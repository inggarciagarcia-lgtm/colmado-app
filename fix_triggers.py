import os

def write_file(path, content):
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content.strip())

# 1. Base UI Button with correct sizes and cn import
button_code = """
import * as React from "react"
import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/80",
        outline:
          "border-border bg-background hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost:
          "hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:hover:bg-muted/50",
        destructive:
          "bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:hover:bg-destructive/30 dark:focus-visible:ring-destructive/40",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 gap-1.5 px-3",
        xs: "h-6 gap-1 rounded px-2 text-xs",
        sm: "h-8 gap-1 rounded px-2.5 text-xs",
        lg: "h-10 gap-1.5 px-4",
        icon: "size-9",
        "icon-xs": "size-6",
        "icon-sm": "size-7",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
"""

# 2. Update contact-dialog.tsx
contact_dialog = """
'use client'

import { useState } from "react"
import { Button, buttonVariants } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus } from "lucide-react"
import { createContact } from "@/lib/actions/contacts"
import { cn } from "@/lib/utils"

export function ContactDialog() {
  const [open, setOpen] = useState(false)

  async function onSubmit(formData: FormData) {
    await createContact(formData)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className={cn(buttonVariants(), "cursor-pointer gap-2")}>
        <Plus className="h-4 w-4" />
        Nuevo Contacto
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form action={onSubmit}>
          <DialogHeader>
            <DialogTitle>Añadir Contacto</DialogTitle>
            <DialogDescription>
              Crea un nuevo cliente o proveedor para gestionar sus facturas.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Nombre
              </Label>
              <Input id="name" name="name" className="col-span-3" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Email
              </Label>
              <Input id="email" name="email" type="email" className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="phone" className="text-right">
                Teléfono
              </Label>
              <Input id="phone" name="phone" className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="type" className="text-right">
                Tipo
              </Label>
              <select 
                id="type" 
                name="type" 
                className="col-span-3 flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background"
              >
                <option value="CLIENT">Cliente</option>
                <option value="PROVIDER">Proveedor</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit">Guardar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
"""

# 3. Update product-dialog.tsx
product_dialog = """
'use client'

import { useState } from "react"
import { Button, buttonVariants } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus } from "lucide-react"
import { createProduct } from "@/lib/actions/products"
import { cn } from "@/lib/utils"

export function ProductDialog() {
  const [open, setOpen] = useState(false)

  async function onSubmit(formData: FormData) {
    await createProduct(formData)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className={cn(buttonVariants(), "cursor-pointer gap-2")}>
        <Plus className="h-4 w-4" />
        Nuevo Producto
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form action={onSubmit}>
          <DialogHeader>
            <DialogTitle>Añadir Producto / Servicio</DialogTitle>
            <DialogDescription>
              Crea un producto o servicio para facturar a tus clientes.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Nombre
              </Label>
              <Input id="name" name="name" placeholder="Ej. Computadora portátil" className="col-span-3" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="price" className="text-right">
                Precio ($)
              </Label>
              <Input id="price" name="price" type="number" step="0.01" placeholder="0.00" className="col-span-3" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="stock" className="text-right">
                Cantidad
              </Label>
              <Input id="stock" name="stock" type="number" defaultValue="1" className="col-span-3" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Detalle
              </Label>
              <Input id="description" name="description" placeholder="Descripción breve" className="col-span-3" />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit">Guardar Producto</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
"""

# 4. Update transaction-dialog.tsx
transaction_dialog = """
'use client'

import { useState } from "react"
import { Button, buttonVariants } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus } from "lucide-react"
import { createTransaction } from "@/lib/actions/transactions"
import { cn } from "@/lib/utils"

type Contact = { id: string, name: string, type: string }

export function TransactionDialog({ contacts }: { contacts: Contact[] }) {
  const [open, setOpen] = useState(false)
  const [type, setType] = useState('INCOME')

  async function onSubmit(formData: FormData) {
    await createTransaction(formData)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className={cn(buttonVariants(), "cursor-pointer gap-2")}>
        <Plus className="h-4 w-4" />
        Nueva Cuenta
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form action={onSubmit}>
          <DialogHeader>
            <DialogTitle>Añadir Cuenta</DialogTitle>
            <DialogDescription>
              Registra una nueva cuenta por cobrar o por pagar.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="type" className="text-right">
                Tipo
              </Label>
              <select 
                id="type" 
                name="type" 
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="col-span-3 flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background"
              >
                <option value="INCOME">Por Cobrar (Ingreso)</option>
                <option value="EXPENSE">Por Pagar (Gasto)</option>
              </select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="amount" className="text-right">
                Monto ($)
              </Label>
              <Input id="amount" name="amount" type="number" step="0.01" className="col-span-3" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Descripción
              </Label>
              <Input id="description" name="description" className="col-span-3" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="clientId" className="text-right">
                Contacto
              </Label>
              <select 
                id="clientId" 
                name="clientId" 
                className="col-span-3 flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background"
              >
                <option value="">Sin contacto asociado</option>
                {contacts.map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({c.type === 'CLIENT' ? 'Cliente' : 'Proveedor'})</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="status" className="text-right">
                Estado
              </Label>
              <select 
                id="status" 
                name="status" 
                className="col-span-3 flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background"
              >
                <option value="PENDING">Pendiente</option>
                <option value="PAID">Pagado</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit">Guardar Cuenta</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
"""

# 5. Update topbar.tsx
topbar = """
'use client'

import { Button, buttonVariants } from "@/components/ui/button"
import { CircleUser, Menu, Home, Users, CreditCard, Package, ReceiptText } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { signOut } from "next-auth/react"
import Link from "next/link"
import { cn } from "@/lib/utils"

export function Topbar() {
  return (
    <header className="flex h-14 items-center gap-4 border-b bg-slate-50/40 px-4 lg:h-[60px] lg:px-6 print:hidden">
      <Sheet>
        <SheetTrigger className={cn(buttonVariants({ variant: "outline", size: "icon" }), "shrink-0 md:hidden cursor-pointer")}>
          <Menu className="h-5 w-5" />
          <span className="sr-only">Menú</span>
        </SheetTrigger>
        <SheetContent side="left" className="flex flex-col">
          <SheetHeader className="text-left border-b pb-4 mb-4">
            <SheetTitle className="flex items-center gap-2">
              <ReceiptText className="h-5 w-5 text-emerald-600" />
              Gestor Negocio
            </SheetTitle>
          </SheetHeader>
          <nav className="grid gap-2 text-base font-medium">
            <Link
              href="/"
              className="flex items-center gap-3 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground hover:bg-slate-100"
            >
              <Home className="h-4 w-4" />
              Dashboard
            </Link>
            <Link
              href="/invoices"
              className="flex items-center gap-3 rounded-xl px-3 py-2 font-semibold text-emerald-700 hover:bg-emerald-50"
            >
              <ReceiptText className="h-4 w-4 text-emerald-600" />
              Facturación
            </Link>
            <Link
              href="/products"
              className="flex items-center gap-3 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground hover:bg-slate-100"
            >
              <Package className="h-4 w-4" />
              Productos
            </Link>
            <Link
              href="/contacts"
              className="flex items-center gap-3 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground hover:bg-slate-100"
            >
              <Users className="h-4 w-4" />
              Contactos
            </Link>
            <Link
              href="/transactions"
              className="flex items-center gap-3 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground hover:bg-slate-100"
            >
              <CreditCard className="h-4 w-4" />
              Cuentas
            </Link>
          </nav>
        </SheetContent>
      </Sheet>
      <div className="w-full flex-1">
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger className={cn(buttonVariants({ variant: "secondary", size: "icon" }), "rounded-full cursor-pointer")}>
          <CircleUser className="h-5 w-5" />
          <span className="sr-only">Menú de usuario</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <Link href="/settings" className="w-full">
            <DropdownMenuItem className="cursor-pointer">Ajustes</DropdownMenuItem>
          </Link>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => signOut()} className="cursor-pointer">Cerrar Sesión</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
"""

write_file("src/components/ui/button.tsx", button_code)
write_file("src/components/contacts/contact-dialog.tsx", contact_dialog)
write_file("src/components/products/product-dialog.tsx", product_dialog)
write_file("src/components/transactions/transaction-dialog.tsx", transaction_dialog)
write_file("src/components/layout/topbar.tsx", topbar)
