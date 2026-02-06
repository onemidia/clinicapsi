'use client'

import React, { useState } from 'react'
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
import { Plus, Loader2 } from "lucide-react"
import { createClient } from '@/lib/client'
import { useToast } from "@/hooks/use-toast"

export function NewPatientModal() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    cpf: '',
    address: '',
    profession: '',
    emergency_contact: '',
    observations: '',
    session_value: '',
    status: 'Ativo'
  })

  // Máscaras de Input
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '')
    value = value.replace(/^(\d{2})(\d)/g, '($1) $2')
    value = value.replace(/(\d)(\d{4})$/, '$1-$2')
    setFormData({ ...formData, phone: value.slice(0, 15) })
  }

  const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '')
    value = value.replace(/(\d{3})(\d)/, '$1.$2')
    value = value.replace(/(\d{3})(\d)/, '$1.$2')
    value = value.replace(/(\d{3})(\d{1,2})/, '$1-$2')
    setFormData({ ...formData, cpf: value.slice(0, 14) })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    // Sanitização: Converte string vazia em null para campos numéricos/opcionais
    const payload = {
      ...formData,
      session_value: formData.session_value === '' ? null : formData.session_value
    }
    console.log("Enviando dados do paciente:", payload)
    
    const supabase = createClient()
    const { error } = await supabase.from('patients').insert([payload])

    if (error) {
      console.error("Erro detalhado:", JSON.stringify(error, null, 2))
      toast({
        variant: "destructive",
        title: "Erro ao criar paciente",
        description: error.message
      })
    } else {
      console.log("Paciente salvo com sucesso!")
      toast({
        title: "Paciente criado!",
        description: `${formData.full_name} foi adicionado com sucesso.`
      })
      setOpen(false)
      setFormData({
        full_name: '', email: '', phone: '', cpf: '', address: '', 
        profession: '', emergency_contact: '', observations: '',
        session_value: '', status: 'Ativo'
      })
    }
    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-teal-600 hover:bg-teal-700 text-white shadow-sm">
          <Plus className="mr-2 h-4 w-4" /> Novo Paciente
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo Paciente</DialogTitle>
          <DialogDescription>
            Preencha os dados completos para o prontuário.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 col-span-2">
              <Label htmlFor="name">Nome Completo *</Label>
              <Input id="name" required value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="cpf">CPF</Label>
              <Input id="cpf" placeholder="000.000.000-00" value={formData.cpf} onChange={handleCPFChange} />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone / WhatsApp</Label>
              <Input id="phone" placeholder="(00) 00000-0000" value={formData.phone} onChange={handlePhoneChange} />
            </div>

            <div className="space-y-2 col-span-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
            </div>

            <div className="space-y-2 col-span-2">
              <Label htmlFor="address">Endereço Completo</Label>
              <Input id="address" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="profession">Profissão</Label>
              <Input id="profession" value={formData.profession} onChange={e => setFormData({...formData, profession: e.target.value})} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="emergency">Contato de Emergência</Label>
              <Input id="emergency" placeholder="Nome e Telefone" value={formData.emergency_contact} onChange={e => setFormData({...formData, emergency_contact: e.target.value})} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="session_value">Valor da Sessão (R$)</Label>
              <Input id="session_value" type="number" placeholder="0.00" value={formData.session_value} onChange={e => setFormData({...formData, session_value: e.target.value})} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(val) => setFormData({...formData, status: val})}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Ativo">Ativo</SelectItem>
                  <SelectItem value="Inativo">Inativo</SelectItem>
                  <SelectItem value="Alta">Alta</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 col-span-2">
              <Label htmlFor="obs">Observações Iniciais</Label>
              <Textarea id="obs" value={formData.observations} onChange={e => setFormData({...formData, observations: e.target.value})} />
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button type="submit" disabled={loading} className="bg-teal-600 hover:bg-teal-700 text-white">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar Paciente
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}