import { Card, CardContent } from '@/components/ui/card'

export function ServiceList({
  services,
  onSelect,
}: {
  services: any[]
  onSelect: (s: any) => void
}) {
  if (services.length === 0)
    return (
      <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed">
        <p className="text-slate-500">Nenhum serviço disponível no momento.</p>
      </div>
    )

  return (
    <div className="grid grid-cols-1 gap-4 animate-fade-in-up">
      {services.map((s) => (
        <Card
          key={s.id}
          className="cursor-pointer hover:-translate-y-0.5 hover:shadow-md hover:border-primary/50 transition-all"
          onClick={() => onSelect(s)}
        >
          <CardContent className="p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex-1">
              <h4 className="font-bold text-lg text-slate-800">{s.nome}</h4>
              <p className="text-sm text-slate-500 mt-1">{s.descricao}</p>
            </div>
            <div className="text-left sm:text-right bg-primary/5 rounded-lg p-3 min-w-[120px]">
              <p className="font-bold text-primary text-xl">R$ {s.preco.toFixed(2)}</p>
              <p className="text-xs font-medium text-slate-500">{s.duracao} minutos</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
