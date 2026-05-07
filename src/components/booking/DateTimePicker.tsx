import { useState, useEffect, useCallback } from 'react'
import { Calendar } from '@/components/ui/calendar'
import { Button } from '@/components/ui/button'
import { ptBR } from 'date-fns/locale'
import pb from '@/lib/pocketbase/client'
import { useRealtime } from '@/hooks/use-realtime'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { setHours, setMinutes, format } from 'date-fns'
import { Form, FormField, FormItem, FormMessage, FormControl } from '@/components/ui/form'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { AlertCircle } from 'lucide-react'

const formSchema = z.object({
  time: z.string().min(1, 'Selecione um horário'),
})

export function DateTimePicker({
  professionalId,
  serviceId,
  serviceDuration,
  initialDate,
  onSelect,
}: {
  professionalId: string
  serviceId: string
  serviceDuration: number
  initialDate?: { date: string; time: string } | null
  onSelect: (dt: { date: string; time: string }) => void
}) {
  const [date, setDate] = useState<Date | undefined>(
    initialDate ? new Date(initialDate.date) : new Date(),
  )

  const [availableTimes, setAvailableTimes] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [isChecking, setIsChecking] = useState(false)
  const [conflictDetails, setConflictDetails] = useState<any[] | null>(null)
  const [suggestedTimes, setSuggestedTimes] = useState<string[]>([])

  const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      time: initialDate?.time || '',
    },
  })

  const timeValue = form.watch('time')

  const fetchTimes = useCallback(async () => {
    if (!date || !professionalId) return
    setLoading(true)
    try {
      let bufferMinutes = 15
      try {
        const settings = await pb.collection('settings').getList(1, 1)
        if (settings.items.length > 0) {
          bufferMinutes = settings.items[0].buffer_duration ?? 15
        }
      } catch {
        /* intentionally ignored */
      }

      const dayOfWeek = date.getDay()
      const schedule = await pb.collection('horarios_disponiveis').getFullList({
        filter: `profissional_id = '${professionalId}' && dia_semana = ${dayOfWeek}`,
      })

      const startOfDay = new Date(date)
      startOfDay.setHours(0, 0, 0, 0)
      const searchStart = new Date(startOfDay.getTime() - 24 * 60 * 60000)
      const searchEnd = new Date(startOfDay.getTime() + 48 * 60 * 60000)

      const apps = await pb.collection('agendamentos').getFullList({
        filter: `profissional_id = '${professionalId}' && data >= '${searchStart.toISOString().replace('T', ' ')}' && data <= '${searchEnd.toISOString().replace('T', ' ')}' && status != 'cancelado'`,
        expand: 'servico_id',
      })

      const busyBlocks = apps.map((a) => {
        const start = new Date(a.data)
        const dur = a.expand?.servico_id?.duracao || 30
        return { start, dur }
      })

      let times: string[] = []
      if (schedule.length > 0) {
        for (const s of schedule) {
          const [startH, startM] = s.hora_inicio.split(':').map(Number)
          const [endH, endM] = s.hora_fim.split(':').map(Number)

          let currentSlot = new Date(date)
          currentSlot.setHours(startH, startM, 0, 0)

          const endOfShift = new Date(date)
          endOfShift.setHours(endH, endM, 0, 0)

          while (currentSlot.getTime() + serviceDuration * 60000 <= endOfShift.getTime()) {
            const slotStart = new Date(currentSlot)
            const slotEnd = new Date(currentSlot.getTime() + serviceDuration * 60000)

            const reqStart = slotStart.getTime() - bufferMinutes * 60000
            const reqEnd = slotEnd.getTime() + bufferMinutes * 60000

            const isBusy = busyBlocks.some((b) => {
              const bStart = b.start.getTime() - bufferMinutes * 60000
              const bEnd = b.start.getTime() + b.dur * 60000 + bufferMinutes * 60000
              return bStart < reqEnd && bEnd > reqStart
            })

            const isPast = slotStart < new Date()

            if (!isBusy && !isPast) {
              times.push(
                `${slotStart.getHours().toString().padStart(2, '0')}:${slotStart.getMinutes().toString().padStart(2, '0')}`,
              )
            }

            currentSlot = new Date(currentSlot.getTime() + 15 * 60000)
          }
        }
      }

      const uniqueTimes = [...new Set(times)].sort()
      setAvailableTimes(uniqueTimes)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [date, professionalId, serviceDuration])

  useEffect(() => {
    fetchTimes()
  }, [fetchTimes])

  useRealtime('agendamentos', () => {
    fetchTimes()
  })

  const validateTime = async (t: string) => {
    setIsChecking(true)
    setConflictDetails(null)
    setSuggestedTimes([])
    try {
      const [h, m] = t.split(':').map(Number)
      const localDate = setMinutes(setHours(date!, h), m)

      await pb.send('/backend/v1/agendamentos/validate', {
        method: 'POST',
        body: JSON.stringify({
          profissional_id: professionalId,
          servico_id: serviceId,
          data: localDate.toISOString(),
        }),
        headers: { 'Content-Type': 'application/json' },
      })

      form.clearErrors('time')
    } catch (err: any) {
      if (err.status === 409 && err.response?.details) {
        form.setError('time', { type: 'manual', message: err.response.message })
        setConflictDetails(err.response.details)

        const idx = availableTimes.indexOf(t)
        if (idx !== -1) {
          const suggestions = availableTimes.slice(idx + 1).slice(0, 3)
          setSuggestedTimes(suggestions)
        }
      }
    } finally {
      setIsChecking(false)
    }
  }

  const handleTimeSelect = (t: string) => {
    form.setValue('time', t, { shouldValidate: true })
    validateTime(t)
  }

  const handleContinue = form.handleSubmit((data) => {
    if (date && data.time && !conflictDetails) {
      onSelect({ date: date.toISOString(), time: data.time })
    }
  })

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in-up">
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-medium text-slate-700">1. Escolha o dia</h3>
        </div>
        <div className="border rounded-xl p-2 inline-block bg-white shadow-sm w-full sm:w-auto">
          <Calendar
            mode="single"
            selected={date}
            onSelect={(d) => {
              if (d) {
                setDate(d)
                form.setValue('time', '')
                setConflictDetails(null)
              }
            }}
            className="rounded-md"
            disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
            locale={ptBR}
          />
        </div>
      </div>
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-medium text-slate-700">2. Escolha o horário</h3>
          <span className="text-xs text-slate-400 font-mono bg-slate-100 px-2 py-1 rounded">
            {browserTimezone}
          </span>
        </div>
        {loading ? (
          <p className="text-slate-500 text-sm">Carregando horários...</p>
        ) : !date ? (
          <p className="text-slate-500 text-sm">Selecione uma data primeiro.</p>
        ) : availableTimes.length === 0 ? (
          <p className="text-slate-500 text-sm bg-slate-50 p-4 rounded-lg border">
            Nenhum horário disponível para este dia.
          </p>
        ) : (
          <Form {...form}>
            <form onSubmit={handleContinue} className="space-y-6">
              <FormField
                control={form.control}
                name="time"
                render={() => (
                  <FormItem>
                    <FormControl>
                      <div className="grid grid-cols-3 gap-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                        {availableTimes.map((t) => {
                          const isSelected = timeValue === t
                          const isConflict = isSelected && conflictDetails !== null

                          return (
                            <Tooltip key={t} delayDuration={0}>
                              <TooltipTrigger asChild>
                                <Button
                                  type="button"
                                  variant={isSelected ? 'default' : 'outline'}
                                  onClick={() => handleTimeSelect(t)}
                                  className={cn(
                                    'w-full transition-all',
                                    isConflict &&
                                      'border-destructive bg-destructive/10 text-destructive hover:bg-destructive/20 hover:text-destructive',
                                    isChecking && isSelected && 'opacity-50',
                                  )}
                                >
                                  {isChecking && isSelected ? '...' : t}
                                  {isConflict && <AlertCircle className="w-4 h-4 ml-2" />}
                                </Button>
                              </TooltipTrigger>
                              {isConflict && conflictDetails && (
                                <TooltipContent
                                  side="top"
                                  className="bg-destructive text-destructive-foreground"
                                >
                                  <p className="font-semibold mb-1">Horário em conflito com:</p>
                                  {conflictDetails.map((c: any, i: number) => (
                                    <p key={i} className="text-xs">
                                      - {c.cliente_nome} ({format(new Date(c.data), 'HH:mm')})
                                    </p>
                                  ))}
                                </TooltipContent>
                              )}
                            </Tooltip>
                          )
                        })}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {suggestedTimes.length > 0 && conflictDetails && (
                <div className="bg-amber-50 p-3 rounded-lg border border-amber-200 animate-fade-in">
                  <p className="text-amber-800 text-sm font-medium mb-2">Horários sugeridos:</p>
                  <div className="flex gap-2">
                    {suggestedTimes.map((st) => (
                      <Button
                        key={st}
                        type="button"
                        size="sm"
                        variant="outline"
                        className="border-amber-300 text-amber-700 hover:bg-amber-100"
                        onClick={() => handleTimeSelect(st)}
                      >
                        {st}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-12"
                disabled={!date || !timeValue || !!conflictDetails || isChecking}
              >
                {isChecking ? 'Verificando...' : 'Continuar'}
              </Button>
            </form>
          </Form>
        )}
      </div>
    </div>
  )
}
