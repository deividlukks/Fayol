# Correções no AI Service (apps/backend/src/ai)

Data: 11/10/2025

## Problemas Identificados e Corrigidos

### 1. Erros de Sintaxe (Template Literals)

**Arquivo**: `ai.service.ts`

#### Erro 1: URLs malformadas
```typescript
// ❌ ANTES
this.httpService.post(
  \/suggest-category,
  { description },
)

// ✅ DEPOIS
this.httpService.post(
  `${this.aiServiceBaseUrl}/suggest-category`,
  { description },
)
```

#### Erro 2: Logs com template strings incorretas
```typescript
// ❌ ANTES
this.logger.error(
  Falha ao chamar o AI Service para sugerir categoria: \,
);

// ✅ DEPOIS
this.logger.error(
  `Falha ao chamar o AI Service para sugerir categoria: ${error.message}`,
);
```

#### Erro 3: Template string no savingsRate
```typescript
// ❌ ANTES
savingsRate: \%,

// ✅ DEPOIS
savingsRate: `${savingsRate.toFixed(2)}%`,
```

### 2. DTO Faltante

**Arquivo**: `dto/analyze-spending.dto.ts`

**Problema**: Faltava a classe `TransactionDto` que é importada em outros DTOs.

**Solução**: Adicionada a classe completa:
```typescript
export class TransactionDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  date: Date;

  @ApiProperty()
  description: string;

  @ApiProperty()
  amount: number;

  @ApiProperty({ enum: ['income', 'expense'] })
  movementType: 'income' | 'expense';

  @ApiProperty({ required: false })
  category?: string;

  @ApiProperty({ required: false })
  subcategory?: string;
}
```

### 3. Assinatura do Método `analyzeSpending`

**Problema**: O controller chamava o método com 2 parâmetros (userId, transactions), mas o service esperava apenas 1 (transactions).

**Solução**: Atualizada a assinatura e retorno completo:
```typescript
// ✅ DEPOIS
async analyzeSpending(
  userId: string,
  transactions: AiTransaction[],
): Promise<any> {
  const summary = { /* ... */ };
  const categorySpending = await this.getSpendingByCategory(transactions);
  const spendingHistory = transactions.map((t) => ({ /* ... */ }));

  return {
    userId,
    generatedAt: new Date(),
    summary,
    categorySpending,
    spendingHistory,
  };
}
```

### 4. Campo `percentage` Faltante

**Problema**: O DTO `CategorySpending` tinha um campo `percentage`, mas o método `getSpendingByCategory` não o calculava.

**Solução**: Adicionado cálculo da percentagem:
```typescript
async getSpendingByCategory(
  transactions: AiTransaction[],
): Promise<CategorySpending[]> {
  // ... código existente ...

  const totalExpenses = expenseTransactions.reduce(
    (sum, t) => sum + t.amount,
    0,
  );

  return Array.from(spendingMap.entries()).map(([category, total]) => ({
    category,
    total,
    percentage: totalExpenses > 0 ? (total / totalExpenses) * 100 : 0,
  }));
}
```

### 5. Método `detectAnomalies` Ausente

**Problema**: O controller chamava `this.aiService.detectAnomalies()`, mas o método não existia.

**Solução**: Adicionado método completo que chama o AI service:
```typescript
async detectAnomalies(
  userId: string,
  transactions: AiTransaction[],
): Promise<any> {
  try {
    const response = await firstValueFrom(
      this.httpService.post(`${this.aiServiceBaseUrl}/detect-anomalies`, {
        transactions: transactions.map((t) => ({
          id: t.id,
          date: t.date,
          description: t.description,
          amount: t.amount,
          movementType: t.movementType,
          category: t.category,
          subcategory: t.subcategory,
        })),
      }),
    );
    return response.data;
  } catch (error) {
    this.logger.error(
      `Falha ao chamar o AI Service para detectar anomalias: ${error.message}`,
    );
    return [];
  }
}
```

## Resumo das Correções

✅ **3 erros de template literals** corrigidos
✅ **1 DTO faltante** adicionado (TransactionDto)
✅ **1 assinatura de método** corrigida
✅ **1 campo calculado** adicionado (percentage)
✅ **1 método faltante** implementado (detectAnomalies)

## Status Final

O módulo AI agora:
- ✅ Compila sem erros
- ✅ Tem todas as assinaturas corretas
- ✅ Calcula todos os campos necessários nos DTOs
- ✅ Está pronto para integração com o AI Service (FastAPI)

## Próximos Passos

1. Testar a integração com o AI Service rodando
2. Validar os endpoints via Swagger
3. Criar testes unitários para os métodos do AiService
