import dotenv from "dotenv";
dotenv.config();

import cors from "cors";
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import authRouter from "./modules/auth/auth.routes.js";
import categoriesRouter from "./modules/categories/categories.routes.js";
import inventoryRouter from "./modules/inventory/inventory.routes.js";
import loyaltyRouter from "./modules/loyalty/loyalty.routes.js";
import menuItemsRouter from "./modules/menu-items/menu-items.routes.js";
import miniRouter from "./modules/minis/minis-routes.js";
import orderItemRouter from "./modules/order_items/order_items.routes.js";
import orderRouter from "./modules/orders/orders.routes.js";
import paymentRouter from "./modules/payments/payments.routes.js";
import reservationsRouter from "./modules/reservations/reservations.routes.js";
import tableRouter from "./modules/tables/tables.routes.js";

const app    = express();
const server = createServer(app);

export const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use("/api/auth",         authRouter);
app.use("/api/categories",   categoriesRouter);
app.use("/api/menuItems",    menuItemsRouter);
app.use("/api/table",        tableRouter);
app.use("/api/order",        orderRouter);
app.use("/api/orderItem",    orderItemRouter);
app.use("/api/payment",      paymentRouter);
app.use("/api/loyalty",      loyaltyRouter);
app.use("/api/reservations", reservationsRouter);
app.use("/api/inventory",    inventoryRouter);
app.use("/api/minis",        miniRouter);

io.on("connection", (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  socket.on("join_waiter", (user_id: number) => {
    socket.join(`waiter_${user_id}`);
    socket.join("waiters_room"); 
    console.log(`Waiter ${user_id} joined`);
  });

  socket.on("call_waiter", (data: { table_number: string; customer_name: string; note?: string }) => {
    console.log(`Waiter called from table ${data.table_number}`);
    io.to("waiters_room").emit("waiter_called", {
      table_number:  data.table_number,
      customer_name: data.customer_name,
      note:          data.note || '',
      timestamp:     new Date().toISOString(),
    });
  });

  socket.on("accept_call", (data: { waiter_name: string; table_number: string }) => {
    io.to("waiters_room").emit("call_accepted", {
      waiter_name:  data.waiter_name,
      table_number: data.table_number,
    });
  });

  socket.on("disconnect", () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

app.get("/", (req, res) => {
  res.json({ message: "Yammy API is running" });
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

export default app;