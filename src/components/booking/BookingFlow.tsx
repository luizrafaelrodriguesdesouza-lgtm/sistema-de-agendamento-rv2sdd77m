import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { ProfessionalCard } from './ProfessionalCard'
import { ServiceList } from './ServiceList'
import { DateTimePicker } from './DateTimePicker'
import { UserForm } from './UserForm'
import { Progress } from '@/components/ui/progress'
import pb from '@/lib/pocketbase/client'

export function BookingFlow({
  proprietarioId,
  onCancel,
}: {
  proprietarioId: string
  onCancel: () => void
}) {
  const [step, setStep] = useState(1)
  const [selectedService, setSelectedService] = useState<any | null>(null)
  const [selectedProfService, setSelectedProfService] = useState<any | null>(null)
  const [selectedProf, setSelectedProf] = useState<any | null>(null)
  const [dateTime, setDateTime] = useState<{ date: Date; time: string } | null>(null)

  const [services, setServices] = useState<any[]>([])
  const [profServices, setProfServices] = useState<any[]>([])
  const [loadingServices, setLoadingServices] = useState(true)
  const [loadingProfs, setLoadingProfs] = useState(false)

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const servs = await pb.collection('servicos').getFullList({
          filter: `proprietario_id = '${proprietarioId}' && profissional_id = '' && ativo = true`,
        })
        setServices(servs)
      } catch (error) {
        console.error(error)
      } finally {
        setLoadingServices(false)
      }
    }
    fetchServices()
  }, [proprietarioId])

  useEffect(() => {
    if (!selectedService) return
    const fetchProfs = async () => {
      setLoadingProfs(true)
      try {
        const safeNome = selectedService.nome.replace(/'/g, "\\'")
        const pServs = await pb.collection('servicos').getFullList({
          filter: `proprietario_id = '${proprietarioId}' && profissional_id != '' && nome = '${safeNome}' && ativo = true`,
          expand: 'profissional_id',
        })
        const validPServs = pServs.filter(
          (ps) => ps.expand?.profissional_id?.status_aprovacao === 'aprovado',
        )
        setProfServices(validPServs)
      } catch (error) {
        console.error(error)
      } finally {
        setLoadingProfs(false)
      }
    }
    fetchProfs()
  }, [selectedService, proprietarioId])

  const handleNext = () => setStep((s) => s + 1)
  const handleBack = () => {
    if (step === 1) onCancel()
    else setStep((s) => s - 1)
  }

  const getStepTitle = () => {
    switch (step) {
      case 1:
        return 'Escolha o Serviço'
      case 2:
        return 'Escolha o Profissional'
      case 3:
        return 'Selecione Data e Hora'
      case 4:
        return 'Confirme seus Dados'
      default:
        return ''
    }
  }

  return (
    <div className="max-w-4xl mx-auto bg-card rounded-2xl shadow-subtle p-6 md:p-10 animate-fade-in-up border">
      <div className="mb-8 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-800">{getStepTitle()}</h2>
          <Button variant="ghost" onClick={handleBack} className="text-slate-500">
            Voltar
          </Button>
        </div>
        <Progress value={(step / 4) * 100} className="h-2" />
      </div>

      {step === 1 && (
        <div className="w-full">
          {loadingServices ? (
            <p className="text-center py-8 text-slate-500">Carregando serviços...</p>
          ) : services.length === 0 ? (
            <div className="text-center py-8 bg-slate-50 rounded-xl border">
              <p className="text-slate-500">Nenhum serviço disponível no momento.</p>
            </div>
          ) : (
            <ServiceList
              services={services}
              onSelect={(s) => {
                setSelectedService(s)
                handleNext()
              }}
            />
          )}
        </div>
      )}

      {step === 2 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {loadingProfs ? (
            <p className="col-span-full text-center py-8 text-slate-500">
              Carregando profissionais...
            </p>
          ) : profServices.length === 0 ? (
            <div className="col-span-full text-center py-8 bg-slate-50 rounded-xl border">
              <p className="text-slate-500">Nenhum profissional disponível para este serviço.</p>
            </div>
          ) : (
            profServices.map((ps) => (
              <ProfessionalCard
                key={ps.expand?.profissional_id?.id}
                prof={ps.expand?.profissional_id}
                onSelect={() => {
                  setSelectedProfService(ps)
                  setSelectedProf(ps.expand?.profissional_id)
                  handleNext()
                }}
              />
            ))
          )}
        </div>
      )}

      {step === 3 && (
        <DateTimePicker
          professionalId={selectedProf?.id}
          serviceDuration={selectedProfService?.duracao || 30}
          onSelect={(dt) => {
            setDateTime(dt)
            handleNext()
          }}
        />
      )}

      {step === 4 && selectedProf && selectedProfService && dateTime && (
        <UserForm
          professional={selectedProf}
          service={selectedProfService}
          dateTime={dateTime}
          onSuccess={onCancel}
        />
      )}
    </div>
  )
}
