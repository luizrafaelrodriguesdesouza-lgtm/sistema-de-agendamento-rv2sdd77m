import { useParams, useNavigate } from 'react-router-dom'
import { BookingFlow } from '@/components/booking/BookingFlow'
import { useEffect, useState } from 'react'
import pb from '@/lib/pocketbase/client'

export default function Booking() {
  const { proprietarioId } = useParams()
  const navigate = useNavigate()
  const [clinic, setClinic] = useState<any>(null)

  useEffect(() => {
    if (!proprietarioId) return
    pb.collection('users')
      .getOne(proprietarioId)
      .then(setClinic)
      .catch(() => navigate('/'))
  }, [proprietarioId, navigate])

  if (!proprietarioId || !clinic) {
    return (
      <div className="flex justify-center py-20 min-h-[calc(100vh-64px)] items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="flex-1 py-12 px-4 md:px-8 bg-slate-50 min-h-[calc(100vh-64px)]">
      <div className="max-w-4xl mx-auto mb-8 text-center animate-fade-in-down">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">
          Agendar em {clinic.empresa || clinic.name}
        </h1>
        <p className="text-slate-500">Siga os passos abaixo para concluir seu agendamento.</p>
      </div>
      <BookingFlow proprietarioId={proprietarioId} onCancel={() => navigate('/')} />
    </div>
  )
}
