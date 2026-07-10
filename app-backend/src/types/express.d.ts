import 'express';

declare module 'express-serve-static-core' {
  interface Request {
    user?: {
      user_id: number;
      user_role: string;
      restaurant_id?: number;
    };
  }
}