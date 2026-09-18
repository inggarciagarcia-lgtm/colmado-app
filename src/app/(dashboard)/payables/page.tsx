import { getPayables, deletePayable, markPayablePaid } from "@/lib/actions/payables"
import { getContacts } from "@/lib/actions/contacts"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PayableDialog } from "./payable-dialog"
import { ArrowDownRight, Check, Trash2, AlertCircle, Clock, CheckCircle2 } from "lucide-react"

export default async function PayablesPage() {
  const payables = await getPayables()
  const allContacts = await getContacts()
  const providers = allContacts.filter(c => c.type === 'PROVIDER')
  const contactsList = providers.length > 0 ? providers : allContacts

  const now = new Date()
  const pendingPayables = payables.filter(p => p.status === 'PENDING')
  const totalPending = pendingPayables.reduce((sum, p) => sum + p.amount, 0)
  
  const overduePayables = pendingPayables.filter(p => p.dueDate && new Date(p.dueDate) < now)
  const totalOverdue = overduePayables.reduce((sum, p) => sum + p.amount, 0)

  const paidPayables = payables.filter(p => p.status === 'PAID')
  const totalPaid = paidPayables.reduce((sum, p) => sum + p.amount, 0)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Cuentas por Pagar (Proveedores y Gastos)</h1>
          <p className="text-sm text-muted-foreground">Control de facturas pendientes de pago, vencimientos y gastos operativos.</p>
        </div>
        <PayableDialog providers={contactsList} />
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-l-4 border-l-rose-500 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-slate-600">Total por Pagar (Pendiente)</CardTitle>
            <ArrowDownRight className="h-5 w-5 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-rose-600 font-mono">
              RD${totalPending.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {pendingPayables.length} {pendingPayables.length === 1 ? 'factura pendiente' : 'facturas pendientes'}
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-slate-600">Facturas Vencidas</CardTitle>
            <AlertCircle className="h-5 w-5 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-amber-600 font-mono">
              RD${totalOverdue.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {overduePayables.length} {overduePayables.length === 1 ? 'factura que ya venció' : 'facturas que ya vencieron'}
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-slate-600">Total Pagado / Liquidado</CardTitle>
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-emerald-600 font-mono">
              RD${totalPaid.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {paidPayables.length} pagos realizados
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabla de Facturas */}
      <div className="rounded-md border bg-white shadow-xs">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Proveedor / Beneficiario</TableHead>
              <TableHead>N° Factura / NCF</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead>Concepto</TableHead>
              <TableHead>Vencimiento</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Monto RD$</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payables.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center h-28 text-muted-foreground">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Clock className="h-6 w-6 text-slate-300" />
                    <span>No hay facturas por pagar registradas.</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              payables.map((p) => {
                const isOverdue = p.status === 'PENDING' && p.dueDate && new Date(p.dueDate) < now
                return (
                  <TableRow key={p.id}>
                    <TableCell className="font-semibold text-slate-900">
                      <div>{p.client?.name || 'Gasto General'}</div>
                      {p.client?.rnc && <div className="text-[11px] text-slate-500 font-mono">RNC: {p.client.rnc}</div>}
                    </TableCell>
                    <TableCell>
                      {p.ncfOrBillNo ? (
                        <span className="font-mono text-xs font-semibold bg-slate-100 px-2 py-0.5 rounded border">
                          {p.ncfOrBillNo}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-xs font-medium bg-slate-50 text-slate-700 px-2 py-1 rounded border">
                        {p.category || 'General'}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-slate-700 max-w-[200px] truncate">{p.description}</TableCell>
                    <TableCell>
                      {p.dueDate ? (
                        <span className={`text-xs font-semibold ${isOverdue ? 'text-rose-600 font-bold' : 'text-slate-600'}`}>
                          {new Date(p.dueDate).toLocaleDateString()}
                          {isOverdue && <span className="block text-[10px] text-rose-500 uppercase font-black">¡Vencida!</span>}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">Sin fecha</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${
                        p.status === 'PAID' ? 'bg-emerald-100 text-emerald-800' : isOverdue ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {p.status === 'PAID' ? 'Pagada' : isOverdue ? 'Vencida' : 'Pendiente'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-bold text-base font-mono text-rose-700">
                      RD${p.amount.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      {p.status === 'PENDING' && (
                        <form action={markPayablePaid.bind(null, p.id, 'TRANSFERENCIA')} className="inline-block">
                          <Button variant="outline" size="sm" className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 gap-1 font-semibold">
                            <Check className="h-4 w-4" />
                            Pagar
                          </Button>
                        </form>
                      )}
                      <form action={deletePayable.bind(null, p.id)} className="inline-block">
                        <Button variant="ghost" size="icon" className="text-rose-500 hover:text-rose-600 hover:bg-rose-50">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </form>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}