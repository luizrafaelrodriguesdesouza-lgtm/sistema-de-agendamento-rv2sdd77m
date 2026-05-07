import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { BookingFlow } from '@/components/booking/BookingFlow'
import { useEffect, useState } from 'react'
import pb from '@/lib/pocketbase/client'
import { hexToHsl } from '@/lib/colors'
import { Button } from '@/components/ui/button'

export default function Booking() {
  const { proprietarioId, slug } = useParams()
  const [searchParams] = useSearchParams()
  const salao = searchParams.get('salao') || slug
  const navigate = useNavigate()
  const [clinic, setClinic] = useState<any>(null)
  const [resolvedProprietarioId, setResolvedProprietarioId] = useState<string | null>(
    proprietarioId || null,
  )
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchClinic = async () => {
      setLoading(true)
      setError(null)
      try {
        if (proprietarioId) {
          const record = await pb.collection('users').getOne(proprietarioId)
          setClinic(record)
          setResolvedProprietarioId(record.id)
        } else if (salao) {
          const records = await pb.collection('users').getFullList({
            filter: `slug = '${salao}'`,
            max: 1,
          })
          if (records.length > 0) {
            setClinic(records[0])
            setResolvedProprietarioId(records[0].id)
          } else {
            setError('Salão não encontrado. Verifique o link.')
          }
        } else {
          setError('Salão não encontrado. Verifique o link.')
        }
      } catch (err) {
        setError('Salão não encontrado. Verifique o link.')
      } finally {
        setLoading(false)
      }
    }
    fetchClinic()
  }, [proprietarioId, salao])

  if (error) {
    return (
      <div className="flex justify-center py-20 min-h-[calc(100vh-64px)] items-center bg-slate-50">
        <div className="text-center p-8 bg-white rounded-2xl shadow-sm border max-w-md w-full mx-4">
          <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl font-bold">
            !
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Ops!</h2>
          <p className="text-slate-500 mb-6">{error}</p>
          <Button onClick={() => navigate('/')} className="w-full h-12">
            Voltar ao início
          </Button>
        </div>
      </div>
    )
  }

  if (loading || !resolvedProprietarioId || !clinic) {
    return (
      <div className="flex-1 py-12 px-4 md:px-8 bg-slate-50 min-h-[calc(100vh-64px)]">
        <div className="max-w-4xl mx-auto mb-8 flex flex-col items-center">
          <div className="h-20 w-20 bg-slate-200 rounded-xl animate-pulse mb-4"></div>
          <div className="h-8 w-64 bg-slate-200 rounded-lg animate-pulse mb-2"></div>
          <div className="h-4 w-48 bg-slate-200 rounded-lg animate-pulse"></div>
        </div>
        <div className="max-w-4xl mx-auto bg-white rounded-2xl p-6 md:p-10 border">
          <div className="h-8 w-48 bg-slate-200 rounded-lg animate-pulse mb-8"></div>
          <div className="space-y-4">
            <div className="h-24 w-full bg-slate-100 rounded-xl animate-pulse"></div>
            <div className="h-24 w-full bg-slate-100 rounded-xl animate-pulse"></div>
            <div className="h-24 w-full bg-slate-100 rounded-xl animate-pulse"></div>
          </div>
        </div>
      </div>
    )
  }

  const customStyle =
    clinic.cor_tema || clinic.cor_secundaria
      ? ({
          ...(clinic.cor_tema ? { '--primary': hexToHsl(clinic.cor_tema) } : {}),
          ...(clinic.cor_secundaria ? { '--secondary': hexToHsl(clinic.cor_secundaria) } : {}),
        } as React.CSSProperties)
      : undefined

  return (
    <div
      className="flex-1 py-12 px-4 md:px-8 bg-slate-50 min-h-[calc(100vh-64px)] transition-colors duration-500"
      style={customStyle}
    >
      <div className="max-w-4xl mx-auto mb-8 text-center animate-fade-in-down flex flex-col items-center">
        {clinic.logo ? (
          <img
            src={pb.files.getURL(clinic, clinic.logo)}
            alt="Logo"
            className="h-20 w-auto mb-4 rounded-xl shadow-sm object-contain bg-white p-2"
          />
        ) : (
          <div className="h-20 w-20 mb-4 rounded-xl bg-primary/10 flex items-center justify-center text-primary text-3xl font-bold">
            {(clinic.empresa || clinic.name)?.[0]?.toUpperCase() || 'E'}
          </div>
        )}
        <h1 className="text-3xl font-bold text-slate-800 mb-2">
          Agendar em {clinic.empresa || clinic.name}
        </h1>
        <p className="text-slate-500">Siga os passos abaixo para concluir seu agendamento.</p>
      </div>
      <BookingFlow proprietarioId={resolvedProprietarioId} onCancel={() => navigate('/')} />
    </div>
  )
}
