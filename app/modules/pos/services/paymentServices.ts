import { authService } from "../../auth/services/auth.service";

const BASE_URL= 'http://192.168.1.71:5000/api/payment';


export interface Payment{
   payment_id: number
  order_id: number
  payment_method: string
  amount_paid: number
  change_given: number
  payment_status: string
  transaction_ref: string
};

const auth_headers= async()=>{
    const token  = await authService.getToken();
  return {
    'Content-type':'application/json',
    'Authorization':`Bearer ${token}`,
  } ;
}

const postPayment= async(payment: Omit<Payment, 'payment_id'>): Promise<Payment> =>{
      const response = await fetch(BASE_URL, {
        method: 'POST',
        headers: await auth_headers(),
        body: JSON.stringify(payment),
      });
      const data = await response.json();
      if(!response.ok) throw new Error(data.message);
      return data;
};

const getPayment= async():  Promise<Payment[]> =>{
  const response = await fetch(BASE_URL, {
    method: 'GET',
    headers : await auth_headers(),
  });
  const data = await response.json();
  if(!response.ok) throw new Error (data.message);
  return data;
};
const putPayment= async(payment_id: number, updates: Partial<Omit<Payment, 'payment_id'>>) : Promise<Payment> => {
    const response = await fetch (`${BASE_URL}/${payment_id}`,{
      method: 'PUT',
      headers: await auth_headers(),
      body: JSON.stringify(updates),
    });

    const data = await response.json();
    if(!response.ok) throw new Error(data.message);
    return data;
};
const deletePayment= async(payment_id:number) : Promise<Payment> =>{
    const response = await fetch(`${BASE_URL}/${payment_id}`,{
      method:'DELETE',
      headers: await auth_headers(),
    
    });
    const data = await response.json();
    if(!response.ok) throw new Error (data.message);

    return data;

};

const payementService = {postPayment, getPayment, putPayment, deletePayment};
export default payementService;