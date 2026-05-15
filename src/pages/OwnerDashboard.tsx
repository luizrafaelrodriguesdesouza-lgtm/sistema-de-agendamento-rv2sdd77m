import { useEffect, useState, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Bar, BarChart, XAxis, YAxis, CartesianGrid } from 'recharts'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/hooks/use-auth'
import pb from '@/lib/pocketbase/client'
import { useRealtime } from '@/hooks/use-realtime'
import useMasterStore from '@/stores/useMasterStore'
import { useToast } from '@/hooks/use-toast'
import { Copy, Upload, Trash2, Loader2 } from 'lucide-react'

export default function OwnerDashboard() {
  const { user } = useAuth()
  const { selectedOwnerId } = useMasterStore()
  const { toast } = useToast()
  const [professionals, setProfessionals] = useState<any[]>([])
  const [appointments, setAppointments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [ownerData, setOwnerData] = useState<any>(null)

  const [corTema, setCorTema] = useState('')
  const [corSecundaria, setCorSecundaria] = useState('')
  const [webhookUrl, setWebhookUrl] = useState('')
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [savingBranding, setSavingBranding] = useState(false)
  const [savingWebhook, setSavingWebhook] = useState(false)
  const [testingWebhook, setTestingWebhook] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const loadData = async () => {
    if (!user) return

    const targetId = user.tipo === 'master' ? selectedOwnerId : user.id
    if (user.tipo === 'master' && !targetId) {
      setProfessionals([])
      setAppointments([])
      setLoading(false)
      return
    }

    try {
      const owner = await pb.collection('users').getOne(targetId)
      setOwnerData(owner)
      setCorTema(owner.cor_tema || '#009999')
      setCorSecundaria(owner.cor_secundaria || '#f1f5f9')
      setWebhookUrl(owner.webhook_url || '')

      const profs = await pb.collection('users').getFullList({
        filter: `proprietario_id = '${targetId}'`,
      })
      setProfessionals(profs)

      if (profs.length > 0) {
        const profIds = profs.map((p) => `"${p.id}"`).join(',')
        const apps = await pb.collection('agendamentos').getFullList({
          filter: `profissional_id ?~ [${profIds}]`,
          expand: 'servico_id,profissional_id',
        })
        setAppointments(apps)
      } else {
        setAppointments([])
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
  useRealtime('agendamentos', () => loadData())

  const totalRevenue = appointments.reduce((acc, app) => {
    if (app.status === 'concluido' || app.status === 'confirmado') {
      return acc + (app.expand?.servico_id?.preco || 0)
    }
    return acc
  }, 0)

  const noShowApps = appointments.filter((a) => a.status === 'cancelado').length
  const totalApps = appointments.length
  const noShowRate = totalApps > 0 ? ((noShowApps / totalApps) * 100).toFixed(1) : '0.0'

  const chartData = professionals.map((p) => {
    const profApps = appointments.filter(
      (a) => a.profissional_id === p.id && (a.status === 'concluido' || a.status === 'confirmado'),
    )
    const revenue = profApps.reduce((acc, a) => acc + (a.expand?.servico_id?.preco || 0), 0)
    return {
      name: p.name.split(' ')[1] || p.name.split(' ')[0],
      receita: revenue,
    }
  })

  const handleTestWebhook = async () => {
    const sanitizedUrl = webhookUrl.trim()
    if (!sanitizedUrl) return
    try {
      new URL(sanitizedUrl)
    } catch (_) {
      toast({ title: 'URL de Webhook inválida', variant: 'destructive' })
      return
    }

    setTestingWebhook(true)
    try {
      const res = await pb.send('/backend/v1/owner-webhook-test', {
        method: 'POST',
        body: JSON.stringify({ webhook_url: sanitizedUrl }),
        headers: { 'Content-Type': 'application/json' },
      })
      toast({
        title: 'Sucesso',
        description: `Webhook disparado com sucesso (Status: ${res.status})`,
      })
    } catch (e: any) {
      const statusCode = e.response?.status || 0
      const errorMsg = e.response?.error || e.message || 'Erro desconhecido'
      toast({
        title: 'Erro no Webhook',
        description: `Status: ${statusCode} - ${errorMsg}`,
        variant: 'destructive',
      })
    } finally {
      setTestingWebhook(false)
    }
  }

  const handleSaveWebhook = async () => {
    if (!ownerData) return
    const sanitizedUrl = webhookUrl.trim()
    if (sanitizedUrl) {
      try {
        new URL(sanitizedUrl)
      } catch (_) {
        toast({ title: 'URL de Webhook inválida', variant: 'destructive' })
        return
      }
    }
    setSavingWebhook(true)
    try {
      await pb.collection('users').update(ownerData.id, { webhook_url: sanitizedUrl })
      setWebhookUrl(sanitizedUrl)
      toast({ title: 'Webhook configurado com sucesso!' })
      loadData()
    } catch (e: any) {
      toast({ title: 'Erro ao configurar webhook', description: e.message, variant: 'destructive' })
    } finally {
      setSavingWebhook(false)
    }
  }

  const handleSaveBranding = async () => {
    if (!ownerData) return
    setSavingBranding(true)
    try {
      const formData = new FormData()
      formData.append('cor_tema', corTema)
      formData.append('cor_secundaria', corSecundaria)
      if (logoFile) {
        formData.append('logo', logoFile)
      }
      await pb.collection('users').update(ownerData.id, formData)
      toast({ title: 'Marca atualizada com sucesso!' })
      setLogoFile(null)
      loadData()
    } catch (e: any) {
      toast({ title: 'Erro ao atualizar marca', description: e.message, variant: 'destructive' })
    } finally {
      setSavingBranding(false)
    }
  }

  const chartConfig = {
    receita: {
      label: 'Receita',
      color: 'hsl(var(--primary))',
    },
  }

  return (
    <div className="space-y-8 animate-fade-in-up">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Visão Geral da Clínica</h2>
          <p className="text-slate-500 mt-1">Métricas e performance da sua empresa.</p>
        </div>
        {user?.tipo === 'proprietario' && user?.codigo_acesso && (
          <div className="flex items-center gap-3 bg-primary/5 p-3 rounded-lg border border-primary/20">
            <div>
              <p className="text-xs font-medium text-slate-500">Código da Clínica (Convite)</p>
              <p className="text-lg font-bold text-primary tracking-wider">{user.codigo_acesso}</p>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                navigator.clipboard.writeText(user.codigo_acesso || '')
                toast({ title: 'Código copiado!' })
              }}
            >
              <Copy className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="py-20 text-center text-slate-500">Carregando métricas...</div>
      ) : user?.tipo === 'master' && !selectedOwnerId ? (
        <div className="py-20 text-center bg-white rounded-2xl border border-dashed shadow-sm">
          <p className="text-slate-500 mb-2">Nenhuma clínica selecionada.</p>
          <p className="text-sm text-slate-400">
            Selecione uma clínica no topo da página para ver seus dados.
          </p>
        </div>
      ) : professionals.length === 0 ? (
        <div className="py-20 text-center bg-white rounded-2xl border border-dashed shadow-sm">
          <p className="text-slate-500 mb-2">Nenhum profissional vinculado a esta clínica.</p>
          <p className="text-sm text-slate-400">
            Convide profissionais usando o Código da Clínica.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="shadow-sm border-slate-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider">
                  Receita Total Estimada
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-slate-800">R$ {totalRevenue.toFixed(2)}</p>
              </CardContent>
            </Card>
            <Card className="shadow-sm border-slate-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider">
                  Agendamentos Totais
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-slate-800">{totalApps}</p>
              </CardContent>
            </Card>
            <Card className="shadow-sm border-slate-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider">
                  Taxa de Cancelamentos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-rose-500">{noShowRate}%</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="shadow-sm border-slate-200 lg:col-span-2">
              <CardHeader>
                <CardTitle>Compartilhamento</CardTitle>
                <CardDescription>Compartilhe os links de acesso da sua clínica.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col sm:flex-row gap-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    const slug = ownerData?.slug || user?.slug
                    if (!slug) {
                      toast({
                        title: 'Erro',
                        description: 'Slug não gerado para esta clínica.',
                        variant: 'destructive',
                      })
                      return
                    }
                    const baseUrl = window.location.origin
                    navigator.clipboard.writeText(`${baseUrl}/${slug}`)
                    toast({ title: 'Link copiado!' })
                  }}
                >
                  <Copy className="w-4 h-4 mr-2" /> Convite Cliente
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    const slug = ownerData?.slug || user?.slug
                    if (!slug) {
                      toast({
                        title: 'Erro',
                        description: 'Slug não gerado para esta clínica.',
                        variant: 'destructive',
                      })
                      return
                    }
                    const baseUrl = window.location.origin
                    navigator.clipboard.writeText(
                      `${baseUrl}/register?tipo=profissional&salao=${slug}`,
                    )
                    toast({ title: 'Link copiado!' })
                  }}
                >
                  <Copy className="w-4 h-4 mr-2" /> Convite Profissional
                </Button>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-slate-200 lg:col-span-2">
              <CardHeader>
                <CardTitle>Identidade Visual da Clínica</CardTitle>
                <CardDescription>
                  Personalize o tema e o logo da sua página pública de agendamentos.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row gap-8">
                  <div className="flex-1 space-y-4">
                    <div className="space-y-2">
                      <Label>Cor Primária</Label>
                      <div className="flex items-center gap-3">
                        <Input
                          type="color"
                          value={corTema}
                          onChange={(e) => setCorTema(e.target.value)}
                          className="w-16 h-10 p-1 cursor-pointer"
                        />
                        <Input
                          type="text"
                          value={corTema}
                          onChange={(e) => setCorTema(e.target.value)}
                          className="flex-1 font-mono uppercase"
                          placeholder="#009999"
                        />
                      </div>
                      <p className="text-xs text-slate-500">
                        Usada em botões e destaques na sua página.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label>Cor Secundária</Label>
                      <div className="flex items-center gap-3">
                        <Input
                          type="color"
                          value={corSecundaria}
                          onChange={(e) => setCorSecundaria(e.target.value)}
                          className="w-16 h-10 p-1 cursor-pointer"
                        />
                        <Input
                          type="text"
                          value={corSecundaria}
                          onChange={(e) => setCorSecundaria(e.target.value)}
                          className="flex-1 font-mono uppercase"
                          placeholder="#f1f5f9"
                        />
                      </div>
                      <p className="text-xs text-slate-500">
                        Usada em fundos e elementos secundários.
                      </p>
                    </div>
                  </div>

                  <div className="flex-1 space-y-4">
                    <Label>Logo da Clínica</Label>
                    <div className="flex items-center gap-4">
                      <div className="w-24 h-24 border-2 border-dashed rounded-xl flex items-center justify-center bg-slate-50 overflow-hidden relative">
                        {logoFile || ownerData?.logo ? (
                          <img
                            src={
                              logoFile
                                ? URL.createObjectURL(logoFile)
                                : pb.files.getURL(ownerData, ownerData.logo)
                            }
                            alt="Logo"
                            className="w-full h-full object-contain p-2"
                          />
                        ) : (
                          <span className="text-slate-400 text-xs text-center p-2">Sem logo</span>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Input
                          type="file"
                          accept="image/png, image/jpeg, image/svg+xml, image/webp"
                          className="hidden"
                          ref={fileInputRef}
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              setLogoFile(e.target.files[0])
                            }
                          }}
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                          className="w-full"
                        >
                          <Upload className="w-4 h-4 mr-2" /> Escolher Imagem
                        </Button>
                        {(logoFile || ownerData?.logo) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full text-rose-500 hover:text-rose-600"
                            onClick={async () => {
                              if (logoFile) setLogoFile(null)
                              else if (ownerData?.logo) {
                                await pb.collection('users').update(ownerData.id, { logo: null })
                                loadData()
                                toast({ title: 'Logo removido.' })
                              }
                            }}
                          >
                            <Trash2 className="w-4 h-4 mr-2" /> Remover
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-6 flex justify-end">
                  <Button onClick={handleSaveBranding} disabled={savingBranding}>
                    {savingBranding ? 'Salvando...' : 'Salvar Identidade Visual'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-slate-200 lg:col-span-2">
              <CardHeader>
                <CardTitle>Integrações e Automações</CardTitle>
                <CardDescription>
                  Configure um webhook para enviar dados de novos agendamentos para ferramentas
                  externas (ex: Botconversa, Make, Zapier).
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="webhook_url">URL do Webhook</Label>
                    <Input
                      id="webhook_url"
                      type="url"
                      placeholder="https://sua-url-de-webhook.com/..."
                      value={webhookUrl}
                      onChange={(e) => setWebhookUrl(e.target.value)}
                    />
                    <p className="text-xs text-slate-500">
                      Os dados do agendamento serão enviados via POST (JSON) para esta URL sempre
                      que um novo agendamento for criado.
                    </p>
                  </div>
                  <div className="flex justify-end gap-3">
                    <Button
                      variant="outline"
                      onClick={handleTestWebhook}
                      disabled={testingWebhook || !webhookUrl || !webhookUrl.startsWith('http')}
                    >
                      {testingWebhook ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Testando...
                        </>
                      ) : (
                        'Testar Webhook'
                      )}
                    </Button>
                    <Button onClick={handleSaveWebhook} disabled={savingWebhook}>
                      {savingWebhook ? 'Salvando...' : 'Salvar Webhook'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-slate-200">
              <CardHeader>
                <CardTitle>Receita por Profissional</CardTitle>
                <CardDescription>Comparativo de faturamento bruto.</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="min-h-[300px] w-full mt-4">
                  <BarChart data={chartData} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid
                      vertical={false}
                      strokeDasharray="3 3"
                      className="stroke-slate-200"
                    />
                    <XAxis dataKey="name" tickLine={false} axisLine={false} className="text-xs" />
                    <YAxis
                      tickFormatter={(val) => `R$${val}`}
                      tickLine={false}
                      axisLine={false}
                      className="text-xs"
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar
                      dataKey="receita"
                      fill="var(--color-receita)"
                      radius={[6, 6, 0, 0]}
                      maxBarSize={60}
                    />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-slate-200">
              <CardHeader>
                <CardTitle>Gestão da Equipe</CardTitle>
                <CardDescription>Profissionais vinculados a sua clínica.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {professionals.map((p) => (
                    <div
                      key={p.id}
                      className="flex justify-between items-center p-4 border rounded-xl bg-slate-50"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full border-2 border-white shadow-sm bg-primary/10 flex items-center justify-center text-primary font-bold">
                          {p.name ? p.name[0].toUpperCase() : '?'}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">{p.name}</p>
                          <p className="text-xs font-medium text-slate-500 mt-0.5">
                            Comissão Base: {p.comissao || 0}%
                          </p>
                        </div>
                      </div>
                      <Badge
                        className={
                          p.status_aprovacao === 'aprovado'
                            ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-0'
                            : 'bg-amber-100 text-amber-700 hover:bg-amber-100 border-0'
                        }
                      >
                        {p.status_aprovacao === 'aprovado' ? 'Ativo' : 'Pendente'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
