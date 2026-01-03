import { UserRole } from '../enums/user-role.enum';
import { InvestorProfile } from '../enums/investor-profile.enum';
import { Gender } from '../enums/gender.enum';
export interface User {
  id: string;
  name: string;
  email: string;
  roles: UserRole[];
  profileImage?: string;
  gender?: Gender;
  cpf?: string;
  phoneNumber?: string;
  investorProfile: InvestorProfile;
  onboardingStep: number;
  mainCurrency: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
//# sourceMappingURL=user.types.d.ts.map
