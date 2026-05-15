import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { releaseExpiredReservations } from "@/lib/reservations";

const reserveSchema = z.object({
    stockId: z.string().min(1),
    quantity: z.number().int().positive(),
});

type UpdatedStock = {
    id: string;
    productId: string;
    warehouseId: string;
    totalUnits: number;
    reservedUnits: number;
};

export async function POST(request: Request) {
    await releaseExpiredReservations();

    const body = await request.json();
    const parsed = reserveSchema.safeParse(body);

    if (!parsed.success) {
    return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
    );
    }

    const { stockId, quantity } = parsed.data;

    try {
    const reservation = await prisma.$transaction(async (tx: any) => {
        const updatedStocks = await tx.$queryRaw<UpdatedStock[]>(
        Prisma.sql`
            UPDATE "Stock"
            SET "reservedUnits" = "reservedUnits" + ${quantity}
            WHERE "id" = ${stockId}
            AND ("totalUnits" - "reservedUnits") >= ${quantity}
            RETURNING "id", "productId", "warehouseId", "totalUnits", "reservedUnits";
        `
        );

        const stock = updatedStocks[0];

        if (!stock) {
        throw new Error("INSUFFICIENT_STOCK");
        }

      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

        return tx.reservation.create({
        data: {
            productId: stock.productId,
            warehouseId: stock.warehouseId,
            quantity,
            status: "PENDING",
            expiresAt,
        },
        include: {
            product: true,
            warehouse: true,
        },
        });
    });

    return NextResponse.json(reservation, { status: 201 });
    } catch (error) {
    if (error instanceof Error && error.message === "INSUFFICIENT_STOCK") {
        return NextResponse.json(
        { error: "Not enough stock available" },
        { status: 409 }
        );
    }

    return NextResponse.json(
        { error: "Something went wrong while creating reservation" },
        { status: 500 }
    );
    }
}