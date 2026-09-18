'use server'

import { getActiveCompany, updateActiveCompany } from './companies'

export async function getCompanySettings() {
  return await getActiveCompany()
}

export async function updateCompanySettings(formData: FormData) {
  return await updateActiveCompany(formData)
}