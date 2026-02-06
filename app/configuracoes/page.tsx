'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/client'
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, Save } from 'lucide-react'

// Define the type for the profile data
type ProfileData = {
  id: string;
  full_name: string;
  crp: string;
  specialty: string;
  phone: string;
  default_session_value: number;
  default_session_duration: number;
  clinic_name: string;
  address: string;
  city: string;
  state: string;
  work_hours_start: string;
  work_hours_end: string;
  whatsapp_reminders_enabled: boolean;
  reminder_lead_time: number;
  reminder_template: string;
}

const initialProfileState: Partial<ProfileData> = {
  full_name: '',
  crp: '',
  specialty: '',
  phone: '',
  default_session_value: 0,
  default_session_duration: 50,
  clinic_name: '',
  address: '',
  city: '',
  state: '',
  work_hours_start: '08:00',
  work_hours_end: '18:00',
  whatsapp_reminders_enabled: true,
  reminder_lead_time: 24,
  reminder_template: 'Olá, {paciente}! Este é um lembrete da sua sessão agendada para {data} às {horario}.',
};

export default function SettingsPage() {
  const [profile, setProfile] = useState(initialProfileState);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const supabase = createClient();

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      // Fallback de Segurança para ambiente de teste
      const FALLBACK_USER_ID = 'e52b9d70-7e30-4b5e-8b8a-9f8c7d6e5f4a';
      const userId = user?.id || FALLBACK_USER_ID;

      if (userId) {
        const { data, error } = await supabase
          .from('professional_profile')
          .select('*')
          .eq('id', userId)
          .single();
        
        if (data) {
          setProfile(data);
        } else if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
          toast({ variant: 'destructive', title: 'Erro ao carregar perfil', description: error.message });
        }
      }
      setLoading(false);
    };
    fetchProfile();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setProfile(prev => ({ ...prev, [id]: value }));
  };

  const handleSelectChange = (id: string, value: string | number) => {
    setProfile(prev => ({ ...prev, [id]: value }));
  };
  
  const handleSwitchChange = (id: string, checked: boolean) => {
    setProfile(prev => ({ ...prev, [id]: checked }));
  };

  const handleSave = async () => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    // Fallback de Segurança: Se o usuário for nulo, usa o UUID manual da Dra. Aline
    const FALLBACK_USER_ID = 'e52b9d70-7e30-4b5e-8b8a-9f8c7d6e5f4a';
    const userId = user?.id || FALLBACK_USER_ID;

    const formData = {
      id: userId, // Garante que o ID seja o do usuário logado ou o fallback
      full_name: profile.full_name,
      crp: profile.crp,
      specialty: profile.specialty,
      phone: profile.phone,
      default_session_value: Number(profile.default_session_value) || 0,
      default_session_duration: Number(profile.default_session_duration) || 50,
      clinic_name: profile.clinic_name,
      address: profile.address,
      city: profile.city,
      state: profile.state,
      work_hours_start: profile.work_hours_start,
      work_hours_end: profile.work_hours_end,
      whatsapp_reminders_enabled: profile.whatsapp_reminders_enabled,
      reminder_lead_time: Number(profile.reminder_lead_time) || 24,
      reminder_template: profile.reminder_template,
    };

    const { error } = await supabase.from('professional_profile').upsert(formData);

    if (error) {
      console.error('Erro ao salvar:', error);
      toast({ variant: 'destructive', title: 'Erro ao salvar', description: error.message });
    } else {
      toast({ title: 'Sucesso!', description: 'Alterações salvas com sucesso.' });
    }
    setSaving(false);
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Configurações</h1>
          <p className="text-slate-500">Gerencie seu perfil profissional, consultório e automações.</p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="bg-teal-600 hover:bg-teal-700 text-white">
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Salvar Alterações
        </Button>
      </div>

      <Tabs defaultValue="perfil" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="perfil">Perfil</TabsTrigger>
          <TabsTrigger value="consultorio">Consultório</TabsTrigger>
          <TabsTrigger value="lembretes">Lembretes</TabsTrigger>
          <TabsTrigger value="plano">Plano</TabsTrigger>
        </TabsList>

        <TabsContent value="perfil">
          <Card>
            <CardHeader>
              <CardTitle>Perfil Profissional</CardTitle>
              <CardDescription>Informações que aparecerão em seus documentos e relatórios.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Nome Profissional</Label>
                  <Input id="full_name" value={profile.full_name || ''} onChange={handleInputChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="crp">CRP</Label>
                  <Input id="crp" value={profile.crp || ''} onChange={handleInputChange} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="specialty">Especialidade</Label>
                <Input id="specialty" placeholder="Ex: Psicologia Clínica, Terapia Cognitivo-Comportamental" value={profile.specialty || ''} onChange={handleInputChange} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone/WhatsApp</Label>
                  <Input id="phone" type="tel" value={profile.phone || ''} onChange={handleInputChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="default_session_value">Valor Padrão da Sessão (R$)</Label>
                  <Input id="default_session_value" type="number" value={profile.default_session_value || 0} onChange={handleInputChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="default_session_duration">Duração Padrão (min)</Label>
                  <Input id="default_session_duration" type="number" value={profile.default_session_duration || 50} onChange={handleInputChange} />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="consultorio">
          <Card>
            <CardHeader>
              <CardTitle>Dados do Consultório</CardTitle>
              <CardDescription>Informações sobre o local de atendimento.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="clinic_name">Nome da Clínica</Label>
                <Input id="clinic_name" value={profile.clinic_name || ''} onChange={handleInputChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Endereço</Label>
                <Input id="address" value={profile.address || ''} onChange={handleInputChange} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="city">Cidade</Label>
                  <Input id="city" value={profile.city || ''} onChange={handleInputChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">Estado</Label>
                  <Input id="state" value={profile.state || ''} onChange={handleInputChange} />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="work_hours_start">Horário de Início</Label>
                  <Input id="work_hours_start" type="time" value={profile.work_hours_start || '08:00'} onChange={handleInputChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="work_hours_end">Horário de Término</Label>
                  <Input id="work_hours_end" type="time" value={profile.work_hours_end || '18:00'} onChange={handleInputChange} />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="lembretes">
          <Card>
            <CardHeader>
              <CardTitle>Lembretes Automáticos</CardTitle>
              <CardDescription>Configure o envio de mensagens via WhatsApp para seus pacientes.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center space-x-2">
                <Switch 
                  id="whatsapp_reminders_enabled" 
                  checked={profile.whatsapp_reminders_enabled} 
                  onCheckedChange={(checked) => handleSwitchChange('whatsapp_reminders_enabled', checked)}
                />
                <Label htmlFor="whatsapp_reminders_enabled">Ativar lembretes automáticos via WhatsApp</Label>
              </div>
              <div className="space-y-2">
                <Label htmlFor="reminder_lead_time">Enviar com antecedência de</Label>
                <Select 
                  value={String(profile.reminder_lead_time || 24)} 
                  onValueChange={(value) => handleSelectChange('reminder_lead_time', Number(value))}
                >
                  <SelectTrigger className="w-[280px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="24">2 horas</SelectItem>
                    <SelectItem value="48">6 horas</SelectItem>
                    <SelectItem value="72">12 horas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="reminder_template">Modelo da Mensagem</Label>
                <Textarea 
                  id="reminder_template" 
                  value={profile.reminder_template || ''} 
                  onChange={handleInputChange}
                  className="min-h-[150px]"
                />
                <p className="text-xs text-slate-500">
                  Use as tags: <code className="bg-slate-100 px-1 rounded">{'{paciente}'}</code>, <code className="bg-slate-100 px-1 rounded">{'{data}'}</code>, <code className="bg-slate-100 px-1 rounded">{'{horario}'}</code>.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="plano">
          <Card>
            <CardHeader>
              <CardTitle>Seu Plano</CardTitle>
              <CardDescription>Informações sobre sua assinatura MentePsi.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600">Detalhes do plano em construção.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}