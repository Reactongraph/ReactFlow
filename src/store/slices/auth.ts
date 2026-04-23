import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { authService, AuthUser } from '../../services/auth.service'
import { realtimeService } from '../../services/realtime.service'

interface AuthState {
  user:       AuthUser | null
  loading:    boolean
  error:      string | null
  isLoggedIn: boolean

  login:    (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout:   () => Promise<void>
  loadUser: () => Promise<void>
  clearError: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user:       null,
      loading:    false,
      error:      null,
      isLoggedIn: false,

      login: async (email, password) => {
        set({ loading: true, error: null })
        try {
          const res = await authService.login(email, password)
          set({ user: res.user, isLoggedIn: true, loading: false })
          realtimeService.connect(res.accessToken)
        } catch (e: unknown) {
          const msg = e instanceof Error ? e.message : 'Login failed'
          set({ error: msg, loading: false })
          throw e
        }
      },

      register: async (name, email, password) => {
        set({ loading: true, error: null })
        try {
          const res = await authService.register(name, email, password)
          set({ user: res.user, isLoggedIn: true, loading: false })
          realtimeService.connect(res.accessToken)
        } catch (e: unknown) {
          const msg = e instanceof Error ? e.message : 'Registration failed'
          set({ error: msg, loading: false })
          throw e
        }
      },

      logout: async () => {
        realtimeService.disconnect()
        await authService.logout()
        // Clear all user-scoped localStorage keys
        const keysToRemove: string[] = []
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i)
          if (k && k.startsWith('flow-storage-v2-')) keysToRemove.push(k)
        }
        keysToRemove.forEach(k => localStorage.removeItem(k))
        // Reset flow store state in memory
        const { useFlowStore } = await import('../index')
        useFlowStore.setState({
          nodes: [], edges: [], workflowName: 'Untitled Workflow',
          savedWorkflowId: null, selectedNodeId: null,
          templates: {}, versions: [], runHistory: [],
        })
        set({ user: null, isLoggedIn: false })
      },

      loadUser: async () => {
        if (!authService.isLoggedIn()) return
        set({ loading: true })
        try {
          const user = await authService.me()
          const token = localStorage.getItem('accessToken')!
          set({ user, isLoggedIn: true, loading: false })
          realtimeService.connect(token)
        } catch {
          set({ user: null, isLoggedIn: false, loading: false })
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-store',
      partialize: state => ({ user: state.user, isLoggedIn: state.isLoggedIn }),
    },
  ),
)
