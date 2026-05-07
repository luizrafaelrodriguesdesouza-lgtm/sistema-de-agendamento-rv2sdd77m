import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import pb from '@/lib/pocketbase/client'
import { useAuth } from '@/hooks/use-auth'
import { useRealtime } from '@/hooks/use-realtime'
import useMasterStore from '@/stores/useMasterStore'
import { Check, X, Plus } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function OwnerTeam() {
  const { user } = useAuth()
  const { selectedOwnerId } = useMasterStore()
  const { toast } = useToast()
  const [professionals, setProfessionals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [planLimit, setPlanLimit] = useState<number>(0)
  const [currentCount, setCurrentCount] = useState<number>(0)

  const [isAddOpen, setIsAddOpen] = useState(false)
  const [newProf, setNewProf] = useState({
    name: '',
    email: '',
    password: '',
    bio: '',
    especialidades: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const getTargetId = () => (user?.tipo === 'master' ? selectedOwnerId : user?.id)

  const loadData = async () => {
    const targetId = getTargetId()
    if (!targetId) {
      setProfessionals([])
      setLoading(false)
      return
    }

    try {
      const profs = await pb.collection('users').getFullList({
        filter: `proprietario_id = '${targetId}' && tipo = 'profissional'`,
        sort: '-created',
      })
      setProfessionals(profs)
      setCurrentCount(profs.length)

      try {
        const subs = await pb.collection('subscriptions').getFullList({
          filter: `user_id = '${targetId}'`,
          expand: 'plan_id',
        })
        if (subs.length > 0 && subs[0].expand?.plan_id) {
          setPlanLimit(subs[0].expand.plan_id.limite_profissionais)
        }
      } catch (err) {
        // ignore
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [user, selectedOwnerId])
  useRealtime('users', () => loadData())

  const handleApprove = async (id: string) => {
    try {
      await pb.collection('users').update(id, { status_aprovacao: 'aprovado' })
      toast({ title: 'Sucesso', description: 'Profissional aprovado.' })
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' })
    }
  }

  const handleReject = async () => {
    if (!rejectingId || !rejectionReason.trim()) return
    try {
      await pb.collection('users').update(rejectingId, {
        status_aprovacao: 'rejeitado',
        motivo_rejeicao: rejectionReason,
      })
      toast({ title: 'Sucesso', description: 'Profissional rejeitado.' })
      setRejectingId(null)
      setRejectionReason('')
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' })
    }
  }

  const handleAddProfessional = async (e: React.FormEvent) => {
    e.preventDefault()
    const targetId = getTargetId()
    if (!targetId) return

    setIsSubmitting(true)
    try {
      await pb.collection('users').create({
        name: newProf.name,
        email: newProf.email,
        password: newProf.password,
        passwordConfirm: newProf.password,
        bio: newProf.bio,
        especialidades: newProf.especialidades,
        tipo: 'profissional',
        status_aprovacao: 'aprovado',
        proprietario_id: targetId,
      })
      toast({ title: 'Sucesso', description: 'Profissional adicionado.' })
      setIsAddOpen(false)
      setNewProf({ name: '', email: '', password: '', bio: '', especialidades: '' })
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-8 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Equipe</h2>
          <p className="text-slate-500 mt-1">Gerencie os profissionais da sua clínica.</p>
        </div>
        {getTargetId() && (
          <div className="flex items-center gap-3">
            {currentCount >= planLimit && planLimit > 0 && (
              <div className="text-sm text-rose-600 bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-200">
                Limite atingido ({currentCount}/{planLimit}).{' '}
                <Link to="/dono/plano" className="font-bold underline">
                  Fazer upgrade
                </Link>
              </div>
            )}
            <Button
              onClick={() => setIsAddOpen(true)}
              disabled={currentCount >= planLimit && planLimit > 0}
            >
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Profissional
            </Button>
          </div>
        )}
      </div>

      <Card className="shadow-sm border-slate-200">
        <CardHeader>
          <CardTitle>Profissionais Vinculados</CardTitle>
          <CardDescription>Aprove ou rejeite solicitações de entrada.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 text-center text-slate-500">Carregando...</div>
          ) : professionals.length === 0 ? (
            <div className="py-8 text-center text-slate-500 bg-slate-50 rounded-xl border">
              Nenhum profissional encontrado.
            </div>
          ) : (
            <div className="space-y-4">
              {professionals.map((p) => (
                <div
                  key={p.id}
                  className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 border rounded-xl bg-slate-50 gap-4"
                >
                  <div>
                    <p className="font-bold text-slate-800">{p.name || p.email}</p>
                    <p className="text-sm text-slate-500">{p.email}</p>
                    {p.especialidades && (
                      <p className="text-xs text-slate-400 mt-1">Esp: {p.especialidades}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge
                      variant="outline"
                      className={
                        p.status_aprovacao === 'aprovado'
                          ? 'bg-emerald-50 text-emerald-700'
                          : p.status_aprovacao === 'rejeitado'
                            ? 'bg-rose-50 text-rose-700'
                            : 'bg-amber-50 text-amber-700'
                      }
                    >
                      {p.status_aprovacao.toUpperCase()}
                    </Badge>

                    {p.status_aprovacao === 'pendente' && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleApprove(p.id)}
                          className="bg-emerald-600 hover:bg-emerald-700"
                        >
                          <Check className="w-4 h-4 mr-1" /> Aprovar
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => setRejectingId(p.id)}
                        >
                          <X className="w-4 h-4 mr-1" /> Rejeitar
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!rejectingId} onOpenChange={(o) => !o && setRejectingId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeitar Profissional</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="Motivo da rejeição..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectingId(null)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleReject} disabled={!rejectionReason.trim()}>
              Confirmar Rejeição
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Novo Profissional</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddProfessional} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome Completo *</Label>
              <Input
                required
                value={newProf.name}
                onChange={(e) => setNewProf({ ...newProf, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input
                required
                type="email"
                value={newProf.email}
                onChange={(e) => setNewProf({ ...newProf, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Senha Provisória *</Label>
              <Input
                required
                type="text"
                minLength={8}
                value={newProf.password}
                onChange={(e) => setNewProf({ ...newProf, password: e.target.value })}
                placeholder="Mínimo de 8 caracteres"
              />
            </div>
            <div className="space-y-2">
              <Label>Especialidades</Label>
              <Input
                value={newProf.especialidades}
                onChange={(e) => setNewProf({ ...newProf, especialidades: e.target.value })}
                placeholder="Ex: Cabelo, Barba, Unhas"
              />
            </div>
            <div className="space-y-2">
              <Label>Bio / Descrição</Label>
              <Textarea
                value={newProf.bio}
                onChange={(e) => setNewProf({ ...newProf, bio: e.target.value })}
              />
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Salvando...' : 'Adicionar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
