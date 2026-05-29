import { authService } from "../../auth/services/auth.service";

const BASE_URL= 'http://10.78.34.24:5000/api/tables';


export interface Table{
  table_id: number
  table_number: string
  floor: string
  capacity: number
  table_status: string
};

const auth_headers= async()=>{
    const token  = await authService.getToken();
  return {
    'Content-type':'application/json',
    'Authorization':`Bearer ${token}`,
  } ;
}

const postTable= async(table: Omit<Table, 'table_id'>): Promise<Table> =>{
      const response = await fetch(BASE_URL, {
        method: 'POST',
        headers: await auth_headers(),
        body: JSON.stringify(table),
      });
      const data = await response.json();
      if(!response.ok) throw new Error(data.message);
      return data;
};

const getTable= async():  Promise<Table[]> =>{
  const response = await fetch(BASE_URL, {
    method: 'GET',
    headers : await auth_headers(),
  });
  const data = await response.json();
  if(!response.ok) throw new Error (data.message);
  return data;
};
const putTable= async(table_id: number, updates: Partial<Omit<Table, 'table_id'>>) : Promise<Table> => {
    const response = await fetch (`${BASE_URL}/${table_id}`,{
      method: 'PUT',
      headers: await auth_headers(),
      body: JSON.stringify(updates),
    });

    const data = await response.json();
    if(!response.ok) throw new Error(data.message);
    return data;
};
const deleteTable= async(table_id:number) : Promise<Table> =>{
    const response = await fetch(`${BASE_URL}/${table_id}`,{
      method:'DELETE',
      headers: await auth_headers(),
    
    });
    const data = await response.json();
    if(!response.ok) throw new Error (data.message);

    return data;

};

const tableService = {postTable, getTable, putTable, deleteTable};
export default tableService;