import prisma from '../../db.js';


export const postEarnPoints = async (body: any) => {
    const { customer_id, order_id, amount_paid } = body;

    const customer = await prisma.customers.findUnique({
        where: { customer_id },
    });

    if (!customer) throw new Error("Customer does not exist!");

    const pointsEarned = Math.floor(amount_paid / 10);

    const transaction = await prisma.loyalty_transactions.create({
        data: {
            customer_id,
            order_id,
            points: pointsEarned,
            transaction_type: 'earned',
            description: `Earned ${pointsEarned} points for order #${order_id}`,
        },
    });
    await prisma.customers.update({
    where: { customer_id },
    data: { loyalty_points: { increment: pointsEarned } }
})

    return {
        message: "Points earned successfully!",
        transaction_id: transaction.transaction_id,
        points_earned: pointsEarned,
    };
};


export const postRedeemPoints = async (body: any) => {
    const { customer_id, points_to_redeem } = body;

    const customer = await prisma.customers.findUnique({
        where: { customer_id },
    });

    if (!customer) throw new Error("Customer does not exist!");

    const balance = await getLoyaltyBalanceValue(customer_id);

    if (balance < points_to_redeem) throw new Error("Insufficient loyalty points!");

    const transaction = await prisma.loyalty_transactions.create({
        data: {
            customer_id,
            points: points_to_redeem,
            transaction_type: 'redeemed',
            description: `Redeemed ${points_to_redeem} points`,
        },
    });
    await prisma.customers.update({
    where: { customer_id },
    data: { loyalty_points: { decrement: points_to_redeem } }
})

    return {
        message: "Points redeemed successfully!",
        transaction_id: transaction.transaction_id,
        points_redeemed: points_to_redeem,
    };
};


const getLoyaltyBalanceValue = async (customer_id: number): Promise<number> => {
    const transactions = await prisma.loyalty_transactions.findMany({
        where: { customer_id },
    });

    const balance = transactions.reduce((sum, t) => {
        return t.transaction_type === 'earned'
            ? sum + t.points
            : sum - t.points;
    }, 0);

    return balance;
};

export const getLoyaltyBalance = async (body: any) => {
    const { customer_id } = body;

    const customer = await prisma.customers.findUnique({
        where: { customer_id },
    });

    if (!customer) throw new Error("Customer does not exist!");

    const balance = await getLoyaltyBalanceValue(customer_id);

    return {
        customer_id,
        loyalty_points: balance,
    };
};


export const getAllTransactions = async (body: any) => {
    const { customer_id } = body;

    const customer = await prisma.customers.findUnique({
        where: { customer_id },
    });

    if (!customer) throw new Error("Customer does not exist!");

    const transactions = await prisma.loyalty_transactions.findMany({
        where: { customer_id },
        orderBy: { created_at: 'desc' },
    });

    return transactions;
};


export const deleteTransaction = async (body: any) => {
    const { transaction_id } = body;

    const transactionExists = await prisma.loyalty_transactions.findUnique({
        where: { transaction_id },
    });

    if (!transactionExists) throw new Error("Transaction does not exist!");

    await prisma.loyalty_transactions.delete({
        where: { transaction_id },
    });

    return {
        message: "Transaction deleted successfully!",
        transaction_id,
    };
};