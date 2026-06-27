import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "../../db.js";
import { validatePassword } from '../../utils/passwordValidator.js';

export const registerUser = async (body: any) => {
  const { user_name, user_email, user_password, user_role } = body;


  const passwordError = validatePassword(user_password);
  if (passwordError) throw new Error(passwordError);

  const JWT_SECRET = process.env.JWT_SECRET as string;
  const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET as string;

  const existingUser = await prisma.users.findUnique({
    where: { user_email },
  });
  if (existingUser) throw new Error("Email already exists");

  const hashedPassword = await bcrypt.hash(user_password, 10);

  const user = await prisma.users.create({
    data: {
      user_name,
      user_email,
      user_password: hashedPassword,
      user_role,
    },
  });

  const accessToken = jwt.sign(
    { user_id: user.user_id, user_role: user.user_role },
    JWT_SECRET,
    { expiresIn: "15m" }
  );

  const refreshToken = jwt.sign(
    { user_id: user.user_id },
    JWT_REFRESH_SECRET,
    { expiresIn: "7d" }
  );

  await prisma.users.update({
    where: { user_id: user.user_id },
    data: { refresh_token: refreshToken },
  });

  return {
    message: "User registered successfully",
    user_id: user.user_id,
    user_name: user.user_name,
    user_role: user.user_role,
    accessToken,
    refreshToken,
  };
};

export const loginUser = async (body: any) => {
  const JWT_SECRET = process.env.JWT_SECRET as string;
  const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET as string;

  const { user_email, user_password } = body;

  const user = await prisma.users.findUnique({
    where: { user_email },
  });
  if (!user) throw new Error("Invalid email or password");

  const isMatch = await bcrypt.compare(user_password, user.user_password);
  if (!isMatch) throw new Error("Invalid email or password");

  const accessToken = jwt.sign(
    { user_id: user.user_id, user_role: user.user_role },
    JWT_SECRET,
    { expiresIn: "15m" }
  );

  const refreshToken = jwt.sign(
    { user_id: user.user_id },
    JWT_REFRESH_SECRET,
    { expiresIn: "7d" }
  );

  await prisma.users.update({
    where: { user_id: user.user_id },
    data: {
      refresh_token: refreshToken,
      last_login: new Date(),
    },
  });

  return {
    accessToken,
    refreshToken,
    user_id:      user.user_id,
    user_name:    user.user_name,
    user_role:    user.user_role,
    first_login:  user.first_login,   // 👈 new
    totp_enabled: user.totp_enabled,  // 👈 new
  };
};

export const logoutUser = async (body: any) => {
  const { user_id } = body;

  await prisma.users.update({
    where: { user_id },
    data: { refresh_token: null },
  });

  return { message: "Logged out successfully" };
};

export const refreshToken = async (body: any) => {
  const JWT_SECRET = process.env.JWT_SECRET as string;
  const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET as string;

  const { token } = body;
  if (!token) throw new Error("Refresh token required");

  const decoded = jwt.verify(token, JWT_REFRESH_SECRET) as any;

  const user = await prisma.users.findUnique({
    where: { user_id: decoded.user_id },
  });
  if (!user || user.refresh_token !== token) throw new Error("Invalid refresh token");

  const accessToken = jwt.sign(
    { user_id: user.user_id, user_role: user.user_role },
    JWT_SECRET,
    { expiresIn: "15m" }
  );

  return { accessToken };
};