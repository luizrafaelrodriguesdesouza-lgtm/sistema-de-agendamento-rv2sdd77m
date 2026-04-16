import { useState, useEffect, useCallback } from 'react'
import { Calendar } from '@/components/ui/calendar'
import { Button } from '@/components/ui/button'
import { ptBR } from 'date-fns/locale'
import pb from '@/lib/pocketbase/client'
import { useRealtime } from '@/hooks/use-realtime'

export function DateTimePicker({
  professionalId,
  serviceDuration,
  onSelect,
}: {
  professionalId: string
  serviceDuration: number
  onSelect: (dt: { date: Date; time: string }) => void
}) {
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [time, setTime] = useState<string | null>(null)

  const [availableTimes, setAvailableTimes] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const fetchTimes = useCallback(async () => {
    if (!date || !professionalId) return
    setLoading(true)
    try {
      const dayOfWeek = date.getDay()
      const schedule = await pb.collection('horarios_disponiveis').getFullList({
        filter: `profissional_id = '${professionalId}' && dia_semana = ${dayOfWeek}`,
      })

      const startOfDay = new Date(date)
      startOfDay.setHours(0, 0, 0, 0)
      const endOfDay = new Date(date)
      endOfDay.setHours(23, 59, 59, 999)

      const apps = await pb.collection('agendamentos').getFullList({
        filter: `profissional_id = '${professionalId}' && data >= '${startOfDay.toISOString().replace('T', ' ')}' && data <= '${endOfDay.toISOString().replace('T', ' ')}' && status != 'cancelado'`,
        expand: 'servico_id',
      })

      const busyBlocks = apps.map((a) => {
        const start = new Date(a.data)
        const dur = a.expand?.servico_id?.duracao || 30
        const end = new Date(start.getTime() + dur * 60000)
        return { start, end }
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

            const isBusy = busyBlocks.some(
              (b) =>
                (slotStart >= b.start && slotStart < b.end) ||
                (slotEnd > b.start && slotEnd <= b.end) ||
                (slotStart <= b.start && slotEnd >= b.end),
            )

            const isPast = slotStart < new Date()

            if (!isBusy && !isPast) {
              times.push(
                `${slotStart.getHours().toString().padStart(2, '0')}:${slotStart.getMinutes().toString().padStart(2, '0')}`,
              )
            }

            currentSlot = new Date(currentSlot.getTime() + 30 * 60000)
          }
        }
      }

      setAvailableTimes([...new Set(times)].sort())
      setTime(null)
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

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in-up">
      <div>
        <h3 className="font-medium text-slate-700 mb-4">1. Escolha o dia</h3>
        <div className="border rounded-xl p-2 inline-block bg-white shadow-sm w-full sm:w-auto">
          <Calendar
            mode="single"
            selected={date}
            onSelect={(d) => {
              if (d) setDate(d)
            }}
            className="rounded-md"
            disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
            locale={ptBR}
          />
        </div>
      </div>
      <div>
        <h3 className="font-medium text-slate-700 mb-4">2. Escolha o horário</h3>
        {loading ? (
          <p className="text-slate-500 text-sm">Carregando horários...</p>
        ) : !date ? (
          <p className="text-slate-500 text-sm">Selecione uma data primeiro.</p>
        ) : availableTimes.length === 0 ? (
          <p className="text-slate-500 text-sm bg-slate-50 p-4 rounded-lg border">
            Nenhum horário disponível para este dia.
          </p>
        ) : (
          <div className="grid grid-cols-3 gap-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
            {availableTimes.map((t) => (
              <Button
                key={t}
                variant={time === t ? 'default' : 'outline'}
                onClick={() => setTime(t)}
                className="w-full"
              >
                {t}
              </Button>
            ))}
          </div>
        )}

        <div className="mt-8">
          <Button
            className="w-full h-12"
            disabled={!date || !time}
            onClick={() => {
              if (date && time) onSelect({ date, time })
            }}
          >
            Continuar
          </Button>
        </div>
      </div>
    </div>
  )
}
