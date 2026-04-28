import * as React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { Check } from "lucide-react"

import { cn } from "@/lib/utils"

const Checkbox = React.forwardRef(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      "peer h-5 w-5 shrink-0 rounded-md border-2 border-slate-500 bg-slate-800 shadow-sm transition-all duration-150",
      "hover:border-primary hover:bg-slate-700",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 focus-visible:ring-offset-slate-900",
      "disabled:cursor-not-allowed disabled:opacity-40",
      "data-[state=checked]:bg-primary data-[state=checked]:border-primary data-[state=checked]:shadow-[0_0_8px_rgba(59,130,246,0.5)]",
      className
    )}
    {...props}>
    <CheckboxPrimitive.Indicator className={cn("flex items-center justify-center text-white")}>
      <Check className="h-4 w-4 stroke-[4]" />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
))
Checkbox.displayName = CheckboxPrimitive.Root.displayName

export { Checkbox }