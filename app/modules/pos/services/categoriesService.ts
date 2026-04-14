import { authService } from "../../auth/services/auth.service";

const BASE_URL= 'http:// 192.168.1.71:5000/api/categories';


export interface Category{
  category_id: number,
  category_name: string,
  category_description: string,
  slug: string,
  is_active: boolean,
};

const auth_headers= async()=>{
    const token  = await authService.getToken();
  return {
    'Content-type':'application/json',
    'Authorization':`Bearer ${token}`,
  } ;
}

const postCategory= async(category: Omit<Category, 'category_id'>): Promise<Category> =>{
      const response = await fetch(BASE_URL, {
        method: 'POST',
        headers: await auth_headers(),
        body: JSON.stringify(category),
      });
      const data = await response.json();
      if(!response.ok) throw new Error(data.message);
      return data;
};

const getCategory= async():  Promise<Category[]> =>{
  const response = await fetch(BASE_URL, {
    method: 'GET',
    headers : await auth_headers(),
  });
  const data = await response.json();
  if(!response.ok) throw new Error (data.message);
  return data;
};
const putCategory= async(category_id: string, updates: Partial<Omit<Category, 'category_id'>>) : Promise<Category> => {
    const response = await fetch (`${BASE_URL}/${category_id}`,{
      method: 'PUT',
      headers: await auth_headers(),
      body: JSON.stringify(updates),
    });

    const data = await response.json();
    if(!response.ok) throw new Error(data.message);
    return data;
};
const deleteCategory= async(category_id:number) : Promise<Category> =>{
    const response = await fetch(`${BASE_URL}/${category_id}`,{
      method:'DELETE',
      headers: await auth_headers(),
    
    });
    const data = await response.json();
    if(!response.ok) throw new Error (data.message);

    return data;

};

const categoriesService = {postCategory, getCategory, putCategory, deleteCategory};
export default categoriesService;