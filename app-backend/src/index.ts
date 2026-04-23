import dotenv from "dotenv";
dotenv.config();

import cors from "cors";
import express from "express";
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

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use("/api/auth", authRouter);
app.use("/api/categories", categoriesRouter);
app.use("/api/menuItems", menuItemsRouter);
app.use("/api/table", tableRouter);
app.use("/api/order",orderRouter);
app.use("/api/orderItem", orderItemRouter);
app.use("/api/payment", paymentRouter);
app.use("/api/loyalty", loyaltyRouter);
app.use("/api/reservations",reservationsRouter )
app.use("/api/inventory",inventoryRouter)
app.use("/api/minis", miniRouter)

app.get("/", (req, res) => {
  res.json({ message: "Yammy API is running" });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

export default app;