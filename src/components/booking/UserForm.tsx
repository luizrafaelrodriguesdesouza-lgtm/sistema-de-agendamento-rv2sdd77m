import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { format } from 'date-fns'
import pb from '@/lib/pocketbase/client'
import { useAuth } from '@/hooks/use-auth'

export function UserForm({
  professional,
  service,
  dateTime,
  onSuccess,
}: {
  professional: any
  service: any
  dateTime: { date: Date; time: string }
  onSuccess: () => void
}) {
  const { user } = useAuth()
  const { toast } = useToast()

  const [name, setName] = useState(user?.name || '')
  const [email, setEmail] = useState(user?.email || '')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const [hour, minute] = dateTime.time.split(':')
      const dt = new Date(dateTime.date)
      dt.setHours(parseInt(hour), parseInt(minute), 0, 0)

      const ref = Math.random().toString(36).substring(2, 8).toUpperCase()

      const payload: any = {
        profissional_id: professional.id,
        servico_id: service.id,
        data: dt.toISOString(),
        status: 'pendente',
        referencia: ref,
        cliente_nome: name,
        cliente_email: email,
        cliente_telefone: phone,
      }

      if (user && user.tipo === 'cliente') {
        payload.cliente_id = user.id
      }

      await pb.collection('agendamentos').create(payload)

      toast({
        title: 'Agendamento Confirmado!',
        description: `Sua referência é: ${ref}`,
      })
      onSuccess()
    } catch (err: any) {
      toast({ title: 'Erro ao agendar', description: err.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in-up">
      <div className="bg-slate-50 p-6 rounded-xl border mb-6 space-y-2">
        <h3 className="font-bold text-slate-800">Resumo do Agendamento</h3>
        <p className="text-sm text-slate-600">
          <span className="font-semibold">Serviço:</span> {service.nome}
        </p>
        <p className="text-sm text-slate-600">
          <span className="font-semibold">Profissional:</span> {professional.name}
        </p>
        <p className="text-sm text-slate-600">
          <span className="font-semibold">Data/Hora:</span> {format(dateTime.date, 'dd/MM/yyyy')} às{' '}
          {dateTime.time}
        </p>
        <p className="text-sm text-slate-600">
          <span className="font-semibold">Valor:</span> R$ {service.preco.toFixed(2)}
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Seu Nome Completo</Label>
          <Input required value={name} onChange={(e) => setName(e.target.value)} className="h-12" />
        </div>
        <div className="space-y-2">
          <Label>E-mail</Label>
          <Input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-12"
          />
        </div>
        <div className="space-y-2">
          <Label>Telefone (WhatsApp)</Label>
          <Input
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="(00) 00000-0000"
            className="h-12"
          />
        </div>
      </div>

      <Button type="submit" className="w-full h-14 text-lg mt-4" disabled={loading}>
        {loading ? 'Confirmando...' : 'Confirmar Agendamento'}
      </Button>
    </form>
  )
}
