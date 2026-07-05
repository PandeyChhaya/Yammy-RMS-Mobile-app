import prisma from '../../db.js';

const mapReservation = (r: any) => ({
    id:                String(r.reservation_id),
    reservation_id:    r.reservation_id,
    status:            r.reservation_status,
    reservation_date:  r.reserved_at.toISOString().split('T')[0],
    reservation_time:  r.reserved_at.toTimeString().slice(0, 5),
    party_size:        r.party_size,
    duration_minutes:  r.duration_minutes,
    customer_name:     r.customer_name,
    customer_phone:    r.customer_phone,
    table_id:          String(r.table_id),
    table_number:      r.tables?.table_number ?? '',
    floor:             r.tables?.floor ?? '',
    reservation_notes: r.reservation_notes,
});

export const postReservation = async (body: any) => {
    const { table_id, party_size, reserved_at, reservation_notes, customer_name, customer_phone, duration_minutes } = body;

    const tableExists = await prisma.tables.findUnique({ where: { table_id } });
    if (!tableExists) throw new Error('Table does not exist');

    const newReservation = await prisma.reservations.create({
        data: {
            party_size,
            reserved_at: new Date(reserved_at),
            reservation_notes,
            customer_name,
            customer_phone,
            duration_minutes: duration_minutes ?? 120,
            reservation_status: 'confirmed',
            tables: { connect: { table_id } },
        },
        include: { tables: true },
    });
    return mapReservation(newReservation);
};

export const getReservation = async (body: any) => {
    const { reservation_id } = body;
    const reservation = await prisma.reservations.findUnique({
        where: { reservation_id },
        include: { tables: true },
    });
    if (!reservation) throw new Error('Reservation does not exist');
    return mapReservation(reservation);
};

export const getAllReservations = async () => {
    const reservations = await prisma.reservations.findMany({
        include: { tables: true },
        orderBy: { reserved_at: 'desc' },
    });
    return reservations.map(mapReservation);
};

export const getReservationsByDate = async (date: string) => {
    const start = new Date(date); start.setHours(0, 0, 0, 0);
    const end   = new Date(date); end.setHours(23, 59, 59, 999);

    const reservations = await prisma.reservations.findMany({
        where: { reserved_at: { gte: start, lte: end }, reservation_status: { not: 'cancelled' } },
        include: { tables: true },
        orderBy: { reserved_at: 'asc' },
    });
    return reservations.map(mapReservation);
};

export const putReservation = async (body: any) => {
    const { reservation_id, party_size, reserved_at, reservation_status, reservation_notes, customer_name, customer_phone, duration_minutes } = body;

    const reservationExists = await prisma.reservations.findUnique({ where: { reservation_id } });
    if (!reservationExists) throw new Error('Reservation does not exist');

    const updated = await prisma.reservations.update({
        where: { reservation_id },
        data: {
            ...(party_size         && { party_size }),
            ...(reserved_at        && { reserved_at: new Date(reserved_at) }),
            ...(reservation_status && { reservation_status }),
            ...(reservation_notes  && { reservation_notes }),
            ...(customer_name      && { customer_name }),
            ...(customer_phone     && { customer_phone }),
            ...(duration_minutes   && { duration_minutes }),
            updated_at: new Date(),
        },
        include: { tables: true },
    });
    return mapReservation(updated);
};

export const updateReservationStatus = async (body: any) => {
    const { reservation_id, status } = body;
    const reservationExists = await prisma.reservations.findUnique({ where: { reservation_id } });
    if (!reservationExists) throw new Error('Reservation does not exist');

    const updated = await prisma.reservations.update({
        where: { reservation_id },
        data: { reservation_status: status, updated_at: new Date() },
        include: { tables: true },
    });
    return mapReservation(updated);
};

export const deleteReservation = async (body: any) => {
    const { reservation_id } = body;
    const reservationExists = await prisma.reservations.findUnique({ where: { reservation_id } });
    if (!reservationExists) throw new Error('Reservation does not exist');
    await prisma.reservations.delete({ where: { reservation_id } });
    return { message: 'Reservation deleted successfully!', reservation_id };
};