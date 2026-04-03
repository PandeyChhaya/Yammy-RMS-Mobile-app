import { authService } from "../../auth/services/auth.service";

const BASE_URL= 'http://192.168.1.71:5000/api/order';


export interface Order{
    order_id: number,
    menu_item_id: number,
    quantity: number,
    unit_price: number,
    special_request?: string,
};

const auth_headers= async()=>{
    const token  = await authService.getToken();
  return {
    'Content-type':'application/json',
    'Authorization':`Bearer ${token}`,
  } ;
}

const postOrder= async(order: Omit<Order,('order_id' ,'menu_item_id')>): Promise<Order> =>{
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
const deleteOrder= async(order_id:number) : Promise<Order> =>{
    const response = await fetch(`${BASE_URL}/${order_id}`,{
      method:'DELETE',
      headers: await auth_headers(),
    
    });
    const data = await response.json();
    if(!response.ok) throw new Error (data.message);

    return data;

};

const orderService = {postOrder, getOrder, putOrder, deleteOrder};
export default orderService;