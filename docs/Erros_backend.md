[09:52:58] Starting compilation in watch mode...

src/ai/ai.controller.ts:104:5 - error TS2322: Type '{ summary: { totalIncome: number; totalExpenses: number; balance: number; savingsRate: string; }; categoryBreakdown: { totals: Record<string, number>; averages: Record<string, number>; percentages: Record<...>; }; insights: FinancialInsight[]; patterns: SpendingPattern[]; trends: { ...; } | { ...; }; healthScore: nu...' is not assignable to type 'SpendingAnalysisResponse'.
  Types of property 'summary' are incompatible.
    Type '{ totalIncome: number; totalExpenses: number; balance: number; savingsRate: string; }' is missing the following properties from type 'SpendingSummary': transactionCount, averageTransaction

104     return this.aiService.analyzeSpending(transactions);
        ~~~~~~

src/ai/ai.controller.ts:104:43 - error TS2345: Argument of type '{ date: Date; id: string; description: string; amount: number; category?: string; subcategory?: string; }[]' is not assignable to parameter of type 'Transaction[]'.
  Property 'movementType' is missing in type '{ date: Date; id: string; description: string; amount: number; category?: string; subcategory?: string; }' but required in type 'Transaction'.

104     return this.aiService.analyzeSpending(transactions);
                                              ~~~~~~~~~~~~

  src/ai/ai.service.ts:8:3
    8   movementType: 'income' | 'expense';
        ~~~~~~~~~~~~
    'movementType' is declared here.

src/ai/ai.controller.ts:152:7 - error TS2345: Argument of type '{ date: Date; id: string; description: string; amount: number; category?: string; subcategory?: string; }[]' is not assignable to parameter of type 'Transaction[]'.
  Property 'movementType' is missing in type '{ date: Date; id: string; description: string; amount: number; category?: string; subcategory?: string; }' but required in type 'Transaction'.

152       transactions,
          ~~~~~~~~~~~~

  src/ai/ai.service.ts:8:3
    8   movementType: 'income' | 'expense';
        ~~~~~~~~~~~~
    'movementType' is declared here.

src/ai/ai.controller.ts:238:60 - error TS2345: Argument of type '{ date: Date; id: string; description: string; amount: number; category?: string; subcategory?: string; }[]' is not assignable to parameter of type 'Transaction[]'.
  Property 'movementType' is missing in type '{ date: Date; id: string; description: string; amount: number; category?: string; subcategory?: string; }' but required in type 'Transaction'.

238     const anomalies = await this.aiService.detectAnomalies(transactions);
                                                               ~~~~~~~~~~~~

  src/ai/ai.service.ts:8:3
    8   movementType: 'income' | 'expense';
        ~~~~~~~~~~~~
    'movementType' is declared here.

src/ai/ai.controller.ts:270:7 - error TS2322: Type 'AnomalyDetection[]' is not assignable to type 'import("C:/Users/Deivid Lucas/Documents/Projetos/Fayol/apps/backend/src/ai/dto/detect-anomalies.dto").AnomalyDetection[]'.
  Type 'AnomalyDetection' is missing the following properties from type 'AnomalyDetection': transactionId, description, amount, date, category

270       anomalies,
          ~~~~~~~~~

  src/ai/dto/detect-anomalies.dto.ts:34:3
    34   anomalies: AnomalyDetection[];
         ~~~~~~~~~
    The expected type comes from property 'anomalies' which is declared here on type 'AnomaliesResponse'

src/ai/ai.controller.ts:347:7 - error TS2345: Argument of type '{ date: Date; id: string; description: string; amount: number; category?: string; subcategory?: string; }[]' is not assignable to parameter of type 'Transaction[]'.
  Property 'movementType' is missing in type '{ date: Date; id: string; description: string; amount: number; category?: string; subcategory?: string; }' but required in type 'Transaction'.

347       transactions,
          ~~~~~~~~~~~~

  src/ai/ai.service.ts:8:3
    8   movementType: 'income' | 'expense';
        ~~~~~~~~~~~~
    'movementType' is declared here.

src/ai/ai.controller.ts:388:59 - error TS2345: Argument of type '{ date: Date; id: string; description: string; amount: number; category?: string; subcategory?: string; }[]' is not assignable to parameter of type 'Transaction[]'.
  Property 'movementType' is missing in type '{ date: Date; id: string; description: string; amount: number; category?: string; subcategory?: string; }' but required in type 'Transaction'.

388     const analysis = await this.aiService.analyzeSpending(transactions);
                                                              ~~~~~~~~~~~~

  src/ai/ai.service.ts:8:3
    8   movementType: 'income' | 'expense';
        ~~~~~~~~~~~~
    'movementType' is declared here.

[09:53:06] Found 7 errors. Watching for file changes.

