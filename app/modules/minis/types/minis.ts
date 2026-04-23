export interface Mini {
  mini_id: number;
  user_id: number;
  title: string;
  description?: string;
  video_url: string;
  thumbnail_url?: string;
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason?: string;
  view_count: number;
  created_at: string;
  users?: {
    user_id: number;
    user_name: string;
  };
}

export interface CreateMiniForm {
  title: string;
  description?: string;
  video: any; 
}

export interface UpdateMiniStatus {
  status: 'approved' | 'rejected';
  rejection_reason?: string;
}