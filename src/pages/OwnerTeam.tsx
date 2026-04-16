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
import { useToast } from '@/hooks/use-toast'
import pb from '@/lib/pocketbase/client'
import { useAuth } from '@/hooks/use-auth'
import { useRealtime } from '@/hooks/use-realtime'
import { Check, X } from 'lucide-react'

export default function OwnerTeam() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [professionals, setProfessionals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')

  const loadData = async () => {
    if (!user) return
    try {
      const profs = await pb.collection('users').getFullList({
        filter: `proprietario_id = '${user.id}' && tipo = 'profissional'`,
        sort: '-created',
      })
      setProfessionals(profs)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [user])
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

  return (
    <div className="space-y-8 animate-fade-in-up">
      <div>
        <h2 className="text-3xl font-bold text-slate-800">Equipe</h2>
        <p className="text-slate-500 mt-1">
          Gerencie as aprovações dos profissionais da sua clínica.
        </p>
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
    </div>
  )
}
