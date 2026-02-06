import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { differenceInDays } from 'date-fns'
import { SubscriptionRequiredOverlay } from '@/components/subscription-required-overlay'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
           try {
             cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
           } catch {}
        }
      }
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Busca status da assinatura e data de criação
  const { data: profile } = await supabase
    .from('admin_users_view')
    .select('subscription_status, created_at')
    .eq('id', user.id)
    .single()

  const createdAt = profile?.created_at || user.created_at
  const subscriptionStatus = profile?.subscription_status || 'trial'

  const daysSinceCreated = Math.abs(differenceInDays(new Date(), new Date(createdAt)))
  const isExpired = daysSinceCreated > 30
  const isPaid = subscriptionStatus === 'active'

  if (isExpired && !isPaid) {
    // Bloqueia o conteúdo e exibe o overlay
    return <SubscriptionRequiredOverlay />
  }

  return <>{children}</>
}