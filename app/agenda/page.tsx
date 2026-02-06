'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/client'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import ptBrLocale from '@fullcalendar/core/locales/pt-br'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, Plus, Calendar as CalendarIcon, Video, MapPin, Link as LinkIcon } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

export default function AgendaClinicaPage() {
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [patients, setPatients] = useState<any[]>([])
  const supabase = createClient()
  const { toast } = useToast()

  // Estado do Formulário (Fiel ao print "Nova Consulta")
  const [formData, setFormData] = useState({
    patient_id: '',
    date: '',
    time: '',
    type: 'Individual',
    duration: '50',
    modality: 'Presencial',
    location: '',
    price: '0,00',
    payment_status: 'Pendente',
    observations: ''
  })

  const fetchInitialData = async () => {
    setLoading(true)
    const [aptRes, patRes] = await Promise.all([
      supabase.from('appointments').select('id, start_time, end_time, status, patients(full_name)'),
      supabase.from('patients').select('id, full_name').order('full_name')
    ])
    
    if (aptRes.data) {
      setEvents(aptRes.data.map(apt => ({
        id: apt.id,
        title: apt.patients?.full_name || 'Paciente',
        start: apt.start_time,
        end: apt.end_time,
        backgroundColor: '#14b8a6'
      })))
    }
    if (patRes.data) setPatients(patRes.data)
    setLoading(false)
  }

  useEffect(() => { fetchInitialData() }, [])

  useEffect(() => {
    if (open) {
      const now = new Date()
      setFormData(prev => ({
        ...prev,
        date: now.toISOString().split('T')[0],
        time: now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      }))
    }
  }, [open])

  const handleSchedule = async () => {
    setLoading(true)
    
    // Cria data local e converte para ISO (UTC) para salvar corretamente no banco
    const startDate = new Date(`${formData.date}T${formData.time}:00`)
    const start = startDate.toISOString()
    const end = new Date(startDate.getTime() + parseInt(formData.duration) * 60000).toISOString()

    const { error } = await supabase.from('appointments').insert([{
      patient_id: formData.patient_id,
      start_time: start,
      end_time: end,
      location: formData.location,
      price: parseFloat(formData.price.replace(',', '.')),
      amount_paid: formData.payment_status === 'Pago' ? parseFloat(formData.price.replace(',', '.')) : 0,
      payment_status: formData.payment_status,
      observations: formData.observations,
      status: 'Agendado'
    }])

    if (!error) {
      toast({ title: "Sucesso!", description: "Consulta agendada." })
      setOpen(false)
      fetchInitialData()
    } else {
      toast({ variant: "destructive", title: "Erro ao agendar", description: error.message })
      setLoading(false)
    }
  }

  return (
    <div className="p-6 space-y-6 bg-slate-50/50 min-h-screen">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border">
        <div className="flex items-center gap-3">
          <CalendarIcon className="h-6 w-6 text-teal-600" />
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Agenda Clínica</h1>
        </div>

        {/* DIALOG DO FORMULÁRIO (Print Nova Consulta) */}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-teal-600 hover:bg-teal-700 text-white shadow-sm"><Plus className="mr-2 h-4 w-4" /> Nova Consulta</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Nova Consulta</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Paciente *</Label>
                <Select onValueChange={(v) => setFormData({...formData, patient_id: v})}>
                  <SelectTrigger><SelectValue placeholder="Selecione o paciente" /></SelectTrigger>
                  <SelectContent>{patients.map(p => <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Data *</Label><Input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} /></div>
                <div className="space-y-2"><Label>Horário *</Label><Input type="time" value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Tipo de Sessão</Label>
                  <Select value={formData.type} onValueChange={v => setFormData({...formData, type: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Individual">Individual</SelectItem>
                      <SelectItem value="Casal">Casal</SelectItem>
                      <SelectItem value="Grupo">Grupo</SelectItem>
                      <SelectItem value="Família">Família</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>Duração (min)</Label>
                  <Select defaultValue="50" onValueChange={v => setFormData({...formData, duration: v})}><SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="50">50 minutos</SelectItem></SelectContent></Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Button 
                  type="button"
                  variant="outline" 
                  onClick={() => setFormData({...formData, modality: 'Presencial'})} 
                  className={`gap-2 h-11 border-2 ${formData.modality === 'Presencial' ? 'border-teal-500 bg-teal-50 text-teal-700' : 'border-slate-200 text-slate-600'}`}
                >
                  <MapPin size={18}/> Presencial
                </Button>
                <Button 
                  type="button"
                  variant="outline" 
                  onClick={() => setFormData({...formData, modality: 'Online'})} 
                  className={`gap-2 h-11 border-2 ${formData.modality === 'Online' ? 'border-teal-500 bg-teal-50 text-teal-700' : 'border-slate-200 text-slate-600'}`}
                >
                  <Video size={18}/> Online
                </Button>
              </div>
              <div className="space-y-2">
                <Label>{formData.modality === 'Online' ? 'Link da Reunião' : 'Sala / Local'}</Label>
                <div className="relative">
                  <Input 
                    placeholder={formData.modality === 'Online' ? 'Cole o link aqui...' : 'Ex: Sala 1'} 
                    value={formData.location}
                    onChange={e => setFormData({...formData, location: e.target.value})} 
                    className="pl-9"
                  />
                  <div className="absolute left-3 top-2.5 text-slate-400">
                    {formData.modality === 'Online' ? <LinkIcon size={16} /> : <MapPin size={16} />}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Valor (R$)</Label><Input value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} /></div>
                <div className="space-y-2"><Label>Pagamento</Label>
                  <Select defaultValue="Pendente" onValueChange={v => setFormData({...formData, payment_status: v})}><SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="Pendente">Pendente</SelectItem><SelectItem value="Pago">Pago</SelectItem></SelectContent></Select>
                </div>
              </div>
              <div className="space-y-2"><Label>Observações</Label><Textarea placeholder="Anotações sobre a consulta" onChange={e => setFormData({...formData, observations: e.target.value})} /></div>
              <div className="flex gap-2 pt-4">
                <Button variant="outline" className="flex-1" onClick={() => setOpen(false)}>Cancelar</Button>
                <Button 
                  className="flex-1 bg-teal-600 hover:bg-teal-700 text-white" 
                  onClick={handleSchedule} 
                  disabled={loading}
                >
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Agendar Consulta
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-none shadow-lg"><CardContent className="p-4 bg-white rounded-xl">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="timeGridWeek"
          locale={ptBrLocale}
          events={events}
          height="700px"
          headerToolbar={{ left: 'prev,next today', center: 'title', right: 'timeGridWeek,timeGridDay' }}
        />
      </CardContent></Card>
    </div>
  )
}