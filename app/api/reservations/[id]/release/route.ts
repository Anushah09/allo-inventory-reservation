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
    return NextResponse.json({ error: "Reservation not found" }, { status: 404 });
    }

    if (reservation.status !== "PENDING") {
    return NextResponse.json(reservation);
    }

    await prisma.stock.update({
    where: {
        productId_warehouseId: {
        productId: reservation.productId,
        warehouseId: reservation.warehouseId,
        },
    },
    data: {
        reservedUnits: {
        decrement: reservation.quantity,
        },
    },
    });

    const released = await prisma.reservation.update({
    where: { id },
    data: {
        status: "RELEASED",
    },
    include: {
        product: true,
        warehouse: true,
    },
    });

    return NextResponse.json(released);
}