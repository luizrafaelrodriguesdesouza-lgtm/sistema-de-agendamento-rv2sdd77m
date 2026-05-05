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
  const [selectedProf, setSelectedProf] = useState<any | null>(null)
  const [selectedService, setSelectedService] = useState<any | null>(null)
  const [dateTime, setDateTime] = useState<{ date: Date; time: string } | null>(null)

  const [professionals, setProfessionals] = useState<any[]>([])
  const [services, setServices] = useState<any[]>([])
  const [loadingProfs, setLoadingProfs] = useState(true)
  const [loadingServices, setLoadingServices] = useState(false)

  useEffect(() => {
    const fetchProfs = async () => {
      try {
        const profs = await pb.collection('users').getFullList({
          filter: `((tipo = 'profissional' && proprietario_id = '${proprietarioId}') || id = '${proprietarioId}') && status_aprovacao = 'aprovado'`,
        })
        setProfessionals(profs)
      } catch (error) {
        console.error(error)
      } finally {
        setLoadingProfs(false)
      }
    }
    fetchProfs()
  }, [proprietarioId])

  useEffect(() => {
    if (!selectedProf) return
    const fetchServices = async () => {
      setLoadingServices(true)
      try {
        const filterStr =
          selectedProf.id === proprietarioId
            ? `proprietario_id = '${proprietarioId}' && profissional_id = '' && ativo = true`
            : `(profissional_id = '${selectedProf.id}' || (proprietario_id = '${proprietarioId}' && profissional_id = '')) && ativo = true`

        const servs = await pb.collection('servicos').getFullList({
          filter: filterStr,
        })
        setServices(servs)
      } catch (error) {
        console.error(error)
      } finally {
        setLoadingServices(false)
      }
    }
    fetchServices()
  }, [selectedProf, proprietarioId])

  const handleNext = () => setStep((s) => s + 1)
  const handleBack = () => {
    if (step === 1) onCancel()
    else setStep((s) => s - 1)
  }

  const getStepTitle = () => {
    switch (step) {
      case 1:
        return 'Escolha o Profissional'
      case 2:
        return 'Escolha o Serviço'
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
          {step > 1 && (
            <Button variant="ghost" onClick={handleBack} className="text-slate-500">
              Voltar
            </Button>
          )}
        </div>
        <Progress value={(step / 4) * 100} className="h-2" />
      </div>

      {step === 1 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {loadingProfs ? (
            <p className="col-span-full text-center py-8 text-slate-500">
              Carregando profissionais...
            </p>
          ) : professionals.length === 0 ? (
            <div className="col-span-full text-center py-8 bg-slate-50 rounded-xl border">
              <p className="text-slate-500">Nenhum profissional disponível.</p>
            </div>
          ) : (
            professionals.map((prof) => (
              <ProfessionalCard
                key={prof.id}
                prof={prof}
                onSelect={() => {
                  setSelectedProf(prof)
                  handleNext()
                }}
              />
            ))
          )}
        </div>
      )}

      {step === 2 && (
        <div className="w-full">
          {loadingServices ? (
            <p className="text-center py-8 text-slate-500">Carregando serviços...</p>
          ) : services.length === 0 ? (
            <div className="text-center py-8 bg-slate-50 rounded-xl border">
              <p className="text-slate-500">Nenhum serviço disponível para este profissional.</p>
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

      {step === 3 && (
        <DateTimePicker
          professionalId={selectedProf?.id}
          serviceDuration={selectedService?.duracao || 30}
          onSelect={(dt) => {
            setDateTime(dt)
            handleNext()
          }}
        />
      )}

      {step === 4 && selectedProf && selectedService && dateTime && (
        <UserForm
          professional={selectedProf}
          service={selectedService}
          dateTime={dateTime}
          onSuccess={onCancel}
        />
      )}
    </div>
  )
}
