'use client'

import React, { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Loader2, Sparkles, FileText, Link as LinkIcon, MessageCircle, CheckCircle, Copy } from "lucide-react"
import { createClient } from '@/lib/client'
import { useToast } from "@/hooks/use-toast"

const TEMPLATES: Record<string, string> = {
  "Atestado": "ATESTADO PSICOLÓGICO\n\nAtesto para os devidos fins que o(a) paciente [NOME], inscrito(a) no CPF [CPF], encontra-se em acompanhamento psicológico sob meus cuidados, necessitando de [DIAS] dias de afastamento de suas atividades para tratamento de saúde.\n\nCID-10: [CID]\n\n[CIDADE], [DATA].",
  "Declaração": "DECLARAÇÃO DE COMPARECIMENTO\n\nDeclaro que o(a) paciente [NOME], inscrito(a) no CPF [CPF], compareceu a atendimento psicológico neste consultório no dia [DATA] das [HORA_INICIO] às [HORA_FIM].\n\n[CIDADE], [DATA].",
  "Contrato": "CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE PSICOLOGIA\n\nCONTRATANTE: [NOME], CPF [CPF].\nCONTRATADO: [NOME_PROFISSIONAL], CRP [CRP_PROFISSIONAL].\n\nCLÁUSULA 1 - DO OBJETO\nO presente contrato tem por objeto a prestação de serviços de psicologia clínica...\n\n[DATA].",
  "Recibo de Pagamento": "RECIBO\n\nRecebi de [NOME], CPF [CPF], a importância de R$ [VALOR] referente a sessões de psicoterapia realizadas em [DATA].\n\n[CIDADE], [DATA].",
  "Recibo Anual IRPF": "RECIBO PARA FINS DE IMPOSTO DE RENDA\n\nRecebi de [NOME], CPF [CPF], o valor total de R$ [VALOR_TOTAL] referente a atendimentos psicológicos realizados durante o ano de 2025.\n\n[DATA].",
  "Testes Psicológicos": "PROTOCOLO DE AVALIAÇÃO PSICOLÓGICA\n\nPACIENTE: [NOME]\nDATA: [DATA]\n\nINSTRUMENTOS UTILIZADOS:\n1. ...\n\nRESULTADOS OBTIDOS:\n...",
  "Anamnese": "FICHA DE ANAMNESE\n\nPACIENTE: [NOME]\nDATA: [DATA]\n\nQUEIXA PRINCIPAL:\n...\n\nHISTÓRICO:\n...",
  "Prontuários Gerais": "REGISTRO DE PRONTUÁRIO\n\nPACIENTE: [NOME]\nDATA: [DATA]\n\nDESCRIÇÃO DO ATENDIMENTO:\n...",
  "Laudo": "LAUDO PSICOLÓGICO\n\n1. IDENTIFICAÇÃO\nNome: [NOME]\nCPF: [CPF]\n\n2. DEMANDA\n...\n\n3. PROCEDIMENTO\n...\n\n4. ANÁLISE\n...\n\n5. CONCLUSÃO\n...\n\nTaquaritinga, [DATA].",
  "Relatórios Psicológicos": "RELATÓRIO PSICOLÓGICO\n\n1. IDENTIFICAÇÃO\nNome: [NOME]\n\n2. DESCRIÇÃO DA DEMANDA\n...\n\n3. PROCEDIMENTO\n...\n\n4. ANÁLISE\n...\n\n5. CONCLUSÃO\n...\n\n[DATA].",
  "Parecer": "PARECER TÉCNICO\n\nSOLICITANTE: ...\nASSUNTO: ...\n\n1. EXPOSIÇÃO DE MOTIVOS\n...\n\n2. ANÁLISE TÉCNICA\n...\n\n3. CONCLUSÃO\n...\n\n[DATA].",
  "Comprovante de Sessões": "COMPROVANTE DE SESSÕES\n\nCertifico que [NOME] realizou as seguintes sessões de psicoterapia:\n\n- Data: [DATA]\n\n[CIDADE], [DATA].",
  "Termo LGPD": `TERMO DE CONSENTIMENTO LIVRE E ESCLARECIDO PARA TRATAMENTO DE DADOS (LGPD)

Eu, [NOME DO PACIENTE], inscrito(a) no CPF sob o nº [CPF DO PACIENTE], autorizo o(a) Psicólogo(a) [NOME DO PROFISSIONAL], inscrito(a) no CRP [CRP], a realizar o tratamento dos meus dados pessoais sensíveis, especificamente os dados de saúde mental, coletados durante os atendimentos psicológicos, para fins exclusivos de prestação de serviços de psicologia, evolução de prontuário e cumprimento de obrigações legais e regulatórias, em conformidade com a Lei nº 13.709/2018 (Lei Geral de Proteção de Dados Pessoais - LGPD).

Estou ciente de que:
1. Os dados serão armazenados em ambiente seguro e com acesso restrito.
2. O sigilo profissional será mantido conforme o Código de Ética Profissional do Psicólogo.
3. Poderei revogar este consentimento a qualquer momento, mediante manifestação expressa.

[CIDADE], [DATA].`
}

interface NewDocumentModalProps {
  preSelectedPatientId?: string
  onDocumentCreated?: () => void
  trigger?: React.ReactNode
}

export function NewDocumentModal({ preSelectedPatientId, onDocumentCreated, trigger }: NewDocumentModalProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const { toast } = useToast()
  const [createdDocId, setCreatedDocId] = useState<string | null>(null)
  
  const [patients, setPatients] = useState<any[]>([])
  const [professional, setProfessional] = useState<any>(null)
  
  const [formData, setFormData] = useState({
    patient_id: preSelectedPatientId || '',
    type: '',
    title: '',
    content: ''
  })

  // Carrega dados do Banco
  useEffect(() => {
    if (open) {
      const fetchData = async () => {
        const supabase = createClient()
        
        // Correção: Usar admin_users_view e tratar erro
        const { data: prof, error } = await supabase.from('admin_users_view').select('full_name, crp').single()
        
        if (error) console.error("Erro ao carregar perfil:", error)
        if (prof) setProfessional(prof)

        const { data: pats } = await supabase.from('patients').select('id, full_name, cpf, phone').order('full_name')
        if (pats) setPatients(pats)

        if (preSelectedPatientId) {
          setFormData(prev => ({ ...prev, patient_id: preSelectedPatientId }))
        }
      }
      fetchData()
    }
  }, [open, preSelectedPatientId])

  // Função auxiliar para preencher o template
  const fillTemplate = (type: string, patientId: string) => {
    const template = TEMPLATES[type] || ""
    const patient = patients.find(p => p.id === patientId)
    
    let filled = template
    if (patient) {
      filled = filled.replace(/\[NOME\]/g, patient.full_name || "...")
      filled = filled.replace(/\[CPF\]/g, patient.cpf || "...")
      filled = filled.replace(/\[NOME DO PACIENTE\]/g, patient.full_name || "...")
      filled = filled.replace(/\[CPF DO PACIENTE\]/g, patient.cpf || "...")
    }
    if (professional) {
      filled = filled.replace(/\[NOME_PROFISSIONAL\]/g, professional.full_name || "...")
      filled = filled.replace(/\[NOME DO PROFISSIONAL\]/g, professional.full_name || "...")
      filled = filled.replace(/\[CRP\]/g, professional.crp || "...")
      filled = filled.replace(/\[CRP_PROFISSIONAL\]/g, professional.crp || "...")
      filled = filled.replace(/\[CIDADE\]/g, professional.city || "Cidade não informada")
    }
    
    const today = new Date().toLocaleDateString('pt-BR')
    filled = filled.replace(/\[DATA\]/g, today)
    return filled
  }

  const handleTypeChange = (newType: string) => {
    const filled = fillTemplate(newType, formData.patient_id)
    const patient = patients.find(p => p.id === formData.patient_id)

    setFormData({
      ...formData,
      type: newType,
      title: `${newType} - ${patient?.full_name || ''}`,
      content: filled
    })
  }

  const handlePatientChange = (patientId: string) => {
    const filled = fillTemplate(formData.type, patientId)
    const patient = patients.find(p => p.id === patientId)
    setFormData({
      ...formData,
      patient_id: patientId,
      title: formData.type ? `${formData.type} - ${patient?.full_name || ''}` : formData.title,
      content: filled
    })
  }

  const handleGenerateAI = async () => {
    if (!formData.patient_id || !formData.content) {
      toast({ variant: "destructive", title: "Atenção", description: "Selecione um paciente e um tipo de documento primeiro." })
      return
    }
    setGenerating(true)
    const supabase = createClient()
    
    // Busca Histórico para a IA
    const { data: evos } = await supabase
      .from('clinical_evolutions')
      .select('content, created_at')
      .eq('patient_id', formData.patient_id)
      .order('created_at', { ascending: false })
      .limit(5)

    const contextText = evos?.map(e => `Sessão (${new Date(e.created_at).toLocaleDateString()}): ${e.content}`).join("\n") || "Sem histórico recente."

    try {
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY || ""
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: `Você é uma IA especialista em documentos psicológicos conforme as normas do CFP. 
            Preencha o modelo abaixo com base no histórico clínico fornecido. 
            Não invente fatos, apenas use o histórico para tornar o documento técnico e profissional.
            
            MODELO:
            ${formData.content}
            
            HISTÓRICO:
            ${contextText}` }]
          }]
        })
      })
      
      const data = await response.json()
      const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text
      if (aiText) {
        setFormData(prev => ({ ...prev, content: aiText }))
        toast({ title: "IA gerou o conteúdo!", description: "Revise e edite se necessário." })
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Erro na IA", description: "Verifique sua chave de API." })
    } finally {
      setGenerating(false)
    }
  }

  const handleSubmit = async () => {
    if (!formData.patient_id || !formData.type || !formData.title || !formData.content) {
      toast({ variant: "destructive", title: "Campos obrigatórios", description: "Por favor, preencha todos os campos antes de salvar." })
      return
    }
    setLoading(true)
    
    console.log('Tentando salvar:', formData);
    
    const supabase = createClient()
    const { data, error } = await supabase.from('patient_documents').insert({
      patient_id: formData.patient_id,
      title: formData.title,
      content: formData.content,
      status: 'Pendente'
    }).select()

    if (error) {
      toast({ variant: "destructive", title: "Erro ao salvar", description: error.message })
      console.error("Erro Supabase:", error)
    } else {
      console.log('Documento salvo:', data)
      toast({ title: "Salvo com sucesso!" })
      
      if (data && data[0]) {
        setCreatedDocId(data[0].id)
      } else {
        // Fallback caso não retorne ID
        handleClose()
      }
    }
    setLoading(false)
  }

  const handleGenerateLink = () => {
    if (!createdDocId) return ""
    return `https://meusistema.com/assinar/${createdDocId}`
  }

  const handleSendWhatsApp = () => {
    const link = handleGenerateLink()
    const patient = patients.find(p => p.id === formData.patient_id)
    if (!patient?.phone) {
        toast({ variant: "destructive", title: "Erro", description: "Paciente sem telefone cadastrado." })
        return
    }
    const message = encodeURIComponent(`Olá ${patient.full_name.split(' ')[0]}, segue o link para assinatura do documento: ${link}`)
    window.open(`https://wa.me/${patient.phone.replace(/\D/g, '')}?text=${message}`, '_blank')
  }

  const handleClose = () => {
    setOpen(false)
    setCreatedDocId(null)
    if (onDocumentCreated) onDocumentCreated()
    setFormData({
      patient_id: preSelectedPatientId || '',
      type: '',
      title: '',
      content: ''
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || <Button><Plus className="mr-2 h-4 w-4" /> Novo Documento</Button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px]">
        {createdDocId ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-6 w-6" /> Documento Criado!
              </DialogTitle>
              <DialogDescription>
                O documento foi salvo. Envie o link para o paciente assinar.
              </DialogDescription>
            </DialogHeader>
            <div className="py-6 space-y-4">
              <div className="flex items-center gap-2 p-3 bg-slate-50 rounded border">
                <LinkIcon className="h-4 w-4 text-slate-500" />
                <code className="flex-1 text-sm text-slate-700 overflow-hidden text-ellipsis whitespace-nowrap">
                  {handleGenerateLink()}
                </code>
                <Button size="sm" variant="ghost" onClick={() => {
                  navigator.clipboard.writeText(handleGenerateLink())
                  toast({ title: "Copiado!" })
                }}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <Button onClick={handleSendWhatsApp} className="w-full bg-green-600 hover:bg-green-700 text-white">
                <MessageCircle className="mr-2 h-4 w-4" /> Enviar no WhatsApp
              </Button>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>Fechar</Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Gerador de Documentos Clínicos</DialogTitle>
              <DialogDescription>Selecione o tipo para carregar o modelo automático.</DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Paciente</Label>
                  <Select onValueChange={handlePatientChange} value={formData.patient_id}>
                    <SelectTrigger><SelectValue placeholder="Selecione o paciente" /></SelectTrigger>
                    <SelectContent>
                      {patients.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Tipo de Documento</Label>
                  <Select onValueChange={handleTypeChange} value={formData.type}>
                    <SelectTrigger><SelectValue placeholder="Escolha o modelo..." /></SelectTrigger>
                    <SelectContent>
                      {Object.keys(TEMPLATES).map(t => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Input placeholder="Título do arquivo" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label>Conteúdo Final</Label>
                  <Button variant="outline" size="sm" onClick={handleGenerateAI} disabled={generating} className="text-purple-600 border-purple-200">
                    {generating ? <Loader2 className="animate-spin mr-2 h-3 w-3" /> : <Sparkles className="mr-2 h-3 w-3" />}
                    Gerar com IA
                  </Button>
                </div>
                <Textarea className="min-h-[350px] font-serif" value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})} />
              </div>
            </div>

            <DialogFooter>
              <Button onClick={handleSubmit} disabled={loading} className="w-full bg-teal-600 hover:bg-teal-700 text-white">
                {loading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <FileText className="mr-2 h-4 w-4" />}
                Salvar e Gerar Link
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}