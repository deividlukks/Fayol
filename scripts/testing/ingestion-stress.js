import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Trend, Counter } from 'k6/metrics';

// ⚙️ CONFIGURAÇÃO DO TESTE
// Define como a carga vai aumentar e diminuir
export const options = {
  stages: [
    { duration: '30s', target: 50 }, // Aquecimento: sobe para 50 usuários
    { duration: '1m', target: 500 }, // Carga Alta: sobe para 500 usuários
    { duration: '2m', target: 1000 }, // Stress: ALVO DA FASE 3 (1000 requests simultâneos)
    { duration: '30s', target: 0 }, // Arrefecimento: volta a 0
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% das requisições devem ser < 2s
    http_req_failed: ['rate<0.05'], // Menos de 5% de falhas permitidas
    db_query_time: ['p(95)<500'], // 95% das queries < 500ms
  },
};

// 🔧 VARIÁVEIS DE AMBIENTE
const BASE_URL = __ENV.API_URL || 'http://localhost:3333/api';
const ADMIN_EMAIL = __ENV.ADMIN_EMAIL || 'admin@fayol.app';
const ADMIN_PASSWORD = __ENV.ADMIN_PASSWORD || 'Admin123!@#';

// Validação de variáveis obrigatórias
if (!__ENV.API_URL) {
  console.warn('⚠️  API_URL não definida, usando padrão: http://localhost:3333/api');
}

// 📊 MÉTRICAS CUSTOMIZADAS
const dbQueryTime = new Trend('db_query_time');
const transactionsCreated = new Counter('transactions_created');
const transactionsFailed = new Counter('transactions_failed');

// 🏗️ SETUP: Executado uma vez no início do teste
export function setup() {
  console.log('🚀 Iniciando setup do teste...');

  // 1. Verificar se API está online
  console.log('Verificando saúde da API...');
  const healthRes = http.get(`${BASE_URL}/health`);
  if (healthRes.status !== 200) {
    throw new Error(`❌ API não está respondendo! Status: ${healthRes.status}`);
  }
  console.log('✅ API está online');

  // 2. Fazer login como admin
  console.log('Autenticando como admin...');
  const loginRes = http.post(
    `${BASE_URL}/auth/login`,
    JSON.stringify({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    }),
    {
      headers: { 'Content-Type': 'application/json' },
    }
  );

  if (loginRes.status !== 200 && loginRes.status !== 201) {
    throw new Error(`❌ Falha no login! Status: ${loginRes.status}\nResponse: ${loginRes.body}`);
  }

  const authData = loginRes.json();
  const token = authData.access_token || authData.token;

  if (!token) {
    throw new Error('❌ Token não encontrado na resposta de login');
  }
  console.log('✅ Autenticação bem-sucedida');

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  // 3. Criar categoria de teste
  console.log('Criando categoria de teste...');
  const categoryRes = http.post(
    `${BASE_URL}/categories`,
    JSON.stringify({
      name: `Teste Stress ${new Date().toISOString()}`,
      type: 'EXPENSE',
      icon: '🧪',
      color: '#FF0000',
    }),
    { headers }
  );

  if (categoryRes.status !== 200 && categoryRes.status !== 201) {
    throw new Error(`❌ Falha ao criar categoria! Status: ${categoryRes.status}`);
  }

  const category = categoryRes.json();
  console.log(`✅ Categoria criada: ${category.id}`);

  // 4. Criar conta de teste
  console.log('Criando conta de teste...');
  const accountRes = http.post(
    `${BASE_URL}/accounts`,
    JSON.stringify({
      name: `Conta Teste Stress ${new Date().toISOString()}`,
      type: 'CHECKING',
      balance: 10000.0,
      currency: 'BRL',
    }),
    { headers }
  );

  if (accountRes.status !== 200 && accountRes.status !== 201) {
    throw new Error(`❌ Falha ao criar conta! Status: ${accountRes.status}`);
  }

  const account = accountRes.json();
  console.log(`✅ Conta criada: ${account.id}`);

  console.log('✅ Setup concluído com sucesso!\n');

  // Retorna dados para uso nos VUs
  return {
    token,
    categoryId: category.id,
    accountId: account.id,
    headers,
  };
}

// 🏃‍♂️ CENÁRIO DE TESTE (O que cada utilizador faz)
export default function (data) {
  const { headers, categoryId, accountId } = data;

  group('Criar Transação', () => {
    const payload = JSON.stringify({
      description: `Stress Test ${new Date().getTime()}-${__VU}-${__ITER}`,
      amount: Math.floor(Math.random() * 500) + 10,
      date: new Date().toISOString(),
      type: 'EXPENSE',
      categoryId: categoryId,
      accountId: accountId,
      isPaid: true,
      tags: ['stress-test', `vu-${__VU}`],
    });

    const res = http.post(`${BASE_URL}/transactions`, payload, { headers });

    // Validações
    const success = check(res, {
      'status é 201 (Criado)': (r) => r.status === 201 || r.status === 200,
      'resposta contém ID': (r) => {
        try {
          const body = r.json();
          return body.id !== undefined;
        } catch {
          return false;
        }
      },
      'tempo de resposta < 1s': (r) => r.timings.duration < 1000,
      'tempo de resposta < 2s': (r) => r.timings.duration < 2000,
    });

    // Métricas
    if (success) {
      transactionsCreated.add(1);
    } else {
      transactionsFailed.add(1);
      console.error(`❌ Falha ao criar transação: Status ${res.status}`);
    }

    // Registrar tempo de query do DB (se disponível no header)
    if (res.headers['X-Query-Time']) {
      dbQueryTime.add(parseFloat(res.headers['X-Query-Time']));
    }
  });

  // Pausa aleatória entre 0.1s e 1s (comportamento humano)
  sleep(Math.random() * 0.9 + 0.1);
}

// 🧹 TEARDOWN: Executado uma vez no final do teste
export function teardown(data) {
  console.log('\n🧹 Iniciando limpeza do teste...');

  const { headers, categoryId, accountId } = data;

  try {
    // Deletar todas as transações de teste criadas
    console.log('Deletando transações de teste...');
    const transactionsRes = http.get(`${BASE_URL}/transactions?tags=stress-test`, { headers });

    if (transactionsRes.status === 200) {
      const transactions = transactionsRes.json();
      let deletedCount = 0;

      if (Array.isArray(transactions)) {
        transactions.forEach((transaction) => {
          const delRes = http.del(`${BASE_URL}/transactions/${transaction.id}`, { headers });
          if (delRes.status === 200 || delRes.status === 204) {
            deletedCount++;
          }
        });
      }

      console.log(`✅ ${deletedCount} transações deletadas`);
    }

    // Deletar categoria de teste
    console.log('Deletando categoria de teste...');
    const delCategoryRes = http.del(`${BASE_URL}/categories/${categoryId}`, { headers });
    if (delCategoryRes.status === 200 || delCategoryRes.status === 204) {
      console.log('✅ Categoria deletada');
    }

    // Deletar conta de teste
    console.log('Deletando conta de teste...');
    const delAccountRes = http.del(`${BASE_URL}/accounts/${accountId}`, { headers });
    if (delAccountRes.status === 200 || delAccountRes.status === 204) {
      console.log('✅ Conta deletada');
    }

    console.log('✅ Limpeza concluída com sucesso!');
  } catch (error) {
    console.error(`⚠️  Erro durante limpeza: ${error.message}`);
    console.error('   Pode ser necessário limpar manualmente');
  }
}

// 📊 RELATÓRIO FINAL (executado automaticamente pelo k6)
export function handleSummary(data) {
  console.log('\n📊 RESUMO DO TESTE DE STRESS\n');
  console.log('═'.repeat(60));

  const { metrics } = data;

  // Estatísticas de requisições HTTP
  if (metrics.http_reqs) {
    console.log(`Total de Requisições: ${metrics.http_reqs.values.count}`);
    console.log(`Taxa: ${metrics.http_reqs.values.rate.toFixed(2)} req/s`);
  }

  // Tempo de resposta
  if (metrics.http_req_duration) {
    console.log(`\nTempo de Resposta:`);
    console.log(`  Média: ${metrics.http_req_duration.values.avg.toFixed(2)}ms`);
    console.log(`  Min: ${metrics.http_req_duration.values.min.toFixed(2)}ms`);
    console.log(`  Max: ${metrics.http_req_duration.values.max.toFixed(2)}ms`);
    console.log(`  P95: ${metrics.http_req_duration.values['p(95)'].toFixed(2)}ms`);
  }

  // Taxa de falha
  if (metrics.http_req_failed) {
    const failRate = (metrics.http_req_failed.values.rate * 100).toFixed(2);
    console.log(`\nTaxa de Falha: ${failRate}%`);
  }

  // Métricas customizadas
  if (metrics.transactions_created) {
    console.log(`\nTransações Criadas: ${metrics.transactions_created.values.count}`);
  }

  if (metrics.transactions_failed) {
    console.log(`Transações Falhadas: ${metrics.transactions_failed.values.count}`);
  }

  console.log('═'.repeat(60));

  return {
    stdout: '', // Output já foi feito acima
  };
}
