export interface UserSession {
  userId: string;
  accessToken: string;
  refreshToken: string;
}

export interface UserState {
  step?: string;
  data?: any;
}
