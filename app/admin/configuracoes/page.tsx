'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/client'
import { Save, Loader2, ShieldCheck, WhatsappIcon, CreditCard, MessageSquare } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"

export default function SaasSettings() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()
  const supabase = createClient()

  const [settings, setSettings] = useState({
    whatsapp_suporte: '',
    valor_plano_professional: '49.90',
    email_contato: '',
  })

  useEffect(() => {
    async function fetchSettings() {
      const { data } = await supabase.from('global_settings').select('*').single()
      if (data) {
        setSettings({
          whatsapp_suporte: data.whatsapp || '',
          valor_plano_professional: data.plan_professional || '49.90',
          email_contato: data.support_email || '',
        })
      }
      setLoading(false)
    }
    fetchSettings()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    const { error } = await supabase.from('global_settings').upsert({
      id: 1, // ID fixo para garantir que só exista uma linha de configuração
      whatsapp: settings.whatsapp_suporte,
      plan_professional: settings.valor_plano_professional,
      support_email: settings.email_contato
    })

    if (!error) {
      toast({ title: "Sucesso!", description: "Configurações do SaaS atualizadas." })
    }
    setSaving(false)
  }

  if (loading) return <div className="p-10 text-center"><Loader2 className="animate-spin inline mr-2"/> Carregando configurações...</div>

  return (
    <div className="p-6 space-y-8 bg-slate-50/50 min-h-screen">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Configurações do SaaS</h1>
        <p className="text-slate-500">Gerencie as regras de negócio e suporte da plataforma MentePsi.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Card de Preços */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-600">
              <CreditCard className="h-5 w-5" /> Valores dos Planos
            </CardTitle>
            <CardDescription>Defina quanto os psicólogos pagarão mensalmente.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Valor Plano Professional (R$)</Label>
              <Input 
                type="number" 
                value={settings.valor_plano_professional}
                onChange={(e) => setSettings({...settings, valor_plano_professional: e.target.value})}
              />
            </div>
          </CardContent>
        </Card>

        {/* Card de Suporte */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <MessageSquare className="h-5 w-5" /> Canais de Suporte
            </CardTitle>
            <CardDescription>Para onde os usuários serão enviados em caso de dúvidas.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>WhatsApp de Suporte (com DDD)</Label>
              <Input 
                placeholder="Ex: 5511999999999"
                value={settings.whatsapp_suporte}
                onChange={(e) => setSettings({...settings, whatsapp_suporte: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>E-mail de Contato</Label>
              <Input 
                type="email"
                value={settings.email_contato}
                onChange={(e) => setSettings({...settings, email_contato: e.target.value})}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white px-8">
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Salvar Configurações
        </Button>
      </div>
    </div>
  )
}