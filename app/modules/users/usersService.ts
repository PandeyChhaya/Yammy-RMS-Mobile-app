import { authService } from "../auth/services/auth.service";

const BASE_URL= 'http:// 192.168.1.71:5000/api/order-items';


export interface User{
   user_id: number
  user_name: string
  user_email: string
  user_role: string
  is_active: boolean
};

const auth_headers= async()=>{
    const token  = await authService.getToken();
  return {
    'Content-type':'application/json',
    'Authorization':`Bearer ${token}`,
  } ;
}

const postUser= async(user: Omit<User, 'user_id'>): Promise<User> =>{
      const response = await fetch(BASE_URL, {
        method: 'POST',
        headers: await auth_headers(),
        body: JSON.stringify(user),
      });
      const data = await response.json();
      if(!response.ok) throw new Error(data.message);
      return data;
};

const getUser= async():  Promise<User[]> =>{
  const response = await fetch(BASE_URL, {
    method: 'GET',
    headers : await auth_headers(),
  });
  const data = await response.json();
  if(!response.ok) throw new Error (data.message);
  return data;
};
const putUser= async(user_id: number, updates: Partial<Omit<User, 'user_id'>>) : Promise<User> => {
    const response = await fetch (`${BASE_URL}/${user_id}`,{
      method: 'PUT',
      headers: await auth_headers(),
      body: JSON.stringify(updates),
    });

    const data = await response.json();
    if(!response.ok) throw new Error(data.message);
    return data;
};
const deleteUser= async(user_id:number) : Promise<User> =>{
    const response = await fetch(`${BASE_URL}/${user_id}`,{
      method:'DELETE',
      headers: await auth_headers(),
    
    });
    const data = await response.json();
    if(!response.ok) throw new Error (data.message);

    return data;

};

const userService = {postUser, getUser, putUser, deleteUser};
export default userService;