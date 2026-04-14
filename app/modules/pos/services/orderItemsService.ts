import { authService } from "../../auth/services/auth.service";

const BASE_URL= 'http:// 192.168.1.71:5000/api/order-items';


export interface OrderItem{
  order_item_id: number
  order_id: number
  menu_item_id: number
  quantity: number
  unit_price: number
  subtotal: number
  special_request: string
  order_item_status: string
};

const auth_headers= async()=>{
    const token  = await authService.getToken();
  return {
    'Content-type':'application/json',
    'Authorization':`Bearer ${token}`,
  } ;
}

const postOrderItem= async(orderItem: Omit<OrderItem, 'order_item_id'| 'menu_item_id'>): Promise<OrderItem> =>{
      const response = await fetch(BASE_URL, {
        method: 'POST',
        headers: await auth_headers(),
        body: JSON.stringify(orderItem),
      });
      const data = await response.json();
      if(!response.ok) throw new Error(data.message);
      return data;
};

const getOrderItem= async():  Promise<OrderItem[]> =>{
  const response = await fetch(BASE_URL, {
    method: 'GET',
    headers : await auth_headers(),
  });
  const data = await response.json();
  if(!response.ok) throw new Error (data.message);
  return data;
};
const putOrderItem= async(order_item_id: number, updates: Partial<Omit<OrderItem, 'order_item_id'>>) : Promise<OrderItem> => {
    const response = await fetch (`${BASE_URL}/${order_item_id}`,{
      method: 'PUT',
      headers: await auth_headers(),
      body: JSON.stringify(updates),
    });

    const data = await response.json();
    if(!response.ok) throw new Error(data.message);
    return data;
};
const deleteOrderItem= async(order_item_id:number) : Promise<OrderItem> =>{
    const response = await fetch(`${BASE_URL}/${order_item_id}`,{
      method:'DELETE',
      headers: await auth_headers(),
    
    });
    const data = await response.json();
    if(!response.ok) throw new Error (data.message);

    return data;

};

const orderItemService = {postOrderItem, getOrderItem, putOrderItem, deleteOrderItem};
export default orderItemService;