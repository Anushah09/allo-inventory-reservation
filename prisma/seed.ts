import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const pool = new Pool({
connectionString: process.env.DIRECT_URL,
});

const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
adapter,
});

async function main() {
await prisma.reservation.deleteMany();
await prisma.stock.deleteMany();
await prisma.product.deleteMany();
await prisma.warehouse.deleteMany();

const tshirt = await prisma.product.create({
    data: {
    name: "Classic Cotton T-Shirt",
    description: "Comfortable everyday cotton t-shirt.",
    imageUrl: "/products/tshirt.jpg",
    },
});

const shoes = await prisma.product.create({
    data: {
    name: "Running Shoes",
    description: "Lightweight shoes for daily running.",
    imageUrl: "/products/shoes.jpg",
    },
});

const headphones = await prisma.product.create({
    data: {
    name: "Wireless Headphones",
    description: "Bluetooth headphones with long battery life.",
    imageUrl: "/products/headphones.jpg",
    },
});

const bangalore = await prisma.warehouse.create({
    data: {
    name: "Bangalore Warehouse",
    location: "Indiranagar, Bangalore",
    },
});

const mumbai = await prisma.warehouse.create({
    data: {
    name: "Mumbai Warehouse",
    location: "Andheri, Mumbai",
    },
});

const delhi = await prisma.warehouse.create({
    data: {
    name: "Delhi Warehouse",
    location: "Saket, Delhi",
    },
});

await prisma.stock.createMany({
    data: [
    {
        productId: tshirt.id,
        warehouseId: bangalore.id,
        totalUnits: 10,
        reservedUnits: 0,
    },
    {
        productId: tshirt.id,
        warehouseId: mumbai.id,
        totalUnits: 6,
        reservedUnits: 0,
    },
    {
        productId: shoes.id,
        warehouseId: bangalore.id,
        totalUnits: 5,
        reservedUnits: 0,
    },
    {
        productId: shoes.id,
        warehouseId: delhi.id,
        totalUnits: 3,
        reservedUnits: 0,
    },
    {
        productId: headphones.id,
        warehouseId: mumbai.id,
        totalUnits: 8,
        reservedUnits: 0,
    },
    {
        productId: headphones.id,
        warehouseId: delhi.id,
        totalUnits: 4,
        reservedUnits: 0,
    },
    ],
});

console.log("Seed data inserted successfully!");
}

main()
.catch((error) => {
    console.error(error);
    process.exit(1);
})
.finally(async () => {
    await prisma.$disconnect();
    await pool.end();
});