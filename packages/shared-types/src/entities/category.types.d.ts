import { LaunchType } from '../enums/launch-type.enum';
export interface Category {
  id: string;
  userId?: string;
  name: string;
  type: LaunchType;
  icon?: string;
  color?: string;
  parentId?: string;
  isSystemDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}
//# sourceMappingURL=category.types.d.ts.map
