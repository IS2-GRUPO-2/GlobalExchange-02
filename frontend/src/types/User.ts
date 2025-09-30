import { type Cliente } from "../features/clientes/types/Cliente";
export type UserProfileToken = {
  access: string;
  refresh: string;
};

export type User = {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  roles: string[];
  permissions: string[];
  is_active: boolean;
  is_verified: boolean;
  clientes?: Cliente[];
};

export type DecodedToken = {
  token_type: string;
  exp: number;
  iat: number;
  jti: string;
  user_id: string;
};
