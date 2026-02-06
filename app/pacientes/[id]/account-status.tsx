'use client'

import React from 'react'
import Link from 'next/link'
import { useSubscription } from '@/hooks/use-subscription'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Zap, Lock, Crown } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

export function AccountStatus() {
  const {
    isTrialActive,
    daysRemaining,
    isFreePlan,
    patientCount,
    loading
  } = useSubscription()

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <Skeleton className="h-4 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-2 w-full mb-4" />
          <Skeleton className="h-9 w-full" />
        </CardContent>
      </Card>
    )
  }

  // 1. Trial Ativo: Mostra progresso dos dias
  if (isTrialActive) {
    const daysUsed = 15 - daysRemaining
    const progress = (daysUsed / 15) * 100

    return (
      <Card className="border-blue-100 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center justify-between text-slate-700">
            <span>Período de Teste</span>
            <Zap className="h-4 w-4 text-amber-500 fill-amber-500" />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-slate-500">
              <span>Dia {daysUsed} de 15</span>
              <span className="font-medium text-blue-600">{daysRemaining} dias restantes</span>
            </div>
            <Progress value={progress} className="h-2 bg-blue-100 [&>div]:bg-blue-600" />
          </div>
          <Button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white border-0 shadow-md" asChild>
            <Link href="/settings/billing">
              <Crown className="mr-2 h-4 w-4" /> Fazer Upgrade
            </Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  // 2. Plano Free (Trial Expirado): Mostra uso de pacientes
  if (isFreePlan) {
    const limit = 3
    const progress = Math.min((patientCount / limit) * 100, 100)
    const isLimitReached = patientCount >= limit

    return (
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center justify-between text-slate-700">
            <span>Plano Gratuito</span>
            <Lock className="h-4 w-4 text-slate-400" />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-slate-500">
              <span>Pacientes utilizados</span>
              <span className={isLimitReached ? "text-red-600 font-medium" : ""}>
                {patientCount} / {limit}
              </span>
            </div>
            <Progress 
              value={progress} 
              className={`h-2 bg-slate-100 ${isLimitReached ? '[&>div]:bg-red-500' : '[&>div]:bg-slate-500'}`} 
            />
          </div>
          <Button variant="outline" className="w-full border-blue-200 text-blue-700 hover:bg-blue-50" asChild>
            <Link href="/settings/billing">
              Liberar Acesso Ilimitado
            </Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return null
}