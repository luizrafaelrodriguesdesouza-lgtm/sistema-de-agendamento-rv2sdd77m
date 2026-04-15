import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Professional, Service } from '@/stores/types'
import useDataStore from '@/stores/useDataStore'
import { ProfessionalCard } from './ProfessionalCard'
import { ServiceList } from './ServiceList'
import { DateTimePicker } from './DateTimePicker'
import { UserForm } from './UserForm'
import { Progress } from '@/components/ui/progress'

export function BookingFlow({ onCancel }: { onCancel: () => void }) {
  const { professionals, services } = useDataStore()
  const [step, setStep] = useState(1)
  const [selectedProf, setSelectedProf] = useState<Professional | null>(null)
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [dateTime, setDateTime] = useState<{ date: Date; time: string } | null>(null)

  const profs = professionals.filter((p) => p.status === 'aprovado')
  const profServices = services.filter((s) => s.professionalId === selectedProf?.id && s.active)

  const handleNext = () => setStep((s) => s + 1)
  const handleBack = () => (step === 1 ? onCancel() : setStep((s) => s - 1))

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
          {profs.map((p) => (
            <ProfessionalCard
              key={p.id}
              prof={p}
              onSelect={() => {
                setSelectedProf(p)
                handleNext()
              }}
            />
          ))}
        </div>
      )}

      {step === 2 && (
        <ServiceList
          services={profServices}
          onSelect={(s) => {
            setSelectedService(s)
            handleNext()
          }}
        />
      )}

      {step === 3 && (
        <DateTimePicker
          onSelect={(dt) => {
            setDateTime(dt)
            handleNext()
          }}
        />
      )}

      {step === 4 && selectedProf && selectedService && dateTime && (
        <UserForm professional={selectedProf} service={selectedService} dateTime={dateTime} />
      )}
    </div>
  )
}
