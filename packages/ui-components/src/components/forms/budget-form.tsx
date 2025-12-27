import { FormEvent, useState } from 'react';
import { Input } from '../ui/input';
import { Select } from '../ui/select';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';

export interface BudgetFormData {
  name: string;
  amount: number;
  categoryId?: string;
  period: 'monthly' | 'quarterly' | 'yearly';
  startDate: string;
  endDate?: string;
}

export interface BudgetFormProps {
  initialData?: Partial<BudgetFormData>;
  onSubmit: (data: BudgetFormData) => void | Promise<void>;
  onCancel?: () => void;
  categories?: Array<{ id: string; name: string }>;
  className?: string;
  isLoading?: boolean;
}

export function BudgetForm({
  initialData,
  onSubmit,
  onCancel,
  categories = [],
  className,
  isLoading = false,
}: BudgetFormProps) {
  const [formData, setFormData] = useState<Partial<BudgetFormData>>({
    name: '',
    amount: 0,
    period: 'monthly',
    startDate: new Date().toISOString().split('T')[0],
    ...initialData,
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.amount) return;

    await onSubmit(formData as BudgetFormData);
  };

  const updateField = <K extends keyof BudgetFormData>(
    field: K,
    value: BudgetFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className={cn('space-y-4', className)}>
      <Input
        label="Nome do Orçamento"
        value={formData.name}
        onChange={(e) => updateField('name', e.target.value)}
        placeholder="Ex: Orçamento de Alimentação"
        required
      />

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Valor Limite"
          type="number"
          step="0.01"
          value={formData.amount}
          onChange={(e) => updateField('amount', parseFloat(e.target.value))}
          placeholder="0.00"
          required
        />

        <Select
          label="Período"
          value={formData.period}
          onChange={(e) => updateField('period', e.target.value as BudgetFormData['period'])}
        >
          <option value="monthly">Mensal</option>
          <option value="quarterly">Trimestral</option>
          <option value="yearly">Anual</option>
        </Select>
      </div>

      {categories.length > 0 && (
        <Select
          label="Categoria"
          value={formData.categoryId || ''}
          onChange={(e) => updateField('categoryId', e.target.value)}
        >
          <option value="">Todas as categorias</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </Select>
      )}

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Data de Início"
          type="date"
          value={formData.startDate}
          onChange={(e) => updateField('startDate', e.target.value)}
          required
        />

        <Input
          label="Data de Término (Opcional)"
          type="date"
          value={formData.endDate || ''}
          onChange={(e) => updateField('endDate', e.target.value)}
        />
      </div>

      <div className="flex gap-2 justify-end pt-4">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
            Cancelar
          </Button>
        )}
        <Button type="submit" isLoading={isLoading}>
          Salvar Orçamento
        </Button>
      </div>
    </form>
  );
}
