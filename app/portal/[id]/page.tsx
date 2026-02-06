'use client'

import React, { useState, useEffect, use, useRef } from 'react'
import { createClient } from '@/lib/client'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Frown, Meh, Smile, ThumbsDown, ThumbsUp, Send, FileText, PenTool, CheckCircle, Eraser } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import SignatureCanvas from 'react-signature-canvas'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"

export default function PatientPortalPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { toast } = useToast()
  const [patientName, setPatientName] = useState("")
  const [loading, setLoading] = useState(true)
  const [mood, setMood] = useState<number | null>(null)
  const [note, setNote] = useState("")
  const [submitted, setSubmitted] = useState(false)
  
  const sigCanvas = useRef<any>(null)
  const [openSignature, setOpenSignature] = useState(false)
  const [lgpdSigned, setLgpdSigned] = useState(false)

  useEffect(() => {
    const fetchPatientName = async () => {
      const supabase = createClient()
      // Busca apenas o nome para privacidade/segurança
      const { data, error } = await supabase
        .from('patients')
        .select('full_name')
        .eq('id', id)
        .single()

      if (data && !error) {
        // Usa o primeiro nome para uma saudação mais amigável
        const firstName = data.full_name.split(' ')[0]
        setPatientName(firstName)
      }
      
      // Verificar documentos assinados
      const { data: docData } = await supabase.from('patient_documents')
        .select('id')
        .eq('patient_id', id)
        .ilike('title', '%LGPD%')
        .eq('status', 'Assinado')
        .maybeSingle()
      
      if (docData) setLgpdSigned(true)
      
      setLoading(false)
    }

    fetchPatientName()
  }, [id])

  const handleSubmit = async () => {
    if (mood === null) {
      toast({
        variant: "destructive",
        title: "Selecione como está se sentindo",
        description: "Por favor, escolha uma opção de humor antes de enviar.",
      })
      return
    }

    const supabase = createClient()
    
    const { error } = await supabase.from('emotion_journal').insert({
      patient_id: id,
      mood_score: mood,
      notes: note
    })

    if (error) {
      toast({ variant: "destructive", title: "Erro ao salvar", description: "Não foi possível registrar. Tente novamente." })
    } else {
      setSubmitted(true)
      toast({
        title: "Registro salvo!",
        description: "Obrigado por compartilhar como você está hoje.",
      })
    }
  }

  const handleSaveSignature = async () => {
    if (!sigCanvas.current || sigCanvas.current.isEmpty()) {
      toast({ variant: "destructive", title: "Assinatura vazia", description: "Por favor, assine antes de salvar." })
      return
    }

    const signatureData = sigCanvas.current.getTrimmedCanvas().toDataURL('image/png')
    const supabase = createClient()

    const { error } = await supabase.from('patient_documents').insert({
      patient_id: id,
      title: 'Termo de Consentimento LGPD (Assinado via Portal)',
      content: 'Assinatura coletada digitalmente via Portal do Paciente.',
      status: 'Assinado',
      signature_data: signatureData,
      signed_at: new Date().toISOString()
    })

    if (error) {
      toast({ variant: "destructive", title: "Erro ao salvar", description: error.message })
    } else {
      setLgpdSigned(true)
      setOpenSignature(false)
      toast({ title: "Documento assinado!", description: "O termo LGPD foi registrado com sucesso." })
    }
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-400">Carregando...</div>
  }

  if (!patientName) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-400">Link inválido ou expirado.</div>
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <Card className="w-full max-w-md text-center py-10 border-none shadow-lg">
          <CardContent>
            <div className="mb-6 flex justify-center">
              <div className="h-20 w-20 bg-green-100 rounded-full flex items-center justify-center animate-in zoom-in duration-300">
                <Send className="h-10 w-10 text-green-600" />
              </div>
            </div>
            <CardTitle className="text-2xl mb-2 text-slate-800">Tudo certo!</CardTitle>
            <CardDescription className="text-lg">Seu registro foi enviado com sucesso.<br/>Tenha um ótimo dia!</CardDescription>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 font-sans gap-6">
      
      {/* CARD DE DOCUMENTOS PENDENTES */}
      <Card className="w-full max-w-md shadow-md border-slate-100 bg-white">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <FileText className="h-5 w-5 text-teal-600" /> Documentos
          </CardTitle>
        </CardHeader>
        <CardContent>
          {lgpdSigned ? (
            <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-lg border border-green-100">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">Termo LGPD Assinado</span>
            </div>
          ) : (
            <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-100">
              <span className="text-slate-700 font-medium text-sm">Termo de Consentimento (LGPD)</span>
              <Dialog open={openSignature} onOpenChange={setOpenSignature}>
                <DialogTrigger asChild>
                  <Button size="sm" className="bg-teal-600 hover:bg-teal-700 text-white h-8">
                    <PenTool className="mr-2 h-3 w-3" /> Ler e Assinar
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader><DialogTitle>Assinatura Digital</DialogTitle></DialogHeader>
                  <div className="space-y-4">
                    <div className="h-32 overflow-y-auto text-sm text-slate-600 border p-3 rounded bg-slate-50">
                      <p className="font-bold mb-2">Termo de Consentimento (LGPD)</p>
                      <p>Autorizo o tratamento dos meus dados pessoais sensíveis para fins de atendimento psicológico, conforme a Lei Geral de Proteção de Dados (Lei nº 13.709/2018). Estou ciente de que meus dados serão mantidos em sigilo e utilizados apenas para fins profissionais.</p>
                    </div>
                    <div className="border-2 border-dashed border-slate-300 rounded-lg bg-white flex justify-center">
                      <SignatureCanvas ref={sigCanvas} penColor="black" canvasProps={{width: 400, height: 180, className: 'sigCanvas'}} />
                    </div>
                    <p className="text-xs text-center text-slate-400">Assine no quadro acima usando o dedo ou mouse.</p>
                  </div>
                  <DialogFooter className="flex gap-2 sm:justify-between">
                    <Button variant="outline" onClick={() => sigCanvas.current?.clear()}><Eraser className="mr-2 h-4 w-4" /> Limpar</Button>
                    <Button onClick={handleSaveSignature} className="bg-green-600 hover:bg-green-700 text-white">Confirmar Assinatura</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="w-full max-w-md shadow-xl border-slate-100 bg-white">
        <CardHeader className="text-center pb-2 pt-8">
          <CardTitle className="text-3xl font-bold text-slate-900">
            Olá, {patientName}
          </CardTitle>
          <CardDescription className="text-lg text-slate-500 mt-2">
            Como você está se sentindo hoje?
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8 pt-8">
          
          {/* Seletor de Humor */}
          <div className="flex justify-between gap-1 sm:gap-2">
            {[
              { value: 1, icon: Frown, label: "Muito Triste", color: "text-red-500 bg-red-50 border-red-200" },
              { value: 2, icon: ThumbsDown, label: "Triste", color: "text-orange-500 bg-orange-50 border-orange-200" },
              { value: 3, icon: Meh, label: "Neutro", color: "text-yellow-500 bg-yellow-50 border-yellow-200" },
              { value: 4, icon: ThumbsUp, label: "Bem", color: "text-lime-500 bg-lime-50 border-lime-200" },
              { value: 5, icon: Smile, label: "Muito Bem", color: "text-green-500 bg-green-50 border-green-200" },
            ].map((item) => (
              <button
                key={item.value}
                onClick={() => setMood(item.value)}
                className={`flex flex-col items-center justify-center p-3 rounded-2xl transition-all duration-200 border-2 ${
                  mood === item.value 
                    ? `bg-slate-800 border-slate-800 text-white scale-110 shadow-lg` 
                    : `bg-white border-slate-100 text-slate-400 hover:scale-105 hover:${item.color}`
                }`}
                title={item.label}
                type="button"
              >
                <item.icon className={`h-8 w-8 ${mood === item.value ? "text-white" : "currentColor"}`} />
              </button>
            ))}
          </div>

          {/* Campo de Texto */}
          <div className="space-y-3">
            <Label htmlFor="note" className="text-slate-700 font-medium text-base">
              O que aconteceu hoje? <span className="text-slate-400 font-normal text-sm">(Opcional)</span>
            </Label>
            <Textarea 
              id="note"
              placeholder="Escreva aqui sobre seu dia, pensamentos ou sentimentos..."
              className="min-h-[140px] resize-none border-slate-200 focus:border-blue-500 focus:ring-blue-100 bg-slate-50/30 text-base"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

        </CardContent>
        <CardFooter className="pb-8">
          <Button 
            className="w-full h-14 text-lg font-semibold bg-teal-600 hover:bg-teal-700 text-white shadow-lg shadow-teal-100 rounded-xl transition-all"
            onClick={handleSubmit}
            disabled={mood === null}
          >
            Registrar
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
