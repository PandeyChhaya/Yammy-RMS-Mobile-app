import { authService } from '../../auth/services/auth.service';

const BASE_URL = 'http://192.168.1.71:5000/api/minis';

const auth_headers = async () => {
  const token = await authService.getToken();
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
};

const getApproved = async (restaurant_id?: number) => {
  const url = restaurant_id ? `${BASE_URL}?restaurant_id=${restaurant_id}` : BASE_URL
  const response = await fetch(url, {
    method: 'GET',
    headers: await auth_headers(),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message);
  return data;
};

const getMyMinis = async () => {
  const response = await fetch(`${BASE_URL}/my`, {
    method: 'GET',
    headers: await auth_headers(),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message);
  return data;
};

const getAllMinis = async () => {
  const response = await fetch(`${BASE_URL}/all`, {
    method: 'GET',
    headers: await auth_headers(),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message);
  return data;
};

const uploadMini = async (title: string, description: string, video: any) => {
  const token = await authService.getToken();
  const formData = new FormData();
  formData.append('title', title);
  if (description) formData.append('description', description);
  formData.append('video', {
    uri: video.uri,
    type: video.mimeType || 'video/mp4',
    name: video.fileName || 'mini.mp4',
  } as any);

  const response = await fetch(BASE_URL, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` }, 
    body: formData,
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message);
  return data;
};

const updateStatus = async (mini_id: number, status: string, rejection_reason?: string) => {
  const response = await fetch(`${BASE_URL}/${mini_id}/status`, {
    method: 'PATCH',
    headers: await auth_headers(),
    body: JSON.stringify({ status, rejection_reason }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message);
  return data;
};

const deleteMini = async (mini_id: number) => {
  const response = await fetch(`${BASE_URL}/${mini_id}`, {
    method: 'DELETE',
    headers: await auth_headers(),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message);
  return data;
};

const incrementView = async (mini_id: number) => {
  await fetch(`${BASE_URL}/${mini_id}/view`, { method: 'PATCH' });
};

const minisService = { getApproved, getMyMinis, getAllMinis, uploadMini, updateStatus, deleteMini, incrementView };
export default minisService;