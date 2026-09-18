import { getContacts, deleteContact } from "@/lib/actions/contacts"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ContactDialog } from "@/components/contacts/contact-dialog"
import { Trash2, Users } from "lucide-react"

export default async function ContactsPage() {
  const contacts = await getContacts()

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Directorio de Contactos</h1>
          <p className="text-sm text-muted-foreground">Clientes y proveedores con su identificación tributaria (RNC / Cédula).</p>
        </div>
        <ContactDialog />
      </div>

      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre / Razón Social</TableHead>
              <TableHead>RNC / Cédula</TableHead>
              <TableHead>Teléfono</TableHead>
              <TableHead>Correo</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contacts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Users className="h-6 w-6 text-slate-400" />
                    <span>No hay contactos registrados todavía.</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              contacts.map((contact) => (
                <TableRow key={contact.id}>
                  <TableCell className="font-semibold text-slate-900">{contact.name}</TableCell>
                  <TableCell>
                    {contact.rnc ? (
                      <span className="font-mono text-xs font-semibold bg-slate-100 px-2 py-0.5 rounded">
                        {contact.rnc}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">Sin RNC</span>
                    )}
                  </TableCell>
                  <TableCell>{contact.phone || '-'}</TableCell>
                  <TableCell>{contact.email || '-'}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      contact.type === 'CLIENT' ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'
                    }`}>
                      {contact.type === 'CLIENT' ? 'Cliente' : 'Proveedor'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <form action={deleteContact.bind(null, contact.id)}>
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