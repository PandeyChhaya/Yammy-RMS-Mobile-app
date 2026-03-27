export interface PostCategories{
    category_name: string;
    slug: string;
    category_description?: string;
}
export interface GetCategories{
    category_id:number;
}
export interface PutCategories{
    category_name?: string;
    category_description?: string;
    slug?: string;
}
export interface DeleteCategories{
    category_id: number;
}