export interface PaymentOrder {
    order_id:        number;
    payment_method:  string;
    amount_paid:     number;
    change_given:    number;
    transaction_ref?: string;
}

export interface EsewaInitiatePayload {
    order_id: number;
    amount:   number;
}

export interface EsewaInitiateResponse {
    paymentUrl: string;
    productId:  string;
}

export interface EsewaVerifyPayload {
    transaction_ref: string;
    amount:          number;
}

export interface CreateOrderPayload {
    table_id?:      number;
    order_type:     string;
    special_notes?: string;
    subtotal:       number;
    discount:       number;
    tax:            number;
    total_amount:   number;
    items: Array<{
        menu_item_id: number;
        quantity:     number;
        unit_price:   number;
        total_price:  number;
    }>;
}

export interface CreateOrderResponse {
    order_id: number;
}

export type PaymentMethod = 'cash' | 'esewa';

export interface SplitEntry {
    id:     number;
    amount: string;
}

export interface PaymentCalculatorProps {
    onClose:      () => void;
    onCharge:     (amountPaid: number, notes: string, method: PaymentMethod) => void;
    onSplit:      (splits: SplitEntry[], notes: string) => void;
    totalWithTax: number;
    esewaQrUrl?:  string;
    symbol?:      string;
}

export interface PaymentModalProps {
    visible:       boolean;
    onClose:       () => void;
    onSuccess:     () => void;
    cartItems: Array<{
        menu_item_id: number | string;
        quantity:     number;
        unit_price:   number;
        total_price:  number;
    }>;
    cartTotal:     number;
    taxAmount:     number;
    totalWithTax:  number;
    selectedTable: { table_id: number; table_number: string | number } | null;
    customerName:  string;
    symbol?:       string;
}