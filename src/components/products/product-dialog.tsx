'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, X } from "lucide-react"
import { createProduct } from "@/lib/actions/products"

export function ProductDialog() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [hasItbis, setHasItbis] = useState('true')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    try {
      await createProduct(formData)
      setOpen(false)
    } catch (err) {
      alert("Error al guardar el producto")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button 
        type="button" 
        onClick={() => setOpen(true)} 
        className="gap-2 bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm font-semibold"
      >
        <Plus className="h-4 w-4" />
        Nuevo Producto
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-100">
            <div className="flex items-center justify-between pb-3 border-b mb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Añadir Producto / Servicio</h2>
                <p className="text-xs text-slate-500">Configura nombre, precio, stock e impuesto ITBIS.</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div className="space-y-1">
                <Label htmlFor="name" className="text-xs font-semibold text-slate-700">
                  Nombre del Producto o Servicio *
                </Label>
                <Input id="name" name="name" placeholder="Ej. Laptop HP / Leche / Asesoría" required autoFocus />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="price" className="text-xs font-semibold text-slate-700">
                    Precio Unitario (RD$) *
                  </Label>
                  <Input id="price" name="price" type="number" step="0.01" min="0" placeholder="0.00" required />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="stock" className="text-xs font-semibold text-slate-700">
                    Cantidad en Stock *
                  </Label>
                  <Input id="stock" name="stock" type="number" min="0" defaultValue="1" required />
                </div>
              </div>

              {/* Selector de ITBIS */}
              <div className="space-y-1">
                <Label htmlFor="hasItbis" className="text-xs font-semibold text-slate-700">
                  Tratamiento Fiscal (ITBIS) *
                </Label>
                <select
                  id="hasItbis"
                  name="hasItbis"
                  value={hasItbis}
                  onChange={(e) => setHasItbis(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background font-medium"
                >
                  <option value="true">Gravado con ITBIS (18%)</option>
                  <option value="false">Exento de ITBIS (0% - No lleva ITBIS)</option>
                </select>
                <p className="text-[11px] text-muted-foreground">
                  {hasItbis === 'true' 
                    ? "Al facturarlo, el sistema calculará automáticamente el 18% de ITBIS."
                    : "Ideal para productos de la canasta básica o servicios exentos por la DGII."}
                </p>
              </div>

              <div className="space-y-1">
                <Label htmlFor="description" className="text-xs font-semibold text-slate-700">
                  Detalle / Descripción
                </Label>
                <Input id="description" name="description" placeholder="Descripción breve del producto" />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
                  {loading ? "Guardando..." : "Guardar Producto"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}