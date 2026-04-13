import { Order, OrderStatus } from "@/shared/types/orders";
import { authService } from "../../auth/services/auth.service";

const BASE_URL= 'http://10.24.5.92:5000/api/orders';




const auth_headers= async()=>{
    const token  = await authService.getToken();
  return {
    'Content-type':'application/json',
    'Authorization':`Bearer ${token}`,
  } ;
}

const postOrder= async(order: Omit<Order, 'order_id' | 'created_at'> ): Promise<Order> =>{
      const response = await fetch(BASE_URL, {
        method: 'POST',
        headers: await auth_headers(),
        body: JSON.stringify(order),
      });
      const data = await response.json();
      if(!response.ok) throw new Error(data.message);
      return data;
};

const getOrder= async():  Promise<Order[]> =>{
  const response = await fetch(BASE_URL, {
    method: 'GET',
    headers : await auth_headers(),
  });
  const data = await response.json();
  if(!response.ok) throw new Error (data.message);
  return data;
};
const putOrder= async(order_id: string, updates: Partial<Omit<Order, 'order_id'>>) : Promise<Order> => {
    const response = await fetch (`${BASE_URL}/${order_id}`,{
      method: 'PUT',
      headers: await auth_headers(),
      body: JSON.stringify(updates),
    });

    const data = await response.json();
    if(!response.ok) throw new Error(data.message);
    return data;
};
const updateOrderStatus = async (order_id: number, status: OrderStatus): Promise<Order> => {
    const response = await fetch(`${BASE_URL}/${order_id}/status`, {
        method: 'PATCH',
        headers: await auth_headers(),
        body: JSON.stringify({ order_status: status }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message);
    return data;
};

const deleteOrder= async(order_id:number) : Promise<Order> =>{
    const response = await fetch(`${BASE_URL}/${order_id}`,{
      method:'DELETE',
      headers: await auth_headers(),
    
    });
    const data = await response.json();
    if(!response.ok) throw new Error (data.message);

    return data;

};

export const ordersService = {postOrder, getOrder, putOrder, deleteOrder, updateOrderStatus};
