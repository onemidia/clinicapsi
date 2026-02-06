'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/client'
import { useToast } from "@/hooks/use-toast"
import { 
  User, MapPin, Heart, Target, Info, 
  Save, Trash2, Loader2, ArrowLeft, Plus,
  DollarSign, CheckCircle, Clock, Calendar, XCircle,
  Activity, Frown, Meh, Smile, ThumbsDown, ThumbsUp,
  FileText, MessageCircle
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export default function FichaClinicaDigital() {
  const { id } = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  const [stats, setStats] = useState({
    debt: 0,
    paid: 0,
    credit: 0,
    done: 0,
    scheduled: 0,
    cancelled: 0
  })
  const [emotions, setEmotions] = useState<any[]>([])
  const [documents, setDocuments] = useState<any[]>([])
  const [viewDoc, setViewDoc] = useState<any>(null)
  const [generatedDocId, setGeneratedDocId] = useState<string | null>(null)

  const [paciente, setPaciente] = useState<any>({
    // Pessoal (Editar 1)
    full_name: '', cpf: '', rg: '', birth_date: '', gender: '', marital_status: '', profession: '', session_value: '', status: 'Ativo',
    // Contato (Editar 2)
    phone: '', email: '', cep: '', city: '', address: '', address_number: '', complement: '', state: '', emergency_name: '', emergency_phone: '', emergency_kinship: '',
    // Saúde (Editar 3)
    has_insurance: false, medical_history: '', psychiatric_history: '', medications: '', allergies: '', family_history: '',
    // Metas (Editar 4)
    therapy_goals: '',
    // Adicional (Editar 5 - Ajustado conforme print)
    lead_source: '', lead_details: '', observations: ''
  })

  useEffect(() => {
    async function fetchPaciente() {
      const [patientRes, aptRes, journalRes, docsRes] = await Promise.all([
        supabase.from('patients').select('*').eq('id', id).single(),
        supabase.from('appointments').select('price, amount_paid, payment_status, status').eq('patient_id', id),
        supabase.from('emotion_journal')
          .select('id, mood_score, notes, created_at')
          .eq('patient_id', id)
          .order('created_at', { ascending: false }),
        supabase.from('patient_documents')
          .select('*')
          .eq('patient_id', id)
          .order('created_at', { ascending: false })
      ])

      if (patientRes.data) {
        setPaciente(patientRes.data)
        setStats(prev => ({ ...prev, credit: Number(patientRes.data.credit_balance) || 0 }))
      }

      if (aptRes.data) {
        const apts = aptRes.data
        const debt = apts
          .filter((a: any) => a.payment_status !== 'Pago')
          .reduce((acc: number, curr: any) => acc + ((Number(curr.price) || 0) - (Number(curr.amount_paid) || 0)), 0)
        
        const paid = apts.reduce((acc: number, curr: any) => acc + (Number(curr.amount_paid) || 0), 0)
        
        const done = apts.filter((a: any) => a.status === 'confirmed').length
        const scheduled = apts.filter((a: any) => a.status === 'Agendado').length
        const cancelled = apts.filter((a: any) => a.status === 'cancelled').length

        setStats(prev => ({ ...prev, debt, paid, done, scheduled, cancelled }))
      }

      if (journalRes.data) {
        setEmotions(journalRes.data)
      }

      if (docsRes.data) {
        setDocuments(docsRes.data)
      }
      setLoading(false)
    }
    fetchPaciente()
  }, [id, supabase])

  const handleSave = async () => {
    setSaving(true)
    const { error } = await supabase.from('patients').update(paciente).eq('id', id)
    if (!error) {
      toast({ title: "Sucesso!", description: "Ficha clínica atualizada." })
    } else {
      toast({ variant: "destructive", title: "Erro ao salvar", description: error.message })
    }
    setSaving(false)
  }

  const getMoodIcon = (score: number) => {
    if (score === 1) return <Frown className="h-6 w-6 text-red-500" />
    if (score === 2) return <ThumbsDown className="h-6 w-6 text-orange-500" />
    if (score === 3) return <Meh className="h-6 w-6 text-yellow-500" />
    if (score === 4) return <ThumbsUp className="h-6 w-6 text-lime-500" />
    if (score === 5) return <Smile className="h-6 w-6 text-green-500" />
    return <Meh className="h-6 w-6 text-slate-300" />
  }

const handleGenerateLGPD = async () => {
    setLoading(true)
    
    try {
      // 1. Busca dados do profissional logado (Dra. Aline)
      const { data: profData } = await supabase
        .from('admin_users_view')
        .select('full_name, crp')
        .single()

      const nomeProfissional = profData?.full_name || 'Dra. Aline Barbosa'
      const crpProfissional = profData?.crp || '00/00000'

      // 2. TEXTO JURÍDICO OFICIAL
      const template = `TERMO DE CONSENTIMENTO LIVRE E ESCLARECIDO PARA TRATAMENTO DE DADOS (LGPD)

Pelo presente instrumento, eu, [NOME DO PACIENTE], inscrito no CPF sob o nº [CPF DO PACIENTE], na qualidade de Titular dos Dados, autorizo que o(a) psicólogo(a) [NOME DO PROFISSIONAL], inscrito(a) no CRP sob o nº [CRP], realize o tratamento de meus dados pessoais e dados sensíveis (saúde e histórico clínico).

1. Finalidade do Tratamento: Os dados coletados destinam-se exclusivamente à finalidade de prestação de serviços psicoterapêuticos, elaboração de prontuários obrigatórios (conforme Resolução CFP nº 01/2009) e gestão administrativa de consultas e honorários.

2. Sigilo Profissional: O tratamento de dados observará o Código de Ética Profissional do Psicólogo, garantindo o sigilo das informações compartilhadas em ambiente clínico, ressalvadas as hipóteses legais de quebra de sigilo previstas em lei.

3. Segurança e Armazenamento: Os dados serão armazenados em ambiente digital seguro (Plataforma MentePsi), com controle de acesso estrito e medidas de segurança cibernética, pelo prazo mínimo de 05 (cinco) anos após a última sessão, conforme exigência do Conselho Federal de Psicologia.

4. Direitos do Titular: O Titular poderá, a qualquer momento, solicitar o acesso, a correção ou a confirmação da existência de tratamento de seus dados, enviando uma solicitação ao profissional responsável.

Ao assinar este termo, declaro que fui informado(a) de forma clara sobre como meus dados serão utilizados.`

      // 3. SUBSTITUIÇÃO DINÂMICA
      const content = template
        .replace(/\[NOME DO PACIENTE\]/g, paciente.full_name || '____________________')
        .replace(/\[CPF DO PACIENTE\]/g, paciente.cpf || '____________________')
        .replace(/\[NOME DO PROFISSIONAL\]/g, nomeProfissional)
        .replace(/\[CRP\]/g, crpProfissional)

      // 4. GRAVAÇÃO NO BANCO
      const { data, error } = await supabase.from('patient_documents').insert({
        patient_id: id,
        title: 'Termo de Consentimento LGPD',
        content: content,
        status: 'Pendente'
      }).select().single()

      if (error) throw error

      setGeneratedDocId(data.id)
      toast({ title: "Documento gerado!", description: "O termo LGPD personalizado está pronto." })
      
      // Atualiza a galeria
      setDocuments(prev => [data, ...prev])

    } catch (error: any) {
      toast({ variant: "destructive", title: "Erro ao gerar", description: error.message })
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-teal-600" /></div>

  return (
    <div className="p-6 space-y-6 bg-slate-50/50 min-h-screen">
      {/* Cabeçalho Cirúrgico */}
      <div className="flex justify-between items-center border-b pb-6 bg-white p-4 rounded-lg shadow-sm">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()}><ArrowLeft className="h-4 w-4" /></Button>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Ficha Clínica Digital</h1>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => router.back()}>Cancelar</Button>
          <Button onClick={handleSave} className="bg-teal-600 hover:bg-teal-700 text-white shadow-sm">
            {saving ? <Loader2 className="animate-spin h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />}
            Salvar Alterações
          </Button>
        </div>
      </div>

      {/* DASHBOARD DE RESUMO */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex flex-col justify-between h-full">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs text-slate-500 font-medium uppercase">Saldo Devedor</p>
                <h3 className="text-2xl font-bold text-red-600">R$ {stats.debt.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
              </div>
              <div className="p-2 bg-red-50 rounded-full"><DollarSign className="h-4 w-4 text-red-600" /></div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 flex flex-col justify-between h-full">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs text-slate-500 font-medium uppercase">Total Pago</p>
                <h3 className="text-2xl font-bold text-emerald-600">R$ {stats.paid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
              </div>
              <div className="p-2 bg-emerald-50 rounded-full"><CheckCircle className="h-4 w-4 text-emerald-600" /></div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex flex-col justify-between h-full">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs text-slate-500 font-medium uppercase">Sessões em Haver</p>
                <h3 className="text-2xl font-bold text-blue-600">R$ {stats.credit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
              </div>
              <div className="p-2 bg-blue-50 rounded-full"><Clock className="h-4 w-4 text-blue-600" /></div>
            </div>
          </CardContent>
        </Card>

        <Card className="flex flex-col justify-center p-4 space-y-3">
           <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600 flex items-center gap-2"><CheckCircle className="h-3 w-3 text-green-600"/> Realizadas</span>
              <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-100">{stats.done}</Badge>
           </div>
           <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600 flex items-center gap-2"><Calendar className="h-3 w-3 text-blue-600"/> Agendadas</span>
              <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-100">{stats.scheduled}</Badge>
           </div>
           <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600 flex items-center gap-2"><XCircle className="h-3 w-3 text-red-600"/> Desmarcadas</span>
              <Badge variant="secondary" className="bg-red-100 text-red-700 hover:bg-red-100">{stats.cancelled}</Badge>
           </div>
        </Card>
      </div>

      <Tabs defaultValue="pessoal" className="w-full">
        <TabsList className="bg-slate-100 p-1 h-auto flex flex-wrap gap-1 rounded-lg">
          <TabsTrigger value="pessoal" className="flex-1"><User className="w-4 h-4 mr-2"/> Pessoal</TabsTrigger>
          <TabsTrigger value="contato" className="flex-1"><MapPin className="w-4 h-4 mr-2"/> Contato</TabsTrigger>
          <TabsTrigger value="saude" className="flex-1"><Heart className="w-4 h-4 mr-2"/> Saúde</TabsTrigger>
          <TabsTrigger value="metas" className="flex-1"><Target className="w-4 h-4 mr-2"/> Metas</TabsTrigger>
          <TabsTrigger value="adicional" className="flex-1"><Info className="w-4 h-4 mr-2"/> Adicional</TabsTrigger>
          <TabsTrigger value="emocoes" className="flex-1"><Activity className="w-4 h-4 mr-2"/> Emoções</TabsTrigger>
          <TabsTrigger value="documentos" className="flex-1"><FileText className="w-4 h-4 mr-2"/> Documentos</TabsTrigger>
        </TabsList>

        {/* PESSOAL - EDITAR 1 */}
        <TabsContent value="pessoal" className="pt-4">
          <Card><CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2 space-y-2">
              <Label>Nome Completo *</Label>
              <Input value={paciente.full_name} onChange={e => setPaciente({...paciente, full_name: e.target.value})} placeholder="Ex: Vanesa Veiga" />
            </div>
            <div className="space-y-2"><Label>CPF</Label><Input value={paciente.cpf} onChange={e => setPaciente({...paciente, cpf: e.target.value})} /></div>
            <div className="space-y-2"><Label>RG</Label><Input value={paciente.rg} onChange={e => setPaciente({...paciente, rg: e.target.value})} /></div>
            <div className="space-y-2"><Label>Data de Nascimento</Label><Input type="date" value={paciente.birth_date} onChange={e => setPaciente({...paciente, birth_date: e.target.value})} /></div>
            <div className="space-y-2"><Label>Gênero</Label>
              <Select value={paciente.gender} onValueChange={v => setPaciente({...paciente, gender: v})}>
                <SelectTrigger><SelectValue placeholder="Selecione"/></SelectTrigger>
                <SelectContent><SelectItem value="feminino">Feminino</SelectItem><SelectItem value="masculino">Masculino</SelectItem><SelectItem value="outro">Outro</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Estado Civil</Label>
              <Select value={paciente.marital_status} onValueChange={v => setPaciente({...paciente, marital_status: v})}>
                <SelectTrigger><SelectValue placeholder="Selecione"/></SelectTrigger>
                <SelectContent><SelectItem value="Solteiro(a)">Solteiro(a)</SelectItem><SelectItem value="Casado(a)">Casado(a)</SelectItem><SelectItem value="Divorciado(a)">Divorciado(a)</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Profissão</Label><Input value={paciente.profession} onChange={e => setPaciente({...paciente, profession: e.target.value})} /></div>
            <div className="space-y-2"><Label>Valor da Sessão (R$)</Label><Input type="number" value={paciente.session_value} onChange={e => setPaciente({...paciente, session_value: e.target.value})} /></div>
          </CardContent></Card>
        </TabsContent>

        {/* CONTATO - EDITAR 2 */}
        <TabsContent value="contato" className="pt-4">
          <Card><CardContent className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2"><Label>Telefone/WhatsApp *</Label><Input value={paciente.phone} onChange={e => setPaciente({...paciente, phone: e.target.value})} /></div>
            <div className="md:col-span-2 space-y-2"><Label>Email</Label><Input value={paciente.email} onChange={e => setPaciente({...paciente, email: e.target.value})} /></div>
            <div className="space-y-2"><Label>CEP</Label><Input value={paciente.cep} onChange={e => setPaciente({...paciente, cep: e.target.value})} /></div>
            <div className="md:col-span-2 space-y-2"><Label>Cidade</Label><Input value={paciente.city} onChange={e => setPaciente({...paciente, city: e.target.value})} /></div>
            <div className="md:col-span-3 pt-4 border-t"><h3 className="font-semibold flex items-center gap-2"><Heart className="w-4 h-4 text-red-500"/> Contato de Emergência</h3></div>
            <div className="space-y-2"><Label>Nome</Label><Input value={paciente.emergency_name} onChange={e => setPaciente({...paciente, emergency_name: e.target.value})} /></div>
            <div className="space-y-2"><Label>Telefone</Label><Input value={paciente.emergency_phone} onChange={e => setPaciente({...paciente, emergency_phone: e.target.value})} /></div>
            <div className="space-y-2"><Label>Parentesco</Label><Input placeholder="Ex: Mãe" value={paciente.emergency_kinship} onChange={e => setPaciente({...paciente, emergency_kinship: e.target.value})} /></div>
          </CardContent></Card>
        </TabsContent>

        {/* SAÚDE - EDITAR 3 */}
        <TabsContent value="saude" className="pt-4">
          <Card><CardContent className="p-6 space-y-6">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg shadow-sm border">
              <div><Label className="text-base">Possui Convênio?</Label><p className="text-sm text-slate-500">Paciente utiliza plano de saúde</p></div>
              <Switch checked={paciente.has_insurance} onCheckedChange={v => setPaciente({...paciente, has_insurance: v})} />
            </div>
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2"><Label>Histórico Médico</Label><Textarea placeholder="Doenças prévias..." value={paciente.medical_history} onChange={e => setPaciente({...paciente, medical_history: e.target.value})} /></div>
              <div className="space-y-2"><Label>Histórico Psiquiátrico</Label><Textarea placeholder="Tratamentos anteriores..." value={paciente.psychiatric_history} onChange={e => setPaciente({...paciente, psychiatric_history: e.target.value})} /></div>
              <div className="space-y-2"><Label>Alergias</Label><Textarea placeholder="Medicamentos, alimentos..." value={paciente.allergies} onChange={e => setPaciente({...paciente, allergies: e.target.value})} /></div>
            </div>
          </CardContent></Card>
        </TabsContent>

        {/* METAS - EDITAR 4 */}
        <TabsContent value="metas" className="pt-4">
          <Card><CardContent className="p-6 text-center space-y-6">
            <div className="flex justify-between items-center mb-6">
              <div className="text-left"><h2 className="text-lg font-bold">Metas Terapêuticas</h2><p className="text-sm text-slate-500">Acompanhamento de evolução e objetivos</p></div>
              <Button className="bg-teal-600 hover:bg-teal-700 text-white"><Plus className="w-4 h-4 mr-2"/> Nova Meta</Button>
            </div>
            <div className="border-2 border-dashed py-20 rounded-xl text-slate-400">Nenhuma meta ativa cadastrada.</div>
          </CardContent></Card>
        </TabsContent>

        {/* ADICIONAL - EDITAR 5 (AJUSTADO CONFORME PRINT) */}
        <TabsContent value="adicional" className="pt-4">
          <Card><CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Como conheceu a clínica?</Label>
                <Select value={paciente.lead_source} onValueChange={v => setPaciente({...paciente, lead_source: v})}>
                  <SelectTrigger><SelectValue placeholder="Selecione"/></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Instagram">Instagram</SelectItem>
                    <SelectItem value="Google">Google</SelectItem>
                    <SelectItem value="Indicação">Indicação</SelectItem>
                    <SelectItem value="Outros">Outros</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Detalhes (se indicação)</Label>
                <Input value={paciente.lead_details} onChange={e => setPaciente({...paciente, lead_details: e.target.value})} placeholder="Nome de quem indicou" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Observações Gerais</Label>
              <Textarea placeholder="Outras informações..." className="min-h-[150px]" value={paciente.observations} onChange={e => setPaciente({...paciente, observations: e.target.value})} />
            </div>
          </CardContent></Card>
        </TabsContent>

        {/* EMOÇÕES - NOVO COMPONENTE */}
        <TabsContent value="emocoes" className="pt-4">
          <Card>
            <CardContent className="p-6 space-y-8">
              
              {/* Gráfico Simples (CSS) */}
              <div>
                <h3 className="text-lg font-bold text-slate-800 mb-6">Variação de Humor (Últimos Registros)</h3>
                <div className="h-40 flex items-end gap-4 border-b border-slate-200 pb-2 px-2">
                  {emotions.length === 0 ? (
                    <div className="w-full text-center text-slate-400 py-10">Sem dados suficientes para o gráfico.</div>
                  ) : (
                    emotions.slice(0, 7).reverse().map((entry, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-2 group relative">
                        <div 
                          className="w-full max-w-[40px] bg-blue-100 rounded-t-md hover:bg-blue-200 transition-all relative"
                          style={{ height: `${(Number(entry.mood_score) / 5) * 100}%` }}
                        >
                          <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-white shadow-sm p-1 rounded-full">
                            {getMoodIcon(Number(entry.mood_score))}
                          </div>
                        </div>
                        <span className="text-xs text-slate-500 font-medium">
                          {new Date(entry.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Lista de Notas */}
              <div>
                <h3 className="text-lg font-bold text-slate-800 mb-4">Diário de Notas</h3>
                <div className="space-y-4">
                  {emotions.map((entry) => (
                    <div key={entry.id} className="flex gap-4 p-4 border rounded-lg bg-slate-50/50 hover:bg-white hover:shadow-sm transition-all">
                      <div className="mt-1">{getMoodIcon(Number(entry.mood_score))}</div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-slate-900 capitalize">
                            {new Date(entry.created_at).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                          </span>
                          <span className="text-xs text-slate-400">
                            às {new Date(entry.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-slate-600 text-sm italic">"{entry.notes || "Sem anotações."}"</p>
                      </div>
                    </div>
                  ))}
                  {emotions.length === 0 && <div className="text-center text-slate-400">Nenhum registro encontrado.</div>}
                </div>
              </div>

            </CardContent>
          </Card>
        </TabsContent>

        {/* DOCUMENTOS - NOVO COMPONENTE */}
        <TabsContent value="documentos" className="pt-4">
          <Card>
            <CardContent className="p-6 space-y-6">
              <div className="flex flex-col items-center justify-center space-y-4 py-10 border-2 border-dashed rounded-xl bg-slate-50">
                <FileText className="h-12 w-12 text-slate-300" />
                <h3 className="text-lg font-medium text-slate-900">Documentos do Paciente</h3>
                
                {!generatedDocId ? (
                  <Button onClick={handleGenerateLGPD} disabled={loading} className="bg-teal-600 hover:bg-teal-700 text-white">
                    Gerar Termo LGPD
                  </Button>
                ) : (
                  <div className="flex flex-col items-center gap-2 animate-in fade-in">
                     <div className="p-3 bg-green-50 text-green-700 rounded-lg border border-green-200 mb-2">
                       Documento criado com sucesso!
                     </div>
                     <Button 
                       className="bg-green-600 hover:bg-green-700 text-white"
                       onClick={() => {
                         const link = `${window.location.origin}/assinar/${generatedDocId}`
                         const msg = encodeURIComponent(`Olá ${paciente.full_name.split(' ')[0]}, segue o link para assinar o termo LGPD: ${link}`)
                         window.open(`https://wa.me/${paciente.phone?.replace(/\D/g, '')}?text=${msg}`, '_blank')
                       }}
                     >
                       <MessageCircle className="mr-2 h-4 w-4" /> Enviar Link de Assinatura
                     </Button>
                     <Button variant="ghost" size="sm" onClick={() => setGeneratedDocId(null)}>Gerar Novo</Button>
                  </div>
                )}
              </div>

              {/* Galeria de Documentos */}
              <div>
                <h3 className="text-lg font-bold text-slate-800 mb-4">Galeria de Documentos</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {documents.map((doc) => (
                    <Card key={doc.id} className="border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                      <CardContent className="p-4 space-y-3">
                        <div className="flex justify-between items-start">
                          <div className="p-2 bg-blue-50 rounded-lg">
                            <FileText className="h-6 w-6 text-blue-600" />
                          </div>
                          <Badge variant={doc.status === 'Assinado' ? 'default' : 'secondary'} 
                                 className={doc.status === 'Assinado' ? 'bg-green-100 text-green-700 hover:bg-green-100' : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100'}>
                            {doc.status}
                          </Badge>
                        </div>
                        <div>
                          <h4 className="font-semibold text-slate-900 line-clamp-1" title={doc.title}>{doc.title}</h4>
                          <p className="text-xs text-slate-500">{new Date(doc.created_at).toLocaleDateString('pt-BR')}</p>
                        </div>
                        
                        {doc.status === 'Assinado' ? (
                          <Button variant="outline" size="sm" className="w-full" onClick={() => setViewDoc(doc)}>
                            Ver Documento
                          </Button>
                        ) : (
                           <Button variant="ghost" size="sm" className="w-full text-slate-400" disabled>
                             Aguardando Assinatura
                           </Button>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                  {documents.length === 0 && (
                    <div className="col-span-full text-center text-slate-400 py-8">
                      Nenhum documento encontrado.
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Button variant="destructive" className="mt-8 bg-red-500 hover:bg-red-600"><Trash2 className="mr-2 h-4 w-4"/> Excluir Paciente</Button>

      {/* Modal de Visualização de Documento */}
      <Dialog open={!!viewDoc} onOpenChange={(open) => !open && setViewDoc(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{viewDoc?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="whitespace-pre-wrap font-serif text-sm leading-relaxed text-slate-700 p-4 bg-slate-50 rounded border">
              {viewDoc?.content}
            </div>
            {viewDoc?.signature_data && (
              <div className="border-t pt-4">
                <p className="text-sm font-bold text-slate-900 mb-2">Assinatura Digital</p>
                <img src={viewDoc.signature_data} alt="Assinatura" className="h-24 border border-dashed border-slate-300 rounded bg-white" />
                <p className="text-xs text-slate-500 mt-1">
                  Assinado digitalmente em {new Date(viewDoc.signed_at).toLocaleString('pt-BR')}
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}