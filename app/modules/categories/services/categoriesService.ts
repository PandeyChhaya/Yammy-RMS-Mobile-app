import authService from '../../auth/services/auth.service';

const BASE_URL = 'http://192.168.1.71:5000/api/categories';

// One single type that matches backend exactly
export interface Category {
  category_id: string;
  category_name: string;
  category_description: string;
}

// Build auth headers
const authHeaders = async () => {
  const token = await authService.getToken();
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
};

// GET all categories
const getCategories = async (): Promise<Category[]> => {
  const response = await fetch(BASE_URL, {
    method: 'GET',
    headers: await authHeaders(),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message);
  return data;
};

// POST create a category
const createCategory = async (category: Omit<Category, 'category_id'>): Promise<Category> => {
  const response = await fetch(BASE_URL, {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify(category),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message);
  return data;
};

// PUT update a category
const updateCategory = async (id: string, updates: Partial<Omit<Category, 'category_id'>>): Promise<Category> => {
  const response = await fetch(`${BASE_URL}/${id}`, {
    method: 'PUT',
    headers: await authHeaders(),
    body: JSON.stringify(updates),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message);
  return data;
};

// DELETE a category
const deleteCategory = async (id: string): Promise<void> => {
  const response = await fetch(`${BASE_URL}/${id}`, {
    method: 'DELETE',
    headers: await authHeaders(),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message);
};

const categoriesService = { getCategories, createCategory, updateCategory, deleteCategory };
export default categoriesService;