import { type Cliente } from "../../clientes/types/Cliente";

export type UserProfileToken = {
  access: string;
  refresh: string;
};

export type MFALoginResponse = {
  mfa_required: boolean;
  temp_token?: string;
  message?: string;
  access?: string;
  refresh?: string;
};

export type MFASetupResponse = {
  secret: string;
  qr_code: string;
  device_id: number;
};

export type MFAStatusResponse = {
  mfa_enabled: boolean;
  has_device: boolean;
};

export type User = {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  roles: number[]; // IDs de los roles asignados
  permissions: string[];
  is_active: boolean;
  email_verified: boolean; // Coincide con el campo del backend
  mfa_enabled?: boolean;
  clientes?: Cliente[];
};

export type DecodedToken = {
  token_type: string;
  exp: number;
  iat: number;
  jti: string;
  user_id: string;
};
