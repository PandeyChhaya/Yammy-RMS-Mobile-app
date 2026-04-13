import prisma from '../../db.js';

export const postReservation = async (body: any) => {
    const { table_id, party_size, reserved_at, reservation_notes } = body;

    const tableExists = await prisma.tables.findUnique({
        where: { table_id },
    });

    if (!tableExists) throw new Error('Table does not exist');

    const newReservation = await prisma.reservations.create({
        data: {
            table_id,
            party_size,
            reserved_at:        new Date(reserved_at),
            reservation_notes,
            reservation_status: 'pending',
        },
        include: {
            tables: true,
        },
    });

    return {
        message:        'Reservation created successfully!',
        reservation_id: newReservation.reservation_id,
        id:             String(newReservation.reservation_id),
        status:         newReservation.reservation_status,
        party_size:     newReservation.party_size,
        reserved_at:    newReservation.reserved_at,
        table_id:       String(newReservation.table_id),
        table_number:   newReservation.tables?.table_number,
    };
};

export const getReservation = async (body: any) => {
    const { reservation_id } = body;

    const reservation = await prisma.reservations.findUnique({
        where: { reservation_id },
        include: { tables: true },
    });

    if (!reservation) throw new Error('Reservation does not exist');
    return reservation;
};

export const getReservationsByDate = async (date: string) => {
    const start = new Date(date)
    start.setHours(0, 0, 0, 0)

    const end = new Date(date)
    end.setHours(23, 59, 59, 999)

    const reservations = await prisma.reservations.findMany({
        where: {
            reserved_at: { gte: start, lte: end },
            reservation_status: { not: 'cancelled' },
        },
        include: { tables: true },
        orderBy: { reserved_at: 'asc' },
    });

    return reservations.map(r => ({
        id:               String(r.reservation_id),
        status:           r.reservation_status,
        reservation_time: r.reserved_at.toTimeString().slice(0, 5),
        party_size:       r.party_size,
        table_id:         String(r.table_id),
        table_number:     r.tables?.table_number ?? '',
        reservation_notes: r.reservation_notes,
    }));
};

export const putReservation = async (body: any) => {
    const { reservation_id, party_size, reserved_at, reservation_status, reservation_notes } = body;

    const reservationExists = await prisma.reservations.findUnique({
        where: { reservation_id },
    });

    if (!reservationExists) throw new Error('Reservation does not exist');

    const updated = await prisma.reservations.update({
        where: { reservation_id },
        data: {
            ...(party_size         && { party_size }),
            ...(reserved_at        && { reserved_at: new Date(reserved_at) }),
            ...(reservation_status && { reservation_status }),
            ...(reservation_notes  && { reservation_notes }),
            updated_at: new Date(),
        },
    });

    return { message: 'Reservation updated successfully!', reservation_id: updated.reservation_id };
};

export const updateReservationStatus = async (body: any) => {
    const { reservation_id, status } = body;

    const reservationExists = await prisma.reservations.findUnique({
        where: { reservation_id },
    });

    if (!reservationExists) throw new Error('Reservation does not exist');

    const updated = await prisma.reservations.update({
        where: { reservation_id },
        data: {
            reservation_status: status,
            updated_at:         new Date(),
        },
    });

    return { message: 'Status updated successfully!', reservation_id: updated.reservation_id, status };
};

export const deleteReservation = async (body: any) => {
    const { reservation_id } = body;

    const reservationExists = await prisma.reservations.findUnique({
        where: { reservation_id },
    });

    if (!reservationExists) throw new Error('Reservation does not exist');

    await prisma.reservations.delete({
        where: { reservation_id },
    });

    return { message: 'Reservation deleted successfully!', reservation_id };
};