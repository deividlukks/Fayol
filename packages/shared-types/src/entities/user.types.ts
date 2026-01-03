import { UserRole } from '../enums/user-role.enum';
import { InvestorProfile } from '../enums/investor-profile.enum';
import { Gender } from '../enums/gender.enum';

export interface User {
  id: string;
  name: string;
  email: string;
  roles: UserRole[];

  // Avatar & Dados Pessoais
  profileImage?: string;
  gender?: Gender; // Novo campo
  cpf?: string; // Novo campo
  phoneNumber?: string;

  investorProfile: InvestorProfile;

  // Onboarding
  onboardingStep: number;
  mainCurrency: string;

  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
