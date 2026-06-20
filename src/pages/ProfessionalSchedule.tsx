import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Calendar } from '@/components/ui/calendar'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import pb from '@/lib/pocketbase/client'
import { useAuth } from '@/hooks/use-auth'
import { useRealtime } from '@/hooks/use-realtime'
import { Plus, Trash2, Ban } from 'lucide-react'
import { startOfDay, format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const DIAS_SEMANA = [
  { value: '0', label: 'Domingo' },
  { value: '1', label: 'Segunda-feira' },
  { value: '2', label: 'Terça-feira' },
  { value: '3', label: 'Quarta-feira' },
  { value: '4', label: 'Quinta-feira' },
  { value: '5', label: 'Sexta-feira' },
  { value: '6', label: 'Sábado' },
]

export default function ProfessionalSchedule() {
  const { user } = useAuth()
  const { toast } = useToast()

  const [team, setTeam] = useState<any[]>([])
  const [selectedProfessional, setSelectedProfessional] = useState<string>('')

  const [schedules, setSchedules] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [addType, setAddType] = useState<'recorrente' | 'especifico' | 'bloqueio'>('recorrente')
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(startOfDay(new Date()))

  const [formData, setFormData] = useState({
    dia_semana: '1',
    hora_inicio: '09:00',
    hora_fim: '18:00',
    motivo: '',
  })

  useEffect(() => {
    if (user?.tipo === 'proprietario' || user?.tipo === 'master') {
      pb.collection('users')
        .getFullList({
          filter: `proprietario_id = '${user.id}' || id = '${user.id}'`,
        })
        .then((res) => {
          setTeam(res)
          if (!selectedProfessional) setSelectedProfessional(user.id)
        })
    } else if (user?.id) {
      setSelectedProfessional(user.id)
    }
  }, [user])

  const loadData = async () => {
    if (!selectedProfessional) return
    setLoading(true)
    try {
      const data = await pb.collection('horarios_disponiveis').getFullList({
        filter: `profissional_id = '${selectedProfessional}'`,
        sort: 'dia_semana,hora_inicio',
      })
      setSchedules(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [selectedProfessional])

  useRealtime('horarios_disponiveis', () => loadData())

  const handleSave = async () => {
    try {
      const payload: any = {
        profissional_id: selectedProfessional,
        tipo: addType,
        hora_inicio: formData.hora_inicio,
        hora_fim: formData.hora_fim,
      }

      if (addType === 'recorrente') {
        payload.dia_semana = Number(formData.dia_semana)
      } else {
        if (!selectedDate) throw new Error('Data não selecionada')
        payload.data = selectedDate.toISOString()
        payload.dia_semana = selectedDate.getDay()
        if (addType === 'bloqueio') payload.motivo = formData.motivo
      }

      const existing = schedules.filter((s) => {
        if (addType === 'recorrente') {
          return s.tipo === 'recorrente' && s.dia_semana === payload.dia_semana
        } else {
          return (
            (s.tipo === 'especifico' || s.tipo === 'bloqueio') &&
            s.data &&
            s.data.substring(0, 10) === selectedDate!.toISOString().substring(0, 10)
          )
        }
      })

      const hasOverlap = existing.some((s) => {
        return payload.hora_inicio < s.hora_fim && payload.hora_fim > s.hora_inicio
      })

      if (hasOverlap) {
        toast({
          title: 'Aviso',
          description: 'Já existe um horário conflitante.',
          variant: 'destructive',
        })
        return
      }

      await pb.collection('horarios_disponiveis').create(payload)
      toast({ title: 'Sucesso', description: 'Horário adicionado.' })
      setIsDialogOpen(false)
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' })
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await pb.collection('horarios_disponiveis').delete(id)
      toast({ title: 'Sucesso', description: 'Horário removido.' })
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' })
    }
  }

  const recurrentSchedules = schedules.filter((s) => !s.tipo || s.tipo === 'recorrente')

  const specificSchedulesForDate = schedules.filter((s) => {
    if (s.tipo === 'recorrente' || !s.tipo || !s.data || !selectedDate) return false
    return s.data.substring(0, 10) === selectedDate.toISOString().substring(0, 10)
  })

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Agenda Flexível</h2>
          <p className="text-slate-500 mt-1">Configure seus horários de atendimento e bloqueios.</p>
        </div>
        {(user?.tipo === 'proprietario' || user?.tipo === 'master') && team.length > 0 && (
          <div className="w-full sm:w-64">
            <Select value={selectedProfessional} onValueChange={setSelectedProfessional}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o profissional" />
              </SelectTrigger>
              <SelectContent>
                {team.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name || t.email} {t.id === user?.id ? '(Você)' : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <Tabs defaultValue="recorrente" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
          <TabsTrigger value="recorrente">Semanal Fixo</TabsTrigger>
          <TabsTrigger value="excecoes">Datas Específicas</TabsTrigger>
        </TabsList>

        <TabsContent value="recorrente" className="mt-6">
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Horário Recorrente</CardTitle>
                <CardDescription>Horários padrão para cada dia da semana.</CardDescription>
              </div>
              <Button
                onClick={() => {
                  setAddType('recorrente')
                  setIsDialogOpen(true)
                }}
              >
                <Plus className="w-4 h-4 mr-2" /> Novo Horário
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="py-8 text-center text-slate-500">Carregando...</div>
              ) : recurrentSchedules.length === 0 ? (
                <div className="py-8 text-center text-slate-500 bg-slate-50 rounded-b-xl">
                  Nenhum horário configurado.
                </div>
              ) : (
                <Table>
                  <TableHeader className="bg-slate-50">
                    <TableRow>
                      <TableHead>Dia da Semana</TableHead>
                      <TableHead>Início</TableHead>
                      <TableHead>Fim</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recurrentSchedules.map((s) => {
                      const diaLabel =
                        DIAS_SEMANA.find((d) => d.value === String(s.dia_semana))?.label ||
                        s.dia_semana
                      return (
                        <TableRow key={s.id}>
                          <TableCell className="font-medium">{diaLabel}</TableCell>
                          <TableCell>{s.hora_inicio}</TableCell>
                          <TableCell>{s.hora_fim}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-rose-500 hover:text-rose-700"
                              onClick={() => handleDelete(s.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="excecoes" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-6">
            <Card className="shadow-sm border-slate-200 w-full md:w-auto h-fit">
              <CardContent className="p-3">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(d) => {
                    if (d) setSelectedDate(d)
                  }}
                  locale={ptBR}
                  className="rounded-md"
                />
              </CardContent>
            </Card>

            <Card className="shadow-sm border-slate-200">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle>
                    Dia {selectedDate ? format(selectedDate, "dd 'de' MMMM", { locale: ptBR }) : ''}
                  </CardTitle>
                  <CardDescription>
                    Adicione turnos extras ou bloqueios para esta data.
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 mb-6 mt-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setAddType('especifico')
                      setIsDialogOpen(true)
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" /> Turno Específico
                  </Button>
                  <Button
                    variant="outline"
                    className="text-rose-600 hover:text-rose-700 border-rose-200 hover:bg-rose-50"
                    onClick={() => {
                      setAddType('bloqueio')
                      setIsDialogOpen(true)
                    }}
                  >
                    <Ban className="w-4 h-4 mr-2" /> Bloquear Horário
                  </Button>
                </div>

                {specificSchedulesForDate.length === 0 ? (
                  <div className="py-8 text-center text-slate-500 bg-slate-50 rounded-xl border border-dashed">
                    Nenhuma exceção ou bloqueio nesta data.
                  </div>
                ) : (
                  <Table>
                    <TableBody>
                      {specificSchedulesForDate.map((s) => (
                        <TableRow key={s.id}>
                          <TableCell>
                            {s.tipo === 'bloqueio' ? (
                              <Badge
                                variant="destructive"
                                className="bg-rose-100 text-rose-700 hover:bg-rose-100"
                              >
                                Bloqueio
                              </Badge>
                            ) : (
                              <Badge
                                variant="secondary"
                                className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100"
                              >
                                Turno Específico
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="font-medium whitespace-nowrap">
                            {s.hora_inicio} às {s.hora_fim}
                          </TableCell>
                          <TableCell className="text-slate-500 text-sm w-full">
                            {s.motivo}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-rose-500 hover:text-rose-700"
                              onClick={() => handleDelete(s.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
                <div className="mt-4 text-xs text-slate-500 bg-slate-50 p-3 rounded-lg">
                  <strong className="block mb-1 text-slate-600">Regras de prioridade:</strong>-{' '}
                  <strong>Turnos Específicos</strong> substituem completamente os horários
                  recorrentes do dia selecionado.
                  <br />- <strong>Bloqueios</strong> subtraem a disponibilidade (seja do turno
                  recorrente ou do turno específico).
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {addType === 'recorrente' && 'Adicionar Horário Recorrente'}
              {addType === 'especifico' && 'Adicionar Turno Específico'}
              {addType === 'bloqueio' && 'Adicionar Bloqueio'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {addType === 'recorrente' && (
              <div className="space-y-2">
                <Label>Dia da Semana</Label>
                <Select
                  value={formData.dia_semana}
                  onValueChange={(v) => setFormData({ ...formData, dia_semana: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o dia" />
                  </SelectTrigger>
                  <SelectContent>
                    {DIAS_SEMANA.map((d) => (
                      <SelectItem key={d.value} value={d.value}>
                        {d.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {addType !== 'recorrente' && selectedDate && (
              <div className="bg-slate-50 p-3 rounded-md text-sm border font-medium">
                Data: {format(selectedDate, 'dd/MM/yyyy')}
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Hora Início</Label>
                <Input
                  type="time"
                  value={formData.hora_inicio}
                  onChange={(e) => setFormData({ ...formData, hora_inicio: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Hora Fim</Label>
                <Input
                  type="time"
                  value={formData.hora_fim}
                  onChange={(e) => setFormData({ ...formData, hora_fim: e.target.value })}
                />
              </div>
            </div>
            {addType === 'bloqueio' && (
              <div className="space-y-2">
                <Label>Motivo (opcional)</Label>
                <Input
                  placeholder="Ex: Almoço, Buscar na escola..."
                  value={formData.motivo}
                  onChange={(e) => setFormData({ ...formData, motivo: e.target.value })}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
