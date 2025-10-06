import { eq } from 'drizzle-orm'
import type { InsertCustomer, Customer } from '@@/types/database'
import { createError } from 'h3'

export const getCustomerByUserId = async (userId: string) => {
  try {
    const customer = await useDB().query.customers.findFirst({
      where: eq(tables.customers.userId, userId),
    })
    return customer
  } catch (error) {
    console.error(error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to find customer by user ID',
    })
  }
}

export const createCustomer = async (
  payload: InsertCustomer,
): Promise<Customer> => {
  try {
    const [customer] = await useDB()
      .insert(tables.customers)
      .values(payload)
      .returning()
    return customer
  } catch (error) {
    console.error(error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to create customer',
    })
  }
}

export const getCustomerById = async (id: string) => {
  try {
    const customer = await useDB().query.customers.findFirst({
      where: eq(tables.customers.id, id),
    })
    return customer
  } catch (error) {
    console.error(error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to find customer by ID',
    })
  }
}
