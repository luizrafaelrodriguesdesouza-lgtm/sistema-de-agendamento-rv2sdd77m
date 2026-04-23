import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import pb from '@/lib/pocketbase/client'
import { useRealtime } from '@/hooks/use-realtime'
import { format } from 'date-fns'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CalendarDays, Search, MapPin, Star } from 'lucide-react'
import { Input } from '@/components/ui/input'

export default function ClientDashboard() {
  const { user } = useAuth()
  const [appointments, setAppointments] = useState<any[]>([])
  const [clinics, setClinics] = useState<any[]>([])
  const [filteredClinics, setFilteredClinics] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [loadingApps, setLoadingApps] = useState(true)
  const [loadingClinics, setLoadingClinics] = useState(true)

  const loadAppointments = async () => {
    if (!user) return
    try {
      const records = await pb.collection('agendamentos').getFullList({
        filter: `cliente_id = '${user.id}'`,
        sort: '-data',
        expand: 'servico_id,profissional_id',
      })
      setAppointments(records)
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingApps(false)
    }
  }

  const loadClinics = async () => {
    try {
      const records = await pb.collection('users').getFullList({
        filter: "tipo = 'proprietario' && status_aprovacao = 'aprovado'",
      })
      setClinics(records)
      setFilteredClinics(records)
    } catch (error) {
      console.error(error)
    } finally {
      setLoadingClinics(false)
    }
  }

  useEffect(() => {
    loadAppointments()
    loadClinics()
  }, [user])

  useEffect(() => {
    if (search.trim() === '') {
      setFilteredClinics(clinics)
    } else {
      const s = search.toLowerCase()
      setFilteredClinics(
        clinics.filter(
          (c) =>
            (c.empresa || '').toLowerCase().includes(s) ||
            (c.name || '').toLowerCase().includes(s) ||
            (c.bio || '').toLowerCase().includes(s),
        ),
      )
    }
  }, [search, clinics])

  useRealtime('agendamentos', () => {
    loadAppointments()
  })

  return (
    <div className="container py-8 px-4 animate-fade-in flex-1 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">
            Olá, {user?.name?.split(' ')[0] || 'Cliente'}!
          </h2>
          <p className="text-slate-500 mt-1">O que você gostaria de agendar hoje?</p>
        </div>
      </div>

      <Tabs defaultValue="explore" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2 mb-8">
          <TabsTrigger value="explore" className="text-base h-10">
            <Search className="w-4 h-4 mr-2" />
            Explorar
          </TabsTrigger>
          <TabsTrigger value="appointments" className="text-base h-10">
            <CalendarDays className="w-4 h-4 mr-2" />
            Meus Agendamentos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="explore" className="space-y-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <Input
              placeholder="Buscar estabelecimentos, serviços..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-12 text-base"
            />
          </div>

          {loadingClinics ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-64 bg-slate-100 rounded-xl animate-pulse"></div>
              ))}
            </div>
          ) : filteredClinics.length === 0 ? (
            <div className="text-center py-20 bg-slate-50 rounded-2xl border border-dashed">
              <p className="text-slate-500">Nenhum estabelecimento encontrado.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
              {filteredClinics.map((clinic) => (
                <Link key={clinic.id} to={`/agendar/${clinic.id}`} className="block h-full">
                  <Card className="h-full hover:-translate-y-1 hover:shadow-elevation transition-all duration-300 border-2 border-transparent hover:border-primary/50 group bg-white flex flex-col">
                    <CardContent className="p-6 flex flex-col gap-4 flex-1">
                      <div className="flex items-start gap-4">
                        <Avatar className="h-16 w-16 shadow-sm bg-primary/10 border-2 border-white group-hover:border-primary/20 transition-colors">
                          <AvatarImage
                            src={clinic.avatar ? pb.files.getURL(clinic, clinic.avatar) : ''}
                          />
                          <AvatarFallback className="text-primary text-xl font-bold">
                            {clinic.empresa?.[0]?.toUpperCase() ||
                              clinic.name?.[0]?.toUpperCase() ||
                              'E'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <h3 className="font-bold text-lg text-slate-800 line-clamp-1">
                            {clinic.empresa || clinic.name}
                          </h3>
                          <div className="flex items-center text-sm text-slate-500 mt-1">
                            <Star className="w-4 h-4 text-amber-400 mr-1 fill-amber-400" />
                            <span>Novo</span>
                          </div>
                        </div>
                      </div>

                      <p className="text-sm text-slate-600 line-clamp-2 flex-1 mt-2">
                        {clinic.bio ||
                          'Estabelecimento parceiro com excelentes serviços disponíveis para você.'}
                      </p>

                      <div className="mt-auto pt-4 border-t flex justify-between items-center">
                        <span className="text-xs text-slate-500 flex items-center">
                          <MapPin className="w-3 h-3 mr-1" />
                          Online
                        </span>
                        <Button
                          variant="secondary"
                          size="sm"
                          className="group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
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
        </TabsContent>

        <TabsContent value="appointments">
          {loadingApps ? (
            <div className="text-center py-20 bg-slate-50 rounded-2xl border border-dashed">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-slate-500">Carregando seus agendamentos...</p>
            </div>
          ) : appointments.length === 0 ? (
            <div className="text-center py-20 bg-slate-50 rounded-2xl border border-dashed flex flex-col items-center justify-center">
              <CalendarDays className="w-12 h-12 text-slate-300 mb-4" />
              <p className="text-slate-600 font-medium mb-2">Você ainda não tem agendamentos.</p>
              <p className="text-slate-500 text-sm mb-6">
                Explore nossos estabelecimentos parceiros e marque seu primeiro horário.
              </p>
              <Button
                onClick={() =>
                  document.querySelector<HTMLButtonElement>('[value="explore"]')?.click()
                }
              >
                Explorar Estabelecimentos
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {appointments.map((app) => {
                const isConfirmed = app.status === 'confirmado'

                return (
                  <Link to={`/consulta/${app.referencia}`} key={app.id} className="block group">
                    <Card
                      className={`h-full transition-all duration-300 border-2 ${isConfirmed ? 'hover:border-primary/50 hover:shadow-md' : 'opacity-80 hover:opacity-100'}`}
                    >
                      <CardContent className="p-6 flex flex-col h-full">
                        <div className="flex justify-between items-start mb-4">
                          <Badge
                            variant="secondary"
                            className={isConfirmed ? 'bg-emerald-100 text-emerald-700' : ''}
                          >
                            {app.status.toUpperCase()}
                          </Badge>
                          <span className="text-sm font-semibold text-slate-700 bg-slate-100 px-2 py-1 rounded">
                            {format(new Date(app.data), 'dd/MM/yyyy HH:mm')}
                          </span>
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-lg text-slate-800 leading-tight">
                            {app.expand?.servico_id?.nome || 'Serviço'}
                          </h3>
                          <p className="text-muted-foreground text-sm mt-1">
                            com {app.expand?.profissional_id?.name || 'Profissional'}
                          </p>
                        </div>
                        <div className="mt-6 pt-4 border-t flex justify-between items-center">
                          <span className="text-xs font-mono text-slate-400">
                            Ref: {app.referencia}
                          </span>
                          <span className="text-sm font-medium text-primary group-hover:underline">
                            Ver detalhes →
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                )
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
