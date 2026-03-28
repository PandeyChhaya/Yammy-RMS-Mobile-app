import prisma from '../../db.js';
import type { DeletePayment, GetPayment, PostPayment, PutPayment } from './payments.types.js';

export const postPayment = async (body: PostPayment) => {
    const { order_id, payment_method, amount_paid, change_given, transaction_ref } = body;

    const checkOrderExists = await prisma.orders.findUnique({
        where: { order_id },
    });
    if (!checkOrderExists) throw new Error("Order does not exist!!");

    const checkPaymentExists = await prisma.payments.findFirst({
        where: { order_id },
    });
    if (checkPaymentExists) throw new Error("Payment for this order already exists!!");

    const createPayment = await prisma.payments.create({
        data: {
            order_id,
            payment_method,
            amount_paid,
            change_given,
            transaction_ref,
        },
    });

    return { message: "Payment created successfully!!", payment_id: createPayment.payment_id };
};

export const getPayment = async (body: GetPayment) => {
    const { payment_id } = body;

    const checkPaymentExists = await prisma.payments.findUnique({
        where: { payment_id },
    });
    if (!checkPaymentExists) throw new Error("Payment does not exist!!");

    return checkPaymentExists;
};

export const getAllPayments = async () => {
    const payments = await prisma.payments.findMany();
    return payments;
};

export const putPayment = async (body: PutPayment) => {
    const { payment_id, payment_status, transaction_ref } = body;

    const checkPaymentExists = await prisma.payments.findUnique({
        where: { payment_id },
    });
    if (!checkPaymentExists) throw new Error("Payment does not exist!!");

    const updatedPayment = await prisma.payments.update({
        where: { payment_id },
        data: {
            payment_status,
            transaction_ref,
        },
    });

    return { message: "Payment updated successfully!!", payment_id: updatedPayment.payment_id };
};

export const deletePayment = async (body: DeletePayment) => {
    const { payment_id } = body;

    const checkPaymentExists = await prisma.payments.findUnique({
        where: { payment_id },
    });
    if (!checkPaymentExists) throw new Error("Payment does not exist!!");

    await prisma.payments.delete({
        where: { payment_id },
    });

    return { message: "Payment deleted successfully!!", payment_id };
};