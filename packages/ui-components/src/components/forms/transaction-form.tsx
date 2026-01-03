import { FormEvent, useState } from 'react';
import { Input } from '../ui/input';
import { Select } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { DatePicker } from '../ui/date-picker';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';

export interface TransactionFormData {
  description: string;
  amount: number;
  type: 'income' | 'expense';
  categoryId?: string;
  accountId?: string;
  date: string;
  notes?: string;
}

export interface TransactionFormProps {
  initialData?: Partial<TransactionFormData>;
  onSubmit: (data: TransactionFormData) => void | Promise<void>;
  onCancel?: () => void;
  categories?: Array<{ id: string; name: string }>;
  accounts?: Array<{ id: string; name: string }>;
  className?: string;
  isLoading?: boolean;
}

export function TransactionForm({
  initialData,
  onSubmit,
  onCancel,
  categories = [],
  accounts = [],
  className,
  isLoading = false,
}: TransactionFormProps) {
  const [formData, setFormData] = useState<Partial<TransactionFormData>>({
    description: '',
    amount: 0,
    type: 'expense',
    date: new Date().toISOString().split('T')[0],
    ...initialData,
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!formData.description || !formData.amount) return;

    await onSubmit(formData as TransactionFormData);
  };

  const updateField = <K extends keyof TransactionFormData>(
    field: K,
    value: TransactionFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className={cn('space-y-4', className)}>
      <Input
        label="Descrição"
        value={formData.description}
        onChange={(e) => updateField('description', e.target.value)}
        placeholder="Ex: Compra no supermercado"
        required
      />

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Valor"
          type="number"
          step="0.01"
          value={formData.amount}
          onChange={(e) => updateField('amount', parseFloat(e.target.value))}
          placeholder="0.00"
          required
        />

        <Select
          label="Tipo"
          value={formData.type}
          onChange={(e) => updateField('type', e.target.value as 'income' | 'expense')}
        >
          <option value="expense">Despesa</option>
          <option value="income">Receita</option>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {categories.length > 0 && (
          <Select
            label="Categoria"
            value={formData.categoryId || ''}
            onChange={(e) => updateField('categoryId', e.target.value)}
          >
            <option value="">Selecione...</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </Select>
        )}

        {accounts.length > 0 && (
          <Select
            label="Conta"
            value={formData.accountId || ''}
            onChange={(e) => updateField('accountId', e.target.value)}
          >
            <option value="">Selecione...</option>
            {accounts.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.name}
              </option>
            ))}
          </Select>
        )}
      </div>

      <DatePicker
        label="Data"
        value={formData.date}
        onChange={(e) => updateField('date', e.target.value)}
        required
      />

      <Textarea
        label="Observações"
        value={formData.notes || ''}
        onChange={(e) => updateField('notes', e.target.value)}
        placeholder="Adicione observações opcionais..."
        rows={3}
      />

      <div className="flex gap-2 justify-end pt-4">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
            Cancelar
          </Button>
        )}
        <Button type="submit" isLoading={isLoading}>
          Salvar Transação
        </Button>
      </div>
    </form>
  );
}
