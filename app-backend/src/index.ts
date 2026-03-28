import dotenv from "dotenv";
dotenv.config();

import cors from "cors";
import express from "express";
import authRouter from "./modules/auth/auth.routes.js";
import categoriesRouter from "./modules/categories/categories.routes.js";
import menuItemsRouter from "./modules/menu-items/menu-items.routes.js";
import tableRouter from "./modules/tables/tables.routes.js";

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use("/api/auth", authRouter);
app.use("/api/categories", categoriesRouter);
app.use("/api/menuItems", menuItemsRouter);
app.use("/api/table/", tableRouter);


app.get("/", (req, res) => {
  res.json({ message: "Yammy API is running" });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

export default app;