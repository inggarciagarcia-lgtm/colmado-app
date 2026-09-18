'use server'

import { prisma } from '@/lib/prisma'
import { getActiveCompany } from './companies'
import { revalidatePath } from 'next/cache'

export interface FiaoItemInput {
  productId?: string
  description: string
  quantity: number
  unitPrice: number
  total: number
}

// 1. Obtener datos completos para la app de fiao
export async function getFiaoDashboardData() {
  const company = await getActiveCompany()

  const [allClients, products] = await Promise.all([
    prisma.client.findMany({
      where: { companyId: company.id },
      orderBy: [
        { creditBalance: 'desc' },
        { name: 'asc' }
      ],
      include: {
        invoices: {
          where: { isFiao: true },
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: { items: true }
        },
        transactions: {
          where: { type: 'INCOME' },
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    }),
    prisma.product.findMany({
      where: { companyId: company.id },
      orderBy: { name: 'asc' }
    })
  ])

  const totalStreetMoney = allClients.reduce((sum, c) => sum + (c.creditBalance || 0), 0)
  const totalDebtors = allClients.filter(c => (c.creditBalance || 0) > 0).length
  const totalBottleDebtors = allClients.filter(c => c.bottleDebt && c.bottleDebt !== 'Al día').length

  return {
    clients: allClients,
    products,
    totalStreetMoney,
    totalDebtors,
    totalBottleDebtors
  }
}

// 2. Registrar nuevo cliente / vecino para fiao
export async function registerFiaoClient(data: {
  name: string
  nickname?: string
  phone?: string
  address?: string
  creditLimit?: number
  initialDebt?: number
  bottleDebt?: string
}) {
  const company = await getActiveCompany()

  const initialDebt = data.initialDebt ? Math.max(0, data.initialDebt) : 0

  const client = await prisma.client.create({
    data: {
      companyId: company.id,
      name: data.name.trim(),
      nickname: data.nickname?.trim() || null,
      phone: data.phone?.trim() || null,
      address: data.address?.trim() || null,
      creditLimit: data.creditLimit && data.creditLimit > 0 ? data.creditLimit : 3000,
      creditBalance: initialDebt,
      bottleDebt: data.bottleDebt?.trim() || null
    }
  })

  // Si tenía deuda inicial previa, registrar la factura/transacción de saldo inicial
  if (initialDebt > 0) {
    const nextSeq = (await prisma.invoice.count()) + 1
    const invoiceNumber = `FIAO-${String(nextSeq).padStart(4, '0')}`
    
    await prisma.invoice.create({
      data: {
        companyId: company.id,
        number: invoiceNumber,
        ncfType: 'NONE',
        clientId: client.id,
        status: 'PENDING',
        paymentMethod: 'CREDITO',
        isFiao: true,
        notes: 'Saldo anterior traído a la libreta',
        subtotal: initialDebt,
        taxableSubtotal: 0,
        exemptSubtotal: initialDebt,
        itbisRate: 0,
        itbis: 0,
        total: initialDebt,
        items: {
          create: [{
            description: 'Saldo previo de libreta anterior',
            quantity: 1,
            unitPrice: initialDebt,
            hasItbis: false,
            total: initialDebt
          }]
        },
        transactions: {
          create: {
            companyId: company.id,
            clientId: client.id,
            amount: initialDebt,
            type: 'INCOME',
            status: 'PENDING',
            description: `Saldo inicial fiao: ${client.nickname || client.name}`
          }
        }
      }
    })
  }

  revalidatePath('/fiao')
  revalidatePath('/pos')
  revalidatePath('/contacts')
  revalidatePath('/')

  return client
}

// 3. ANOTAR FIAO MODO RÁPIDO: Solo digitar el total en RD$ (sin productos obligatorios)
export async function createDirectAmountFiao(data: {
  clientId: string
  amount: number
  note?: string
  bottleDebt?: string
}) {
  const company = await getActiveCompany()
  const amount = Math.max(0, data.amount)

  if (amount <= 0) {
    throw new Error('El monto del fiao debe ser mayor a RD$ 0.00')
  }

  const client = await prisma.client.findUnique({
    where: { id: data.clientId }
  })

  if (!client) {
    throw new Error('Cliente o vecino no encontrado')
  }

  // Correlativo único
  const count = await prisma.invoice.count()
  let nextSeq = count + 1
  let invoiceNumber = `FIAO-${String(nextSeq).padStart(4, '0')}`
  while (await prisma.invoice.findUnique({ where: { number: invoiceNumber } })) {
    nextSeq++
    invoiceNumber = `FIAO-${String(nextSeq).padStart(4, '0')}`
  }

  const conceptNote = data.note?.trim() || 'Fiao de mostrador'

  const invoice = await prisma.invoice.create({
    data: {
      companyId: company.id,
      number: invoiceNumber,
      ncfType: 'NONE',
      clientId: data.clientId,
      status: 'PENDING',
      paymentMethod: 'CREDITO',
      isFiao: true,
      notes: conceptNote,
      subtotal: amount,
      taxableSubtotal: 0,
      exemptSubtotal: amount,
      itbisRate: 0,
      itbis: 0,
      total: amount,
      items: {
        create: [{
          description: conceptNote,
          quantity: 1,
          unitPrice: amount,
          hasItbis: false,
          total: amount
        }]
      },
      transactions: {
        create: {
          companyId: company.id,
          clientId: data.clientId,
          amount: amount,
          type: 'INCOME',
          status: 'PENDING',
          description: `Fiao ${invoiceNumber}: ${conceptNote} (RD$ ${amount.toFixed(2)})`
        }
      }
    }
  })

  // Actualizar balance del cliente y deuda de botellas
  const updateData: any = {
    creditBalance: { increment: amount }
  }
  if (data.bottleDebt) {
    updateData.bottleDebt = data.bottleDebt
  }

  const updatedClient = await prisma.client.update({
    where: { id: data.clientId },
    data: updateData
  })

  revalidatePath('/fiao')
  revalidatePath('/pos')
  revalidatePath('/transactions')
  revalidatePath('/')

  return { success: true, invoice, updatedClient }
}

// 4. ANOTAR FIAO MODO DETALLADO: Desglose de artículos o productos que se llevó
export async function createDetailedFiao(data: {
  clientId: string
  items: FiaoItemInput[]
  note?: string
  bottleDebt?: string
}) {
  const company = await getActiveCompany()

  if (!data.items || data.items.length === 0) {
    throw new Error('Debe agregar al menos un artículo a la cuenta')
  }

  const client = await prisma.client.findUnique({
    where: { id: data.clientId }
  })

  if (!client) {
    throw new Error('Cliente o vecino no encontrado')
  }

  const total = data.items.reduce((sum, item) => sum + item.total, 0)
  if (total <= 0) {
    throw new Error('El total del fiao debe ser mayor a RD$ 0.00')
  }

  // Correlativo único
  const count = await prisma.invoice.count()
  let nextSeq = count + 1
  let invoiceNumber = `FIAO-${String(nextSeq).padStart(4, '0')}`
  while (await prisma.invoice.findUnique({ where: { number: invoiceNumber } })) {
    nextSeq++
    invoiceNumber = `FIAO-${String(nextSeq).padStart(4, '0')}`
  }

  const conceptNote = data.note?.trim() || `Fiao detallado a ${client.nickname || client.name}`

  const invoice = await prisma.invoice.create({
    data: {
      companyId: company.id,
      number: invoiceNumber,
      ncfType: 'NONE',
      clientId: data.clientId,
      status: 'PENDING',
      paymentMethod: 'CREDITO',
      isFiao: true,
      notes: conceptNote,
      subtotal: total,
      taxableSubtotal: 0,
      exemptSubtotal: total,
      itbisRate: 0,
      itbis: 0,
      total: total,
      items: {
        create: data.items.map(item => ({
          productId: item.productId || null,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          hasItbis: false,
          total: item.total
        }))
      },
      transactions: {
        create: {
          companyId: company.id,
          clientId: data.clientId,
          amount: total,
          type: 'INCOME',
          status: 'PENDING',
          description: `Fiao ${invoiceNumber}: ${data.items.length} artículos (RD$ ${total.toFixed(2)})`
        }
      }
    },
    include: { items: true }
  })

  // Disminuir inventario de productos si están vinculados
  for (const item of data.items) {
    if (item.productId) {
      await prisma.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } }
      }).catch(() => {})
    }
  }

  // Actualizar balance de crédito del cliente
  const updateData: any = {
    creditBalance: { increment: total }
  }
  if (data.bottleDebt) {
    updateData.bottleDebt = data.bottleDebt
  }

  const updatedClient = await prisma.client.update({
    where: { id: data.clientId },
    data: updateData
  })

  revalidatePath('/fiao')
  revalidatePath('/pos')
  revalidatePath('/transactions')
  revalidatePath('/products')
  revalidatePath('/')

  return { success: true, invoice, updatedClient }
}

// 5. Obtener historial completo de fiao de un cliente específico
export async function getClientFiaoHistory(clientId: string) {
  const [client, invoices, payments] = await Promise.all([
    prisma.client.findUnique({
      where: { id: clientId }
    }),
    prisma.invoice.findMany({
      where: { clientId, isFiao: true },
      orderBy: { createdAt: 'desc' },
      include: { items: true }
    }),
    prisma.transaction.findMany({
      where: { 
        clientId, 
        type: 'INCOME', 
        status: 'PAID',
        description: { contains: 'Abono' }
      },
      orderBy: { createdAt: 'desc' }
    })
  ])

  return { client, invoices, payments }
}
