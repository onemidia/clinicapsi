'use client'

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Lock, CreditCard } from "lucide-react"

export function SubscriptionRequiredOverlay() {
  return (
    <div className="flex flex-col items-center justify-center h-[calc(100vh-100px)] p-6 animate-in fade-in duration-500">
      <Card className="w-full max-w-md shadow-xl border-red-100 bg-white">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto bg-red-50 p-4 rounded-full w-fit mb-4">
            <Lock className="h-10 w-10 text-red-500" />
          </div>
          <CardTitle className="text-2xl font-bold text-slate-900">Período de Teste Expirado</CardTitle>
          <CardDescription className="text-base mt-2">
            Seus 30 dias de teste gratuito chegaram ao fim.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4 pt-2">
           <p className="text-slate-600">
             Para continuar gerenciando seus pacientes e acessando o prontuário, escolha um plano que se adapte à sua rotina.
           </p>
           <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-xs text-slate-500">
             Seus dados estão salvos e seguros. O acesso será liberado imediatamente após a assinatura.
           </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-3 pt-2">
          <Button className="w-full h-12 text-lg bg-teal-600 hover:bg-teal-700 text-white shadow-md" asChild>
            <Link href="/planos">
              <CreditCard className="mr-2 h-5 w-5" /> Ver Planos e Assinar
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}