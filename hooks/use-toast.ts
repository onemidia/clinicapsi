"use client"

import * as React from "react"

const TOAST_LIMIT = 1
const TOAST_REMOVE_DELAY = 1000000

export function useToast() {
  const [toasts, setToasts] = React.useState<any[]>([])

  const toast = React.useCallback(({ ...props }) => {
    console.log("Toast:", props.title, props.description)
    // Simulação simplificada para destravar o seu código
  }, [])

  return {
    toast,
    toasts,
    dismiss: () => {},
  }
}