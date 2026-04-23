import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/hooks/use-toast'
import pb from '@/lib/pocketbase/client'
import { useAuth } from '@/hooks/use-auth'
import { useRealtime } from '@/hooks/use-realtime'
import { Plus, Trash2 } from 'lucide-react'

export default function ProfessionalServices() {
  const { user } = useAuth()
  const { toast } = useToast()

  const [catalogServices, setCatalogServices] = useState<any[]>([])
  const [myServices, setMyServices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    if (!user) return
    try {
      const proprietarioId = user.proprietario_id

      if (!proprietarioId) {
        setCatalogServices([])
        setMyServices([])
        return
      }

      const [catalog, mine] = await Promise.all([
        pb.collection('servicos').getFullList({
          filter: `proprietario_id = '${proprietarioId}' && profissional_id = ''`,
          sort: 'nome',
        }),
        pb.collection('servicos').getFullList({
          filter: `profissional_id = '${user.id}'`,
          sort: 'nome',
        }),
      ])

      setCatalogServices(catalog)
      setMyServices(mine)
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

  const handleAdd = async (service: any) => {
    try {
      await pb.collection('servicos').create({
        nome: service.nome,
        descricao: service.descricao,
        preco: service.preco,
        duracao: service.duracao,
        ativo: true,
        proprietario_id: service.proprietario_id,
        profissional_id: user?.id,
      })
      toast({ title: 'Sucesso', description: 'Serviço adicionado ao seu portfólio.' })
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' })
    }
  }

  const handleRemove = async (id: string) => {
    if (!confirm('Remover este serviço do seu portfólio?')) return
    try {
      await pb.collection('servicos').delete(id)
      toast({ title: 'Sucesso', description: 'Serviço removido.' })
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' })
    }
  }

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    try {
      await pb.collection('servicos').update(id, { ativo: !currentActive })
      toast({
        title: 'Sucesso',
        description: `Serviço ${!currentActive ? 'ativado' : 'desativado'}.`,
      })
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' })
    }
  }

  const myServiceNames = myServices.map((s) => s.nome)

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h2 className="text-3xl font-bold text-slate-800">Meus Serviços</h2>
        <p className="text-slate-500 mt-1">
          Selecione os serviços do catálogo da clínica que você oferece.
        </p>
      </div>

      {!user?.proprietario_id && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl">
          <p className="font-semibold">Atenção</p>
          <p className="text-sm">
            Você ainda não está vinculado a nenhuma clínica. Peça o código de acesso ao proprietário
            e atualize seu perfil.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="shadow-sm border-slate-200">
          <CardHeader>
            <CardTitle>Catálogo da Clínica</CardTitle>
            <CardDescription>Serviços disponibilizados pelo proprietário.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-sm text-slate-500">Carregando...</div>
            ) : catalogServices.length === 0 ? (
              <div className="text-sm text-slate-500">Nenhum serviço no catálogo.</div>
            ) : (
              <ul className="space-y-3">
                {catalogServices.map((s) => {
                  const alreadyAdded = myServiceNames.includes(s.nome)
                  return (
                    <li
                      key={s.id}
                      className="flex justify-between items-center p-4 border rounded-xl bg-slate-50"
                    >
                      <div>
                        <p className="font-bold text-slate-800">{s.nome}</p>
                        <p className="text-sm font-medium text-primary mt-1">
                          R$ {s.preco.toFixed(2)}{' '}
                          <span className="text-slate-400 font-normal ml-1">• {s.duracao} min</span>
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant={alreadyAdded ? 'secondary' : 'default'}
                        disabled={alreadyAdded}
                        onClick={() => handleAdd(s)}
                      >
                        {alreadyAdded ? (
                          'Adicionado'
                        ) : (
                          <>
                            <Plus className="w-4 h-4 mr-1" /> Adicionar
                          </>
                        )}
                      </Button>
                    </li>
                  )
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-200">
          <CardHeader>
            <CardTitle>Meu Portfólio</CardTitle>
            <CardDescription>Serviços que você está apto a realizar.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-sm text-slate-500">Carregando...</div>
            ) : myServices.length === 0 ? (
              <div className="text-sm text-slate-500">Você ainda não adicionou serviços.</div>
            ) : (
              <ul className="space-y-3">
                {myServices.map((s) => (
                  <li
                    key={s.id}
                    className={`flex justify-between items-center p-4 border rounded-xl shadow-sm transition-colors ${
                      s.ativo ? 'bg-white' : 'bg-slate-50 opacity-75'
                    }`}
                  >
                    <div>
                      <p className="font-bold text-slate-800">{s.nome}</p>
                      <p className="text-sm font-medium text-primary mt-1">
                        R$ {s.preco.toFixed(2)}{' '}
                        <span className="text-slate-400 font-normal ml-1">• {s.duracao} min</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-slate-500">
                          {s.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                        <Switch
                          checked={s.ativo}
                          onCheckedChange={() => handleToggleActive(s.id, s.ativo)}
                        />
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-rose-500 hover:text-rose-700"
                        onClick={() => handleRemove(s.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
