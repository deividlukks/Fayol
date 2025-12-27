import { FormEvent, useState } from 'react';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';

export interface GoalFormData {
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  description?: string;
}

export interface GoalFormProps {
  initialData?: Partial<GoalFormData>;
  onSubmit: (data: GoalFormData) => void | Promise<void>;
  onCancel?: () => void;
  className?: string;
  isLoading?: boolean;
}

export function GoalForm({
  initialData,
  onSubmit,
  onCancel,
  className,
  isLoading = false,
}: GoalFormProps) {
  const [formData, setFormData] = useState<Partial<GoalFormData>>({
    name: '',
    targetAmount: 0,
    currentAmount: 0,
    deadline: '',
    ...initialData,
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.targetAmount || !formData.deadline) return;

    await onSubmit(formData as GoalFormData);
  };

  const updateField = <K extends keyof GoalFormData>(field: K, value: GoalFormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const progress = formData.targetAmount && formData.targetAmount > 0
    ? ((formData.currentAmount || 0) / formData.targetAmount) * 100
    : 0;

  return (
    <form onSubmit={handleSubmit} className={cn('space-y-4', className)}>
      <Input
        label="Nome da Meta"
        value={formData.name}
        onChange={(e) => updateField('name', e.target.value)}
        placeholder="Ex: Viagem para Paris"
        required
      />

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Valor Alvo"
          type="number"
          step="0.01"
          value={formData.targetAmount}
          onChange={(e) => updateField('targetAmount', parseFloat(e.target.value))}
          placeholder="0.00"
          required
        />

        <Input
          label="Valor Atual"
          type="number"
          step="0.01"
          value={formData.currentAmount}
          onChange={(e) => updateField('currentAmount', parseFloat(e.target.value))}
          placeholder="0.00"
        />
      </div>

      {formData.targetAmount && formData.targetAmount > 0 && (
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Progresso: {progress.toFixed(1)}%
          </label>
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        </div>
      )}

      <Input
        label="Prazo"
        type="date"
        value={formData.deadline}
        onChange={(e) => updateField('deadline', e.target.value)}
        required
      />

      <Textarea
        label="Descrição"
        value={formData.description || ''}
        onChange={(e) => updateField('description', e.target.value)}
        placeholder="Descreva sua meta..."
        rows={3}
      />

      <div className="flex gap-2 justify-end pt-4">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
            Cancelar
          </Button>
        )}
        <Button type="submit" isLoading={isLoading}>
          Salvar Meta
        </Button>
      </div>
    </form>
  );
}
