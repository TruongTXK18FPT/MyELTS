"use client"

import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"
import { CheckCircle2, AlertTriangle, Info, Sparkles, AlertCircle } from "lucide-react"

function getCuteIcon(variant: string | null | undefined) {
  switch (variant) {
    case "success":
      return (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-green-100 text-green-600 dark:bg-green-950/40 dark:text-green-400 animate-bounce">
          <CheckCircle2 className="h-5 w-5" />
        </div>
      )
    case "destructive":
      return (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400 animate-pulse">
          <AlertTriangle className="h-5 w-5" />
        </div>
      )
    case "warning":
      return (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
          <AlertCircle className="h-5 w-5" />
        </div>
      )
    case "info":
      return (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
          <Info className="h-5 w-5" />
        </div>
      )
    default:
      return (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-pink-100 text-pink-500 dark:bg-pink-950/40 dark:text-pink-400">
          <Sparkles className="h-5 w-5" />
        </div>
      )
  }
}

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, variant, ...props }) {
        return (
          <Toast key={id} variant={variant} {...props} className="flex gap-3 items-center rounded-2xl border p-4 shadow-lg">
            {getCuteIcon(variant)}
            <div className="grid gap-1 flex-1">
              {title && <ToastTitle className="text-sm font-semibold">{title}</ToastTitle>}
              {description && (
                <ToastDescription className="text-xs opacity-90">{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose className="hover:bg-black/5 dark:hover:bg-white/5 rounded-full p-1" />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}

