'use client';

import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { User, Category, LaunchType, UserRole, Gender } from '@fayol/shared-types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { CategoryManager } from '@/components/settings/category-manager';
import { Modal } from '@/components/ui/modal';
import { CategoryForm } from '@/components/forms/category-form';
import { Shield, Camera, CreditCard, Bell, CheckCircle2, Star } from 'lucide-react';

// --- FUNÇÕES UTILITÁRIAS ---
const formatCPF = (value: string) => {
  if (!value) return '';
  const numbers = value.replace(/\D/g, '');
  const limited = numbers.slice(0, 11);
  return limited
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})/, '$1-$2');
};

const formatPhone = (value: string) => {
  if (!value) return '';
  const numbers = value.replace(/\D/g, '');
  const limited = numbers.slice(0, 11);
  return limited.replace(/^(\d{2})/, '($1) ').replace(/(\d{5})(\d)/, '$1-$2');
};

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('profile');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Estados para edição de perfil
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    cpf: '',
    phoneNumber: '',
    gender: '' as Gender | '',
  });

  // --- ESTADOS PARA CATEGORIA ---
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [categoryTypeToAdd, setCategoryTypeToAdd] = useState<LaunchType>(LaunchType.EXPENSE);
  const [parentCategoryToAdd, setParentCategoryToAdd] = useState<Category | undefined>(undefined);
  // Se precisar editar categoria no futuro, adicione um estado editingCategory aqui

  // --- QUERIES ---
  const { data: user } = useQuery<User>({
    queryKey: ['profile'],
    queryFn: async () => {
      const storedUser = localStorage.getItem('user');
      const id = storedUser ? JSON.parse(storedUser).id : '';
      if (!id) return null;

      const response = await api.get(`/users/${id}`);
      return response.data.data;
    },
  });

  const { data: categories } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: async () => (await api.get('/categories')).data.data,
  });

  // --- MUTATIONS ---
  const updateUserMutation = useMutation({
    mutationFn: async (data: Partial<User>) => {
      if (!user?.id) throw new Error('Usuário não identificado');
      return api.patch(`/users/${user.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      setIsEditing(false);
      alert('Perfil atualizado com sucesso!');
    },
    onError: () => alert('Erro ao atualizar perfil.'),
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/categories/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categories'] }),
    onError: () => alert('Erro ao excluir categoria. Verifique se ela possui transações.'),
  });

  // --- HANDLERS PERFIL ---
  const handleEditToggle = () => {
    if (user) {
      setEditForm({
        name: user.name,
        cpf: formatCPF(user.cpf || ''),
        phoneNumber: formatPhone(user.phoneNumber || ''),
        gender: user.gender || '',
      });
    }
    setIsEditing(!isEditing);
  };

  const handleSaveProfile = () => {
    const { gender, cpf, phoneNumber, ...rest } = editForm;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const payload: any = {
      ...rest,
      cpf: cpf.replace(/\D/g, ''),
      phoneNumber: phoneNumber.replace(/\D/g, ''),
    };

    if (gender) payload.gender = gender;
    updateUserMutation.mutate(payload);
  };

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditForm({ ...editForm, cpf: formatCPF(e.target.value) });
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditForm({ ...editForm, phoneNumber: formatPhone(e.target.value) });
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        updateUserMutation.mutate({ profileImage: base64String });
      };
      reader.readAsDataURL(file);
    }
  };

  // --- HANDLERS CATEGORIAS ---
  const handleDeleteCategory = (category: Category) => {
    if (category.isSystemDefault) return;
    if (confirm(`Deseja excluir a categoria "${category.name}"?`)) {
      deleteCategoryMutation.mutate(category.id);
    }
  };

  // Adicionar Categoria PAI
  const handleAddCategory = (type: LaunchType) => {
    setCategoryTypeToAdd(type);
    setParentCategoryToAdd(undefined); // Garante que não é subcategoria
    setIsCategoryModalOpen(true);
  };

  // Adicionar SUBCATEGORIA
  const handleAddSubcategory = (parent: Category) => {
    setCategoryTypeToAdd(parent.type); // Subcategoria herda o tipo do pai
    setParentCategoryToAdd(parent);
    setIsCategoryModalOpen(true);
  };

  const handleCloseCategoryModal = () => {
    setIsCategoryModalOpen(false);
    setParentCategoryToAdd(undefined);
  };

  // Lógica Avatar
  const getAvatar = () => {
    if (user?.profileImage) {
      return <img src={user.profileImage} alt="Perfil" className="h-full w-full object-cover" />;
    }
    if (user?.gender === Gender.MALE) return <span className="text-4xl">👨‍💼</span>;
    if (user?.gender === Gender.FEMALE) return <span className="text-4xl">👩‍💼</span>;
    return <span className="text-2xl font-bold text-blue-600">{user?.name?.charAt(0)}</span>;
  };

  if (!user)
    return <div className="p-8 text-center text-slate-500">Carregando configurações...</div>;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Configurações</h1>
        <p className="text-slate-500">Gerencie sua conta, preferências e assinatura.</p>
      </div>

      <Tabs className="w-full space-y-6">
        <TabsList className="w-full justify-start h-12 p-1 bg-slate-100/80 backdrop-blur">
          <TabsTrigger
            value="profile"
            activeValue={activeTab}
            onValueChange={setActiveTab}
            className="flex-1 sm:flex-none min-w-[100px]"
          >
            Perfil
          </TabsTrigger>
          <TabsTrigger
            value="categories"
            activeValue={activeTab}
            onValueChange={setActiveTab}
            className="flex-1 sm:flex-none min-w-[100px]"
          >
            Categorias
          </TabsTrigger>
          <TabsTrigger
            value="billing"
            activeValue={activeTab}
            onValueChange={setActiveTab}
            className="flex-1 sm:flex-none min-w-[100px]"
          >
            Assinatura
          </TabsTrigger>
          <TabsTrigger
            value="preferences"
            activeValue={activeTab}
            onValueChange={setActiveTab}
            className="flex-1 sm:flex-none min-w-[100px]"
          >
            Preferências
          </TabsTrigger>
        </TabsList>

        {/* --- TAB: PERFIL --- */}
        <TabsContent value="profile" activeValue={activeTab} className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Dados Pessoais</CardTitle>
                <CardDescription>Informações básicas da sua conta.</CardDescription>
              </div>
              <Button variant={isEditing ? 'secondary' : 'outline'} onClick={handleEditToggle}>
                {isEditing ? 'Cancelar' : 'Editar Perfil'}
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar Upload */}
              <div className="flex items-center gap-6 pb-4 border-b border-slate-100">
                <div className="relative group">
                  <div
                    className="h-20 w-20 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden border-2 border-white shadow-md cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {getAvatar()}
                  </div>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 bg-blue-600 text-white p-1.5 rounded-full shadow-sm hover:bg-blue-700 transition-colors"
                    title="Alterar foto"
                  >
                    <Camera className="h-3 w-3" />
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                </div>

                <div>
                  <h3 className="font-semibold text-lg text-slate-900">{user.name}</h3>
                  <p className="text-sm text-slate-500">{user.email}</p>
                  <Badge
                    variant="outline"
                    className="mt-1 bg-blue-50 text-blue-700 border-blue-200"
                  >
                    {user.roles.includes(UserRole.ADMIN) ? 'Administrador' : 'Usuário Padrão'}
                  </Badge>
                </div>
              </div>

              {/* Formulário */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Nome Completo</label>
                  <Input
                    value={isEditing ? editForm.name : user.name}
                    disabled={!isEditing}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className={!isEditing ? 'bg-slate-50' : ''}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">E-mail</label>
                  <Input value={user.email} disabled className="bg-slate-50 cursor-not-allowed" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">CPF</label>
                  <Input
                    value={
                      isEditing ? editForm.cpf : user.cpf ? formatCPF(user.cpf) : 'Não informado'
                    }
                    disabled={!isEditing}
                    placeholder="000.000.000-00"
                    onChange={handleCpfChange}
                    maxLength={14}
                    className={!isEditing ? 'bg-slate-50' : ''}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Telefone</label>
                  <Input
                    value={
                      isEditing
                        ? editForm.phoneNumber
                        : user.phoneNumber
                          ? formatPhone(user.phoneNumber)
                          : ''
                    }
                    disabled={!isEditing}
                    onChange={handlePhoneChange}
                    maxLength={15}
                    className={!isEditing ? 'bg-slate-50' : ''}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Gênero (para Avatar)</label>
                  {isEditing ? (
                    <Select
                      value={editForm.gender}
                      onChange={(e) =>
                        setEditForm({ ...editForm, gender: e.target.value as Gender })
                      }
                      options={[
                        { label: 'Masculino', value: Gender.MALE },
                        { label: 'Feminino', value: Gender.FEMALE },
                        { label: 'Outro', value: Gender.OTHER },
                        {
                          label: 'Prefiro não dizer',
                          value: Gender.PREFER_NOT_TO_SAY,
                        },
                      ]}
                      placeholder="Selecione..."
                    />
                  ) : (
                    <Input
                      value={
                        user.gender === Gender.MALE
                          ? 'Masculino'
                          : user.gender === Gender.FEMALE
                            ? 'Feminino'
                            : user.gender === Gender.OTHER
                              ? 'Outro'
                              : 'Não definido'
                      }
                      disabled
                      className="bg-slate-50"
                    />
                  )}
                </div>
              </div>

              {isEditing && (
                <div className="flex justify-end pt-4 border-t border-slate-100">
                  <Button onClick={handleSaveProfile} isLoading={updateUserMutation.isPending}>
                    Salvar Alterações
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- TAB: CATEGORIAS --- */}
        <TabsContent value="categories" activeValue={activeTab} className="space-y-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-slate-900">Gerenciamento de Categorias</h2>
            <p className="text-sm text-slate-500">
              Visualize e organize suas categorias por tipo de operação.
            </p>
          </div>

          <CategoryManager
            categories={categories || []}
            onDelete={handleDeleteCategory}
            onAdd={handleAddCategory}
            onAddSubcategory={handleAddSubcategory} // <--- PASSANDO O HANDLER
          />
        </TabsContent>

        {/* --- TAB: ASSINATURA --- */}
        <TabsContent value="billing" activeValue={activeTab} className="space-y-6">
          <Card className="bg-gradient-to-r from-slate-900 to-slate-800 text-white border-none">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Star className="h-5 w-5 text-amber-400 fill-amber-400" />
                  <span className="font-semibold tracking-wide text-slate-200 uppercase text-xs">
                    Plano Atual
                  </span>
                </div>
                <h2 className="text-3xl font-bold">Fayol Free</h2>
                <p className="text-slate-300 text-sm mt-1">
                  Acesso básico às funcionalidades de gestão.
                </p>
              </div>
              <Button className="bg-white text-slate-900 hover:bg-slate-100">Fazer Upgrade</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-slate-500" /> Forma de Pagamento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg bg-slate-50">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-14 bg-white border border-slate-200 rounded flex items-center justify-center">
                    <span className="font-bold text-xs text-slate-400">CARD</span>
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">Nenhum cartão vinculado</p>
                    <p className="text-xs text-slate-500">Adicione um método para upgrade.</p>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  Adicionar
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Comparativo */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <Card className="border-2 border-transparent">
              <CardHeader>
                <CardTitle>Free</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-slate-600">
                <div className="flex gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Gestão de Receitas/Despesas
                </div>
                <div className="flex gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" /> 2 Contas Bancárias
                </div>
                <div className="flex gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Relatórios Básicos
                </div>
              </CardContent>
            </Card>
            <Card className="border-2 border-blue-600 bg-blue-50/30 relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-blue-600 text-white text-[10px] px-3 py-1 rounded-bl-lg font-bold">
                RECOMENDADO
              </div>
              <CardHeader>
                <CardTitle className="text-blue-700">Premium</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-slate-700">
                <div className="flex gap-2">
                  <CheckCircle2 className="h-4 w-4 text-blue-600" /> <strong>Tudo do Free</strong>
                </div>
                <div className="flex gap-2">
                  <CheckCircle2 className="h-4 w-4 text-blue-600" /> IA de Investimentos
                </div>
                <div className="flex gap-2">
                  <CheckCircle2 className="h-4 w-4 text-blue-600" /> Contas Ilimitadas
                </div>
                <div className="flex gap-2">
                  <CheckCircle2 className="h-4 w-4 text-blue-600" /> Trading Signals
                </div>
                <Button className="w-full mt-4 bg-blue-600 hover:bg-blue-700">
                  Assinar por R$ 29,90/mês
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* --- TAB: PREFERÊNCIAS --- */}
        <TabsContent value="preferences" activeValue={activeTab} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-slate-500" /> Notificações
              </CardTitle>
              <CardDescription>Escolha como deseja ser alertado.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <label className="text-sm font-medium text-slate-900">Alertas por E-mail</label>
                  <p className="text-xs text-slate-500">Resumos semanais e alertas de segurança.</p>
                </div>
                <Switch checked={true} />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <label className="text-sm font-medium text-slate-900">
                    Notificações no Telegram
                  </label>
                  <p className="text-xs text-slate-500">
                    Receba avisos de transações em tempo real.
                  </p>
                </div>
                <Switch checked={true} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Segurança</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <label className="text-sm font-medium text-slate-900">
                    Autenticação em 2 Fatores (2FA)
                  </label>
                  <p className="text-xs text-slate-500">Adicione uma camada extra de segurança.</p>
                </div>
                <Button variant="outline" size="sm">
                  Configurar
                </Button>
              </div>

              <div className="bg-amber-50 border border-amber-100 rounded-md p-3 flex gap-3 text-sm text-amber-800 mt-2">
                <Shield className="h-5 w-5 flex-shrink-0" />
                <p>A alteração de senha e exclusão de conta requerem confirmação por e-mail.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal de Categoria */}
      <Modal
        isOpen={isCategoryModalOpen}
        onClose={handleCloseCategoryModal}
        title={
          parentCategoryToAdd
            ? `Nova Subcategoria em "${parentCategoryToAdd.name}"`
            : `Nova Categoria de ${
                categoryTypeToAdd === LaunchType.EXPENSE
                  ? 'Despesa'
                  : categoryTypeToAdd === LaunchType.INCOME
                    ? 'Receita'
                    : 'Transferência'
              }`
        }
      >
        <CategoryForm
          defaultType={categoryTypeToAdd}
          parentId={parentCategoryToAdd?.id} // Passa o ID do pai para o form
          onSuccess={() => {
            handleCloseCategoryModal();
            queryClient.invalidateQueries({ queryKey: ['categories'] });
          }}
          onCancel={handleCloseCategoryModal}
        />
      </Modal>
    </div>
  );
}
