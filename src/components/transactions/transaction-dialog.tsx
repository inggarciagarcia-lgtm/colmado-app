'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, X } from "lucide-react"
import { createTransaction } from "@/lib/actions/transactions"

type Contact = { id: string, name: string, type: string }

export function TransactionDialog({ contacts }: { contacts: Contact[] }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [type, setType] = useState('INCOME')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    try {
      await createTransaction(formData)
      setOpen(false)
    } catch (err) {
      alert("Error al guardar la cuenta")
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
        Nueva Cuenta
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-100">
            <div className="flex items-center justify-between pb-3 border-b mb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Añadir Cuenta</h2>
                <p className="text-xs text-slate-500">Registra una nueva cuenta por cobrar o por pagar.</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="type" className="text-xs font-semibold text-slate-700">
                  Tipo de Cuenta
                </Label>
                <select 
                  id="type" 
                  name="type" 
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                >
                  <option value="INCOME">Por Cobrar (Ingreso para mí)</option>
                  <option value="EXPENSE">Por Pagar (Gasto / Factura de proveedor)</option>
                </select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="amount" className="text-xs font-semibold text-slate-700">
                  Monto ($) *
                </Label>
                <Input id="amount" name="amount" type="number" step="0.01" min="0" placeholder="0.00" required autoFocus />
              </div>

              <div className="space-y-1">
                <Label htmlFor="description" className="text-xs font-semibold text-slate-700">
                  Descripción o Concepto *
                </Label>
                <Input id="description" name="description" placeholder="Ej. Servicio de consultoría / Factura #123" required />
              </div>

              <div className="space-y-1">
                <Label htmlFor="clientId" className="text-xs font-semibold text-slate-700">
                  Contacto Asociado (Opcional)
                </Label>
                <select 
                  id="clientId" 
                  name="clientId" 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                >
                  <option value="">(Sin contacto asociado)</option>
                  {contacts.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.type === 'CLIENT' ? 'Cliente' : 'Proveedor'})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="status" className="text-xs font-semibold text-slate-700">
                  Estado Inicial
                </Label>
                <select 
                  id="status" 
                  name="status" 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                >
                  <option value="PENDING">Pendiente</option>
                  <option value="PAID">Pagado al instante</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading} className="bg-slate-900 hover:bg-slate-800 text-white">
                  {loading ? "Guardando..." : "Guardar Cuenta"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}