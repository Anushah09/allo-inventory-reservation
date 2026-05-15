import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = {
    params: Promise<{ id: string }>;
};

export async function POST(_request: Request, { params }: Params) {
    const { id } = await params;

    const reservation = await prisma.reservation.findUnique({
    where: { id },
    });

    if (!reservation) {
    return NextResponse.json(
        { error: "Reservation not found" },
        { status: 404 }
    );
    }

    if (reservation.status !== "PENDING") {
    return NextResponse.json(reservation);
    }

    if (reservation.expiresAt < new Date()) {
    return NextResponse.json(
        { error: "Reservation expired" },
        { status: 410 }
    );
    }

    const confirmed = await prisma.$transaction(async (tx) => {
    await tx.stock.update({
        where: {
        productId_warehouseId: {
            productId: reservation.productId,
            warehouseId: reservation.warehouseId,
        },
        },
        data: {
        totalUnits: {
            decrement: reservation.quantity,
        },
        reservedUnits: {
            decrement: reservation.quantity,
        },
        },
    });

    return tx.reservation.update({
        where: { id },
        data: {
        status: "CONFIRMED",
        },
        include: {
        product: true,
        warehouse: true,
        },
    });
    });

    return NextResponse.json(confirmed);
}