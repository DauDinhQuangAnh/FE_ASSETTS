export interface LoginResponse {
  token: string;
  user: {
    emp_code: string;
    full_name: string;
    email: string;
    role: string;
  };
}

export interface LoginRequest {
  emp_code: string;
  password: string;
  rememberMe?: boolean;
}

export interface AuthError {
  message: string;
  status?: number;
  code?: string;
} 