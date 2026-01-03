'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createCategorySchema, CreateCategoryInput } from '@fayol/validation-schemas';
import { Category, LaunchType } from '@fayol/shared-types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { useState, useEffect } from 'react';
import { AxiosError } from 'axios';

interface CategoryFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  initialData?: Category;
  defaultType?: LaunchType;
  parentId?: string; // <--- NOVA PROP
}

export function CategoryForm({
  onSuccess,
  onCancel,
  initialData,
  defaultType,
  parentId,
}: CategoryFormProps) {
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreateCategoryInput>({
    resolver: zodResolver(createCategorySchema),
    defaultValues: {
      type: defaultType || LaunchType.EXPENSE,
      icon: '🏷️',
      color: '#64748b',
      parentId: parentId, // <--- Valor inicial
    },
  });

  useEffect(() => {
    if (initialData) {
      reset({
        name: initialData.name,
        type: initialData.type,
        icon: initialData.icon || '🏷️',
        color: initialData.color || '#64748b',
        parentId: initialData.parentId || undefined,
      });
    } else {
      // Reset para garantir que valores padrão ou props sejam aplicados ao abrir modal limpo
      if (defaultType) setValue('type', defaultType);
      if (parentId) setValue('parentId', parentId);
    }
  }, [initialData, defaultType, parentId, reset, setValue]);

  const saveCategoryMutation = useMutation({
    mutationFn: async (data: CreateCategoryInput) => {
      // Garante que parentId seja enviado
      const payload = { ...data, parentId };

      if (initialData?.id) {
        return api.patch(`/categories/${initialData.id}`, payload);
      } else {
        return api.post('/categories', payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      onSuccess();
    },
    onError: (error: AxiosError<{ message: string }>) => {
      setServerError(error.response?.data?.message || 'Erro ao salvar categoria.');
    },
  });

  const onSubmit = (data: CreateCategoryInput) => {
    setServerError(null);
    saveCategoryMutation.mutate(data);
  };

  const typeOptions = [
    { label: 'Despesa', value: LaunchType.EXPENSE },
    { label: 'Receita', value: LaunchType.INCOME },
    { label: 'Transferência', value: LaunchType.TRANSFER },
  ];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input
        label={parentId ? 'Nome da Subcategoria' : 'Nome da Categoria'}
        id="name"
        placeholder="Ex: Jogos, Streaming, Freelas..."
        {...register('name')}
        error={errors.name?.message}
      />

      <Select
        label="Tipo de Lançamento"
        id="type"
        options={typeOptions}
        {...register('type')}
        error={errors.type?.message}
        // Desabilita se for subcategoria (herda do pai) ou edição
        disabled={!!initialData || !!parentId}
      />

      {/* Oculta inputs de visual/cor se for subcategoria (opcional, mas simplifica para o usuário) */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label htmlFor="icon" className="text-sm font-medium text-slate-700">
            Ícone (Emoji)
          </label>
          <Input
            id="icon"
            placeholder="Ex: 🎮"
            maxLength={2}
            {...register('icon')}
            error={errors.icon?.message}
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="color" className="text-sm font-medium text-slate-700">
            Cor (Hex)
          </label>
          <div className="flex gap-2 items-center">
            <Input id="color" type="color" className="w-12 p-1 h-10" {...register('color')} />
            <span className="text-xs text-slate-500">Selecione a cor</span>
          </div>
          {errors.color && <p className="text-xs text-red-500">{errors.color.message}</p>}
        </div>
      </div>

      {serverError && (
        <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm text-center">
          {serverError}
        </div>
      )}

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting} isLoading={isSubmitting}>
          {initialData ? 'Atualizar' : 'Criar'}
        </Button>
      </div>
    </form>
  );
}
