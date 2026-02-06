'use client'

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { differenceInDays } from "date-fns"
import { Button } from "@/components/ui/button"
import { Clock, Sparkles, AlertTriangle, CreditCard } from "lucide-react"
import { createClient } from "@/lib/client"

interface TrialBannerProps {
  createdAt: string | Date
  planName?: string
}

export function TrialBanner({ createdAt, planName: initialPlan }: TrialBannerProps) {
  const [planName, setPlanName] = useState(initialPlan || "Profissional")
  const router = useRouter()

  useEffect(() => {
    const fetchPlan = async () => {
      if (initialPlan) return

      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        const { data } = await supabase
          .from('admin_users_view')
          .select('selected_plan')
          .eq('id', user.id)
          .single()
        if (data?.selected_plan) setPlanName(data.selected_plan)
      }
    }
    fetchPlan()
  }, [initialPlan])

  const start = new Date(createdAt)
  const now = new Date()
  const daysUsed = Math.abs(differenceInDays(now, start))
  const remainingDays = Math.max(0, 30 - daysUsed)
  const progressPercentage = Math.min(100, Math.max(0, (daysUsed / 30) * 100))

  // Se o período de teste acabou, não exibe este banner (provavelmente haverá um bloqueio ou outro banner)
  if (remainingDays <= 0) return null

  const isUrgent = remainingDays < 5

  const handleUpgrade = () => {
    // 1. Garantimos que o plano que ele está testando esteja no localStorage
    localStorage.setItem('selectedPlan', planName)
    // Caso ele queira mudar o plano antes de pagar, ele pode voltar na /planos
    router.push('/checkout')
  }

  return (
    <div className={`w-full p-4 flex flex-col gap-3 text-white shadow-md transition-all duration-500 ${
      isUrgent 
        ? 'bg-red-600' 
        : 'bg-gradient-to-r from-orange-500 to-red-500'
    }`}>
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 text-center sm:text-left">
          <div className={`p-2 rounded-full bg-white/20 ${isUrgent ? 'animate-pulse' : ''}`}>
            {isUrgent ? <AlertTriangle className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}
          </div>
          <div>
            <p className="text-sm font-medium">
              {isUrgent 
                ? "Seu acesso às funcionalidades premium expirará em breve. Assine para não perder seus dados!"
                : <>Você está testando o <strong>Plano {planName}</strong>. Restam <strong>{remainingDays}</strong> dias de acesso gratuito.</>
              }
            </p>
          </div>
        </div>
        
        <Button 
          variant="secondary" 
          size="sm" 
          className={`font-semibold shadow-lg hover:bg-white/90 border-0 whitespace-nowrap ${isUrgent ? 'text-red-600 animate-pulse' : 'text-orange-600'}`} 
          onClick={handleUpgrade}
        >
          <CreditCard className="mr-2 h-4 w-4" /> Assinar Agora
        </Button>
      </div>

      {/* Barra de Progresso Visual */}
      <div className="w-full h-1 bg-black/20 rounded-full overflow-hidden">
        <div 
          className="h-full bg-white/90 transition-all duration-1000 ease-out rounded-full" 
          style={{ width: `${progressPercentage}%` }} 
        />
      </div>
    </div>
  )
}