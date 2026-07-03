export interface UnsplashSearchQuery {
    query: string;
    page?: number;
}

export interface UnsplashPhotoResult {
    id: string;
    thumb_url: string;
    full_url: string;
    description: string | null;
    photographer: string;
    photographer_url: string;
}

export interface UploadFromUrlBody {
    image_url: string;
    folder?: string;
}