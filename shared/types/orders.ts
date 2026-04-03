export interface OrderItem {
    order_item_id: number
    order_id: number
    menu_item_id: number
    quantity: number
    unit_price: number
    subtotal: number
    special_request?: string
    order_item_status: string
}

export type OrderStatus= 'pending'| 'in_kitchen' | 'ready' |'completed';

export interface Order {
    order_id: number
    table_id: number
    user_id: number
    order_type: string
    order_status: OrderStatus
    special_notes?: string
    total_amount?: number
    created_at: string
}



