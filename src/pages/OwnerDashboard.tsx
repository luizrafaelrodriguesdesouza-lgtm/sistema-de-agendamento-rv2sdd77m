import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Bar, BarChart, XAxis, YAxis, CartesianGrid } from 'recharts'
import useDataStore from '@/stores/useDataStore'
import { Badge } from '@/components/ui/badge'

export default function OwnerDashboard() {
  const { professionals } = useDataStore()

  const chartData = professionals.map((p) => ({
    name: p.name.split(' ')[1] || p.name.split(' ')[0], // Get last or first name
    receita: Math.floor(Math.random() * 5000) + 1500,
  }))

  const chartConfig = {
    receita: {
      label: 'Receita',
      color: 'hsl(var(--primary))',
    },
  }

  return (
    <div className="space-y-8 animate-fade-in-up">
      <div>
        <h2 className="text-3xl font-bold text-slate-800">Visão Geral da Clínica</h2>
        <p className="text-slate-500 mt-1">Métricas e performance da sua empresa.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider">
              Receita Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-slate-800">R$ 12.450,00</p>
            <p className="text-xs text-emerald-500 font-medium mt-1">+14% este mês</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider">
              Agendamentos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-slate-800">142</p>
            <p className="text-xs text-emerald-500 font-medium mt-1">+5% este mês</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider">
              Taxa No-show
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-rose-500">4.2%</p>
            <p className="text-xs text-slate-400 font-medium mt-1">Estável</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="shadow-sm border-slate-200">
          <CardHeader>
            <CardTitle>Receita por Profissional</CardTitle>
            <CardDescription>Comparativo de faturamento bruto.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="min-h-[300px] w-full mt-4">
              <BarChart data={chartData} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid
                  vertical={false}
                  strokeDasharray="3 3"
                  className="stroke-slate-200"
                />
                <XAxis dataKey="name" tickLine={false} axisLine={false} className="text-xs" />
                <YAxis
                  tickFormatter={(val) => `R$${val}`}
                  tickLine={false}
                  axisLine={false}
                  className="text-xs"
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar
                  dataKey="receita"
                  fill="var(--color-receita)"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={60}
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-200">
          <CardHeader>
            <CardTitle>Gestão da Equipe</CardTitle>
            <CardDescription>Profissionais ativos na sua clínica.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {professionals.map((p) => (
                <div
                  key={p.id}
                  className="flex justify-between items-center p-4 border rounded-xl bg-slate-50"
                >
                  <div className="flex items-center gap-4">
                    <img
                      src={p.photo}
                      alt={p.name}
                      className="w-10 h-10 rounded-full border-2 border-white shadow-sm"
                    />
                    <div>
                      <p className="font-bold text-slate-800">{p.name}</p>
                      <p className="text-xs font-medium text-slate-500 mt-0.5">
                        Comissão Base: {p.commissionRate}%
                      </p>
                    </div>
                  </div>
                  <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-0">
                    Ativo
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
