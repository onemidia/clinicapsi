// hooks/use-subscription.ts
import { useState, useEffect } from 'react'

export function useSubscription() {
  // Por enquanto, retornamos valores padrão para o site funcionar
  // Depois podemos conectar isso ao seu banco de dados
  return {
    isTrialActive: true,
    isFreePlan: true,
    loading: false
  }
}