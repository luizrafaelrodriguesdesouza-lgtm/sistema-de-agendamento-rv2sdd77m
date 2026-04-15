import useDataStore from '@/stores/useDataStore'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Link } from 'react-router-dom'
import useAuthStore from '@/stores/useAuthStore'

export default function ClientDashboard() {
  const { appointments, services, professionals } = useDataStore()
  const { user } = useAuthStore()

  // Filter for current client by matching email (mock logic)
  const myApps = appointments.filter((a) => a.clientEmail === user?.email)

  return (
    <div className="container py-12 px-4 animate-fade-in flex-1">
      <h2 className="text-2xl font-bold mb-8 text-slate-800">Meus Agendamentos</h2>

      {myApps.length === 0 ? (
        <div className="text-center py-20 bg-slate-50 rounded-2xl border border-dashed">
          <p className="text-slate-500 mb-4">Você ainda não tem nenhum agendamento.</p>
          <Link to="/" className="text-primary font-medium hover:underline">
            Fazer um novo agendamento
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {myApps.map((app) => {
            const srv = services.find((s) => s.id === app.serviceId)
            const prof = professionals.find((p) => p.id === app.professionalId)

            const isConfirmed = app.status === 'Confirmado'

            return (
              <Link to={`/consulta/${app.reference}`} key={app.id} className="block group">
                <Card
                  className={`h-full transition-all duration-300 border-2 ${isConfirmed ? 'hover:border-primary/50 hover:shadow-md' : 'opacity-70'}`}
                >
                  <CardContent className="p-6 flex flex-col h-full">
                    <div className="flex justify-between items-start mb-4">
                      <Badge
                        variant="secondary"
                        className={isConfirmed ? 'bg-emerald-100 text-emerald-700' : ''}
                      >
                        {app.status}
                      </Badge>
                      <span className="text-sm font-semibold text-slate-700 bg-slate-100 px-2 py-1 rounded">
                        {app.date}
                      </span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-slate-800 leading-tight">
                        {srv?.name}
                      </h3>
                      <p className="text-muted-foreground text-sm mt-1">com {prof?.name}</p>
                    </div>
                    <div className="mt-6 pt-4 border-t flex justify-between items-center">
                      <span className="text-xs font-mono text-slate-400">Ref: {app.reference}</span>
                      <span className="text-sm font-medium text-primary">Ver detalhes →</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
