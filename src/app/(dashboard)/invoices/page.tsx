import { getInvoices, deleteInvoice } from "@/lib/actions/invoices"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import Link from "next/link"
import { Plus, Printer, Trash2, ReceiptText } from "lucide-react"

export default async function InvoicesPage() {
  const invoices = await getInvoices()

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Facturación y NCF</h1>
          <p className="text-sm text-muted-foreground">Comprobantes fiscales emitidos según normativas de la DGII.</p>
        </div>
        <Link href="/invoices/new">
          <Button className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 font-semibold">
            <Plus className="h-4 w-4" />
            Nueva Factura con NCF
          </Button>
        </Link>
      </div>

      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>N° Factura</TableHead>
              <TableHead>Comprobante Fiscal (NCF)</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Método</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Total RD$</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center h-24 text-muted-foreground">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <ReceiptText className="h-6 w-6 text-slate-400" />
                    <span>No has emitido facturas aún.</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              invoices.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell className="font-semibold text-slate-600">{inv.number}</TableCell>
                  <TableCell>
                    {inv.ncf ? (
                      <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-md border">
                        {inv.ncf}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">Sin NCF</span>
                    )}
                  </TableCell>
                  <TableCell>{new Date(inv.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell className="font-medium">{inv.client.name}</TableCell>
                  <TableCell className="text-xs font-semibold uppercase text-slate-600">{inv.paymentMethod}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      inv.status === 'PAID' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {inv.status === 'PAID' ? 'Cobrada' : 'Pendiente'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-bold text-base font-mono">
                    RD${inv.total.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Link href={`/invoices/${inv.id}`}>
                      <Button variant="outline" size="sm" className="gap-1">
                        <Printer className="h-3.5 w-3.5" />
                        Imprimir
                      </Button>
                    </Link>
                    <form action={deleteInvoice.bind(null, inv.id)} className="inline-block">
                      <Button variant="ghost" size="icon" className="text-rose-500 hover:text-rose-600 hover:bg-rose-50">
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