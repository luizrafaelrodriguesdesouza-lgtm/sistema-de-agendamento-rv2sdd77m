import { useState } from 'react'
import { Calendar } from '@/components/ui/calendar'
import { Button } from '@/components/ui/button'

const SLOTS = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00']

export function DateTimePicker({
  onSelect,
}: {
  onSelect: (dt: { date: Date; time: string }) => void
}) {
  const [date, setDate] = useState<Date | undefined>(new Date())

  return (
    <div className="flex flex-col md:flex-row gap-8 animate-fade-in-up">
      <div className="flex-1 flex justify-center bg-white border rounded-2xl p-6 shadow-sm">
        <Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          className="rounded-md"
          disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
        />
      </div>
      <div className="flex-1 bg-white border rounded-2xl p-6 shadow-sm">
        <h4 className="font-bold text-lg text-slate-800 mb-6">Horários Disponíveis</h4>
        {date ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {SLOTS.map((t) => (
              <Button
                key={t}
                variant="outline"
                className="hover:bg-primary hover:text-white transition-colors h-12"
                onClick={() => onSelect({ date, time: t })}
              >
                {t}
              </Button>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm flex items-center justify-center h-full">
            Selecione uma data para ver os horários.
          </p>
        )}
      </div>
    </div>
  )
}
