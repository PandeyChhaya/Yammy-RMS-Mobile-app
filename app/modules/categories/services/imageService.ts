import { authService } from "../../auth/services/auth.service";

const BASE_URL = 'http://192.168.1.71:5000/api/images';

export interface UnsplashResult {
  id: string,
  thumb_url: string,
  full_url: string,
  description: string | null,
  photographer: string,
  photographer_url: string,
}

const auth_headers = async () => {
  const token = await authService.getToken();
  return {
    'Authorization': `Bearer ${token}`,
  }
}

const searchUnsplash = async (query: string, page = 1): Promise<UnsplashResult[]> => {
  const url = `${BASE_URL}/unsplash/search?query=${encodeURIComponent(query)}&page=${page}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: await auth_headers(),
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Image search failed');
  return data;
};

const uploadFromUrl = async (imageUrl: string, folder?: string): Promise<string> => {
  const headers = await auth_headers();
  const response = await fetch(`${BASE_URL}/upload-from-url`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ image_url: imageUrl, folder }),
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Upload failed');
  return data.image_url;
};

const uploadFromFile = async (localUri: string, folder?: string): Promise<string> => {
  const headers = await auth_headers();

  const filename = localUri.split('/').pop() || 'photo.jpg';
  const match = /\.(\w+)$/.exec(filename);
  const ext = match ? match[1].toLowerCase() : 'jpg';
  const mimeType = ext === 'png' ? 'image/png' : 'image/jpeg';

  const form = new FormData();
  form.append('image', {
    uri: localUri,
    name: filename,
    type: mimeType,
  } as any);
  if (folder) form.append('folder', folder);

  const response = await fetch(`${BASE_URL}/upload-from-file`, {
    method: 'POST',
    headers,
    body: form,
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Upload failed');
  return data.image_url;
};

const imageService = { searchUnsplash, uploadFromUrl, uploadFromFile };
export default imageService;