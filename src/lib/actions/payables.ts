'use server'

import { prisma } from '@/lib/prisma'
import { getActiveCompany } from './companies'
import { revalidatePath } from 'next/cache'

export async function getPayables() {
  const company = await getActiveCompany()
  return await prisma.transaction.findMany({
    where: { 
      type: 'EXPENSE',
      companyId: company.id 
    },
    orderBy: { createdAt: 'desc' },
    include: {
      client: true
    }
  })
}

export async function createPayable(formData: FormData) {
  const company = await getActiveCompany()
  const amount = parseFloat(formData.get('amount') as string) || 0
  const description = (formData.get('description') as string)?.trim() || 'Gasto / Factura de proveedor'
  const clientId = (formData.get('clientId') as string)?.trim() || null
  const category = (formData.get('category') as string)?.trim() || 'Mercancía'
  const ncfOrBillNo = (formData.get('ncfOrBillNo') as string)?.trim() || null
  const dueDateStr = formData.get('dueDate') as string
  const dueDate = dueDateStr ? new Date(dueDateStr) : null
  const status = (formData.get('status') as string) || 'PENDING'
  const paymentMethod = (formData.get('paymentMethod') as string) || (status === 'PAID' ? 'EFECTIVO' : null)

  await prisma.transaction.create({
    data: {
      companyId: company.id,
      amount,
      type: 'EXPENSE',
      status,
      description,
      clientId,
      category,
      ncfOrBillNo,
      dueDate,
      paymentMethod
    }
  })

  revalidatePath('/payables')
  revalidatePath('/transactions')
  revalidatePath('/')
}

export async function markPayablePaid(id: string, paymentMethod: string = 'TRANSFERENCIA') {
  await prisma.transaction.update({
    where: { id },
    data: {
      status: 'PAID',
      paymentMethod
    }
  })

  revalidatePath('/payables')
  revalidatePath('/transactions')
  revalidatePath('/')
}

export async function deletePayable(id: string) {
  await prisma.transaction.delete({
    where: { id }
  })

  revalidatePath('/payables')
  revalidatePath('/transactions')
  revalidatePath('/')
}