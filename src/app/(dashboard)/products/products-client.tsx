'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ProductDialog } from "@/components/products/product-dialog"
import { Trash2, Package, Search, X } from "lucide-react"
import { deleteProduct } from "@/lib/actions/products"

interface Product {
  id: string
  name: string
  description: string | null
  price: number
  stock: number
  hasItbis: boolean
}

export function ProductsClient({ initialProducts }: { initialProducts: Product[] }) {
  const [searchQuery, setSearchQuery] = useState("")
  const [filterTax, setFilterTax] = useState<"ALL" | "ITBIS" | "EXEMPT">("ALL")

  const filtered = initialProducts.filter((p) => {
    const query = searchQuery.toLowerCase().trim()
    const matchesQuery = 
      query === "" || 
      p.name.toLowerCase().includes(query) || 
      (p.description && p.description.toLowerCase().includes(query))

    const matchesTax = 
      filterTax === "ALL" ||
      (filterTax === "ITBIS" && p.hasItbis) ||
      (filterTax === "EXEMPT" && !p.hasItbis)

    return matchesQuery && matchesTax
  })

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Catálogo de Productos e Inventario</h1>
          <p className="text-sm text-muted-foreground">Administra tus artículos, precios, stock y estado de ITBIS (Gravado o Exento).</p>
        </div>
        <ProductDialog />
      </div>

      {/* Barra de Búsqueda y Filtros */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="🔍 Buscar producto por nombre o descripción..."
            className="pl-9 pr-9 h-10 bg-slate-50/50 border-slate-200"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Filtros de Impuesto */}
        <div className="flex rounded-lg border bg-slate-50 p-1 text-xs font-semibold shrink-0">
          <button
            type="button"
            onClick={() => setFilterTax("ALL")}
            className={`px-3 py-1.5 rounded-md transition-all ${
              filterTax === "ALL" ? "bg-white shadow text-slate-900 font-bold" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Todos ({initialProducts.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterTax("ITBIS")}
            className={`px-3 py-1.5 rounded-md transition-all ${
              filterTax === "ITBIS" ? "bg-white shadow text-blue-700 font-bold" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Con ITBIS
          </button>
          <button
            type="button"
            onClick={() => setFilterTax("EXEMPT")}
            className={`px-3 py-1.5 rounded-md transition-all ${
              filterTax === "EXEMPT" ? "bg-white shadow text-slate-700 font-bold" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Exentos
          </button>
        </div>
      </div>

      <div className="rounded-xl border bg-white overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-slate-50/70">
            <TableRow>
              <TableHead className="font-bold">Producto</TableHead>
              <TableHead className="font-bold">Descripción</TableHead>
              <TableHead className="font-bold">Impuesto ITBIS</TableHead>
              <TableHead className="text-right font-bold">Stock Disponible</TableHead>
              <TableHead className="text-right font-bold">Precio Unitario RD$</TableHead>
              <TableHead className="text-right font-bold w-[70px]">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center h-32 text-muted-foreground">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Package className="h-8 w-8 text-slate-300" />
                    <span className="font-medium">
                      {searchQuery ? `No se encontraron productos que coincidan con "${searchQuery}"` : "No hay productos registrados todavía."}
                    </span>
                    {searchQuery && (
                      <Button variant="outline" size="sm" onClick={() => setSearchQuery("")} className="mt-2 text-xs">
                        Limpiar búsqueda
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((p) => (
                <TableRow key={p.id} className="hover:bg-slate-50/50">
                  <TableCell className="font-bold text-slate-900">{p.name}</TableCell>
                  <TableCell className="text-muted-foreground text-xs">{p.description || '-'}</TableCell>
                  <TableCell>
                    {p.hasItbis ? (
                      <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
                        ITBIS 18%
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold bg-slate-100 text-slate-700 border">
                        Exento (0%)
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${
                      p.stock > 5 ? 'bg-emerald-100 text-emerald-800' : p.stock > 0 ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {p.stock} unid.
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-bold font-mono text-base text-slate-900">
                    RD${p.price.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right">
                    <form action={deleteProduct.bind(null, p.id)}>
                      <Button variant="ghost" size="icon" className="text-slate-400 hover:text-rose-600 hover:bg-rose-50">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </form>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
