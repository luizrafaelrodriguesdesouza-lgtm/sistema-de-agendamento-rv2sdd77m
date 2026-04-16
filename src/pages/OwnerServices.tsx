import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useToast } from '@/hooks/use-toast'
import pb from '@/lib/pocketbase/client'
import { useAuth } from '@/hooks/use-auth'
import { useRealtime } from '@/hooks/use-realtime'
import { Plus, Edit, Trash2 } from 'lucide-react'

export default function OwnerServices() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [services, setServices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    preco: '',
    duracao: '',
  })

  const loadData = async () => {
    if (!user) return
    try {
      const servs = await pb.collection('servicos').getFullList({
        filter: `proprietario_id = '${user.id}' && profissional_id = ''`,
        sort: 'nome',
      })
      setServices(servs)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [user])
  useRealtime('servicos', () => loadData())

  const handleOpenNew = () => {
    setEditingId(null)
    setFormData({ nome: '', descricao: '', preco: '', duracao: '' })
    setIsDialogOpen(true)
  }

  const handleOpenEdit = (s: any) => {
    setEditingId(s.id)
    setFormData({
      nome: s.nome,
      descricao: s.descricao || '',
      preco: s.preco.toString(),
      duracao: s.duracao.toString(),
    })
    setIsDialogOpen(true)
  }

  const handleSave = async () => {
    try {
      const data = {
        nome: formData.nome,
        descricao: formData.descricao,
        preco: Number(formData.preco),
        duracao: Number(formData.duracao),
        proprietario_id: user?.id,
        ativo: true,
      }
      if (editingId) {
        await pb.collection('servicos').update(editingId, data)
        toast({ title: 'Sucesso', description: 'Serviço atualizado.' })
      } else {
        await pb.collection('servicos').create(data)
        toast({ title: 'Sucesso', description: 'Serviço criado.' })
      }
      setIsDialogOpen(false)
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente remover este serviço do catálogo?')) return
    try {
      await pb.collection('servicos').delete(id)
      toast({ title: 'Sucesso', description: 'Serviço removido.' })
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-8 animate-fade-in-up">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Catálogo de Serviços</h2>
          <p className="text-slate-500 mt-1">
            Defina os serviços padrão oferecidos na sua clínica.
          </p>
        </div>
        <Button onClick={handleOpenNew}>
          <Plus className="w-4 h-4 mr-2" /> Novo Serviço
        </Button>
      </div>

      <Card className="shadow-sm border-slate-200">
        <CardContent className="p-0">
          {loading ? (
            <div className="py-8 text-center text-slate-500">Carregando...</div>
          ) : services.length === 0 ? (
            <div className="py-8 text-center text-slate-500 bg-slate-50 rounded-b-xl">
              Nenhum serviço cadastrado no catálogo.
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead>Serviço</TableHead>
                  <TableHead>Preço (R$)</TableHead>
                  <TableHead>Duração (min)</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {services.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>
                      <p className="font-medium">{s.nome}</p>
                      <p className="text-xs text-slate-500">{s.descricao}</p>
                    </TableCell>
                    <TableCell>{s.preco.toFixed(2)}</TableCell>
                    <TableCell>{s.duracao}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(s)}>
                        <Edit className="w-4 h-4" />
                      </Button>
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
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? 'Editar Serviço' : 'Novo Serviço'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome do Serviço</Label>
              <Input
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Input
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Preço (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.preco}
                  onChange={(e) => setFormData({ ...formData, preco: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Duração (min)</Label>
                <Input
                  type="number"
                  value={formData.duracao}
                  onChange={(e) => setFormData({ ...formData, duracao: e.target.value })}
                />
              </div>
            </div>
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
