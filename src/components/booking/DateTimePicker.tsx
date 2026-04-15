import { useState, useEffect } from 'react'
import { Calendar } from '@/components/ui/calendar'
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import pb from '@/lib/pocketbase/client'

export function DateTimePicker({
  professionalId,
  onSelect,
}: {
  professionalId: string
  onSelect: (dt: { date: Date; time: string }) => void
}) {
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [time, setTime] = useState<string | null>(null)

  const [availableTimes, setAvailableTimes] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!date || !professionalId) return

    const fetchTimes = async () => {
      setLoading(true)
      try {
        const dayOfWeek = date.getDay()
        const schedule = await pb.collection('horarios_disponiveis').getFullList({
          filter: `profissional_id = '${professionalId}' && dia_semana = ${dayOfWeek}`,
        })

        const dateStr = format(date, 'yyyy-MM-dd') + ' 00:00:00.000Z'
        const nextDayStr =
          format(new Date(date.getTime() + 86400000), 'yyyy-MM-dd') + ' 00:00:00.000Z'

        const apps = await pb.collection('agendamentos').getFullList({
          filter: `profissional_id = '${professionalId}' && data >= '${dateStr}' && data < '${nextDayStr}' && status != 'cancelado'`,
        })

        const bookedTimes = apps.map((a) => {
          const appDate = new Date(a.data)
          return `${appDate.getHours().toString().padStart(2, '0')}:${appDate.getMinutes().toString().padStart(2, '0')}`
        })

        let times: string[] = []
        if (schedule.length > 0) {
          const s = schedule[0]
          let currentH = parseInt(s.hora_inicio.split(':')[0])
          const endH = parseInt(s.hora_fim.split(':')[0])

          while (currentH < endH) {
            const tStr = `${currentH.toString().padStart(2, '0')}:00`
            if (!bookedTimes.includes(tStr)) {
              times.push(tStr)
            }
            currentH++
          }
        }

        setAvailableTimes(times)
        setTime(null)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchTimes()
  }, [date, professionalId])

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in-up">
      <div>
        <h3 className="font-medium text-slate-700 mb-4">1. Escolha o dia</h3>
        <div className="border rounded-xl p-2 inline-block bg-white shadow-sm">
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
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
          <div className="grid grid-cols-3 gap-3">
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
