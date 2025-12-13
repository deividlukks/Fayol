import http from 'k6/http';
import { check, sleep } from 'k6';

// ⚙️ CONFIGURAÇÃO DO TESTE
// Define como a carga vai aumentar e diminuir
export const options = {
  stages: [
    { duration: '30s', target: 50 },   // Aquecimento: sobe para 50 utilizadores
    { duration: '1m', target: 500 },   // Carga Alta: sobe para 500 utilizadores
    { duration: '2m', target: 1000 },  // Stress: ALVO DA FASE 3 (1000 requests simultâneos)
    { duration: '30s', target: 0 },    // Arrefecimento: volta a 0
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% das requisições devem ser < 2s
    http_req_failed: ['rate<0.05'],    // Menos de 5% de falhas permitidas
  },
};

// 🔧 VARIÁVEIS DE AMBIENTE E SEGREDOS
// Substitui estes valores por dados reais do teu banco local ou de staging
const BASE_URL = __ENV.API_URL || 'http://host.docker.internal:3333/api'; // Use localhost se correr nativo
const JWT_TOKEN = __ENV.TOKEN || 'COLOCA_AQUI_O_TEU_TOKEN_JWT_DE_ADMIN'; 

const HEADERS = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${JWT_TOKEN}`,
};

// IDs fixos para teste (Certifica-te que existem no banco!)
// Substitua por UUIDs reais de categoria e conta válidas
const TEST_CATEGORY_ID = '550e8400-e29b-41d4-a716-446655440000'; 
const TEST_ACCOUNT_ID = '550e8400-e29b-41d4-a716-446655440001';

// 🏃‍♂️ CENÁRIO DE TESTE (O que cada utilizador faz)
export default function () {
  const payload = JSON.stringify({
    description: `Stress Test ${new Date().getTime()}`,
    amount: Math.floor(Math.random() * 500) + 10,
    date: new Date().toISOString(),
    type: 'EXPENSE',
    categoryId: TEST_CATEGORY_ID,
    accountId: TEST_ACCOUNT_ID,
    isPaid: true,
  });

  // Envia a transação
  const res = http.post(`${BASE_URL}/transactions`, payload, { headers: HEADERS });

  // Valida a resposta
  check(res, {
    'status é 201 (Criado)': (r) => r.status === 201,
    'tempo de resposta < 1s': (r) => r.timings.duration < 1000,
  });

  // Pausa aleatória entre 0.1s e 1s (comportamento humano)
  sleep(Math.random() * 0.9 + 0.1); 
}