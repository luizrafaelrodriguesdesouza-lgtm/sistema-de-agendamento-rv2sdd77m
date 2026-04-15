import React, { createContext, useContext, useState, ReactNode } from 'react'
import { User } from './types'

interface AuthContextType {
  user: User | null
  setUser: (user: User | null) => void
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  return React.createElement(AuthContext.Provider, { value: { user, setUser } }, children)
}

export default function useAuthStore() {
  return useContext(AuthContext)
}
