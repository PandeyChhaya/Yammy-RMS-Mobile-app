export interface postUser {
        user_name: string,
        user_email: string,
        user_password: string, 
        user_role: string,
        is_active?: string
};
export interface getUser{
    user_id: string,
};
export interface putUser{
    user_id: string,
    user_name: string,
    user_email: string,
    user_role: string,
    is_active: string,
};
export interface deleteUser{
    user_id: string;
};