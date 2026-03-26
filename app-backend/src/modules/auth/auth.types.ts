export interface RegisterInput {
  user_name: string;
  user_email: string;
  user_password: string;
  user_role: string;
}

export interface LoginInput {
  user_email: string;
  user_password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface JwtPayload {
  user_id: number;
  user_role: string;
}