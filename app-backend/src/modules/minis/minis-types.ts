export interface CreateMini {
  user_id: number;
  restaurant_id: number;
  title: string;
  description?: string;
}

export interface UpdateMiniStatus {
  mini_id: number;
  status: 'approved' | 'rejected';
  rejection_reason?: string;
}

export interface GetMini {
  mini_id: number;
}