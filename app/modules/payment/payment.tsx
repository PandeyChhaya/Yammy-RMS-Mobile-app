import { useMutation, useQueryClient } from '@tanstack/react-query'
import { CheckCircle } from 'lucide-react-native'
import { useState } from 'react'
import { ActivityIndicator, Alert, Modal, StyleSheet, Text, View } from 'react-native'
import PaymentCalculator from './calculator'
import { createCashPayment, createOrder, initiateEsewa, verifyEsewa } from './services/paymentService'
import type { PaymentMethod, PaymentModalProps, SplitEntry } from './types/payment'

const C = {
    espresso:  '#1C1008',
    clay:      '#7A4528',
    cream:     '#FDF6EC',
    parchment: '#F5E9D4',
    vellum:    '#EDD9BC',
    sage:      '#3B6E52',
    brass:     '#B5822A',
}

const fmt = (n: number, sym = 'NPR') => `${sym} ${Number(n).toFixed(2)}`

export default function PaymentModal({
    visible,
    onClose,
    onSuccess,
    cartItems,
    cartTotal,
    taxAmount,
    totalWithTax,
    selectedTable,
    customerName,
    symbol = 'NPR',
}: PaymentModalProps) {
    const queryClient = useQueryClient()

    const [done,          setDone]          = useState(false)
    const [esewaQrUrl,    setEsewaQrUrl]    = useState<string | undefined>(undefined)
    const [productId,     setProductId]     = useState<string | null>(null)
    const [pendingAmount, setPendingAmount] = useState(0)

    const handleSuccess = () => {
        queryClient.invalidateQueries({ queryKey: ['orders'] })
        queryClient.invalidateQueries({ queryKey: ['tables'] })
        setDone(true)
        setTimeout(() => {
            setDone(false)
            setEsewaQrUrl(undefined)
            setProductId(null)
            onSuccess()
            onClose()
        }, 1800)
    }

    const buildOrderPayload = (notes?: string) => ({
        table_id:      selectedTable?.table_id,
        order_type:    selectedTable ? 'dine_in' : 'direct',
        special_notes: notes || undefined,
        subtotal:      cartTotal,
        discount:      0,
        tax:           taxAmount,
        total_amount:  totalWithTax,
        items: cartItems.map(i => ({
            menu_item_id: Number(i.menu_item_id),
            quantity:     i.quantity,
            unit_price:   i.unit_price,
            total_price:  i.total_price,
        })),
    })

    const cashMutation = useMutation({
        mutationFn: async ({ amountPaid, notes }: { amountPaid: number; notes: string }) => {
            const { order_id } = await createOrder(buildOrderPayload(notes))
            await createCashPayment({
                order_id,
                payment_method: 'cash',
                amount_paid:    amountPaid,
                change_given:   Math.max(0, amountPaid - totalWithTax),
            })
        },
        onSuccess: handleSuccess,
        onError: (err: Error) => Alert.alert('Payment Failed', err.message),
    })

    const esewaInitMutation = useMutation({
        mutationFn: async ({ notes }: { notes: string }) => {
            const { order_id } = await createOrder(buildOrderPayload(notes))
            const { paymentUrl, productId: pid } = await initiateEsewa({
                order_id,
                amount: totalWithTax,
            })
            return { paymentUrl, productId: pid }
        },
        onSuccess: ({ paymentUrl, productId: pid }) => {
            setEsewaQrUrl(paymentUrl)
            setProductId(pid)
            setPendingAmount(totalWithTax)
        },
        onError: (err: Error) => Alert.alert('eSewa Error', err.message),
    })

    const verifyMutation = useMutation({
        mutationFn: () => verifyEsewa({
            transaction_ref: productId!,
            amount: pendingAmount,
        }),
        onSuccess: handleSuccess,
        onError: (err: Error) => Alert.alert('Verification Failed', err.message),
    })

    const handleCharge = (amountPaid: number, notes: string, method: PaymentMethod) => {
        if (method === 'esewa') {
            esewaInitMutation.mutate({ notes })
        } else {
            cashMutation.mutate({ amountPaid, notes })
        }
    }

    const handleSplit = (_splits: SplitEntry[], _notes: string) => {
        Alert.alert(
            'Split Payment',
            'Collect each person\'s share separately using cash or eSewa.',
            [{ text: 'OK' }]
        )
    }

    const isLoading = cashMutation.isPending || esewaInitMutation.isPending || verifyMutation.isPending

    return (
        <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
            <View style={s.overlay}>
                <View style={s.sheet}>
                    {done ? (
                        <View style={s.centered}>
                            <CheckCircle size={52} color={C.sage} />
                            <Text style={s.successTitle}>Payment Complete!</Text>
                            <Text style={s.successSub}>{fmt(totalWithTax, symbol)} received</Text>
                        </View>
                    ) : isLoading ? (
                        <View style={s.centered}>
                            <ActivityIndicator size="large" color={C.brass} />
                            <Text style={s.loadingText}>Processing...</Text>
                        </View>
                    ) : (
                        <>
                            <PaymentCalculator
                                onClose={onClose}
                                onCharge={handleCharge}
                                onSplit={handleSplit}
                                totalWithTax={totalWithTax}
                                esewaQrUrl={esewaQrUrl}
                                symbol={symbol}
                            />
                            {productId && (
                                <View style={s.verifyBanner}>
                                    <Text style={s.verifyText}>Customer scanned & paid?</Text>
                                    <Text
                                        style={s.verifyLink}
                                        onPress={() => verifyMutation.mutate()}
                                    >
                                        Tap to Verify →
                                    </Text>
                                </View>
                            )}
                        </>
                    )}
                </View>
            </View>
        </Modal>
    )
}

const s = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(28,16,8,0.55)',
        justifyContent: 'flex-end',
    },
    sheet: {
        backgroundColor: C.parchment,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        borderWidth: 1.5,
        borderColor: C.vellum,
        maxHeight: '95%',
    },
    centered: {
        alignItems: 'center',
        paddingVertical: 60,
        gap: 12,
    },
    successTitle: { fontSize: 22, fontWeight: '900', color: C.espresso },
    successSub:   { fontSize: 14, color: C.clay },
    loadingText:  { fontSize: 14, color: C.clay, marginTop: 8 },
    verifyBanner: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        backgroundColor: C.cream, borderTopWidth: 1, borderTopColor: C.vellum,
        paddingHorizontal: 20, paddingVertical: 14,
    },
    verifyText: { fontSize: 13, color: C.clay, fontWeight: '600' },
    verifyLink: { fontSize: 13, fontWeight: '800', color: C.sage },
})
