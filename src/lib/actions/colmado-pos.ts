'use server'

import { prisma } from '@/lib/prisma'
import { getActiveCompany } from './companies'
import { revalidatePath } from 'next/cache'
import os from 'os'

export interface PosItemInput {
  productId?: string
  description: string
  quantity: number
  unitPrice: number
  hasItbis: boolean
  total: number
}

// 1. Obtener productos para el mostrador táctil
export async function getColmadoProducts() {
  const company = await getActiveCompany()
  return await prisma.product.findMany({
    where: { companyId: company.id },
    orderBy: [
      { isPopular: 'desc' },
      { category: 'asc' },
      { name: 'asc' }
    ]
  })
}

// 2. Obtener vecinos / clientes para fiao y mostrador
export async function getColmadoClients() {
  const company = await getActiveCompany()
  return await prisma.client.findMany({
    where: { companyId: company.id },
    orderBy: [
      { creditBalance: 'desc' },
      { name: 'asc' }
    ]
  })
}

// 3. Venta Rápida de Mostrador en Efectivo / Tarjeta
export async function createPosSale(data: {
  clientId?: string
  items: PosItemInput[]
  amountPaid: number
  changeReturn: number
  paymentMethod?: string
  notes?: string
}) {
  const company = await getActiveCompany()

  // Si no se especifica cliente, usar o crear "Consumidor Final"
  let clientId = data.clientId
  if (!clientId) {
    let finalClient = await prisma.client.findFirst({
      where: { companyId: company.id, name: 'Consumidor Final' }
    })
    if (!finalClient) {
      finalClient = await prisma.client.create({
        data: {
          companyId: company.id,
          name: 'Consumidor Final',
          nickname: 'Mostrador',
          creditLimit: 0,
          creditBalance: 0
        }
      })
    }
    clientId = finalClient.id
  }

  // Generar NCF B02 (Consumo)
  const ncf = `B02${String(company.ncfB02Seq).padStart(8, '0')}`
  await prisma.company.update({
    where: { id: company.id },
    data: { ncfB02Seq: { increment: 1 } }
  })

  // Generar número secuencial interno
  const allInvoices = await prisma.invoice.findMany({ select: { number: true } })
  let maxSeq = 0
  for (const inv of allInvoices) {
    const match = inv.number.match(/FAC-(\d+)/)
    if (match) {
      const num = parseInt(match[1], 10)
      if (num > maxSeq) maxSeq = num
    }
  }
  let nextSeq = maxSeq + 1
  let invoiceNumber = `FAC-${String(nextSeq).padStart(4, '0')}`
  while (await prisma.invoice.findUnique({ where: { number: invoiceNumber } })) {
    nextSeq++
    invoiceNumber = `FAC-${String(nextSeq).padStart(4, '0')}`
  }

  // Cálculos ITBIS
  const subtotal = data.items.reduce((acc, item) => acc + item.total, 0)
  const taxableSubtotal = data.items.filter(i => i.hasItbis).reduce((acc, item) => acc + item.total, 0)
  const exemptSubtotal = data.items.filter(i => !i.hasItbis).reduce((acc, item) => acc + item.total, 0)
  const itbis = taxableSubtotal * 0.18
  const total = subtotal + itbis

  const invoice = await prisma.invoice.create({
    data: {
      companyId: company.id,
      number: invoiceNumber,
      ncfType: 'B02',
      ncf: ncf,
      ncfExpiry: company.ncfExpiry || '31/12/2026',
      clientId: clientId,
      status: 'PAID',
      paymentMethod: data.paymentMethod || 'EFECTIVO',
      isFiao: false,
      amountPaid: data.amountPaid,
      changeReturn: data.changeReturn,
      notes: data.notes || 'Venta rápida de mostrador',
      subtotal,
      taxableSubtotal,
      exemptSubtotal,
      itbisRate: 18,
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
          clientId: clientId,
          amount: total,
          type: 'INCOME',
          status: 'PAID',
          description: `Venta POS ${invoiceNumber} (${ncf})`
        }
      }
    },
    include: {
      client: true,
      items: true
    }
  })

  // Descontar inventario
  for (const item of data.items) {
    if (item.productId) {
      await prisma.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } }
      }).catch(() => {})
    }
  }

  revalidatePath('/pos')
  revalidatePath('/invoices')
  revalidatePath('/transactions')
  revalidatePath('/caja-diaria')
  revalidatePath('/products')
  revalidatePath('/')

  return { success: true, invoice }
}

// 4. Venta a Crédito / Fiao a Vecino
export async function createFiaoSale(data: {
  clientId: string
  items: PosItemInput[]
  newBottleDebt?: string
  deliveryMan?: string
  changeGiven?: number
  notes?: string
}) {
  const company = await getActiveCompany()

  const client = await prisma.client.findUnique({
    where: { id: data.clientId }
  })

  if (!client) {
    throw new Error('Cliente o vecino no encontrado')
  }

  // Generar NCF B02
  const ncf = `B02${String(company.ncfB02Seq).padStart(8, '0')}`
  await prisma.company.update({
    where: { id: company.id },
    data: { ncfB02Seq: { increment: 1 } }
  })

  // Generar número correlativo
  const allInvoices = await prisma.invoice.findMany({ select: { number: true } })
  let maxSeq = 0
  for (const inv of allInvoices) {
    const match = inv.number.match(/FAC-(\d+)/)
    if (match) {
      const num = parseInt(match[1], 10)
      if (num > maxSeq) maxSeq = num
    }
  }
  let nextSeq = maxSeq + 1
  let invoiceNumber = `FAC-${String(nextSeq).padStart(4, '0')}`
  while (await prisma.invoice.findUnique({ where: { number: invoiceNumber } })) {
    nextSeq++
    invoiceNumber = `FAC-${String(nextSeq).padStart(4, '0')}`
  }

  // Cálculos
  const subtotal = data.items.reduce((acc, item) => acc + item.total, 0)
  const taxableSubtotal = data.items.filter(i => i.hasItbis).reduce((acc, item) => acc + item.total, 0)
  const exemptSubtotal = data.items.filter(i => !i.hasItbis).reduce((acc, item) => acc + item.total, 0)
  const itbis = taxableSubtotal * 0.18
  const total = subtotal + itbis

  const invoice = await prisma.invoice.create({
    data: {
      companyId: company.id,
      number: invoiceNumber,
      ncfType: 'B02',
      ncf: ncf,
      ncfExpiry: company.ncfExpiry || '31/12/2026',
      clientId: data.clientId,
      status: 'PENDING',
      paymentMethod: 'CREDITO',
      isFiao: true,
      deliveryMan: data.deliveryMan || null,
      changeGiven: data.changeGiven || null,
      notes: data.notes || `Fiao a ${client.nickname || client.name}`,
      subtotal,
      taxableSubtotal,
      exemptSubtotal,
      itbisRate: 18,
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
          status: 'PENDING',
          description: `Fiao ${invoiceNumber} - ${client.nickname || client.name}`
        }
      }
    },
    include: {
      client: true,
      items: true
    }
  })

  // Aumentar balance de crédito del cliente y registrar deuda de botellas si aplica
  const updateData: any = {
    creditBalance: { increment: total }
  }
  if (data.newBottleDebt) {
    updateData.bottleDebt = data.newBottleDebt
  }

  const updatedClient = await prisma.client.update({
    where: { id: data.clientId },
    data: updateData
  })

  // Descontar inventario
  for (const item of data.items) {
    if (item.productId) {
      await prisma.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } }
      }).catch(() => {})
    }
  }

  revalidatePath('/pos')
  revalidatePath('/fiao')
  revalidatePath('/invoices')
  revalidatePath('/transactions')
  revalidatePath('/contacts')
  revalidatePath('/')

  return { success: true, invoice, updatedClient }
}

// 5. Abonar o Salir de Fiao (Pago de Cliente)
export async function recordClientAbono(data: {
  clientId: string
  amount: number
  paymentMethod?: string
  bottleReturned?: string
  notes?: string
}) {
  const company = await getActiveCompany()
  const client = await prisma.client.findUnique({
    where: { id: data.clientId }
  })

  if (!client) {
    throw new Error('Cliente no encontrado')
  }

  const newBalance = Math.max(0, client.creditBalance - data.amount)

  const updateData: any = {
    creditBalance: newBalance
  }
  if (data.bottleReturned) {
    updateData.bottleDebt = data.bottleReturned
  }

  const updatedClient = await prisma.client.update({
    where: { id: data.clientId },
    data: updateData
  })

  // Registrar transacción de ingreso por abono
  await prisma.transaction.create({
    data: {
      companyId: company.id,
      clientId: data.clientId,
      amount: data.amount,
      type: 'INCOME',
      status: 'PAID',
      paymentMethod: data.paymentMethod || 'EFECTIVO',
      description: `Abono Fiao: ${client.nickname || client.name}${data.notes ? ` - ${data.notes}` : ''}`
    }
  })

  revalidatePath('/pos')
  revalidatePath('/fiao')
  revalidatePath('/transactions')
  revalidatePath('/caja-diaria')
  revalidatePath('/contacts')
  revalidatePath('/')

  return { success: true, updatedClient }
}

// 6. Actualizar información de fiao/envases de un cliente
export async function updateClientCreditInfo(data: {
  clientId: string
  nickname?: string
  creditLimit?: number
  bottleDebt?: string
  phone?: string
  address?: string
}) {
  const updated = await prisma.client.update({
    where: { id: data.clientId },
    data: {
      ...(data.nickname !== undefined && { nickname: data.nickname }),
      ...(data.creditLimit !== undefined && { creditLimit: data.creditLimit }),
      ...(data.bottleDebt !== undefined && { bottleDebt: data.bottleDebt }),
      ...(data.phone !== undefined && { phone: data.phone }),
      ...(data.address !== undefined && { address: data.address })
    }
  })

  revalidatePath('/fiao')
  revalidatePath('/contacts')
  revalidatePath('/pos')
  return updated
}

// 7. Resumen de la Libreta de Fiao (Cuentas por Cobrar)
export async function getFiaoSummary() {
  const company = await getActiveCompany()
  const clients = await prisma.client.findMany({
    where: {
      companyId: company.id
    },
    orderBy: [
      { creditBalance: 'desc' },
      { name: 'asc' }
    ],
    include: {
      invoices: {
        where: { isFiao: true },
        orderBy: { createdAt: 'desc' },
        take: 10
      }
    }
  })

  const debtors = clients.filter(c => c.creditBalance > 0)
  const totalStreetMoney = debtors.reduce((acc, c) => acc + c.creditBalance, 0)
  const totalDebtors = debtors.length

  return {
    clients,
    debtors,
    totalStreetMoney,
    totalDebtors
  }
}

// 8. Anotar Fiado Rápido (Número tras número, sin detallar productos)
export async function recordQuickCharge(data: {
  clientId: string
  amount: number
  note?: string
  newBottleDebt?: string
}) {
  const company = await getActiveCompany()
  const client = await prisma.client.findUnique({
    where: { id: data.clientId }
  })

  if (!client) {
    throw new Error('Cliente o vecino no encontrado')
  }

  const prevBalance = client.creditBalance
  const newBalance = prevBalance + data.amount

  // Generar NCF B02
  const ncf = `B02${String(company.ncfB02Seq).padStart(8, '0')}`
  await prisma.company.update({
    where: { id: company.id },
    data: { ncfB02Seq: { increment: 1 } }
  })

  // Generar correlativo interno
  const allInvoices = await prisma.invoice.findMany({ select: { number: true } })
  let maxSeq = 0
  for (const inv of allInvoices) {
    const match = inv.number.match(/FAC-(\d+)/)
    if (match) {
      const num = parseInt(match[1], 10)
      if (num > maxSeq) maxSeq = num
    }
  }
  let nextSeq = maxSeq + 1
  let invoiceNumber = `FAC-${String(nextSeq).padStart(4, '0')}`
  while (await prisma.invoice.findUnique({ where: { number: invoiceNumber } })) {
    nextSeq++
    invoiceNumber = `FAC-${String(nextSeq).padStart(4, '0')}`
  }

  const noteText = data.note?.trim() || 'Consumo / Fiao'

  const invoice = await prisma.invoice.create({
    data: {
      companyId: company.id,
      number: invoiceNumber,
      ncfType: 'B02',
      ncf: ncf,
      ncfExpiry: company.ncfExpiry || '31/12/2026',
      clientId: data.clientId,
      status: 'PENDING',
      paymentMethod: 'CREDITO',
      isFiao: true,
      notes: noteText,
      subtotal: data.amount,
      taxableSubtotal: 0,
      exemptSubtotal: data.amount,
      itbisRate: 0,
      itbis: 0,
      total: data.amount,
      items: {
        create: [
          {
            description: noteText,
            quantity: 1,
            unitPrice: data.amount,
            hasItbis: false,
            total: data.amount
          }
        ]
      },
      transactions: {
        create: {
          companyId: company.id,
          clientId: data.clientId,
          amount: data.amount,
          type: 'INCOME',
          status: 'PENDING',
          description: `Fiao ${invoiceNumber}: ${noteText}`
        }
      }
    },
    include: {
      client: true,
      items: true
    }
  })

  const updateData: any = {
    creditBalance: newBalance
  }
  if (data.newBottleDebt) {
    updateData.bottleDebt = data.newBottleDebt
  }

  const updatedClient = await prisma.client.update({
    where: { id: data.clientId },
    data: updateData
  })

  revalidatePath('/fiao')
  revalidatePath('/pos')
  revalidatePath('/invoices')
  revalidatePath('/transactions')
  revalidatePath('/contacts')
  revalidatePath('/')

  return {
    success: true,
    invoice,
    updatedClient,
    previousBalance: prevBalance,
    newBalance: newBalance
  }
}

// 9. Crear Cliente Rápido desde la Libreta
export async function createQuickClient(data: {
  name: string
  nickname?: string
  phone?: string
  address?: string
  creditLimit?: number
  initialDebt?: number
  bottleDebt?: string
}) {
  const company = await getActiveCompany()
  const initialDebt = data.initialDebt && data.initialDebt > 0 ? data.initialDebt : 0

  const client = await prisma.client.create({
    data: {
      companyId: company.id,
      name: data.name.trim(),
      nickname: data.nickname?.trim() || data.name.trim(),
      phone: data.phone?.trim() || null,
      address: data.address?.trim() || null,
      creditLimit: data.creditLimit || 3000,
      creditBalance: initialDebt,
      bottleDebt: data.bottleDebt?.trim() || null,
      type: 'CLIENT'
    }
  })

  if (initialDebt > 0) {
    await prisma.transaction.create({
      data: {
        companyId: company.id,
        clientId: client.id,
        amount: initialDebt,
        type: 'INCOME',
        status: 'PENDING',
        description: 'Balance inicial traído de la libreta de papel'
      }
    })
  }

  revalidatePath('/fiao')
  revalidatePath('/contacts')
  revalidatePath('/pos')
  revalidatePath('/')

  return client
}

// 10. Historial de Libreta (Movimientos de cargo y abono estilo cuaderno)
export async function getClientHistory(clientId: string) {
  const [invoices, transactions, client] = await Promise.all([
    prisma.invoice.findMany({
      where: { clientId, isFiao: true },
      orderBy: { createdAt: 'desc' },
      include: { items: true },
      take: 50
    }),
    prisma.transaction.findMany({
      where: { clientId },
      orderBy: { date: 'desc' },
      take: 50
    }),
    prisma.client.findUnique({
      where: { id: clientId }
    })
  ])

  return { invoices, transactions, client }
}

// 11. Información del servidor local para conexión móvil
export async function getLocalServerInfo() {
  const interfaces = os.networkInterfaces()
  let localIp = 'localhost'
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      if (iface.family === 'IPv4' && !iface.internal) {
        localIp = iface.address
        break
      }
    }
    if (localIp !== 'localhost') break
  }
  return { localIp, port: 3000 }
}

