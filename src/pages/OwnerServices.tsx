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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
import { Plus, Edit, Trash2, Image as ImageIcon, X } from 'lucide-react'

export default function OwnerServices() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [services, setServices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const [fileToUpload, setFileToUpload] = useState<File | null>(null)
  const [currentFotoUrl, setCurrentFotoUrl] = useState<string | null>(null)
  const [removeFoto, setRemoveFoto] = useState(false)

  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    preco: '',
    duracao: '',
    profissional_id: '',
  })

  const loadData = async () => {
    if (!user) return
    try {
      const servs = await pb.collection('servicos').getFullList({
        filter: `proprietario_id = '${user.id}' && (profissional_id = '' || profissional_id = '${user.id}')`,
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
    setFormData({ nome: '', descricao: '', preco: '', duracao: '', profissional_id: '' })
    setFileToUpload(null)
    setCurrentFotoUrl(null)
    setRemoveFoto(false)
    setIsDialogOpen(true)
  }

  const handleOpenEdit = (s: any) => {
    setEditingId(s.id)
    setFormData({
      nome: s.nome,
      descricao: s.descricao || '',
      preco: s.preco.toString(),
      duracao: s.duracao.toString(),
      profissional_id: s.profissional_id || '',
    })
    setFileToUpload(null)
    setCurrentFotoUrl(s.foto ? pb.files.getURL(s, s.foto) : null)
    setRemoveFoto(false)
    setIsDialogOpen(true)
  }

  const handleSave = async () => {
    try {
      const payload = new FormData()
      payload.append('nome', formData.nome)
      if (formData.descricao) payload.append('descricao', formData.descricao)
      payload.append('preco', String(Number(formData.preco)))
      payload.append('duracao', String(Number(formData.duracao)))
      payload.append('proprietario_id', user?.id || '')
      if (formData.profissional_id) payload.append('profissional_id', formData.profissional_id)
      payload.append('ativo', 'true')

      if (fileToUpload) {
        payload.append('foto', fileToUpload)
      } else if (removeFoto) {
        payload.append('foto', '')
      }

      if (editingId) {
        await pb.collection('servicos').update(editingId, payload)
        toast({ title: 'Sucesso', description: 'Serviço atualizado.' })
      } else {
        await pb.collection('servicos').create(payload)
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
                  <TableHead>Prestador</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {services.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {s.foto ? (
                          <img
                            src={pb.files.getURL(s, s.foto)}
                            alt={s.nome}
                            className="w-10 h-10 rounded-md object-cover border shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-md bg-slate-100 border flex items-center justify-center text-slate-400 shrink-0">
                            <ImageIcon className="w-5 h-5" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium">{s.nome}</p>
                          <p className="text-xs text-slate-500 line-clamp-1 max-w-[200px]">
                            {s.descricao}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{s.preco.toFixed(2)}</TableCell>
                    <TableCell>{s.duracao}</TableCell>
                    <TableCell>
                      {s.profissional_id ? (
                        <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary ring-1 ring-inset ring-primary/20 whitespace-nowrap">
                          Somente Eu
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-500/10 whitespace-nowrap">
                          Catálogo
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {' '}
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
              <Label>Foto do Serviço (Opcional)</Label>
              <div className="flex items-center gap-4">
                {(currentFotoUrl && !removeFoto) || fileToUpload ? (
                  <div className="relative h-20 w-20 rounded-lg overflow-hidden border shadow-sm shrink-0">
                    <img
                      src={fileToUpload ? URL.createObjectURL(fileToUpload) : currentFotoUrl!}
                      alt="Preview"
                      className="h-full w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setFileToUpload(null)
                        setRemoveFoto(true)
                      }}
                      className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 hover:bg-black/70 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <label className="flex h-20 w-20 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100 transition-colors shrink-0">
                    <ImageIcon className="h-6 w-6 text-slate-400 mb-1" />
                    <span className="text-[10px] text-slate-500 font-medium">Upload</span>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setFileToUpload(e.target.files[0])
                          setRemoveFoto(false)
                        }
                      }}
                    />
                  </label>
                )}
                <div className="flex-1 text-xs text-slate-500">
                  <p>Adicione uma imagem representativa para o seu serviço.</p>
                  <p>Recomendado: Imagens quadradas (1:1), tamanho máximo de 5MB.</p>
                  <p>Formatos suportados: JPG, PNG, WEBP.</p>
                </div>
              </div>
            </div>
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
            <div className="space-y-2">
              <Label>Quem pode prestar este serviço?</Label>
              <Select
                value={formData.profissional_id || 'all'}
                onValueChange={(v) =>
                  setFormData({ ...formData, profissional_id: v === 'all' ? '' : v })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Qualquer profissional (Catálogo da Clínica)</SelectItem>
                  <SelectItem value={user?.id || 'owner'}>
                    Somente Eu (Serviço Exclusivo)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {' '}
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
