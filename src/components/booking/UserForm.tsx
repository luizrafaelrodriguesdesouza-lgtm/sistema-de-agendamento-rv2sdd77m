import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import useAuthStore from '@/stores/useAuthStore'
import useDataStore from '@/stores/useDataStore'
import { Professional, Service } from '@/stores/types'
import { useToast } from '@/hooks/use-toast'

export function UserForm({
  professional,
  service,
  dateTime,
}: {
  professional: Professional
  service: Service
  dateTime: { date: Date; time: string }
}) {
  const { user } = useAuthStore()
  const { addAppointment } = useDataStore()
  const navigate = useNavigate()
  const { toast } = useToast()

  const [name, setName] = useState(user?.name || '')
  const [email, setEmail] = useState(user?.email || '')
  const [phone, setPhone] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const reference = crypto.randomUUID().split('-')[0].toUpperCase()

    addAppointment({
      id: crypto.randomUUID(),
      reference,
      serviceId: service.id,
      professionalId: professional.id,
      clientName: name,
      clientEmail: email,
      clientPhone: phone,
      date: dateTime.date.toISOString().split('T')[0],
      time: dateTime.time,
      status: 'Confirmado',
    })

    toast({ title: 'Agendamento Confirmado!' })
    navigate(`/consulta/${reference}`)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in-up max-w-xl mx-auto">
      <div className="p-6 bg-primary/5 rounded-xl border border-primary/20 text-sm space-y-2">
        <h4 className="font-bold text-primary mb-4 text-base border-b border-primary/20 pb-2">
          Resumo do Agendamento
        </h4>
        <div className="flex justify-between">
          <span className="text-slate-500">Serviço:</span>{' '}
          <span className="font-medium">{service.name}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Profissional:</span>{' '}
          <span className="font-medium">{professional.name}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Data:</span>{' '}
          <span className="font-medium">
            {dateTime.date.toLocaleDateString('pt-BR')} às {dateTime.time}
          </span>
        </div>
        <div className="flex justify-between pt-2 mt-2 border-t border-primary/20">
          <span className="text-slate-500">Total a Pagar:</span>{' '}
          <span className="font-bold text-primary text-lg">R$ {service.price.toFixed(2)}</span>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border shadow-sm space-y-4">
        <h4 className="font-bold text-slate-800">Seus Dados</h4>
        <div className="space-y-2">
          <Label>Nome Completo</Label>
          <Input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="João da Silva"
          />
        </div>
        <div className="space-y-2">
          <Label>E-mail</Label>
          <Input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="joao@exemplo.com"
          />
        </div>
        <div className="space-y-2">
          <Label>Telefone / WhatsApp</Label>
          <Input
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="(00) 00000-0000"
          />
        </div>
      </div>

      <Button type="submit" className="w-full shadow-elevation" size="lg">
        Confirmar Agendamento
      </Button>
    </form>
  )
}
