'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, X } from "lucide-react"
import { createContact } from "@/lib/actions/contacts"

export function ContactDialog() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    try {
      await createContact(formData)
      setOpen(false)
    } catch (err) {
      alert("Error al guardar el contacto")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button 
        type="button" 
        onClick={() => setOpen(true)} 
        className="gap-2 bg-slate-900 text-white hover:bg-slate-800 shadow-sm"
      >
        <Plus className="h-4 w-4" />
        Nuevo Contacto
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-100">
            <div className="flex items-center justify-between pb-3 border-b mb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Añadir Cliente / Proveedor</h2>
                <p className="text-xs text-slate-500">Registra los datos para emisión de facturas y NCF.</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="name" className="text-xs font-semibold text-slate-700">
                  Razón Social / Nombre Completo *
                </Label>
                <Input id="name" name="name" placeholder="Ej. Juan Pérez / Distribuidora ABC, SRL" required autoFocus />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="rnc" className="text-xs font-semibold text-slate-700">
                    RNC o Cédula
                  </Label>
                  <Input id="rnc" name="rnc" placeholder="Ej. 131-00000-0" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="phone" className="text-xs font-semibold text-slate-700">
                    Teléfono
                  </Label>
                  <Input id="phone" name="phone" placeholder="809-555-0000" />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="email" className="text-xs font-semibold text-slate-700">
                  Correo Electrónico
                </Label>
                <Input id="email" name="email" type="email" placeholder="cliente@correo.com" />
              </div>

              <div className="space-y-1">
                <Label htmlFor="address" className="text-xs font-semibold text-slate-700">
                  Dirección
                </Label>
                <Input id="address" name="address" placeholder="Calle, Sector, Ciudad" />
              </div>

              <div className="space-y-1">
                <Label htmlFor="type" className="text-xs font-semibold text-slate-700">
                  Tipo de Contacto
                </Label>
                <select 
                  id="type" 
                  name="type" 
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background"
                >
                  <option value="CLIENT">Cliente (Le facturo)</option>
                  <option value="PROVIDER">Proveedor (Le compro)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading} className="bg-slate-900 hover:bg-slate-800 text-white">
                  {loading ? "Guardando..." : "Guardar Contacto"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}