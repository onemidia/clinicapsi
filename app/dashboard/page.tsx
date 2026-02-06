'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/client'
import { 
  Calendar, 
  AlertTriangle, 
  FileText, 
  DollarSign, 
  ArrowRight, 
  MessageCircle, 
  Clock,
  Play,
  Activity
} from "lucide-react"

import { TrialBanner } from "@/components/trial-banner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"

export default function PsychologistDashboard() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    sessionsToday: 0,
    crisisAlerts: 0,
    monthlyRevenue: 0,
    pendingRevenue: 0
  })
  const [attentionList, setAttentionList] = useState<any[]>([])
  const [agenda, setAgenda] = useState<any[]>([])
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const supabase = createClient()

    const fetchData = async () => {
      const now = new Date()
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
      const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59).toISOString()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString()
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()
      
      // Busca usuário logado
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      
      // Executa consultas em paralelo para performance
      const [
        sessionsRes,
        crisisRes,
        paymentsRes,
        pendingRes,
        attentionRes,
        agendaRes
      ] = await Promise.all([
        // 1. Sessões Hoje
        supabase.from('appointments')
          .select('*', { count: 'exact', head: true })
          .gte('start_time', startOfDay)
          .lte('start_time', endOfDay)
          .neq('status', 'cancelled'),
        
        // 2. Alertas de Crise
        supabase.from('emotion_journal')
          .select('patient_id')
          .lte('mood_score', 2)
          .gte('created_at', yesterday),

        // 3. Faturamento Mensal
        supabase.from('appointments')
          .select('amount_paid')
          .gt('amount_paid', 0) // Soma tudo que entrou, inclusive parciais
          .gte('start_time', startOfMonth)
          .lte('start_time', endOfMonth),

        // 4. A Receber
        supabase.from('appointments')
          .select('price, amount_paid')
          .eq('status', 'confirmed') // Sessões confirmadas
          .gte('start_time', startOfMonth)
          .lte('start_time', endOfMonth),

        // 5. Lista de Bem-estar
        supabase.from('emotion_journal')
          .select(`id, mood_score, notes, created_at, patients (id, full_name, phone)`)
          .order('created_at', { ascending: false })
          .limit(5),

        // 6. Agenda do Dia
        supabase.from('appointments')
          .select(`*, patients (id, full_name)`)
          .gte('start_time', now.toISOString())
          .order('start_time', { ascending: true })
          .limit(5)
      ])

      const uniqueCrisisPatients = new Set(crisisRes.data?.map((d: any) => d.patient_id)).size
      
      const monthlyRevenue = paymentsRes.data?.reduce((acc: number, curr: any) => acc + (Number(curr.amount_paid) || 0), 0) || 0

      const pendingRevenue = pendingRes.data?.reduce((acc: number, curr: any) => acc + ((Number(curr.price) || 0) - (Number(curr.amount_paid) || 0)), 0) || 0

      setStats({
        sessionsToday: sessionsRes.count || 0,
        crisisAlerts: uniqueCrisisPatients,
        monthlyRevenue,
        pendingRevenue
      })

      const formattedAttention = attentionRes.data?.map((item: any) => ({
        id: item.id, // ID do registro
        patientId: item.patients?.id,
        name: item.patients?.full_name,
        mood: Number(item.mood_score),
        note: item.notes,
        time: new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        whatsapp: item.patients?.phone
      })) || []
      setAttentionList(formattedAttention)

      const formattedAgenda = agendaRes.data?.map((item: any) => {
        const dateObj = new Date(item.start_time)
        const isToday = new Date().toDateString() === dateObj.toDateString()
        return {
          id: item.id,
          patientId: item.patients?.id,
          name: item.patients?.full_name,
          time: isToday ? dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : `${dateObj.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} ${dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`,
          type: item.modality || item.type || 'Sessão',
          status: item.status
        }
      }) || []
      setAgenda(formattedAgenda)

      setLoading(false)
    }

    fetchData()

    // Canal de Escuta: Ouve mudanças na tabela 'appointments'
    const channel = supabase
      .channel('dashboard-appointments-channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'appointments' },
        (payload) => {
          console.log('Mudança na agenda detectada, atualizando dashboard...', payload)
          // Atualização Reativa: Dispara a busca de dados novamente
          fetchData()
        }
      )
      .subscribe()

    // Limpeza: Remove a inscrição do canal quando o componente é desmontado
    return () => {
      supabase.removeChannel(channel)
    }
  }, []) // A dependência vazia [] garante que isso rode apenas na montagem e desmontagem

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Skeleton className="h-96 lg:col-span-2 rounded-xl" />
          <Skeleton className="h-96 rounded-xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 space-y-8">
      
      {/* Banner de Teste Grátis (Full Width) */}
      {user && (
        <div className="-mx-6 -mt-6">
          <TrialBanner createdAt={user.created_at} />
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900 tracking-tight">Visão Geral</h1>
          <p className="text-slate-500">Resumo clínico e administrativo do dia.</p>
        </div>
        <div className="text-sm text-slate-500 bg-white px-4 py-2 rounded-full shadow-sm border border-slate-100">
          {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </div>
      </div>

      {/* 1. Widgets Superiores (KPIs) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Sessões Hoje</CardTitle>
            <Calendar className="h-4 w-4 text-teal-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{stats.sessionsToday}</div>
            <p className="text-xs text-slate-500 mt-1">Agendadas para hoje</p>
          </CardContent>
        </Card>

        <Card className="border-red-100 bg-red-50/30 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-700">Alertas de Crise</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-700">{stats.crisisAlerts}</div>
            <p className="text-xs text-red-600/80 mt-1">Humor baixo (últimas 24h)</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">A Receber (Mês)</CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">R$ {stats.pendingRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
            <p className="text-xs text-slate-500 mt-1">Pagamentos pendentes</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Faturamento Mensal</CardTitle>
            <DollarSign className="h-4 w-4 text-teal-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">R$ {stats.monthlyRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
            <p className="text-xs text-slate-500 mt-1">Recebido este mês</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* 2. Painel de 'Alertas de Bem-estar' */}
        <Card className="lg:col-span-2 border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-800">
              <Activity className="h-5 w-5 text-teal-600" /> Alertas de Bem-estar
            </CardTitle>
            <CardDescription>Últimos registros do diário de emoções dos pacientes.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {attentionList.length === 0 ? (
              <div className="text-center py-8 text-slate-500">Nenhum registro recente.</div>
            ) : (
              attentionList.map((item) => {
                const isCrisis = item.mood <= 2
                return (
                  <div key={item.id} className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-lg border transition-colors shadow-sm ${isCrisis ? 'bg-red-50 border-red-100' : 'bg-white border-slate-100'}`}>
                    <div className="flex items-start gap-4 mb-4 sm:mb-0">
                      <Avatar className={`h-10 w-10 border-2 ${isCrisis ? 'border-red-200' : 'border-slate-100'}`}>
                        <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${item.name}`} />
                        <AvatarFallback>{item.name?.substring(0, 2)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className={`font-semibold ${isCrisis ? 'text-red-900' : 'text-slate-900'}`}>{item.name}</h4>
                          <Badge variant="outline" className={`${isCrisis ? 'bg-red-100 text-red-700 border-red-200' : 'bg-slate-100 text-slate-700 border-slate-200'} text-xs`}>
                            Humor: {item.mood}/5
                          </Badge>
                        </div>
                        <p className={`text-sm mt-1 line-clamp-1 ${isCrisis ? 'text-red-700' : 'text-slate-600'}`}>"{item.note || 'Sem anotações'}"</p>
                        <span className={`text-xs mt-1 block flex items-center gap-1 ${isCrisis ? 'text-red-500' : 'text-slate-400'}`}>
                          <Clock className="h-3 w-3" /> {item.time}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                      <Button variant="outline" size="sm" className={`flex-1 sm:flex-none ${isCrisis ? 'text-red-700 border-red-200 hover:bg-red-100' : 'text-slate-600'}`} asChild>
                        <Link href={`/pacientes/${item.patientId}`}>Ver Prontuário</Link>
                      </Button>
                      {item.whatsapp && (
                        <Button size="sm" className={`flex-1 sm:flex-none ${isCrisis ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'} text-white`} asChild>
                          <a href={`https://wa.me/${item.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer">
                            <MessageCircle className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </CardContent>
        </Card>

        {/* 3. Agenda Resumida do Dia */}
        <Card className="border-slate-200 shadow-sm h-fit">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-800">
              <Calendar className="h-5 w-5 text-teal-600" /> Próximos Atendimentos
            </CardTitle>
            <CardDescription>Sua agenda para hoje.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {agenda.length === 0 ? (
              <div className="text-center py-8 text-slate-500">Sem mais atendimentos hoje.</div>
            ) : (
              agenda.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col items-center justify-center bg-white h-10 w-10 rounded border border-slate-200 shadow-sm">
                      <span className="text-xs font-bold text-slate-700">{item.time}</span>
                    </div>
                    <div>
                      <p className="font-medium text-sm text-slate-900">{item.name}</p>
                      <p className="text-xs text-slate-500">{item.type}</p>
                    </div>
                  </div>
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-teal-600 hover:text-teal-700 hover:bg-teal-50" asChild>
                    <Link href={`/pacientes/${item.patientId}`}>
                      <Play className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              ))
            )}
          </CardContent>
          <CardFooter className="border-t border-slate-100 pt-4">
            <Button variant="ghost" className="w-full text-slate-600 hover:text-teal-600" asChild>
              <Link href="/agenda">Ver Agenda Completa <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </CardFooter>
        </Card>

      </div>
    </div>
  )
}