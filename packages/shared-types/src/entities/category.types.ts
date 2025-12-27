import { LaunchType } from '../enums/launch-type.enum';

export interface Category {
  id: string;
  userId?: string; // Opcional pois existem categorias padrão do sistema
  name: string;
  type: LaunchType;
  icon?: string;
  color?: string;
  parentId?: string;
  isSystemDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}
