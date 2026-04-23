import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import pb from '@/lib/pocketbase/client'

export default function Index() {
  const [clinics, setClinics] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchClinics = async () => {
      try {
        const records = await pb.collection('users').getFullList({
          filter: "tipo = 'proprietario' && status_aprovacao = 'aprovado'",
        })
        setClinics(records)
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    }
    fetchClinics()
  }, [])

  return (
    <div className="flex-1 py-12 px-4 md:px-8 bg-slate-50 min-h-[calc(100vh-64px)]">
      <section className="text-center py-16 max-w-5xl mx-auto animate-fade-in-up">
        <div className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary font-semibold text-sm mb-6">
          Agendamento Rápido e Seguro
        </div>
        <h1 className="text-4xl md:text-6xl font-bold text-slate-800 mb-6 leading-tight">
          Encontre os melhores <br className="hidden md:block" /> salões e clínicas.
        </h1>
        <p className="text-xl text-slate-500 mb-12 max-w-2xl mx-auto">
          Escolha o estabelecimento, o serviço desejado e o melhor horário. Tudo de forma 100%
          online.
        </p>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : clinics.length === 0 ? (
          <div className="bg-white p-8 rounded-xl shadow-sm border text-center">
            <p className="text-slate-500 text-lg">Nenhum estabelecimento encontrado no momento.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
            {clinics.map((clinic) => (
              <Link key={clinic.id} to={`/agendar/${clinic.id}`} className="block h-full">
                <Card className="h-full hover:-translate-y-1 hover:shadow-elevation transition-all duration-300 border-2 border-transparent hover:border-primary/50 group bg-white">
                  <CardContent className="p-6 flex flex-col items-center text-center gap-4 h-full">
                    <Avatar className="h-24 w-24 shadow-sm bg-primary/10 border-4 border-white group-hover:border-primary/20 transition-colors">
                      <AvatarImage
                        src={clinic.avatar ? pb.files.getURL(clinic, clinic.avatar) : ''}
                      />
                      <AvatarFallback className="text-primary text-3xl font-bold">
                        {clinic.empresa?.[0]?.toUpperCase() ||
                          clinic.name?.[0]?.toUpperCase() ||
                          'E'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 flex flex-col w-full">
                      <h3 className="font-bold text-xl text-slate-800 mb-2">
                        {clinic.empresa || clinic.name}
                      </h3>
                      <p className="text-sm text-slate-500 line-clamp-3 mb-4 flex-1">
                        {clinic.bio || 'Nenhuma descrição disponível.'}
                      </p>
                      <Button
                        variant="secondary"
                        className="w-full mt-auto group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                      >
                        Agendar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
