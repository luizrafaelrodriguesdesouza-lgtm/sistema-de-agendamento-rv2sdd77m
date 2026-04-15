import { useAuth } from '@/hooks/use-auth'
import { User } from './types'

interface AuthState {
  user: User | null
  logout: () => void
  signOut: () => void
  loading: boolean
}

export default function useAuthStore<T>(selector?: (state: AuthState) => T): T | AuthState {
  const { user, signOut, loading } = useAuth()

  const state: AuthState = {
    user,
    logout: signOut,
    signOut,
    loading,
  }

  if (selector) {
    return selector(state)
  }

  return state
}
