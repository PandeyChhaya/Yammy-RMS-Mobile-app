export interface TableData {
  table_id:     number
  table_number: string
  floor:        string
  capacity:     number
  table_status: 'Available' | 'Occupied' | 'Reserved' | 'Maintenance'
  is_active:    boolean
  created_at:   string
  updated_at:   string
}

export interface CreateTableRequest {
  table_number: string
  floor:        string
  capacity:     number
}

export interface UpdateTableRequest {
  table_number?: string
  floor?:        string
  capacity?:     number
  table_status?: TableData['table_status']
}