import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { releaseExpiredReservations } from "@/lib/reservations";

export async function GET() {
await releaseExpiredReservations();

const products = await prisma.product.findMany({
    include: {
    stocks: {
        include: {
        warehouse: true,
        },
    },
    },
    orderBy: {
    createdAt: "desc",
    },
});

const result = products.map((product: any) => ({
    id: product.id,
    name: product.name,
    description: product.description,
    imageUrl: product.imageUrl,

    warehouses: product.stocks.map((stock) => ({
    stockId: stock.id,
    warehouseId: stock.warehouseId,
    warehouseName: stock.warehouse.name,
    warehouseLocation: stock.warehouse.location,
    totalUnits: stock.totalUnits,
    reservedUnits: stock.reservedUnits,
    availableUnits: stock.totalUnits - stock.reservedUnits,
    })),
}));

return NextResponse.json(result);
}