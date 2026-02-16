export const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000';

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  role?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export interface ApiUser {
  id: number;
  name: string;
  email: string;
  role: string;
  created_at: string;
}

/** Custom error that carries an HTTP status (when available). */
export class ApiError extends Error {
  status?: number;

  constructor(message: string, status?: number, options?: ErrorOptions) {
    super(message, options);
    this.name = 'ApiError';
    this.status = status;
  }
}

const getAuthHeader = (): Record<string, string> => {
  if (typeof window === 'undefined') {
    return {};
  }
  const token = localStorage.getItem('access_token');
  if (!token) {
    return {};
  }
  return { Authorization: `Bearer ${token}` };
};

const request = async <T>(path: string, options: RequestInit = {}): Promise<T> => {
  let response: Response;

  try {
    response = await fetch(`${BASE_URL}${path}`, {
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
        ...(options.headers ?? {}),
      },
      ...options,
    });
  } catch (err) {
    // Network/connection level failure (server down, CORS, offline, etc.)
    throw new ApiError('تعذّر الاتصال بالسيرفر، حاول مجدداً.', undefined, { cause: err });
  }

  if (!response.ok) {
    let message = 'Request failed';
    try {
      const data = (await response.json()) as { detail?: unknown };
      if (data?.detail) {
        message = typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail);
      }
    } catch {
      const text = await response.text();
      if (text) {
        message = text;
      }
    }
    throw new ApiError(message, response.status);
  }

  return response.json() as Promise<T>;
};

export const register = (payload: RegisterPayload) =>
  request<ApiUser>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const login = (payload: LoginPayload) =>
  request<TokenResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const me = () => request<ApiUser>('/users/me');
