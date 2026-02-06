'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/client'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check, Zap, Users, Star, Shield, AlertTriangle, CreditCard } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function PlanosPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [currentPlan, setCurrentPlan] = useState<string>('') 
  const [isTrial, setIsTrial] = useState(false)
  const [user, setUser] = useState<any>(null)
  const { toast } = useToast()

  useEffect(() => {
    const checkUser = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        setUser(user)
        // Verifica se está no período de trial (30 dias)
        const createdAt = new Date(user.created_at)
        const now = new Date()
        const diffTime = Math.abs(now.getTime() - createdAt.getTime())
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        
        if (diffDays <= 30) {
          setIsTrial(true)
        }
        
        // Busca o plano atual do usuário
        const { data: profile } = await supabase
          .from('admin_users_view')
          .select('selected_plan')
          .single()
        if (profile?.selected_plan) setCurrentPlan(profile.selected_plan)
      }
      setLoading(false)
    }
    checkUser()
  }, [])

  const handleCheckout = (planName: string) => {
    if (!user) {
      // Se NÃO estiver logado: Salva e redireciona para cadastro
      localStorage.setItem('selectedPlan', planName)
      router.push('/register')
    } else {
      // Se ESTIVER logado: Simula checkout
      toast({
          title: "Checkout Simulado",
          description: `Iniciando checkout para o plano ${planName}.`
      })
    }
  }

  const plans = [
    {
      name: 'Iniciante',
      price: 'R$ 0,00',
      description: 'Para quem está começando a clínica.',
      features: ['Até 3 Pacientes', 'Agenda Básica', 'Financeiro Básico'],
      highlight: false,
      icon: Users
    },
    {
      name: 'Básico',
      price: 'R$ 29,90',
      description: 'Essencial para o dia a dia.',
      features: ['Até 10 Pacientes', 'Agendamento Avançado', 'Financeiro Completo', 'Gestão de Documentos'],
      highlight: true,
      icon: Zap
    },
    {
      name: 'Profissional',
      price: 'R$ 59,90',
      description: 'A suíte completa sem limites.',
      features: ['Pacientes Ilimitados', 'Relatórios com IA', 'Lembretes WhatsApp', 'Portal do Paciente'],
      highlight: false,
      icon: Star
    }
  ]

  return (
    <div className="p-6 space-y-8 bg-slate-50/50 min-h-screen">
        {/* Header */}
        <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-semibold text-slate-900 tracking-tight">Planos e Assinatura</h1>
            <p className="text-slate-500">Escolha o plano ideal para o seu momento profissional.</p>
        </div>

        {/* Aviso de Trial */}
        {isTrial && (
            <div className="bg-orange-50 border border-orange-200 text-orange-800 p-4 rounded-lg flex items-center gap-3 shadow-sm">
                <div className="bg-orange-100 p-2 rounded-full">
                    <AlertTriangle className="h-5 w-5 text-orange-600" />
                </div>
                <p className="text-sm font-medium">
                    Você está no período de teste grátis. Escolha um plano agora para garantir que não perderá o acesso aos recursos premium.
                </p>
            </div>
        )}

        {/* Cards de Planos */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto pt-4">
            {plans.map((plan) => (
                <Card key={plan.name} className={`relative flex flex-col transition-all duration-300 ${plan.highlight ? 'border-teal-500 shadow-xl scale-105 z-10 ring-1 ring-teal-500/20' : 'border-slate-200 shadow-sm hover:shadow-md'}`}>
                    {plan.highlight && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-teal-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide shadow-sm">
                            Mais Popular
                        </div>
                    )}
                    <CardHeader>
                        <div className="flex justify-between items-start">
                            <div>
                                <CardTitle className="text-xl font-bold text-slate-900">{plan.name}</CardTitle>
                                <CardDescription className="mt-1">{plan.description}</CardDescription>
                            </div>
                            <div className={`p-2 rounded-lg ${plan.highlight ? 'bg-teal-50 text-teal-600' : 'bg-slate-100 text-slate-500'}`}>
                                <plan.icon className="h-5 w-5" />
                            </div>
                        </div>
                        <div className="mt-4">
                            <span className="text-3xl font-bold text-slate-900">{plan.price}</span>
                            <span className="text-slate-500 text-sm font-normal">/mês</span>
                        </div>
                    </CardHeader>
                    <CardContent className="flex-1">
                        <ul className="space-y-3">
                            {plan.features.map((feature, i) => (
                                <li key={i} className="flex items-center gap-3 text-sm text-slate-600">
                                    <Check className={`h-4 w-4 ${plan.highlight ? 'text-teal-500' : 'text-slate-400'}`} />
                                    {feature}
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                    <CardFooter>
                        <Button 
                            className={`w-full h-11 font-medium ${
                                currentPlan === plan.name 
                                ? 'bg-slate-100 text-slate-400 hover:bg-slate-100 cursor-default border border-slate-200' 
                                : plan.highlight 
                                    ? 'bg-teal-600 hover:bg-teal-700 text-white shadow-md shadow-teal-200' 
                                    : 'bg-slate-900 hover:bg-slate-800 text-white'
                            }`}
                            onClick={() => currentPlan !== plan.name && handleCheckout(plan.name)}
                            disabled={currentPlan === plan.name}
                        >
                            {currentPlan === plan.name ? 'Plano Atual' : 'Assinar Agora'}
                        </Button>
                    </CardFooter>
                </Card>
            ))}
        </div>
        
        <div className="text-center text-sm text-slate-500 pt-8 pb-4">
            <p className="flex items-center justify-center gap-2">
                <Shield className="h-4 w-4 text-teal-600" /> Pagamento seguro e criptografado. Cancele quando quiser.
            </p>
        </div>
    </div>
  )
}
