import * as React from "react"

import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, name, ...props }, ref) => {
    const id = name || React.useId()
    const containerClass = props.type === 'checkbox' ? 'flex flex-row-reverse items-center gap-2' : 'w-full';


    return (
      <div className={containerClass}>
        {label && <Label htmlFor={id} className={cn("font-medium", {'mb-2 block': type !== 'checkbox'})}>{label}</Label>}
        <input
          id={id}
          name={name}
          type={type}
          className={cn(
            "flex h-12 w-full rounded-lg border border-input bg-surface px-4 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
            error && "border-destructive focus-visible:ring-destructive",
            type === 'checkbox' && 'h-4 w-4 accent-primary',
            className
          )}
          ref={ref}
          {...props}
        />
        {error && <p className="mt-1.5 text-sm text-destructive">{error}</p>}
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input }
