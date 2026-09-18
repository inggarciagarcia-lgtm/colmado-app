import { getContacts } from "@/lib/actions/contacts"
import { getProducts } from "@/lib/actions/products"
import { InvoiceForm } from "./invoice-form"

export default async function NewInvoicePage() {
  const allContacts = await getContacts()
  const clients = allContacts.filter(c => c.type === 'CLIENT')
  const products = await getProducts()

  return (
    <div className="max-w-4xl mx-auto w-full py-4">
      <InvoiceForm clients={clients.length > 0 ? clients : allContacts} products={products} />
    </div>
  )
}