import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import useDataStore from '@/stores/useDataStore'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export default function ProfessionalDashboard() {
  const { appointments, services } = useDataStore()

  // In a real app, filter by `user.id === professionalId`

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h2 className="text-3xl font-bold text-slate-800">Painel do Profissional</h2>
        <p className="text-slate-500 mt-1">Gerencie sua agenda e seu portfólio de serviços.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <Card className="shadow-sm border-slate-200">
          <CardHeader>
            <CardTitle>Próximos Agendamentos</CardTitle>
            <CardDescription>Pacientes confirmados para os próximos dias.</CardDescription>
          </CardHeader>
          <CardContent>
            {appointments.length === 0 ? (
              <div className="py-8 text-center text-slate-500">Nenhum agendamento futuro.</div>
            ) : (
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader className="bg-slate-50">
                    <TableRow>
                      <TableHead>Paciente</TableHead>
                      <TableHead>Data / Hora</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {appointments.map((a) => (
                      <TableRow key={a.id}>
                        <TableCell className="font-medium">{a.clientName}</TableCell>
                        <TableCell className="text-slate-600">
                          {a.date} às {a.time}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={a.status === 'Confirmado' ? 'default' : 'secondary'}
                            className={
                              a.status === 'Confirmado' ? 'bg-emerald-500 hover:bg-emerald-600' : ''
                            }
                          >
                            {a.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-200">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Meus Serviços</CardTitle>
                <CardDescription>Os procedimentos que você oferece.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {services.map((s) => (
                <li
                  key={s.id}
                  className="flex justify-between items-center p-4 border rounded-xl bg-white hover:border-primary/30 transition-colors"
                >
                  <div>
                    <p className="font-bold text-slate-800">{s.name}</p>
                    <p className="text-sm font-medium text-primary mt-1">
                      R$ {s.price.toFixed(2)}{' '}
                      <span className="text-slate-400 font-normal ml-2">{s.duration} min</span>
                    </p>
                  </div>
                  <Badge
                    variant="secondary"
                    className={s.active ? 'bg-emerald-100 text-emerald-700' : ''}
                  >
                    {s.active ? 'Ativo' : 'Inativo'}
                  </Badge>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
