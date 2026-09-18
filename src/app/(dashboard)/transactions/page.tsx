import { getTransactions, deleteTransaction, markAsPaid } from "@/lib/actions/transactions"
import { getContacts } from "@/lib/actions/contacts"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { TransactionDialog } from "@/components/transactions/transaction-dialog"
import { Check, Trash2 } from "lucide-react"

export default async function TransactionsPage() {
  const transactions = await getTransactions()
  const contacts = await getContacts()

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Cuentas (Por Cobrar / Pagar)</h1>
        <TransactionDialog contacts={contacts} />
      </div>

      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead>Contacto</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Monto</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">
                  No hay transacciones registradas.
                </TableCell>
              </TableRow>
            ) : (
              transactions.map((tx) => (
                <TableRow key={tx.id}>
                  <TableCell>{new Date(tx.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell className="font-medium">{tx.description || '-'}</TableCell>
                  <TableCell>{tx.client?.name || '-'}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      tx.type === 'INCOME' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {tx.type === 'INCOME' ? 'Por Cobrar' : 'Por Pagar'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      tx.status === 'PAID' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-800'
                    }`}>
                      {tx.status === 'PAID' ? 'Pagado' : 'Pendiente'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-bold">
                    ${tx.amount.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    {tx.status === 'PENDING' && (
                      <form action={markAsPaid.bind(null, tx.id)} className="inline-block">
                        <Button variant="ghost" size="icon" className="text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50">
                          <Check className="h-4 w-4" />
                        </Button>
                      </form>
                    )}
                    <form action={deleteTransaction.bind(null, tx.id)} className="inline-block">
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