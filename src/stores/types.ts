export type Role = 'cliente' | 'profissional' | 'proprietario' | 'master'

export interface User {
  id: string
  name: string
  email: string
  role: Role
  status: 'aprovado' | 'pendente' | 'rejeitado'
}

export interface Professional extends User {
  bio: string
  photo: string
  specialties: string[]
  commissionRate: number
  ownerId: string
}

export interface Service {
  id: string
  professionalId: string
  name: string
  description: string
  price: number
  duration: number
  active: boolean
}

export interface Appointment {
  id: string
  reference: string
  serviceId: string
  professionalId: string
  clientName: string
  clientEmail: string
  clientPhone: string
  date: string
  time: string
  status: 'Confirmado' | 'Cancelado' | 'Concluído'
}
