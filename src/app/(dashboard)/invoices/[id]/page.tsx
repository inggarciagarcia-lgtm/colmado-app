import { getInvoiceById, markInvoicePaid } from "@/lib/actions/invoices"
import { getActiveCompany } from "@/lib/actions/companies"
import { notFound } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PrintButton } from "./print-button"
import { ArrowLeft, Check, CheckCircle2 } from "lucide-react"
import Link from "next/link"

function getNcfTypeName(type: string) {
  switch (type) {
    case 'B01': return 'FACTURA DE CRÉDITO FISCAL'
    case 'B02': return 'FACTURA PARA CONSUMIDOR FINAL'
    case 'B15': return 'COMPROBANTE GUBERNAMENTAL'
    default: return 'COMPROBANTE INTERNO'
  }
}

export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const invoice = await getInvoiceById(id)
  const company = await getActiveCompany()

  if (!invoice) {
    notFound()
  }

  const ncfTitle = getNcfTypeName(invoice.ncfType)

  return (
    <div className="max-w-3xl mx-auto w-full py-6 space-y-6">
      {/* Botones de acción (ocultos al imprimir) */}
      <div className="print:hidden flex items-center justify-between">
        <Link href="/invoices">
          <Button variant="outline" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Volver a Facturas
          </Button>
        </Link>

        <div className="flex items-center gap-2">
          {invoice.status === 'PENDING' && (
            <form action={markInvoicePaid.bind(null, invoice.id)}>
              <Button variant="outline" size="sm" className="text-emerald-600 hover:text-emerald-700 gap-1 font-semibold">
                <Check className="h-4 w-4" />
                Marcar como Cobrada
              </Button>
            </form>
          )}
          <PrintButton />
        </div>
      </div>

      {/* Hoja de Factura Oficial Impresa */}
      <div className="bg-white border rounded-xl p-8 md:p-12 shadow-sm print:shadow-none print:border-none print:p-0 text-slate-900">
        
        {/* Encabezado: Emisor y Recuadro Fiscal */}
        <div className="flex justify-between items-start border-b-2 border-slate-900 pb-6">
          <div className="space-y-1">
            <h1 className="text-2xl font-black tracking-tight text-slate-900 uppercase">{invoice.company?.name || company.name}</h1>
            <p className="text-sm font-bold text-slate-800">RNC: {invoice.company?.rnc || company.rnc || '1-30-00000-0'}</p>
            {(invoice.company?.address || company.address) && (
              <p className="text-xs text-slate-600 max-w-sm">{invoice.company?.address || company.address}</p>
            )}
            {(invoice.company?.phone || company.phone) && (
              <p className="text-xs text-slate-600">Tel: {invoice.company?.phone || company.phone}</p>
            )}
          </div>

          <div className="text-right border-2 border-slate-900 p-4 rounded-lg bg-slate-50/50 min-w-[280px]">
            <p className="text-xs font-black uppercase text-slate-700 tracking-wider mb-1">{ncfTitle}</p>
            {invoice.ncf ? (
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-slate-500 uppercase">NCF:</span>
                <p className="font-mono text-xl font-black text-slate-900 tracking-wider">{invoice.ncf}</p>
                {invoice.ncfExpiry && (
                  <p className="text-[11px] text-slate-500 font-semibold mt-1">Válido hasta: {invoice.ncfExpiry}</p>
                )}
              </div>
            ) : (
              <p className="text-xs font-bold text-slate-500">Documento no fiscal</p>
            )}
            <div className="mt-2 pt-2 border-t border-slate-300 text-xs flex justify-between font-semibold">
              <span className="text-slate-500">N° Factura:</span>
              <span>{invoice.number}</span>
            </div>
            <div className="text-xs flex justify-between font-semibold">
              <span className="text-slate-500">Fecha:</span>
              <span>{new Date(invoice.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {/* Datos del Cliente y Condiciones */}
        <div className="grid grid-cols-2 gap-8 py-6 border-b text-sm">
          <div>
            <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Facturado a:</span>
            <p className="text-base font-bold text-slate-900 mt-1">{invoice.client.name}</p>
            <p className="text-xs font-bold text-slate-700 mt-0.5">
              RNC / Cédula: <span className="font-mono">{invoice.client.rnc || 'Consumidor Final'}</span>
            </p>
            {invoice.client.phone && <p className="text-xs text-slate-600">Tel: {invoice.client.phone}</p>}
            {invoice.client.address && <p className="text-xs text-slate-600">{invoice.client.address}</p>}
          </div>

          <div className="text-right flex flex-col justify-center space-y-1">
            <div className="text-xs">
              <span className="text-slate-500 font-medium">Método de Pago: </span>
              <span className="font-bold uppercase text-slate-800">{invoice.paymentMethod}</span>
            </div>
            <div className="text-xs">
              <span className="text-slate-500 font-medium">Estado: </span>
              {invoice.status === 'PAID' ? (
                <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">PAGADA AL CONTADO</span>
              ) : (
                <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">PENDIENTE DE PAGO</span>
              )}
            </div>
          </div>
        </div>

        {/* Tabla de Artículos */}
        <div className="py-6">
          <Table>
            <TableHeader>
              <TableRow className="border-b-2 border-slate-900">
                <TableHead className="font-black text-slate-900 text-xs uppercase">Descripción</TableHead>
                <TableHead className="text-center font-black text-slate-900 text-xs uppercase w-[70px]">ITBIS</TableHead>
                <TableHead className="text-center font-black text-slate-900 text-xs uppercase w-[70px]">Cant.</TableHead>
                <TableHead className="text-right font-black text-slate-900 text-xs uppercase w-[120px]">Precio RD$</TableHead>
                <TableHead className="text-right font-black text-slate-900 text-xs uppercase w-[120px]">Importe RD$</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoice.items.map((item) => (
                <TableRow key={item.id} className="border-b border-slate-200">
                  <TableCell className="font-medium text-slate-900">{item.description}</TableCell>
                  <TableCell className="text-center">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      item.hasItbis ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {item.hasItbis ? '18%' : 'E'}
                    </span>
                  </TableCell>
                  <TableCell className="text-center font-mono">{item.quantity}</TableCell>
                  <TableCell className="text-right font-mono">RD${item.unitPrice.toFixed(2)}</TableCell>
                  <TableCell className="text-right font-bold font-mono">RD${item.total.toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Totales con desglose exacto DGII */}
        <div className="flex justify-end pt-4 border-t-2 border-slate-900">
          <div className="w-80 space-y-1.5 text-sm">
            <div className="flex justify-between text-slate-700">
              <span>Monto Gravado (con ITBIS):</span>
              <span className="font-mono font-medium">RD${invoice.taxableSubtotal.toFixed(2)}</span>
            </div>
            {invoice.exemptSubtotal > 0 && (
              <div className="flex justify-between text-slate-700">
                <span>Monto Exento (sin ITBIS):</span>
                <span className="font-mono font-medium">RD${invoice.exemptSubtotal.toFixed(2)}</span>
              </div>
            )}
            {invoice.discount > 0 && (
              <div className="flex justify-between text-slate-700">
                <span>Descuento Otorgado:</span>
                <span className="font-mono font-medium text-rose-600">-RD${invoice.discount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-700 border-t pt-1">
              <span>ITBIS (18%):</span>
              <span className="font-mono font-medium text-blue-600">RD${invoice.itbis.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg font-black text-slate-900 border-t border-slate-400 pt-2">
              <span>TOTAL A PAGAR:</span>
              <span className="font-mono text-emerald-700">RD${invoice.total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Leyenda legal al pie */}
        <div className="mt-12 pt-4 border-t text-center space-y-1">
          <p className="text-xs font-semibold text-slate-700">{invoice.company?.slogan || company.slogan || '¡Gracias por su compra!'}</p>
          <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Original: Cliente • Copia: Emisor • E = Exento de ITBIS</p>
        </div>
      </div>
    </div>
  )
}