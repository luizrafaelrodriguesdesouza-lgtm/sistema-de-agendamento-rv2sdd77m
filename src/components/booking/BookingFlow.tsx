import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { ProfessionalCard } from './ProfessionalCard'
import { ServiceList } from './ServiceList'
import { DateTimePicker } from './DateTimePicker'
import { UserForm } from './UserForm'
import { Progress } from '@/components/ui/progress'
import pb from '@/lib/pocketbase/client'

export function BookingFlow({ onCancel }: { onCancel: () => void }) {
  const [step, setStep] = useState(1)
  const [selectedProf, setSelectedProf] = useState<any | null>(null)
  const [selectedService, setSelectedService] = useState<any | null>(null)
  const [dateTime, setDateTime] = useState<{ date: Date; time: string } | null>(null)

  const [professionals, setProfessionals] = useState<any[]>([])
  const [services, setServices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProfs = async () => {
      try {
        const profs = await pb.collection('users').getFullList({
          filter: "tipo = 'profissional' && status_aprovacao = 'aprovado'",
        })
        setProfessionals(profs)
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    }
    fetchProfs()
  }, [])

  useEffect(() => {
    if (!selectedProf) return
    const fetchServices = async () => {
      try {
        const servs = await pb.collection('servicos').getFullList({
          filter: `profissional_id = '${selectedProf.id}' && ativo = true`,
        })
        setServices(servs)
      } catch (error) {
        console.error(error)
      }
    }
    fetchServices()
  }, [selectedProf])

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
          <Button variant="ghost" onClick={handleBack} className="text-slate-500">
            Voltar
          </Button>
        </div>
        <Progress value={(step / 4) * 100} className="h-2" />
      </div>

      {step === 1 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {loading ? (
            <p className="col-span-full text-center py-8 text-slate-500">
              Carregando profissionais...
            </p>
          ) : professionals.length === 0 ? (
            <div className="col-span-full text-center py-8 bg-slate-50 rounded-xl border">
              <p className="text-slate-500">Nenhum profissional disponível no momento.</p>
            </div>
          ) : (
            professionals.map((p) => (
              <ProfessionalCard
                key={p.id}
                prof={p}
                onSelect={() => {
                  setSelectedProf(p)
                  handleNext()
                }}
              />
            ))
          )}
        </div>
      )}

      {step === 2 && (
        <ServiceList
          services={services}
          onSelect={(s) => {
            setSelectedService(s)
            handleNext()
          }}
        />
      )}

      {step === 3 && (
        <DateTimePicker
          professionalId={selectedProf?.id}
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
