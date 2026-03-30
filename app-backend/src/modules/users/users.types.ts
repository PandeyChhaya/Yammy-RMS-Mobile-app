export interface PostUser {
        user_name: string,
        user_email: string,
        user_password: string, 
        user_role: string,
        is_active?: boolean
};
export interface GetUser{
    user_id: number,
};
export interface PutUser{
    user_id: number,
    user_name: string,
    user_email: string,
    user_role: string,
    is_active: boolean,
};
export interface DeleteUser{
    user_id: number,
};