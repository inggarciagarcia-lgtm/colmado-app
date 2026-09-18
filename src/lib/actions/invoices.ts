'use server'

import { prisma } from '@/lib/prisma'
import { getActiveCompany } from './companies'
import { revalidatePath } from 'next/cache'

export async function getInvoices() {
  const company = await getActiveCompany()
  return await prisma.invoice.findMany({
    where: { companyId: company.id },
    orderBy: { createdAt: 'desc' },
    include: {
      client: true,
      items: true
    }
  })
}

export async function getInvoiceById(id: string) {
  return await prisma.invoice.findUnique({
    where: { id },
    include: {
      client: true,
      company: true,
      items: {
        include: {
          product: true
        }
      }
    }
  })
}

export interface InvoiceItemInput {
  productId?: string
  description: string
  quantity: number
  unitPrice: number
  hasItbis: boolean
  total: number
}

export async function createInvoice(data: {
  clientId: string
  ncfType: string // B02, B01, B15, NONE
  paymentMethod: string
  notes?: string
  status: string
  items: InvoiceItemInput[]
  discount?: number
  itbisRate?: number
}) {
  const company = await getActiveCompany()

  // 1. Generate NCF for active company
  let ncf: string | null = null
  if (data.ncfType === 'B02') {
    ncf = `B02${String(company.ncfB02Seq).padStart(8, '0')}`
    await prisma.company.update({
      where: { id: company.id },
      data: { ncfB02Seq: { increment: 1 } }
    })
  } else if (data.ncfType === 'B01') {
    ncf = `B01${String(company.ncfB01Seq).padStart(8, '0')}`
    await prisma.company.update({
      where: { id: company.id },
      data: { ncfB01Seq: { increment: 1 } }
    })
  } else if (data.ncfType === 'B15') {
    ncf = `B15${String(company.ncfB15Seq).padStart(8, '0')}`
    await prisma.company.update({
      where: { id: company.id },
      data: { ncfB15Seq: { increment: 1 } }
    })
  }

  // 2. Sequential internal number (find highest existing number and guarantee uniqueness)
  const allInvoices = await prisma.invoice.findMany({
    select: { number: true }
  })
  
  let maxSeq = 0
  for (const inv of allInvoices) {
    const match = inv.number.match(/FAC-(\d+)/)
    if (match) {
      const num = parseInt(match[1], 10)
      if (num > maxSeq) {
        maxSeq = num
      }
    }
  }

  let nextSeq = maxSeq + 1
  let invoiceNumber = `FAC-${String(nextSeq).padStart(4, '0')}`
  
  while (await prisma.invoice.findUnique({ where: { number: invoiceNumber } })) {
    nextSeq++
    invoiceNumber = `FAC-${String(nextSeq).padStart(4, '0')}`
  }

  // 3. Precise ITBIS Calculations: Separating Gravado vs Exento
  const subtotal = data.items.reduce((acc, item) => acc + item.total, 0)
  const taxableSubtotal = data.items.filter(i => i.hasItbis).reduce((acc, item) => acc + item.total, 0)
  const exemptSubtotal = data.items.filter(i => !i.hasItbis).reduce((acc, item) => acc + item.total, 0)
  
  const discount = data.discount || 0
  // Apply discount proportionally to taxable base if exists
  const discountOnTaxable = subtotal > 0 ? (taxableSubtotal / subtotal) * discount : 0
  const netTaxable = Math.max(0, taxableSubtotal - discountOnTaxable)

  const itbisRate = data.itbisRate !== undefined ? data.itbisRate : 18
  const itbis = netTaxable * (itbisRate / 100)
  const total = Math.max(0, subtotal - discount) + itbis

  const invoice = await prisma.invoice.create({
    data: {
      companyId: company.id,
      number: invoiceNumber,
      ncfType: data.ncfType,
      ncf: ncf,
      ncfExpiry: company.ncfExpiry || '31/12/2026',
      clientId: data.clientId,
      status: data.status,
      paymentMethod: data.paymentMethod,
      notes: data.notes,
      subtotal,
      taxableSubtotal,
      exemptSubtotal,
      discount,
      itbisRate,
      itbis,
      total,
      items: {
        create: data.items.map(item => ({
          productId: item.productId || null,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          hasItbis: item.hasItbis,
          total: item.total
        }))
      },
      transactions: {
        create: {
          companyId: company.id,
          clientId: data.clientId,
          amount: total,
          type: 'INCOME',
          status: data.status === 'PAID' ? 'PAID' : 'PENDING',
          description: ncf ? `Factura NCF ${ncf}` : `Factura ${invoiceNumber}`
        }
      }
    }
  })

  // Reduce product stocks
  for (const item of data.items) {
    if (item.productId) {
      await prisma.product.update({
        where: { id: item.productId },
        data: {
          stock: { decrement: item.quantity }
        }
      }).catch(() => {})
    }
  }

  revalidatePath('/invoices')
  revalidatePath('/transactions')
  revalidatePath('/products')
  revalidatePath('/settings')
  revalidatePath('/')

  return invoice.id
}

export async function markInvoicePaid(id: string) {
  await prisma.invoice.update({
    where: { id },
    data: { status: 'PAID' }
  })

  await prisma.transaction.updateMany({
    where: { invoiceId: id },
    data: { status: 'PAID' }
  })

  revalidatePath(`/invoices/${id}`)
  revalidatePath('/invoices')
  revalidatePath('/transactions')
  revalidatePath('/')
}

export async function deleteInvoice(id: string) {
  await prisma.transaction.deleteMany({
    where: { invoiceId: id }
  })

  await prisma.invoice.delete({
    where: { id }
  })

  revalidatePath('/invoices')
  revalidatePath('/transactions')
  revalidatePath('/')
}