import type {
    CreateOrderPayload,
    CreateOrderResponse,
    EsewaInitiatePayload,
    EsewaInitiateResponse,
    EsewaVerifyPayload,
    PaymentOrder,
} from '../types/payment';

const BASE = 'http://192.168.1.7:5000/api';

const handleResponse = async (res: Response) => {
    const data = await res.json();
    if (!res.ok) throw new Error(data.message ?? 'Something went wrong');
    return data;
};

export const createOrder = async (payload: CreateOrderPayload): Promise<CreateOrderResponse> => {
    const res = await fetch(`${BASE}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    return handleResponse(res);
};

export const createCashPayment = async (payload: PaymentOrder): Promise<void> => {
    const res = await fetch(`${BASE}/payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    return handleResponse(res);
};

export const initiateEsewa = async (payload: EsewaInitiatePayload): Promise<EsewaInitiateResponse> => {
    const res = await fetch(`${BASE}/payment/esewa/initiate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    return handleResponse(res);
};

export const verifyEsewa = async (payload: EsewaVerifyPayload): Promise<void> => {
    const res = await fetch(`${BASE}/payment/esewa/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    return handleResponse(res);
};