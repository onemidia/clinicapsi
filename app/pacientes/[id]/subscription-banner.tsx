'use client'

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Rocket, Lock, Clock } from "lucide-react"
import Link from "next/link"
import { SubscriptionStatus } from "@/hooks/use-subscription"

export function SubscriptionBanner({ status }: { status: SubscriptionStatus }) {
  if (status.loading) return null
  
  // Caso 1: Trial Ativo
  if (status.isTrialActive) {
    return (
      <Alert className="rounded-none border-x-0 border-t-0 border-b border-blue-200 bg-blue-50/80 text-blue-900 flex items-center justify-between py-2 px-6">
        <div className="flex items-center gap-3">
          <Clock className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-sm font-medium">
            Seu período de teste completo termina em <span className="font-bold">{status.daysRemaining} dias</span>. Aproveite todas as funcionalidades Premium.
          </AlertDescription>
        </div>
        <Button size="sm" variant="outline" className="h-7 text-xs border-blue-300 text-blue-700 hover:bg-blue-100" asChild>
          <Link href="/settings/billing">Fazer Upgrade agora</Link>
        </Button>
      </Alert>
    )
  }

  // Caso 2: Trial Expirado e Plano Free
  if (status.isFreePlan) {
    return (
      <Alert className="rounded-none border-x-0 border-t-0 border-b border-amber-200 bg-amber-50/80 text-amber-900 flex items-center justify-between py-2 px-6">
        <div className="flex items-center gap-3">
          <Lock className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-sm font-medium">
            Você está no <strong>Plano Free</strong> (Limite de 3 pacientes atingido: {status.patientCount}/3).
          </AlertDescription>
        </div>
        <Button size="sm" className="h-7 text-xs bg-amber-600 hover:bg-amber-700 text-white border-none" asChild>
          <Link href="/settings/billing"><Rocket className="mr-1 h-3 w-3" /> Liberar Recursos Pro</Link>
        </Button>
      </Alert>
    )
  }

  return null
}