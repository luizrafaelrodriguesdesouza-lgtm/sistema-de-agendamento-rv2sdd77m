import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import pb from '@/lib/pocketbase/client'
import { User } from '@/stores/types'

interface AuthContextType {
  user: User | null
  signIn: (email: string, password: string) => Promise<{ error: any; user: User | null }>
  signOut: () => void
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(pb.authStore.record as unknown as User)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = pb.authStore.onChange((_token, record) => {
      setUser(record as unknown as User)
    })
    setLoading(false)
    return () => {
      unsubscribe()
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    try {
      const authData = await pb.collection('users').authWithPassword(email, password)
      return { error: null, user: authData.record as unknown as User }
    } catch (error) {
      return { error, user: null }
    }
  }

  const signOut = () => {
    pb.authStore.clear()
  }

  return React.createElement(
    AuthContext.Provider,
    { value: { user, signIn, signOut, loading } },
    children,
  )
}
