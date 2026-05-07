import { useState, useMemo, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Slider } from '@/components/ui/slider'
import { Sparkles, Clock, User, Search } from 'lucide-react'

interface AvailableServicesSectionProps {
  services: any[]
  professionals: any[]
  loading: boolean
  onBook: (service: any) => void
}

export function AvailableServicesSection({
  services,
  professionals,
  loading,
  onBook,
}: AvailableServicesSectionProps) {
  const [availProf, setAvailProf] = useState('all')
  const [availPrice, setAvailPrice] = useState<number[]>([1000])
  const [availDuration, setAvailDuration] = useState('all')

  const maxPrice = useMemo(() => {
    if (services.length === 0) return 1000
    return Math.max(...services.map((s) => s.preco))
  }, [services])

  useEffect(() => {
    if (maxPrice > 0 && maxPrice !== 1000) setAvailPrice([maxPrice])
  }, [maxPrice])

  const availableServices = useMemo(() => {
    let filtered = services
    if (availProf !== 'all') {
      filtered = filtered.filter(
        (s) => s.profissional_id === availProf || s.proprietario_id === availProf,
      )
    }
    filtered = filtered.filter((s) => s.preco <= availPrice[0])

    if (availDuration !== 'all') {
      if (availDuration === 'short') filtered = filtered.filter((s) => s.duracao <= 30)
      else if (availDuration === 'medium')
        filtered = filtered.filter((s) => s.duracao > 30 && s.duracao <= 60)
      else if (availDuration === 'long') filtered = filtered.filter((s) => s.duracao > 60)
    }
    return filtered
  }, [services, availProf, availPrice, availDuration])

  return (
    <section className="space-y-6">
      <div className="flex items-center gap-2 border-b pb-2">
        <Sparkles className="w-6 h-6 text-amber-500" />
        <h2 className="text-2xl font-semibold text-slate-800">Serviços Disponíveis para Agendar</h2>
      </div>

      <Card className="bg-slate-50/50">
        <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="space-y-2">
            <Label>Profissional / Clínica</Label>
            <Select value={availProf} onValueChange={setAvailProf}>
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {professionals.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name || p.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label>Preço Máximo</Label>
              <span className="text-sm font-medium text-slate-600">R$ {availPrice[0]}</span>
            </div>
            <Slider
              max={Math.max(maxPrice, 100)}
              min={0}
              step={10}
              value={availPrice}
              onValueChange={setAvailPrice}
            />
          </div>
          <div className="space-y-2">
            <Label>Duração</Label>
            <Select value={availDuration} onValueChange={setAvailDuration}>
              <SelectTrigger>
                <SelectValue placeholder="Qualquer" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Qualquer</SelectItem>
                <SelectItem value="short">Até 30 min</SelectItem>
                <SelectItem value="medium">30 a 60 min</SelectItem>
                <SelectItem value="long">Mais de 60 min</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
      ) : availableServices.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed flex flex-col items-center">
          <Search className="w-12 h-12 text-slate-300 mb-4" />
          <p className="text-slate-600 font-medium">Nenhum serviço disponível</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {availableServices.map((s) => (
            <Card
              key={s.id}
              className="flex flex-col h-full hover:shadow-md transition-shadow hover:-translate-y-1"
            >
              <CardHeader>
                <CardTitle className="text-lg">{s.nome}</CardTitle>
                <p className="text-sm text-slate-500 line-clamp-2">
                  {s.descricao || 'Sem descrição'}
                </p>
              </CardHeader>
              <CardContent className="flex-1">
                <div className="space-y-2 text-sm text-slate-600">
                  <div className="flex justify-between">
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" /> Duração
                    </span>
                    <span className="font-medium">{s.duracao} min</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="flex items-center gap-1">
                      <User className="w-4 h-4" /> Profissional
                    </span>
                    <span className="font-medium text-right line-clamp-1">
                      {s.expand?.profissional_id?.name ||
                        s.expand?.proprietario_id?.name ||
                        'Qualquer'}
                    </span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="pt-4 border-t flex items-center justify-between gap-4">
                <p className="font-bold text-xl text-primary">R$ {s.preco.toFixed(2)}</p>
                <Button onClick={() => onBook(s)}>Agendar Agora</Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </section>
  )
}
