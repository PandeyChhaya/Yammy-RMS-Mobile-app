import prisma from '../../db.js';
import type { DeletePayment, GetPayment, InitiateEsewa, PostPayment, PutPayment, VerifyEsewa } from './payments.types.js';

const ESEWA_MERCHANT_ID = 'EPAYTEST';
const ESEWA_SECRET = '8gBm/:&EnhH.1/q';
const ESEWA_VERIFY_URL = 'https://rc.esewa.com.np/mobile/transaction';
const BASE_URL = 'http://192.168.1.71:5000';

const POINTS_PER_NPR = 10; // 1 loyalty point per NPR 10 spent — change this if your rate differs

const awardLoyaltyPoints = async (order_id: number, amount_paid: number) => {
    const order = await prisma.orders.findUnique({ where: { order_id } });
    if (!order?.customer_id) return; // walk-in/guest order — no loyalty account to credit

    const points = Math.floor(Number(amount_paid) / POINTS_PER_NPR);
    if (points <= 0) return;

    await prisma.$transaction([
        prisma.loyalty_transactions.create({
            data: {
                customer_id: order.customer_id,
                order_id,
                points,
                transaction_type: 'earned',
                description: `Earned from order #${order_id}`,
            },
        }),
        prisma.customers.update({
            where: { customer_id: order.customer_id },
            data: { loyalty_points: { increment: points } },
        }),
    ]);
};

export const postPayment = async (body: PostPayment) => {
    const { order_id, payment_method, amount_paid, change_given, transaction_ref } = body;

    const checkOrderExists = await prisma.orders.findUnique({
        where: { order_id },
    });
    if (!checkOrderExists) throw new Error('Order does not exist!!');

    const checkPaymentExists = await prisma.payments.findFirst({
        where: { order_id },
    });
    if (checkPaymentExists) throw new Error('Payment for this order already exists!!');

    const createPayment = await prisma.payments.create({
        data: {
            order_id,
            payment_method,
            amount_paid,
            change_given,
            transaction_ref,
            payment_status: 'completed',
        },
    });

    await awardLoyaltyPoints(order_id, Number(amount_paid));

    return { message: 'Payment created successfully!!', payment_id: createPayment.payment_id };
};

export const getPayment = async (body: GetPayment) => {
    const { payment_id } = body;

    const checkPaymentExists = await prisma.payments.findUnique({
        where: { payment_id },
    });
    if (!checkPaymentExists) throw new Error('Payment does not exist!!');

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
    if (!checkPaymentExists) throw new Error('Payment does not exist!!');

    const updatedPayment = await prisma.payments.update({
        where: { payment_id },
        data: { payment_status, transaction_ref },
    });

    if (payment_status === 'completed' && checkPaymentExists.payment_status !== 'completed') {
        await awardLoyaltyPoints(updatedPayment.order_id, Number(updatedPayment.amount_paid));
    }

    return { message: 'Payment updated successfully!!', payment_id: updatedPayment.payment_id };
};

export const deletePayment = async (body: DeletePayment) => {
    const { payment_id } = body;

    const checkPaymentExists = await prisma.payments.findUnique({
        where: { payment_id },
    });
    if (!checkPaymentExists) throw new Error('Payment does not exist!!');

    await prisma.payments.delete({ where: { payment_id } });

    return { message: 'Payment deleted successfully!!', payment_id };
};

export const initiateEsewaPayment = async (body: InitiateEsewa) => {
    const { order_id, amount } = body;

    const checkOrderExists = await prisma.orders.findUnique({
        where: { order_id },
    });
    if (!checkOrderExists) throw new Error('Order does not exist!!');

    const existingPayment = await prisma.payments.findFirst({
        where: { order_id },
    });
    if (existingPayment) throw new Error('Payment for this order already exists!!');

    const productId = `ORDER-${order_id}-${Date.now()}`;

    const params = new URLSearchParams({
        amt: String(amount),
        psc: '0',
        pdc: '0',
        txAmt: '0',
        tAmt: String(amount),
        pid: productId,
        scd: ESEWA_MERCHANT_ID,
        su: `${BASE_URL}/api/payment/esewa/callback/success`,
        fu: `${BASE_URL}/api/payment/esewa/callback/failure`,
    });

    const paymentUrl = `https://rc-epay.esewa.com.np/epay/main?${params.toString()}`;

    await prisma.payments.create({
        data: {
            order_id,
            payment_method: 'esewa',
            amount_paid: amount,
            change_given: 0,
            payment_status: 'pending',
            transaction_ref: productId,
        },
    });

    return { paymentUrl, productId };
};

export const verifyEsewaPayment = async (body: VerifyEsewa) => {
    const { transaction_ref, amount } = body;

    const paymentRecord = await prisma.payments.findFirst({
        where: { transaction_ref },
    });
    if (!paymentRecord) throw new Error('Payment record not found!!');

    const verifyRes = await fetch(
        `${ESEWA_VERIFY_URL}?productId=${transaction_ref}&amount=${amount}`,
        {
            method: 'GET',
            headers: {
                merchantId: ESEWA_MERCHANT_ID,
                merchantSecret: ESEWA_SECRET,
                'Content-Type': 'application/json',
            },
        }
    );

    const verifyData = await verifyRes.json();
    const txn = verifyData?.[0];

    if (!txn || txn?.transactionDetails?.status !== 'COMPLETE') {
        throw new Error('eSewa payment not verified!!');
    }

    await prisma.payments.update({
        where: { payment_id: paymentRecord.payment_id },
        data: { payment_status: 'completed', updated_at: new Date() },
    });

    await awardLoyaltyPoints(paymentRecord.order_id, Number(paymentRecord.amount_paid));

    return { message: 'eSewa payment verified successfully!!', data: txn };
};