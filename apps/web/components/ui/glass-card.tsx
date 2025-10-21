"use client"

import { Card, CardContent, CardHeader } from "./card"
import { cn } from "@/lib/utils"

export function GlassCard({ className, children, ...props }: any) {
  return (
    <Card
      className={cn(
        "relative border border-white/10 bg-gray-900/60 backdrop-blur-md shadow-[0_8px_30px_rgb(0,0,0,0.12)]",
        "hover:bg-gray-900/70 transition-all",
        className
      )}
      {...props}
    >
      {children}
    </Card>
  )
}

export { CardContent as GlassContent, CardHeader as GlassHeader }

