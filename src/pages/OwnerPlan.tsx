import { useEffect, useState } from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { Check, Star, Zap, CreditCard, ArrowRight } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import pb from '@/lib/pocketbase/client'
import { useToast } from '@/hooks/use-toast'
import { useSearchParams } from 'react-router-dom'
import useMasterStore from '@/stores/useMasterStore'

export default function OwnerPlan() {
  const { user } = useAuth()
  const { selectedOwnerId } = useMasterStore()
  const { toast } = useToast()
  const [searchParams, setSearchParams] = useSearchParams()

  const [subscription, setSubscription] = useState<any>(null)
  const [plans, setPlans] = useState<any[]>([])
  const [currentCount, setCurrentCount] = useState(0)
  const [loading, setLoading] = useState(true)

  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  const getTargetId = () => (user?.tipo === 'master' ? selectedOwnerId : user?.id)

  const loadData = async () => {
    const targetId = getTargetId()
    if (!targetId) {
      setLoading(false)
      return
    }

    try {
      const [subsResponse, plansResponse, profsResponse] = await Promise.all([
        pb.collection('subscriptions').getFullList({
          filter: `user_id = '${targetId}'`,
          expand: 'plan_id',
        }),
        pb.collection('plans').getFullList({
          sort: 'preco_mensal',
          filter: 'ativo = true',
        }),
        pb.collection('users').getFullList({
          filter: `proprietario_id = '${targetId}' && tipo = 'profissional'`,
        }),
      ])

      setSubscription(subsResponse[0] || null)
      setPlans(plansResponse)
      setCurrentCount(profsResponse.length)

      if (searchParams.get('success') === 'true') {
        toast({ title: 'Sucesso', description: 'Plano atualizado com sucesso!' })
        setSearchParams({})
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

  const handleUpgrade = async (planId: string) => {
    setIsProcessing(true)
    try {
      const res = await pb.send('/backend/v1/checkout', {
        method: 'POST',
        body: JSON.stringify({ plan_id: planId }),
      })
      if (res.url) {
        window.location.href = res.url
      }
    } catch (e: any) {
      toast({
        title: 'Erro',
        description: e.message || 'Falha ao processar checkout.',
        variant: 'destructive',
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const currentPlan = subscription?.expand?.plan_id
  const usagePercent = currentPlan
    ? Math.min(100, (currentCount / currentPlan.limite_profissionais) * 100)
    : 0
  const isLimitReached = currentPlan && currentCount >= currentPlan.limite_profissionais

  const availablePlans = plans.filter((p) =>
    currentPlan ? p.preco_mensal > currentPlan.preco_mensal : true,
  )

  if (loading) {
    return (
      <div className="space-y-8 animate-fade-in-up">
        <Skeleton className="h-10 w-48 mb-2" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (!getTargetId()) {
    return (
      <div className="py-20 text-center text-slate-500 bg-white rounded-2xl border border-dashed shadow-sm">
        <p>Selecione uma clínica para visualizar o plano.</p>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Meu Plano</h2>
          <p className="text-slate-500 mt-1">Gerencie sua assinatura e limites de profissionais.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card className="border-primary/20 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <Star className="w-48 h-48" />
            </div>
            <CardHeader className="pb-4 border-b bg-slate-50/50">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-2xl text-primary flex items-center gap-2">
                    Plano {currentPlan?.nome || 'Não definido'}
                    {subscription?.status === 'ativo' && (
                      <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-0 ml-2">
                        Ativo
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription className="mt-2 text-base">
                    {currentPlan?.descricao || 'O plano atual da sua clínica.'}
                  </CardDescription>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-slate-800">
                    {currentPlan?.preco_mensal === 0
                      ? 'Grátis'
                      : `R$ ${currentPlan?.preco_mensal.toFixed(2).replace('.', ',')}`}
                  </p>
                  <p className="text-sm text-slate-500">/mês</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex justify-between text-sm font-medium">
                  <span className="text-slate-600">Uso de Profissionais</span>
                  <span className={isLimitReached ? 'text-rose-600' : 'text-slate-600'}>
                    {currentCount} de{' '}
                    {currentPlan?.limite_profissionais > 1000
                      ? 'Ilimitado'
                      : currentPlan?.limite_profissionais}{' '}
                    usados
                  </span>
                </div>
                <Progress value={usagePercent} className="h-3" />

                {isLimitReached && (
                  <div className="bg-rose-50 border border-rose-100 rounded-lg p-3 text-sm text-rose-700 mt-2 flex items-center gap-2">
                    <Zap className="w-4 h-4 shrink-0" />
                    <p>
                      Limite de profissionais atingido. Você não pode adicionar novos profissionais
                      até fazer um upgrade.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="bg-slate-50/50 border-t flex justify-between items-center py-4">
              <div className="text-sm text-slate-500 flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                {subscription?.data_proxima_cobranca ? (
                  <span>
                    Próxima cobrança:{' '}
                    {new Date(subscription.data_proxima_cobranca).toLocaleDateString('pt-BR')}
                  </span>
                ) : (
                  <span>Nenhuma cobrança pendente.</span>
                )}
              </div>
              <Button onClick={() => setIsUpgradeOpen(true)} className="gap-2">
                <Zap className="w-4 h-4" />
                Upgrade de Plano
              </Button>
            </CardFooter>
          </Card>
        </div>

        <div>
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Por que fazer upgrade?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3 items-start">
                <div className="bg-primary/10 p-2 rounded-full text-primary mt-1">
                  <Check className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-medium text-slate-800">Mais Profissionais</p>
                  <p className="text-sm text-slate-500">Escale sua equipe sem limites.</p>
                </div>
              </div>
              <div className="flex gap-3 items-start">
                <div className="bg-primary/10 p-2 rounded-full text-primary mt-1">
                  <Check className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-medium text-slate-800">Suporte Prioritário</p>
                  <p className="text-sm text-slate-500">Atendimento mais rápido.</p>
                </div>
              </div>
              <div className="flex gap-3 items-start">
                <div className="bg-primary/10 p-2 rounded-full text-primary mt-1">
                  <Check className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-medium text-slate-800">Recursos Exclusivos</p>
                  <p className="text-sm text-slate-500">
                    Acesso a novas funcionalidades antes de todos.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={isUpgradeOpen} onOpenChange={setIsUpgradeOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">Escolha o plano ideal para você</DialogTitle>
            <DialogDescription>Escale sua clínica com nossos planos flexíveis.</DialogDescription>
          </DialogHeader>

          {availablePlans.length === 0 ? (
            <div className="py-12 text-center">
              <Star className="w-12 h-12 text-amber-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-slate-800 mb-2">
                Você já está no melhor plano!
              </h3>
              <p className="text-slate-500">Obrigado por usar nosso plano de maior nível.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 py-6">
              {availablePlans.map((plan) => (
                <Card
                  key={plan.id}
                  className="relative flex flex-col hover:border-primary transition-colors cursor-pointer group"
                >
                  <CardHeader>
                    <CardTitle className="text-xl">{plan.nome}</CardTitle>
                    <div className="mt-4 flex items-baseline">
                      <span className="text-3xl font-bold">
                        R$ {plan.preco_mensal.toFixed(2).replace('.', ',')}
                      </span>
                      <span className="text-slate-500 ml-1">/mês</span>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <ul className="space-y-3 text-sm text-slate-600">
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-500" />
                        Até{' '}
                        {plan.limite_profissionais > 1000
                          ? 'Ilimitados'
                          : plan.limite_profissionais}{' '}
                        profissionais
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-500" />
                        Agendamentos Ilimitados
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-500" />
                        Lembretes por E-mail
                      </li>
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <Button
                      className="w-full group-hover:bg-primary"
                      onClick={() => handleUpgrade(plan.id)}
                      disabled={isProcessing}
                    >
                      {isProcessing ? 'Aguarde...' : 'Fazer Upgrade'}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
