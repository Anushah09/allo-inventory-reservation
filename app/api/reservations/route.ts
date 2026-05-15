import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { releaseExpiredReservations } from "@/lib/reservations";

const reserveSchema = z.object({
    stockId: z.string().min(1),
    quantity: z.number().int().positive(),
});

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
        const stock = await tx.stock.findUnique({
        where: {
            id: stockId,
        },
        });

        if (!stock) {
        throw new Error("INSUFFICIENT_STOCK");
        }

        const availableUnits = stock.totalUnits - stock.reservedUnits;

        if (availableUnits < quantity) {
        throw new Error("INSUFFICIENT_STOCK");
        }

        await tx.stock.update({
        where: {
            id: stockId,
        },
        data: {
            reservedUnits: {
            increment: quantity,
            },
        },
        });

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