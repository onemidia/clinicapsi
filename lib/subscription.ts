export type SubscriptionStatusResult = {
  daysRemaining: number
  isExpired: boolean
  canCreatePatient: boolean
  currentPlan: 'Trial' | 'Free' | 'Pro'
}

export function getSubscriptionStatus(profile: any, patientCount: number): SubscriptionStatusResult {
  if (!profile) {
    return {
      daysRemaining: 0,
      isExpired: true,
      canCreatePatient: false,
      currentPlan: 'Free'
    }
  }

  const now = new Date()
  // Se não tiver data de início, assume que começou agora (fallback seguro)
  const trialStart = new Date(profile.trial_started_at || now)
  
  // Diferença em milissegundos
  const diffTime = Math.abs(now.getTime() - trialStart.getTime())
  // Converter para dias (arredondando para cima para contar dias parciais como 1 dia)
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  // Trial dura 15 dias
  const isExpired = diffDays > 15
  const daysRemaining = Math.max(0, 15 - diffDays)

  let currentPlan: 'Trial' | 'Free' | 'Pro' = 'Trial'
  
  if (isExpired) {
    // Se o trial acabou, usa o plano do banco ou 'Free' por padrão
    currentPlan = (profile.plan_type as 'Free' | 'Pro') || 'Free'
  }

  // Regra: Pode criar se (Trial) OU (Não é Free) OU (Free e < 3 pacientes)
  const canCreatePatient = !isExpired || currentPlan !== 'Free' || patientCount < 3

  return {
    daysRemaining,
    isExpired,
    canCreatePatient,
    currentPlan
  }
}