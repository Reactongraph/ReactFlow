import api from './api'

export interface AuthUser {
  id:       string
  email:    string
  name:     string
  role:     string
  avatarUrl?: string | null
}

export interface TokenResponse {
  accessToken:  string
  refreshToken: string
  expiresIn:    number
  user:         AuthUser
}

function persist(res: TokenResponse): void {
  localStorage.setItem('accessToken',  res.accessToken)
  localStorage.setItem('refreshToken', res.refreshToken)
  localStorage.setItem('userId',       res.user.id)
}

export const authService = {
  async register(name: string, email: string, password: string): Promise<TokenResponse> {
    const { data } = await api.post<TokenResponse>('/auth/register', { name, email, password })
    persist(data)
    return data
  },

  async login(email: string, password: string): Promise<TokenResponse> {
    const { data } = await api.post<TokenResponse>('/auth/login', { email, password })
    persist(data)
    return data
  },

  async logout(): Promise<void> {
    try { await api.post('/auth/logout') } catch { /* ignore */ }
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('userId')
  },

  async me(): Promise<AuthUser> {
    const { data } = await api.get<AuthUser>('/auth/me')
    return data
  },

  isLoggedIn(): boolean {
    return !!localStorage.getItem('accessToken')
  },
}
