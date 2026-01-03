'use client';

import { useState } from 'react';
import { Category, LaunchType } from '@fayol/shared-types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Tag,
  Lock,
  Trash2,
  Plus,
  TrendingUp,
  TrendingDown,
  ArrowLeftRight,
  PiggyBank,
} from 'lucide-react';

type CategoryViewType = 'EXPENSE' | 'INCOME' | 'TRANSFER' | 'INVESTMENT';

interface CategoryManagerProps {
  categories: Category[];
  onDelete: (category: Category) => void;
  onAdd: (type: LaunchType) => void;
  onAddSubcategory: (parent: Category) => void; // <--- NOVA PROP
}

export function CategoryManager({
  categories,
  onDelete,
  onAdd,
  onAddSubcategory,
}: CategoryManagerProps) {
  const [activeView, setActiveView] = useState<CategoryViewType>('EXPENSE');

  const getCategoryGroup = (category: Category): CategoryViewType | null => {
    if (category.name === 'Investimentos') return 'INVESTMENT';
    if (category.type === LaunchType.EXPENSE) return 'EXPENSE';
    if (category.type === LaunchType.INCOME) return 'INCOME';
    if (category.type === LaunchType.TRANSFER) return 'TRANSFER';
    return null;
  };

  // Filtra as categorias Pai
  const filteredCategories = categories.filter(
    (cat) => !cat.parentId && getCategoryGroup(cat) === activeView
  );

  const getTypeStyles = (type: CategoryViewType) => {
    switch (type) {
      case 'EXPENSE':
        return { icon: TrendingDown, color: 'text-red-600', bg: 'bg-red-50' };
      case 'INCOME':
        return { icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' };
      case 'INVESTMENT':
        return { icon: PiggyBank, color: 'text-purple-600', bg: 'bg-purple-50' };
      case 'TRANSFER':
        return { icon: ArrowLeftRight, color: 'text-blue-600', bg: 'bg-blue-50' };
    }
  };

  const currentStyles = getTypeStyles(activeView);

  return (
    <div className="space-y-6">
      {/* Navegação por Tipo */}
      <div className="flex flex-wrap gap-2">
        {[
          { id: 'EXPENSE', label: 'Despesas', icon: TrendingDown },
          { id: 'INCOME', label: 'Receitas', icon: TrendingUp },
          { id: 'INVESTMENT', label: 'Investimentos', icon: PiggyBank },
          { id: 'TRANSFER', label: 'Transferências', icon: ArrowLeftRight },
        ].map((tab) => {
          const isActive = activeView === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveView(tab.id as CategoryViewType)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                isActive
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Lista */}
      <Card>
        <CardContent className="p-0">
          {filteredCategories.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <Tag className="h-10 w-10 mx-auto mb-3 opacity-20" />
              <p>Nenhuma categoria encontrada neste grupo.</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() =>
                  onAdd(
                    activeView === 'INVESTMENT' ? LaunchType.EXPENSE : (activeView as LaunchType)
                  )
                }
              >
                Criar Primeira
              </Button>
            </div>
          ) : (
            <Accordion type="multiple" className="w-full">
              {filteredCategories.map((category) => (
                <AccordionItem
                  key={category.id}
                  value={category.id}
                  className="border-b last:border-0 px-6"
                >
                  <div className="flex items-center justify-between w-full py-2">
                    <div className="flex items-center gap-4 flex-1">
                      <div
                        className={`p-2.5 rounded-lg ${currentStyles.bg} ${currentStyles.color}`}
                      >
                        {category.icon ? (
                          <span className="text-lg leading-none">{category.icon}</span>
                        ) : (
                          <Tag className="h-5 w-5" />
                        )}
                      </div>

                      <div className="flex-1">
                        {/* @ts-expect-error: children vem do backend */}
                        {category.children && category.children.length > 0 ? (
                          <AccordionTrigger className="hover:no-underline py-2 justify-start gap-3">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-slate-900 text-base">
                                {category.name}
                              </span>

                              {activeView === 'INVESTMENT' && (
                                <Badge
                                  variant="outline"
                                  className={`
                                            border-0 text-[10px] px-2 h-5 
                                            ${
                                              category.type === LaunchType.INCOME
                                                ? 'bg-emerald-100 text-emerald-700'
                                                : 'bg-red-100 text-red-700'
                                            }
                                        `}
                                >
                                  {category.type === LaunchType.INCOME
                                    ? 'Rendimentos (Entrada)'
                                    : 'Aportes (Saída)'}
                                </Badge>
                              )}
                            </div>

                            <Badge variant="secondary" className="ml-2 font-normal text-xs">
                              {/* @ts-expect-error: children length */}
                              {category.children.length} subcategorias
                            </Badge>
                          </AccordionTrigger>
                        ) : (
                          <div className="py-2 flex items-center gap-2">
                            <span className="font-semibold text-slate-900 text-base">
                              {category.name}
                            </span>
                            {activeView === 'INVESTMENT' && (
                              <Badge
                                variant="outline"
                                className={`
                                            border-0 text-[10px] px-2 h-5 
                                            ${
                                              category.type === LaunchType.INCOME
                                                ? 'bg-emerald-100 text-emerald-700'
                                                : 'bg-red-100 text-red-700'
                                            }
                                        `}
                              >
                                {category.type === LaunchType.INCOME ? 'Rendimentos' : 'Aportes'}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pl-4">
                      {category.isSystemDefault ? (
                        <Badge
                          variant="outline"
                          className="gap-1 bg-slate-50 text-slate-500 border-slate-200"
                        >
                          <Lock className="h-3 w-3" /> Padrão
                        </Badge>
                      ) : (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete(category);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Subcategorias */}
                  {/* @ts-expect-error: children check */}
                  {(category.children || []).length >= 0 && ( // Alterado para sempre mostrar a área expansível se for AccordionItem
                    <AccordionContent>
                      <div className="pl-[4.5rem] pr-4 pb-2 space-y-1">
                        {/* @ts-expect-error: children map */}
                        {category.children?.map((sub: Category) => (
                          <div
                            key={sub.id}
                            className="flex items-center justify-between group py-2 px-3 rounded-md hover:bg-slate-50 transition-colors"
                          >
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                              <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div>
                              {sub.name}
                            </div>
                            {!sub.isSystemDefault && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-all"
                                onClick={() => onDelete(sub)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        ))}

                        {/* BOTÃO DE ADICIONAR SUBCATEGORIA - AGORA COM ONCLICK */}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 mt-2 h-7 px-2"
                          onClick={() => onAddSubcategory(category)}
                        >
                          <Plus className="h-3 w-3 mr-1.5" /> Adicionar subcategoria
                        </Button>
                      </div>
                    </AccordionContent>
                  )}
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
