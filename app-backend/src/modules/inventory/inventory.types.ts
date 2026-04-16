export interface PostInventory {
    item_name: string
    unit: string
    quantity?: number
    reorder_level?: number
    cost_per_unit?: number
    supplier?: string
}

export interface GetInventory {
    inventory_id: number
}

export interface PutInventory {
    inventory_id: number
    item_name?: string
    unit?: string
    quantity?: number
    reorder_level?: number
    cost_per_unit?: number
    supplier?: string
    is_active?: boolean
}

export interface DeleteInventory {
    inventory_id: number
}