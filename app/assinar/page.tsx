'use client'

import React, { useRef, useState, useEffect, use } from 'react'
import SignatureCanvas from 'react-signature-canvas'
import { createClient } from '@/lib/client'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, CheckCircle } from "lucide-react"

export default function SignaturePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const sigCanvas = useRef<any>(null)
  const [doc, setDoc] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [signed, setSigned] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    async function getDoc() {
      const { data } = await supabase.from('patient_documents').select('*').eq('id', id).single()
      setDoc(data)
      setLoading(false)
    }
    getDoc()
  }, [id])

  const handleSave = async () => {
    if (sigCanvas.current.isEmpty()) return alert("Por favor, assine antes de enviar.")
    
    setSaving(true)
    const signatureImage = sigCanvas.current.getTrimmedCanvas().toDataURL('image/png')
    
    const { error } = await supabase.from('patient_documents').update({
      signature_data: signatureImage,
      status: 'Assinado',
      signed_at: new Date().toISOString()
    }).eq('id', id)

    if (!error) setSigned(true)
    setSaving(false)
  }

  if (loading) return <div className="p-10 text-center">Carregando documento...</div>
  if (signed) return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
      <Card className="text-center p-10"><CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4"/>
      <CardTitle>Documento Assinado com Sucesso!</CardTitle></Card>
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <Card className="max-w-2xl mx-auto shadow-xl bg-white">
        <CardHeader className="border-b"><CardTitle>{doc?.title}</CardTitle></CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap border p-4 bg-slate-50 rounded">
            {doc?.content}
          </div>
          
          <div className="space-y-2">
            <p className="font-bold text-slate-800">Assine no quadro abaixo:</p>
            <div className="border-2 border-dashed border-slate-300 rounded-lg bg-white">
              <SignatureCanvas 
                ref={sigCanvas}
                penColor='black'
                canvasProps={{width: 500, height: 200, className: 'w-full h-48 cursor-crosshair'}}
              />
            </div>
            <Button variant="ghost" size="sm" onClick={() => sigCanvas.current.clear()}>Limpar Desenho</Button>
          </div>

          <Button className="w-full h-14 text-lg bg-blue-600 hover:bg-blue-700 text-white" 
                  onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="animate-spin mr-2"/> : "Finalizar e Enviar Assinatura"}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}