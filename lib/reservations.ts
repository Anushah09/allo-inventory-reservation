import { prisma } from "./prisma";

export async function releaseExpiredReservations() {
const expiredReservations = await prisma.reservation.findMany({
    where: {
    status: "PENDING",
    expiresAt: {
        lt: new Date(),
    },
    },
});

for (const reservation of expiredReservations) {
    await prisma.$transaction(async (tx) => {
    const latest = await tx.reservation.findUnique({
        where: {
        id: reservation.id,
        },
    });

    if (
        !latest ||
        latest.status !== "PENDING" ||
        latest.expiresAt > new Date()
    ) {
        return;
    }

    await tx.stock.update({
        where: {
        productId_warehouseId: {
            productId: latest.productId,
            warehouseId: latest.warehouseId,
        },
        },
        data: {
        reservedUnits: {
            decrement: latest.quantity,
        },
        },
    });

    await tx.reservation.update({
        where: {
        id: latest.id,
        },
        data: {
        status: "RELEASED",
        },
    });
    });
}
}