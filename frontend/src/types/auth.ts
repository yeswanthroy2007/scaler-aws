export interface User {
  id: number;
  email: string;
  name: string;
  account_id: string;
  created_at: string;
}

export interface LoginPayload {
  email: string;
  password: string;
  remember_me: boolean;
}

export interface LoginResponse {
  user: User;
  token: string;
}
