import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { format, setHours, setMinutes } from 'date-fns'
import pb from '@/lib/pocketbase/client'
import { useAuth } from '@/hooks/use-auth'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'

const formSchema = z.object({
  cliente_nome: z.string().min(2, 'Nome é obrigatório'),
  cliente_email: z.string().email('E-mail inválido'),
  cliente_telefone: z.string().min(10, 'Telefone inválido (mínimo 10 dígitos)'),
})

export function UserForm({
  proprietarioId,
  professional,
  service,
  dateTime,
  initialData,
  onSuccess,
  onChange,
}: {
  proprietarioId: string
  professional: any
  service: any
  dateTime: { date: string; time: string }
  initialData?: { cliente_nome: string; cliente_email: string; cliente_telefone: string } | null
  onSuccess: (ref: string, isClientLoggedIn?: boolean) => void
  onChange?: (data: any) => void
}) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      cliente_nome: initialData?.cliente_nome || user?.name || '',
      cliente_email: initialData?.cliente_email || user?.email || '',
      cliente_telefone: initialData?.cliente_telefone || '',
    },
  })

  useEffect(() => {
    const subscription = form.watch((value) => {
      onChange?.(value)
    })
    return () => subscription.unsubscribe()
  }, [form, onChange])

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setLoading(true)

    try {
      const [hour, minute] = dateTime.time.split(':')
      const dt = setMinutes(setHours(new Date(dateTime.date), parseInt(hour)), parseInt(minute))

      const ref = Math.random().toString(36).substring(2, 8).toUpperCase()

      const payload: any = {
        proprietario_id: proprietarioId,
        profissional_id: professional.id,
        servico_id: service.id,
        data: dt.toISOString(), // Automatically converted to UTC
        status: 'pendente',
        referencia: ref,
        ...values,
      }

      const isClientLoggedIn = user && user.tipo === 'cliente'
      if (isClientLoggedIn) {
        payload.cliente_id = user.id
      }

      await pb.collection('agendamentos').create(payload)

      toast({
        title: 'Agendamento Confirmado!',
        description: isClientLoggedIn
          ? 'Você pode acompanhar seus agendamentos no painel.'
          : `Sua referência é: ${ref}`,
      })
      onSuccess(ref, isClientLoggedIn)
    } catch (err: any) {
      let msg = err.response?.message || err.message || 'Erro ao agendar'
      if (err.status === 403) {
        msg = 'Permissão negada. Não foi possível vincular o agendamento à sua conta.'
      } else if (err.status === 400) {
        msg = 'Dados inválidos. Verifique os campos e tente novamente.'
      }
      toast({ title: 'Erro ao agendar', description: msg, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="animate-fade-in-up space-y-6">
      <div className="bg-slate-50 p-6 rounded-xl border mb-6 space-y-2">
        <h3 className="font-bold text-slate-800">Resumo do Agendamento</h3>
        <p className="text-sm text-slate-600">
          <span className="font-semibold">Serviço:</span> {service.nome}
        </p>
        <p className="text-sm text-slate-600">
          <span className="font-semibold">Profissional:</span> {professional.name}
        </p>
        <p className="text-sm text-slate-600">
          <span className="font-semibold">Data/Hora:</span>{' '}
          {format(new Date(dateTime.date), 'dd/MM/yyyy')} às {dateTime.time}
        </p>
        <p className="text-sm text-slate-600">
          <span className="font-semibold">Valor:</span> R$ {service.preco.toFixed(2)}
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="cliente_nome"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Seu Nome Completo</FormLabel>
                <FormControl>
                  <Input
                    placeholder="João da Silva"
                    className="h-12"
                    disabled={!!(user && user.tipo === 'cliente')}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="cliente_email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>E-mail</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="joao@exemplo.com"
                    className="h-12"
                    disabled={!!(user && user.tipo === 'cliente')}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="cliente_telefone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Telefone (WhatsApp)</FormLabel>
                <FormControl>
                  <Input placeholder="(11) 99999-9999" className="h-12" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full h-14 text-lg mt-4" disabled={loading}>
            {loading ? 'Confirmando...' : 'Confirmar Agendamento'}
          </Button>
        </form>
      </Form>
    </div>
  )
}
