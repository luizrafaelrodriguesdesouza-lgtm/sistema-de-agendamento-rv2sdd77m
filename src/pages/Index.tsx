import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import pb from '@/lib/pocketbase/client'
import { BookingFlow } from '@/components/booking/BookingFlow'
import { hexToHsl } from '@/lib/colors'

export default function Index() {
  const [searchParams] = useSearchParams()
  const salaoSlug = searchParams.get('salao')

  const [clinicFromSlug, setClinicFromSlug] = useState<any>(null)
  const [loadingSlug, setLoadingSlug] = useState(false)

  useEffect(() => {
    if (salaoSlug) {
      setLoadingSlug(true)
      pb.collection('users')
        .getFirstListItem(`slug = '${salaoSlug}' && tipo = 'proprietario'`)
        .then(setClinicFromSlug)
        .catch((err) => {
          console.error(err)
          setClinicFromSlug(null)
        })
        .finally(() => setLoadingSlug(false))
    } else {
      setClinicFromSlug(null)
    }
  }, [salaoSlug])

  if (loadingSlug) {
    return (
      <div className="flex justify-center py-20 min-h-[calc(100vh-64px)] items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!salaoSlug) {
    return (
      <div className="flex-1 py-12 px-4 md:px-8 bg-slate-50 min-h-[calc(100vh-64px)] flex flex-col items-center justify-center text-center">
        <h2 className="text-2xl font-bold mb-4 text-slate-800">Acesso Restrito</h2>
        <p className="text-slate-500 max-w-md mb-8">
          Para agendar um serviço, você precisa acessar o link específico do salão ou clínica
          desejada.
        </p>
      </div>
    )
  }

  if (!clinicFromSlug) {
    return (
      <div className="flex-1 py-12 px-4 md:px-8 bg-slate-50 min-h-[calc(100vh-64px)] flex flex-col items-center justify-center text-center">
        <h2 className="text-2xl font-bold mb-4 text-slate-800">Clínica não encontrada</h2>
        <p className="text-slate-500 max-w-md mb-8">Verifique se o link está correto.</p>
      </div>
    )
  }

  const customStyle = clinicFromSlug.cor_tema
    ? ({ '--primary': hexToHsl(clinicFromSlug.cor_tema) } as React.CSSProperties)
    : undefined

  return (
    <div
      className="flex-1 py-12 px-4 md:px-8 bg-slate-50 min-h-[calc(100vh-64px)] transition-colors duration-500"
      style={customStyle}
    >
      <div className="max-w-4xl mx-auto mb-8 text-center animate-fade-in-down flex flex-col items-center">
        {clinicFromSlug.logo ? (
          <img
            src={pb.files.getURL(clinicFromSlug, clinicFromSlug.logo)}
            alt="Logo"
            className="h-20 w-auto mb-4 rounded-xl shadow-sm object-contain bg-white p-2"
          />
        ) : (
          <div className="h-20 w-20 mb-4 rounded-xl bg-primary/10 flex items-center justify-center text-primary text-3xl font-bold">
            {(clinicFromSlug.empresa || clinicFromSlug.name)?.[0]?.toUpperCase() || 'E'}
          </div>
        )}
        <h1 className="text-3xl font-bold text-slate-800 mb-2">
          Agendar em {clinicFromSlug.empresa || clinicFromSlug.name}
        </h1>
        <p className="text-slate-500">Siga os passos abaixo para concluir seu agendamento.</p>
      </div>
      <BookingFlow proprietarioId={clinicFromSlug.id} onCancel={() => {}} />
    </div>
  )
}
