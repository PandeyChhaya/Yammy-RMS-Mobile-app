import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma/client.js";

const adapter = new PrismaPg({ 
  connectionString: "postgresql://postgres:Herald%4054321@localhost:5432/yammy_fresh"
});

const prisma = new PrismaClient({ adapter });

export default prisma;