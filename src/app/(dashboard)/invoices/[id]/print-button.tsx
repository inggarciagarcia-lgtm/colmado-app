'use client'

import { Button } from "@/components/ui/button"
import { Printer } from "lucide-react"

export function PrintButton() {
  return (
    <Button onClick={() => window.print()} className="gap-2 bg-slate-900 hover:bg-slate-800">
      <Printer className="h-4 w-4" />
      Imprimir / Guardar PDF
    </Button>
  )
}