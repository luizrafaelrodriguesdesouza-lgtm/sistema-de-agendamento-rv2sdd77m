import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Sparkles } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import pb from '@/lib/pocketbase/client'
import { useRealtime } from '@/hooks/use-realtime'
import { useToast } from '@/hooks/use-toast'
import { BookingFlow } from '@/components/booking/BookingFlow'
import { UpcomingSection } from '@/components/client-dashboard/UpcomingSection'
import { HistorySection } from '@/components/client-dashboard/HistorySection'
import { AvailableServicesSection } from '@/components/client-dashboard/AvailableServicesSection'

export default function ClientDashboard() {
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()

  const [appointments, setAppointments] = useState<any[]>([])
  const [services, setServices] = useState<any[]>([])
  const [professionals, setProfessionals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [isBookingOpen, setIsBookingOpen] = useState(false)
  const [bookingProprietarioId, setBookingProprietarioId] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login')
    }
  }, [user, authLoading, navigate])

  const loadData = async (showLoader = true) => {
    if (!user) return
    if (showLoader) setLoading(true)
    try {
      const [apps, servs, profs] = await Promise.all([
        pb.collection('agendamentos').getFullList({
          filter: `cliente_id = '${user.id}'`,
          expand: 'servico_id,profissional_id',
        }),
        pb.collection('servicos').getFullList({
          filter: `ativo = true`,
          expand: 'proprietario_id,profissional_id',
        }),
        pb.collection('users').getFullList({
          filter: `tipo = 'profissional' || tipo = 'proprietario'`,
        }),
      ])
      setAppointments(apps)
      setServices(servs)
      setProfessionals(profs)
    } catch (err) {
      console.error(err)
    } finally {
      if (showLoader) setLoading(false)
    }
  }

  useEffect(() => {
    if (user) loadData(true)
  }, [user])

  useRealtime('agendamentos', () => {
    loadData(false)
  })

  const handleCancel = async (id: string) => {
    if (!confirm('Deseja cancelar este agendamento?')) return
    try {
      await pb.collection('agendamentos').update(id, { status: 'cancelado' })
      toast({ title: 'Sucesso', description: 'Agendamento cancelado.' })
      loadData(false)
    } catch (e) {
      toast({
        title: 'Erro',
        description: 'Erro ao cancelar o agendamento.',
        variant: 'destructive',
      })
    }
  }

  const handleReschedule = (app: any) => {
    const propId = app.expand?.profissional_id?.proprietario_id || app.profissional_id
    if (propId) {
      setBookingProprietarioId(propId)
      setIsBookingOpen(true)
      toast({
        title: 'Remarcar',
        description:
          'Selecione um novo horário. Lembre-se de cancelar o agendamento anterior se necessário.',
      })
    } else {
      toast({
        title: 'Erro',
        description: 'Não foi possível identificar o estabelecimento.',
        variant: 'destructive',
      })
    }
  }

  const handleBook = (service: any) => {
    const propId =
      service.proprietario_id || service.expand?.proprietario_id?.id || service.profissional_id
    if (propId) {
      setBookingProprietarioId(propId)
      setIsBookingOpen(true)
    } else {
      toast({
        title: 'Erro',
        description: 'Não foi possível identificar o estabelecimento.',
        variant: 'destructive',
      })
    }
  }

  const isPageLoading = authLoading || (loading && !appointments.length && !services.length)

  if (isPageLoading) {
    return (
      <div className="container max-w-5xl mx-auto py-8 px-4 flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="container max-w-5xl mx-auto py-8 px-4 space-y-12 animate-fade-in">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">
          Olá, {user?.name?.split(' ')[0] || 'Cliente'}!
        </h1>
        <p className="text-slate-500 mt-1">
          Bem-vindo ao seu painel de controle. Gerencie seus agendamentos e histórico.
        </p>
      </header>

      <UpcomingSection
        appointments={appointments}
        loading={loading}
        onCancel={handleCancel}
        onReschedule={handleReschedule}
      />

      <HistorySection appointments={appointments} professionals={professionals} loading={loading} />

      {user && !user.proprietario_id ? (
        <section className="space-y-6">
          <div className="flex items-center gap-2 border-b pb-2">
            <Sparkles className="w-6 h-6 text-amber-500" />
            <h2 className="text-2xl font-semibold text-slate-800">
              Serviços Disponíveis para Agendar
            </h2>
          </div>
          <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-300">
            <p className="text-slate-600 font-medium">
              Você não está vinculado a nenhuma clínica. Contate o administrador.
            </p>
          </div>
        </section>
      ) : (
        <AvailableServicesSection
          services={services}
          professionals={professionals}
          loading={loading}
          onBook={handleBook}
        />
      )}

      <Dialog
        open={isBookingOpen}
        onOpenChange={(open) => {
          setIsBookingOpen(open)
          if (!open) {
            setBookingProprietarioId(null)
            loadData(false)
          }
        }}
      >
        <DialogContent className="max-w-4xl p-0 bg-transparent border-none shadow-none">
          <DialogTitle className="sr-only">Novo Agendamento</DialogTitle>
          <DialogDescription className="sr-only">
            Formulário para agendamento de serviço
          </DialogDescription>
          {bookingProprietarioId && (
            <div className="w-full bg-background rounded-2xl overflow-hidden">
              <BookingFlow
                proprietarioId={bookingProprietarioId}
                onCancel={() => {
                  setIsBookingOpen(false)
                  setBookingProprietarioId(null)
                  loadData(false)
                }}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
