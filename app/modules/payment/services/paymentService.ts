import AsyncStorage from '@react-native-async-storage/async-storage'
import type {
    CreateOrderPayload,
    CreateOrderResponse,
    EsewaInitiatePayload,
    EsewaInitiateResponse,
    EsewaVerifyPayload,
    PaymentOrder,
} from '../types/payment'

const BASE = 'http://192.168.1.71:5000/api'

const handleResponse = async (res: Response) => {
    const text = await res.text()
    console.log('API response status:', res.status)
    console.log('API response body:', text)

    let data
    try {
        data = JSON.parse(text)
    } catch {
        throw new Error(`Server returned non-JSON (status ${res.status}): ${text.slice(0, 200)}`)
    }

    if (!res.ok) throw new Error(data.message ?? 'Something went wrong')
    return data
}

const getHeaders = async () => {
    const token = await AsyncStorage.getItem('@accessToken')
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
    }
}

export const createOrder = async (payload: CreateOrderPayload): Promise<CreateOrderResponse> => {
    const res = await fetch(`${BASE}/order`, {
        method: 'POST',
        headers: await getHeaders(),
        body: JSON.stringify(payload),
    })
    return handleResponse(res)
}

export const createCashPayment = async (payload: PaymentOrder): Promise<void> => {
    const res = await fetch(`${BASE}/payment`, {
        method: 'POST',
        headers: await getHeaders(),
        body: JSON.stringify(payload),
    })
    return handleResponse(res)
}

export const initiateEsewa = async (payload: EsewaInitiatePayload): Promise<EsewaInitiateResponse> => {
    const res = await fetch(`${BASE}/payment/esewa/initiate`, {
        method: 'POST',
        headers: await getHeaders(),
        body: JSON.stringify(payload),
    })
    return handleResponse(res)
}

export const verifyEsewa = async (payload: EsewaVerifyPayload): Promise<void> => {
    const res = await fetch(`${BASE}/payment/esewa/verify`, {
        method: 'POST',
        headers: await getHeaders(),
        body: JSON.stringify(payload),
    })
    return handleResponse(res)
}