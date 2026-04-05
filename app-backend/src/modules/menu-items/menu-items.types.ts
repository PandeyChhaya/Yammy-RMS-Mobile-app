export interface PostMenuItemsTypes {
    menu_items_category_id?: number;
    menu_items_name: string;
    slug: string;
    menu_items_description?: string;
    price: number;
    cost_price?: number;
    image_url?: string;
    prep_time?: number;
    calories?: number;
    display_order?: number;
    is_active?:boolean
}

export interface GetMenuItemsTypes {
    menu_items_id: number;
}

export interface PutMenuItemsTypes {
    menu_items_id: number;
    menu_items_category_id?: number;
    menu_items_name?: string;
    slug?: string;
    menu_items_description?: string;
    price?: number;
    cost_price?: number;
    image_url?: string;
    prep_time?: number;
    calories?: number;
    display_order?: number;
}

export interface DeleteMenuItemsTypes {
    menu_items_id: number;
}