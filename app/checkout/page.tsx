'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/client'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card"
import { Loader2, CheckCircle, CreditCard, ShieldCheck } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function CheckoutPage() {
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [plan, setPlan] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();

  const PLANS = {
    'Iniciante': 0,
    'Básico': 29.90,
    'Profissional': 59.90
  };

  useEffect(() => {
    const fetchPlan = async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) {
        router.push('/login');
        return;
      }
      setUser(currentUser);

      const { data: profile } = await supabase
        .from('admin_users_view')
        .select('selected_plan')
        .single();
      
      const localPlan = typeof window !== 'undefined' ? localStorage.getItem('selectedPlan') : null;
      const planName = profile?.selected_plan || localPlan || 'Profissional';
      
      setPlan({
        name: planName,
        price: PLANS[planName as keyof typeof PLANS] || 59.90
      });
      setLoading(false);
    };
    fetchPlan();
  }, [router, supabase]);

  const handlePayment = async () => {
    setProcessing(true);
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: user?.id,
          userEmail: user?.email,
          planName: plan?.name, 
          price: plan?.price
        })
      });
      
      const data = await response.json();
      
      if (data.invoiceUrl) {
        window.location.href = data.invoiceUrl;
      } else {
        toast({ 
          variant: "destructive", 
          title: "Erro no checkout", 
          description: data.error || "Falha ao gerar fatura no Asaas." 
        });
        setProcessing(false);
      }
    } catch (error) {
      console.error(error);
      toast({ 
        variant: "destructive", 
        title: "Erro", 
        description: "Erro ao processar solicitação." 
      });
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin h-8 w-8 text-teal-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl border-slate-200">
        <CardHeader className="text-center border-b border-slate-100 pb-6">
          <div className="mx-auto bg-teal-100 p-3 rounded-full w-fit mb-4">
            <CreditCard className="h-8 w-8 text-teal-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-slate-900">Checkout Seguro</CardTitle>
          <CardDescription>Finalize sua assinatura via Asaas.</CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <p className="text-sm text-slate-500 mb-1">Resumo do Pedido</p>
            <div className="flex justify-between items-center">
              <span className="font-semibold text-slate-900 text-lg">Plano {plan?.name}</span>
              <span className="font-bold text-slate-900 text-xl">
                {plan?.price === 0 ? 'Grátis' : `R$ ${plan?.price?.toFixed(2).replace('.', ',')}/mês`}
              </span>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm text-slate-600">
              <CheckCircle className="h-4 w-4 text-green-500" /> Pagamento via PIX ou Cartão
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-600">
              <CheckCircle className="h-4 w-4 text-green-500" /> Ambiente seguro Asaas
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4 pb-8 pt-2">
          <Button 
            className="w-full h-12 text-lg bg-teal-600 hover:bg-teal-700 text-white shadow-lg shadow-teal-100" 
            onClick={handlePayment}
            disabled={processing}
          >
            {processing ? (
              <>
                <Loader2 className="animate-spin mr-2" />
                Gerando Fatura...
              </>
            ) : (
              'Ir para Pagamento Seguro'
            )}
          </Button>
          <p className="text-xs text-center text-slate-400 flex items-center justify-center gap-1">
            <ShieldCheck className="h-3 w-3" /> Seus dados estão protegidos.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}