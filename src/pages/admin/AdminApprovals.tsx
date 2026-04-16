import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useRealtime } from '@/hooks/use-realtime'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import pb from '@/lib/pocketbase/client'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'

export default function AdminApprovals() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [rejectingUser, setRejectingUser] = useState<any>(null)
  const [rejectReason, setRejectReason] = useState('')
  const { toast } = useToast()

  const loadPending = async () => {
    try {
      setLoading(true)
      const records = await pb.collection('users').getFullList({
        filter: "status_aprovacao = 'pendente' && tipo != 'master'",
        sort: '-created',
      })
      setUsers(records)
    } catch (e) {
      toast({ title: 'Erro', description: 'Falha ao carregar usuários.', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPending()
  }, [])

  useRealtime('users', () => {
    loadPending()
  })

  const handleApprove = async (id: string) => {
    try {
      await pb.collection('users').update(id, { status_aprovacao: 'aprovado' })
      toast({ title: 'Aprovado', description: 'Usuário aprovado com sucesso.' })
      loadPending()
    } catch (e) {
      toast({ title: 'Erro', description: 'Falha ao aprovar.', variant: 'destructive' })
    }
  }

  const handleReject = async () => {
    if (!rejectingUser) return
    try {
      await pb.collection('users').update(rejectingUser.id, {
        status_aprovacao: 'rejeitado',
        motivo_rejeicao: rejectReason,
      })
      toast({ title: 'Rejeitado', description: 'Usuário rejeitado.' })
      setRejectingUser(null)
      setRejectReason('')
      loadPending()
    } catch (e) {
      toast({ title: 'Erro', description: 'Falha ao rejeitar.', variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h2 className="text-3xl font-bold text-slate-800">Aprovações de Contas</h2>
        <p className="text-slate-500 mt-1">
          Analise as solicitações de novos proprietários e profissionais.
        </p>
      </div>

      <Card className="shadow-sm border-slate-200">
        <CardHeader>
          <CardTitle>Solicitações Pendentes</CardTitle>
          <CardDescription>
            Usuários aguardando validação para utilizar a plataforma.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {loading ? (
              <p className="text-sm text-slate-500">Carregando...</p>
            ) : users.length === 0 ? (
              <p className="text-sm text-slate-500 bg-slate-50 p-4 rounded-lg border text-center">
                Nenhuma pendência encontrada.
              </p>
            ) : (
              users.map((user) => (
                <div
                  key={user.id}
                  className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 border rounded-xl bg-white shadow-sm"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-bold text-slate-800 text-lg">{user.name || 'Sem nome'}</p>
                      <Badge variant="secondary" className="bg-amber-100 text-amber-700">
                        Pendente
                      </Badge>
                      <Badge variant="outline" className="capitalize">
                        {user.tipo}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-500">{user.email}</p>
                    {user.tipo === 'proprietario' && user.empresa && (
                      <p className="text-xs text-slate-400 mt-1">
                        Empresa: {user.empresa} (CNPJ: {user.cnpj})
                      </p>
                    )}
                    {user.tipo === 'profissional' && user.especialidades && (
                      <p className="text-xs text-slate-400 mt-1">
                        Especialidades: {user.especialidades}
                      </p>
                    )}
                  </div>{' '}
                  <div className="flex gap-2 w-full sm:w-auto">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 sm:flex-none text-rose-600 border-rose-200 hover:bg-rose-50"
                      onClick={() => setRejectingUser(user)}
                    >
                      Rejeitar
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-700 text-white"
                      onClick={() => handleApprove(user.id)}
                    >
                      Aprovar
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!rejectingUser} onOpenChange={(open) => !open && setRejectingUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeitar Solicitação</DialogTitle>
            <DialogDescription>
              Informe o motivo da rejeição para {rejectingUser?.name || 'o usuário'}.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label>Motivo da Rejeição</Label>
              <Input
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Ex: Dados inconsistentes ou inválidos"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectingUser(null)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleReject} disabled={!rejectReason.trim()}>
              Confirmar Rejeição
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
