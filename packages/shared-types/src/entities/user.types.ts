import { UserRole } from '../enums/user-role.enum';
import { InvestorProfile } from '../enums/investor-profile.enum';

export interface User {
  id: string;
  name: string;
  email: string;
  roles: UserRole[];
  profileImage?: string;
  phoneNumber?: string;
  investorProfile: InvestorProfile;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}