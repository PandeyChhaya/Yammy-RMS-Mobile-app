import { authService } from "../../auth/services/auth.service";

const BASE_URL = 'http://10.24.5.92:5000/api/loyalty';

export interface LoyaltyBalance {
  customer_id: number
  loyalty_points: number
}

export interface LoyaltyTransaction {
  transaction_id: number
  customer_id: number
  order_id?: number
  points: number
  transaction_type: 'earned' | 'redeemed'
  description?: string
  created_at: string
}

const auth_headers = async () => {
  const token = await authService.getToken();
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
}

const getLoyaltyBalance = async (customer_id: number): Promise<LoyaltyBalance> => {
  const response = await fetch(`${BASE_URL}/balance/${customer_id}`, {
    method: 'GET',
    headers: await auth_headers(),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message);
  return data;
};

const getAllTransactions = async (customer_id: number): Promise<LoyaltyTransaction[]> => {
  const response = await fetch(`${BASE_URL}/transactions/${customer_id}`, {
    method: 'GET',
    headers: await auth_headers(),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message);
  return data;
};

const earnPoints = async (earnData: { customer_id: number; order_id: number; amount_paid: number }): Promise<any> => {
  const response = await fetch(`${BASE_URL}/earn`, {
    method: 'POST',
    headers: await auth_headers(),
    body: JSON.stringify(earnData),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message);
  return data;
};

const redeemPoints = async (redeemData: { customer_id: number; points_to_redeem: number }): Promise<any> => {
  const response = await fetch(`${BASE_URL}/redeem`, {
    method: 'POST',
    headers: await auth_headers(),
    body: JSON.stringify(redeemData),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message);
  return data;
};

const loyaltyService = { getLoyaltyBalance, getAllTransactions, earnPoints, redeemPoints };
export default loyaltyService;