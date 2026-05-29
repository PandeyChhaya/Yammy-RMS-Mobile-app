import { authService } from '../../auth/services/auth.service'
import { CreateTableRequest, TableData, UpdateTableRequest } from '../../pos/types/tables'

const BASE_URL = 'http://10.78.34.24:5000/api/table'

const auth_headers = async () => {
  const token = await authService.getToken()
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  }
}

const getTable = async (): Promise<TableData[]> => {
  const response = await fetch(BASE_URL, {
    method: 'GET',
    headers: await auth_headers(),
  })
  const data = await response.json()
  if (!response.ok) throw new Error(data.message || 'Failed to load tables')
  if (!Array.isArray(data)) throw new Error('Unexpected response format')
  return data
}

const postTable = async (table: CreateTableRequest): Promise<TableData> => {
  const response = await fetch(BASE_URL, {
    method: 'POST',
    headers: await auth_headers(),
    body: JSON.stringify(table),
  })
  const data = await response.json()
  if (!response.ok) throw new Error(data.message)
  return data
}

const putTable = async (table_id: number, updates: UpdateTableRequest): Promise<TableData> => {
  const response = await fetch(`${BASE_URL}/${table_id}`, {
    method: 'PUT',
    headers: await auth_headers(),
    body: JSON.stringify(updates),
  })
  const data = await response.json()
  if (!response.ok) throw new Error(data.message)
  return data
}

const deleteTable = async (table_id: number): Promise<TableData> => {
  const response = await fetch(`${BASE_URL}/${table_id}`, {
    method: 'DELETE',
    headers: await auth_headers(),
  })
  const data = await response.json()
  if (!response.ok) throw new Error(data.message)
  return data
}

const tableService = { getTable, postTable, putTable, deleteTable }
export default tableService