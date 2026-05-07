import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { ProfessionalCard } from './ProfessionalCard'
import { ServiceList } from './ServiceList'
import { DateTimePicker } from './DateTimePicker'
import { UserForm } from './UserForm'
import { Progress } from '@/components/ui/progress'
import pb from '@/lib/pocketbase/client'
import { RotateCcw } from 'lucide-react'

const STORAGE_KEY = 'booking_state'

import { useNavigate } from 'react-router-dom'

export function BookingFlow({
  proprietarioId,
  onCancel,
}: {
  proprietarioId: string
  onCancel: () => void
}) {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [selectedService, setSelectedService] = useState<any | null>(null)
  const [selectedProf, setSelectedProf] = useState<any | null>(null)
  const [dateTime, setDateTime] = useState<{ date: string; time: string } | null>(null)
  const [infosCliente, setInfosCliente] = useState<{
    cliente_nome: string
    cliente_email: string
    cliente_telefone: string
  } | null>(null)

  const [services, setServices] = useState<any[]>([])
  const [professionals, setProfessionals] = useState<any[]>([])
  const [loadingServices, setLoadingServices] = useState(true)
  const [loadingProfs, setLoadingProfs] = useState(false)

  // Hydration & Initialization
  useEffect(() => {
    const saved = sessionStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (parsed.proprietarioId === proprietarioId) {
          if (parsed.servicoSelecionado) setSelectedService(parsed.servicoSelecionado)
          if (parsed.profissionalSelecionado) setSelectedProf(parsed.profissionalSelecionado)
          if (parsed.dataSelecionada) setDateTime(parsed.dataSelecionada)
          if (parsed.infosCliente) setInfosCliente(parsed.infosCliente)
          if (parsed.step) setStep(parsed.step)
        }
      } catch {
        /* intentionally ignored */
      }
    }

    const fetchServices = async () => {
      setLoadingServices(true)
      try {
        const servs = await pb.collection('servicos').getFullList({
          filter: `proprietario_id = '${proprietarioId}' && ativo = true`,
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

  // Fetch Professionals when Step 2
  useEffect(() => {
    if (step === 2 && selectedService) {
      const fetchProfs = async () => {
        setLoadingProfs(true)
        try {
          let filterStr = `((tipo = 'profissional' && proprietario_id = '${proprietarioId}') || id = '${proprietarioId}') && status_aprovacao = 'aprovado'`
          if (selectedService.profissional_id) {
            filterStr = `id = '${selectedService.profissional_id}'`
          }
          const profs = await pb.collection('users').getFullList({ filter: filterStr })
          setProfessionals(profs)
        } catch (error) {
          console.error(error)
        } finally {
          setLoadingProfs(false)
        }
      }
      fetchProfs()
    }
  }, [step, selectedService, proprietarioId])

  // Save state
  useEffect(() => {
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        proprietarioId,
        step,
        servicoSelecionado: selectedService,
        profissionalSelecionado: selectedProf,
        dataSelecionada: dateTime,
        infosCliente,
      }),
    )
  }, [step, selectedService, selectedProf, dateTime, infosCliente, proprietarioId])

  const handleReset = () => {
    sessionStorage.removeItem(STORAGE_KEY)
    setSelectedService(null)
    setSelectedProf(null)
    setDateTime(null)
    setInfosCliente(null)
    setStep(1)
  }

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
          <div className="flex gap-2">
            <Button
              variant="ghost"
              onClick={handleReset}
              className="text-slate-500"
              title="Reiniciar"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
            {step > 1 && (
              <Button variant="ghost" onClick={handleBack} className="text-slate-500">
                Voltar
              </Button>
            )}
          </div>
        </div>
        <Progress value={(step / 4) * 100} className="h-2" />
      </div>

      {step === 1 && (
        <div className="w-full">
          {loadingServices ? (
            <div className="space-y-4">
              <div className="h-24 w-full bg-slate-100 rounded-xl animate-pulse border border-slate-200"></div>
              <div className="h-24 w-full bg-slate-100 rounded-xl animate-pulse border border-slate-200"></div>
              <div className="h-24 w-full bg-slate-100 rounded-xl animate-pulse border border-slate-200"></div>
            </div>
          ) : services.length === 0 ? (
            <div className="text-center py-8 bg-slate-50 rounded-xl border">
              <p className="text-slate-500">Nenhum serviço disponível.</p>
            </div>
          ) : (
            <ServiceList
              services={services}
              onSelect={(s) => {
                setSelectedService(s)
                if (selectedProf && s.profissional_id && s.profissional_id !== selectedProf.id) {
                  setSelectedProf(null)
                }
                handleNext()
              }}
            />
          )}
        </div>
      )}

      {step === 2 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {loadingProfs ? (
            <>
              <div className="h-40 w-full bg-slate-100 rounded-xl animate-pulse border border-slate-200"></div>
              <div className="h-40 w-full bg-slate-100 rounded-xl animate-pulse border border-slate-200"></div>
            </>
          ) : professionals.length === 0 ? (
            <div className="col-span-full text-center py-8 bg-slate-50 rounded-xl border">
              <p className="text-slate-500">Nenhum profissional disponível para este serviço.</p>
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

      {step === 3 && selectedService && selectedProf && (
        <DateTimePicker
          professionalId={selectedProf.id}
          serviceId={selectedService.id}
          serviceDuration={selectedService.duracao || 30}
          initialDate={dateTime}
          onSelect={(dt) => {
            setDateTime(dt)
            handleNext()
          }}
        />
      )}

      {step === 4 && selectedProf && selectedService && dateTime && (
        <UserForm
          proprietarioId={proprietarioId}
          professional={selectedProf}
          service={selectedService}
          dateTime={dateTime}
          initialData={infosCliente}
          onSuccess={(ref) => {
            sessionStorage.removeItem(STORAGE_KEY)
            navigate(`/consulta/${ref}`)
          }}
          onChange={(data) => setInfosCliente(data)}
        />
      )}
    </div>
  )
}
