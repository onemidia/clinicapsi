'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@/lib/client'
import { Search, Link as LinkIcon, MessageCircle, Loader2, Smartphone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"

export default function PortalManagementPage() {
  const [patients, setPatients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const supabase = createClient()
  const { toast } = useToast()

  const fetchPatients = async () => {
    setLoading(true)
    try {
      // Busca usando os nomes REAIS das colunas: 'phone' em vez de 'whatsapp'
      const { data: pData } = await supabase.from('patients').select('id, full_name, phone')
      const { data: sData } = await supabase.from('portal_settings').select('*')

      if (pData) {
        const normalized = pData.map(p => ({
          ...p,
          portal_settings: sData?.find(s => s.patient_id === p.id) || { active: false, journal: false, financials: false, documents: false }
        }))
        setPatients(normalized)
      }
    } catch (err) {
      console.error('Erro ao carregar:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchPatients() }, [])

  const updatePortalConfig = async (patientId: string, key: string, value: boolean) => {
    const patient = patients.find(p => p.id === patientId)
    const newSettings = { ...patient.portal_settings, [key]: value, patient_id: patientId }
    delete newSettings.id 

    const { error } = await supabase.from('portal_settings').upsert(newSettings, { onConflict: 'patient_id' })

    if (!error) {
      setPatients(prev => prev.map(p => p.id === patientId ? { ...p, portal_settings: newSettings } : p))
      toast({ title: "Configuração salva!" })
    } else {
      toast({ variant: "destructive", title: "Erro ao salvar", description: error.message })
    }
  }

  const filteredPatients = patients.filter(p => p.full_name?.toLowerCase().includes(searchTerm.toLowerCase()))

  return (
    <div className="p-6 space-y-6 bg-slate-50/50 min-h-screen">
      <div className="flex items-center gap-3">
        <Smartphone className="text-blue-600" size={32} />
        <h1 className="text-3xl font-bold text-slate-900">Portal do Cliente</h1>
      </div>

      <Card className="border-none shadow-sm bg-white">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg text-slate-700">Controle de Acessos</CardTitle>
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Buscar paciente..." 
              className="pl-9 bg-slate-50 border-none" 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="font-bold">Paciente</TableHead>
                <TableHead className="text-center">Ativar Portal</TableHead>
                <TableHead className="text-center">Diário de Emoções</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={4} className="text-center py-10"><Loader2 className="animate-spin inline mr-2"/> Carregando...</TableCell></TableRow>
              ) : filteredPatients.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="text-center py-10 text-slate-500">Nenhum paciente encontrado.</TableCell></TableRow>
              ) : (
                filteredPatients.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.full_name}</TableCell>
                    <TableCell className="text-center">
                      <Switch checked={p.portal_settings?.active} onCheckedChange={(v) => updatePortalConfig(p.id, 'active', v)} />
                    </TableCell>
                    <TableCell className="text-center">
                      <Switch 
                        checked={p.portal_settings?.journal} 
                        onCheckedChange={(v) => updatePortalConfig(p.id, 'journal', v)} 
                        disabled={!p.portal_settings?.active} 
                      />
                    </TableCell>
                    <TableCell className="text-right flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/portal/${p.id}`)
                        toast({ title: "Link Copiado!" })
                      }}><LinkIcon size={16} /></Button>
                      <Button size="sm" className="bg-green-500 text-white" onClick={() => {
                        const link = `${window.location.origin}/portal/${p.id}`
                        const msg = encodeURIComponent(`Olá ${p.full_name.split(' ')[0]}, aqui está seu link do Portal: ${link}`)
                        window.open(`https://wa.me/${p.phone?.replace(/\D/g, '')}?text=${msg}`, '_blank')
                      }}><MessageCircle size={16} /></Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}