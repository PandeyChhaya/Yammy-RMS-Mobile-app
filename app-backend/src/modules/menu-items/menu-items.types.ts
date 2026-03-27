export interface postMenuItemsTypes{
    menu_items_name: string;
    slug:string;
    menu_items_description:string;
    price: number;
    cost_price: number;
    image_url: string;
    is_available: boolean;
    prep_time: number;
    calories: number;
}


export interface getMenuItemsTypes{
    menu_items_id: number;
}
export interface putMenuItemsTypes{
    menu_items_id: number;
    menu_items_name: string;
    slug:string;
}
export interface deleteMenuItemsTypes{
    menu_items_id: number;
}