
"use client"

import * as React from "react"
import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"
import { cn } from "@/lib/utils"

const CustomToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastViewport>,
  React.ComponentPropsWithoutRef<typeof ToastViewport>
>(({ className, ...props }, ref) => (
  <ToastViewport
    ref={ref}
    className={cn(
      "fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:top-0 sm:right-1/2 sm:translate-x-1/2 sm:flex-col md:max-w-[420px]",
      className
    )}
    {...props}
  />
));
CustomToastViewport.displayName = "ToastViewport"


export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast key={id} {...props}>
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <CustomToastViewport />
    </ToastProvider>
  )
}
