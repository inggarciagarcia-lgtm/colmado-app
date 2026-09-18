'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function getTransactions() {
  return await prisma.transaction.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      client: true
    }
  })
}

export async function createTransaction(formData: FormData) {
  const amount = parseFloat(formData.get('amount') as string)
  const type = formData.get('type') as string
  const description = formData.get('description') as string
  const clientId = formData.get('clientId') as string || null
  const status = formData.get('status') as string

  await prisma.transaction.create({
    data: { amount, type, description, clientId, status }
  })

  revalidatePath('/transactions')
  revalidatePath('/') // update dashboard
}

export async function deleteTransaction(id: string) {
  await prisma.transaction.delete({
    where: { id }
  })
  revalidatePath('/transactions')
  revalidatePath('/')
}

export async function markAsPaid(id: string) {
  await prisma.transaction.update({
    where: { id },
    data: { status: 'PAID' }
  })
  revalidatePath('/transactions')
  revalidatePath('/')
}