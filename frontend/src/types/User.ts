export type UserProfileToken = {
  access: string;
  refresh: string;
};

export type UserProfile = {
  id: number;
  username: string;
  email: string;
  is_staff: boolean;
  roles: string[];
  permissions: string[];
  is_active: boolean;
};

export type DecodedToken = {
  token_type: string;
  exp: number;
  iat: number;
  jti: string;
  user_id: string;
};
