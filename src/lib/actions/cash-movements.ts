'use server'

import { prisma } from '@/lib/prisma'
import { getActiveCompany } from './companies'
import { revalidatePath } from 'next/cache'

export interface CashItemInput {
  productId?: string
  description: string
  quantity: number
  unitPrice: number
  total: number
  addToStock?: boolean
}

export interface CreateCashMovementInput {
  category: 'COMPRA_PRODUCTOS' | 'PAGO_EMPLEADOS' | 'OTROS_GASTOS' | 'FONDO_INICIAL'
  description: string
  amount: number
  responsible?: string
  notes?: string
  date?: string
  items?: CashItemInput[]
}

export async function getDailyCashSummary(dateStr?: string) {
  const company = await getActiveCompany()

  // Base date range for the day in local time
  const targetDate = dateStr ? new Date(dateStr + 'T12:00:00') : new Date()
  const startOfDay = new Date(targetDate)
  startOfDay.setHours(0, 0, 0, 0)

  const endOfDay = new Date(targetDate)
  endOfDay.setHours(23, 59, 59, 999)

  // 1. Inflow from Cash Sales (Invoices with paymentMethod = 'EFECTIVO' and status = 'PAID')
  const cashInvoices = await prisma.invoice.findMany({
    where: {
      companyId: company.id,
      paymentMethod: 'EFECTIVO',
      createdAt: {
        gte: startOfDay,
        lte: endOfDay
      }
    }
  })
  const totalCashSales = cashInvoices.reduce((sum, inv) => sum + inv.total, 0)

  // 2. Outflow cash movements
  const movements = await prisma.cashMovement.findMany({
    where: {
      companyId: company.id,
      date: {
        gte: startOfDay,
        lte: endOfDay
      }
    },
    include: {
      items: true
    },
    orderBy: { createdAt: 'desc' }
  })

  let totalProductPurchases = 0
  let totalEmployeePayments = 0
  let totalOtherExpenses = 0
  let initialCashFund = 0

  for (const m of movements) {
    if (m.category === 'COMPRA_PRODUCTOS') {
      totalProductPurchases += m.amount
    } else if (m.category === 'PAGO_EMPLEADOS') {
      totalEmployeePayments += m.amount
    } else if (m.category === 'OTROS_GASTOS') {
      totalOtherExpenses += m.amount
    } else if (m.category === 'FONDO_INICIAL') {
      initialCashFund += m.amount
    }
  }

  const totalCashOutflows = totalProductPurchases + totalEmployeePayments + totalOtherExpenses
  const netCashBalance = initialCashFund + totalCashSales - totalCashOutflows

  return {
    date: startOfDay.toISOString().split('T')[0],
    companyName: company.name,
    totalCashSales,
    totalProductPurchases,
    totalEmployeePayments,
    totalOtherExpenses,
    initialCashFund,
    totalCashOutflows,
    netCashBalance,
    movements,
    cashInvoicesCount: cashInvoices.length
  }
}

export async function createCashMovement(input: CreateCashMovementInput) {
  const company = await getActiveCompany()

  const movementDate = input.date ? new Date(input.date + 'T12:00:00') : new Date()

  const movement = await prisma.cashMovement.create({
    data: {
      companyId: company.id,
      type: input.category === 'FONDO_INICIAL' ? 'INFLOW' : 'OUTFLOW',
      category: input.category,
      description: input.description,
      amount: input.amount,
      responsible: input.responsible,
      notes: input.notes,
      date: movementDate,
      items: input.items && input.items.length > 0 ? {
        create: input.items.map(item => ({
          productId: item.productId || null,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.total,
          addToStock: Boolean(item.addToStock && item.productId)
        }))
      } : undefined
    }
  })

  // If items have addToStock = true, increment product stock in inventory
  if (input.items && input.items.length > 0) {
    for (const item of input.items) {
      if (item.addToStock && item.productId) {
        await prisma.product.update({
          where: { id: item.productId },
          data: {
            stock: { increment: Math.round(item.quantity) }
          }
        }).catch(() => {})
      }
    }
  }

  // Also record in general Transaction table for accounting
  await prisma.transaction.create({
    data: {
      companyId: company.id,
      amount: input.amount,
      type: input.category === 'FONDO_INICIAL' ? 'INCOME' : 'EXPENSE',
      status: 'PAID',
      category: input.category === 'COMPRA_PRODUCTOS' ? 'Mercancía' : 
                input.category === 'PAGO_EMPLEADOS' ? 'Nómina' : 'Otros Gastos',
      description: `[Caja Efectivo] ${input.description}` + (input.responsible ? ` (${input.responsible})` : ''),
      paymentMethod: 'EFECTIVO',
      date: movementDate
    }
  }).catch(() => {})

  revalidatePath('/caja-diaria')
  revalidatePath('/products')
  revalidatePath('/transactions')
  revalidatePath('/')

  return movement.id
}

export async function deleteCashMovement(id: string) {
  const movement = await prisma.cashMovement.findUnique({
    where: { id },
    include: { items: true }
  })

  if (!movement) return

  // If items were added to stock, decrement them back
  for (const item of movement.items) {
    if (item.addToStock && item.productId) {
      await prisma.product.update({
        where: { id: item.productId },
        data: {
          stock: { decrement: Math.round(item.quantity) }
        }
      }).catch(() => {})
    }
  }

  await prisma.cashMovement.delete({
    where: { id }
  })

  revalidatePath('/caja-diaria')
  revalidatePath('/products')
  revalidatePath('/transactions')
  revalidatePath('/')
}
