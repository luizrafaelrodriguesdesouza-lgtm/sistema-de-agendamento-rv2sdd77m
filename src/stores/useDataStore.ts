import React, { createContext, useContext, useState, ReactNode } from 'react'
import { Professional, Service, Appointment } from './types'

interface DataContextType {
  professionals: Professional[]
  services: Service[]
  appointments: Appointment[]
  setAppointments: React.Dispatch<React.SetStateAction<Appointment[]>>
  addAppointment: (app: Appointment) => void
}

const DataContext = createContext<DataContextType>({} as DataContextType)

const INITIAL_PROFS: Professional[] = [
  {
    id: 'p1',
    name: 'Dra. Ana Silva',
    email: 'ana@clinica.com',
    role: 'profissional',
    status: 'aprovado',
    bio: 'Especialista em estética facial e cuidado avançado.',
    photo: 'https://img.usecurling.com/ppl/thumbnail?gender=female&seed=1',
    specialties: ['Estética Facial', 'Limpeza de Pele'],
    commissionRate: 40,
    ownerId: 'o1',
  },
  {
    id: 'p2',
    name: 'Dr. Carlos Souza',
    email: 'carlos@clinica.com',
    role: 'profissional',
    status: 'aprovado',
    bio: 'Focado em harmonização e estética avançada.',
    photo: 'https://img.usecurling.com/ppl/thumbnail?gender=male&seed=2',
    specialties: ['Harmonização'],
    commissionRate: 30,
    ownerId: 'o1',
  },
]

const INITIAL_SERVICES: Service[] = [
  {
    id: 's1',
    professionalId: 'p1',
    name: 'Limpeza de Pele',
    description: 'Limpeza profunda com hidratação, 60 min',
    price: 150,
    duration: 60,
    active: true,
  },
  {
    id: 's2',
    professionalId: 'p1',
    name: 'Peeling Químico',
    description: 'Renovação celular e clareamento',
    price: 200,
    duration: 60,
    active: true,
  },
  {
    id: 's3',
    professionalId: 'p2',
    name: 'Harmonização Facial',
    description: 'Consulta e primeira aplicação',
    price: 500,
    duration: 60,
    active: true,
  },
]

export const DataProvider = ({ children }: { children: ReactNode }) => {
  const [professionals] = useState<Professional[]>(INITIAL_PROFS)
  const [services] = useState<Service[]>(INITIAL_SERVICES)
  const [appointments, setAppointments] = useState<Appointment[]>([])

  const addAppointment = (app: Appointment) => setAppointments((prev) => [...prev, app])

  return React.createElement(
    DataContext.Provider,
    {
      value: { professionals, services, appointments, setAppointments, addAppointment },
    },
    children,
  )
}

export default function useDataStore() {
  return useContext(DataContext)
}
