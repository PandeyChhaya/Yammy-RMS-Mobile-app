import { Order, OrderItem, OrderStatus } from '@/shared/types/orders'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CheckCircle, ChefHat, Clock, Package, Trash2, Utensils } from 'lucide-react-native'
import { useEffect, useState } from 'react'
import {
    ActivityIndicator,
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native'
import { ordersService } from './services/orderService'

const C = {
  black:      '#0A0A0A',
  charcoal:   '#1A1A1A',
  graphite:   '#2C2C2C',
  steel:      '#3D3D3D',
  muted:      '#6B6B6B',
  border:     '#2E2E2E',
  card:       '#1E1E1E',
  orange:     '#FF6B2C',
  orangeTint: '#2A1A10',
  orangeDim:  '#7A3010',
  white:      '#FFFFFF',
  offWhite:   '#F0F0F0',
  dim:        '#A0A0A0',
  success:    '#22C55E',
  successBg:  '#0D2818',
  error:      '#EF4444',
  errorBg:    '#2A0A0A',
  pending:    '#F59E0B',
  pendingBg:  '#1C1500',
  cooking:    '#FF6B2C',
  cookingBg:  '#2A1A10',
  ready:      '#22C55E',
  readyBg:    '#0D2818',
  done:       '#6B6B6B',
  doneBg:     '#1A1A1A',
}

const radius = { xs: 6, sm: 10, md: 14, lg: 18, pill: 100 }

export default function Orders() {
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
    const [canDelete, setCanDelete]         = useState(false)
    const [canAdvance, setCanAdvance]       = useState(false)
    const queryClient = useQueryClient()

    useEffect(() => {
        AsyncStorage.getItem('@userRole').then(role => {
            setCanDelete(role === 'Admin')
            setCanAdvance(role === 'Admin' || role === 'Kitchen Staff' || role === 'Cashier')
        })
    }, [])

    const { data: orders = [], isLoading } = useQuery<Order[]>({
        queryKey: ['all-orders'],
        queryFn:  () => ordersService.getOrder(),
        refetchInterval: 5000,
    })

    const updateStatusMutation = useMutation({
        mutationFn: ({ orderId, status }: { orderId: number; status: OrderStatus }) =>
            ordersService.updateOrderStatus(orderId, status),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['all-orders'] }),
    })

    const deleteOrderMutation = useMutation({
        mutationFn: (orderId: number) => ordersService.deleteOrder(orderId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['all-orders'] })
            setSelectedOrder(null)
        },
    })

    const getElapsedTime = (createdAt: string) => {
        const mins = Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000)
        return mins < 60 ? `${mins}m` : `${Math.floor(mins / 60)}h ${mins % 60}m`
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending':    return C.pending
            case 'in_kitchen': return C.cooking
            case 'ready':      return C.ready
            case 'completed':  return C.done
            default:           return C.muted
        }
    }

    const getStatusBg = (status: string) => {
        switch (status) {
            case 'pending':    return C.pendingBg
            case 'in_kitchen': return C.cookingBg
            case 'ready':      return C.readyBg
            case 'completed':  return C.doneBg
            default:           return C.graphite
        }
    }

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'pending':    return 'Pending'
            case 'in_kitchen': return 'Cooking'
            case 'ready':      return 'Ready'
            case 'completed':  return 'Done'
            default:           return status
        }
    }

    const getNextStatus = (status: string): OrderStatus | null => {
        switch (status) {
            case 'pending':    return 'in_kitchen'
            case 'in_kitchen': return 'ready'
            case 'ready':      return 'completed'
            default:           return null
        }
    }

    const activeOrders    = orders.filter((o: Order) => o.order_status !== 'completed')
    const completedOrders = orders.filter((o: Order) => o.order_status === 'completed')

    if (isLoading) {
        return (
            <View style={styles.center}>
                <View style={styles.loadingIcon}>
                    <Utensils size={26} color={C.orange} />
                </View>
                <ActivityIndicator size="large" color={C.orange} style={{ marginTop: 20 }} />
                <Text style={styles.loadingTitle}>Loading Orders…</Text>
            </View>
        )
    }

    return (
        <View style={styles.container}>

            <View style={styles.header}>
                <View style={styles.brand}>
                    <View style={styles.logoBadge}>
                        <ChefHat size={18} color={C.white} />
                    </View>
                    <View>
                        <Text style={styles.headerTitle}>Kitchen Orders</Text>
                        <Text style={styles.headerSub}>Live order management</Text>
                    </View>
                </View>

                <View style={styles.statsRow}>
                    {[
                        { num: activeOrders.filter((o: Order) => o.order_status === 'pending').length,    label: 'Pending', color: C.pending },
                        { num: activeOrders.filter((o: Order) => o.order_status === 'in_kitchen').length, label: 'Cooking', color: C.cooking },
                        { num: activeOrders.filter((o: Order) => o.order_status === 'ready').length,      label: 'Ready',   color: C.ready  },
                        { num: completedOrders.length,                                                    label: 'Done',    color: C.done   },
                    ].map(({ num, label, color }) => (
                        <View key={label} style={styles.statCard}>
                            <Text style={[styles.statNumber, { color }]}>{num}</Text>
                            <Text style={styles.statLabel}>{label}</Text>
                        </View>
                    ))}
                </View>
            </View>

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Active Orders</Text>
                    <View style={styles.sectionBadge}>
                        <Text style={styles.sectionBadgeText}>{activeOrders.length}</Text>
                    </View>
                </View>

                {activeOrders.length === 0 ? (
                    <View style={styles.empty}>
                        <View style={styles.emptyIcon}>
                            <Package size={32} color={C.muted} />
                        </View>
                        <Text style={styles.emptyTitle}>No active orders</Text>
                        <Text style={styles.emptySub}>New orders will appear here</Text>
                    </View>
                ) : (
                    activeOrders.map((order: Order) => {
                        const elapsed    = getElapsedTime(order.created_at)
                        const isUrgent   = parseInt(elapsed) > 20
                        const nextStatus = getNextStatus(order.order_status)

                        return (
                            <TouchableOpacity
                                key={order.order_id}
                                style={[
                                    styles.orderCard,
                                    isUrgent && styles.orderCardUrgent,
                                    { borderLeftColor: getStatusColor(order.order_status) },
                                ]}
                                onPress={() => setSelectedOrder(order)}
                                activeOpacity={0.82}
                            >
                                <View style={styles.orderHeader}>
                                    <View style={styles.orderHeaderLeft}>
                                        <Text style={styles.orderNumber}>#{order.order_id}</Text>
                                        <View style={[styles.statusBadge, { backgroundColor: getStatusBg(order.order_status) }]}>
                                            <View style={[styles.statusDot, { backgroundColor: getStatusColor(order.order_status) }]} />
                                            <Text style={[styles.statusText, { color: getStatusColor(order.order_status) }]}>
                                                {getStatusLabel(order.order_status)}
                                            </Text>
                                        </View>
                                    </View>
                                    <View style={styles.orderHeaderRight}>
                                        <Clock size={13} color={isUrgent ? C.error : C.muted} />
                                        <Text style={[styles.timeText, isUrgent && styles.timeUrgent]}>{elapsed}</Text>
                                    </View>
                                </View>

                                <View style={styles.orderMeta}>
                                    <Text style={styles.tableText}>
                                        {order.table_id ? `Table ${order.table_id}` : 'Takeaway'}
                                    </Text>
                                    <View style={styles.orderTypePill}>
                                        <Text style={styles.orderTypeText}>{order.order_type}</Text>
                                    </View>
                                </View>

                                {order.items && (
                                    <View style={styles.itemsPreview}>
                                        {order.items.slice(0, 2).map((item: OrderItem, i: number) => (
                                            <Text key={i} style={styles.itemText}>
                                                · {item.quantity}× item #{item.menu_item_id}
                                                {item.special_request ? ` (${item.special_request})` : ''}
                                            </Text>
                                        ))}
                                        {order.items.length > 2 && (
                                            <Text style={styles.itemMore}>+{order.items.length - 2} more items</Text>
                                        )}
                                    </View>
                                )}

                                <View style={styles.orderFooter}>
                                    <Text style={styles.orderTotal}>
                                        NPR {order.total_amount?.toFixed(2) ?? '—'}
                                    </Text>
                                    <View style={styles.actions}>
                                        {canAdvance && nextStatus && (
                                            <TouchableOpacity
                                                style={[styles.actionBtn, { backgroundColor: getStatusColor(nextStatus) }]}
                                                onPress={() => updateStatusMutation.mutate({
                                                    orderId: order.order_id,
                                                    status:  nextStatus,
                                                })}
                                            >
                                                <CheckCircle size={12} color={C.white} />
                                                <Text style={styles.actionText}>
                                                    {order.order_status === 'pending'    ? 'Start'  :
                                                     order.order_status === 'in_kitchen' ? 'Ready'  : 'Done'}
                                                </Text>
                                            </TouchableOpacity>
                                        )}
                                        {canDelete && (
                                            <TouchableOpacity
                                                style={styles.deleteBtn}
                                                onPress={() => Alert.alert(
                                                    'Delete Order',
                                                    `Delete order #${order.order_id}?`,
                                                    [
                                                        { text: 'Cancel', style: 'cancel' },
                                                        { text: 'Delete', style: 'destructive', onPress: () => deleteOrderMutation.mutate(order.order_id) },
                                                    ]
                                                )}
                                            >
                                                <Trash2 size={13} color={C.error} />
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                </View>
                            </TouchableOpacity>
                        )
                    })
                )}

                {completedOrders.length > 0 && (
                    <>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Completed</Text>
                            <View style={[styles.sectionBadge, { backgroundColor: C.graphite, borderColor: C.border }]}>
                                <Text style={[styles.sectionBadgeText, { color: C.dim }]}>{completedOrders.length}</Text>
                            </View>
                        </View>
                        {completedOrders.map((order: Order) => (
                            <TouchableOpacity
                                key={order.order_id}
                                style={[styles.orderCard, styles.orderCardCompleted, { borderLeftColor: C.muted }]}
                                onPress={() => setSelectedOrder(order)}
                                activeOpacity={0.82}
                            >
                                <View style={styles.orderHeader}>
                                    <View style={styles.orderHeaderLeft}>
                                        <Text style={[styles.orderNumber, { color: C.dim }]}>#{order.order_id}</Text>
                                        <View style={[styles.statusBadge, { backgroundColor: C.doneBg }]}>
                                            <View style={[styles.statusDot, { backgroundColor: C.done }]} />
                                            <Text style={[styles.statusText, { color: C.done }]}>Done</Text>
                                        </View>
                                    </View>
                                    <Text style={styles.timeText}>{getElapsedTime(order.created_at)}</Text>
                                </View>
                                <Text style={styles.tableText}>
                                    {order.table_id ? `Table ${order.table_id}` : 'Takeaway'}
                                </Text>
                                <Text style={[styles.orderTotal, { color: C.dim, marginTop: 8 }]}>
                                    NPR {order.total_amount?.toFixed(2) ?? '—'}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </>
                )}
            </ScrollView>

            <Modal visible={!!selectedOrder} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>

                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Order #{selectedOrder?.order_id}</Text>
                            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setSelectedOrder(null)}>
                                <Text style={styles.modalCloseText}>✕</Text>
                            </TouchableOpacity>
                        </View>

                        {selectedOrder && (
                            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>

                                {[
                                    { label: 'Table', value: selectedOrder.table_id ? `Table ${selectedOrder.table_id}` : 'Takeaway' },
                                    { label: 'Type',  value: selectedOrder.order_type },
                                    { label: 'Time',  value: getElapsedTime(selectedOrder.created_at) },
                                ].map(({ label, value }) => (
                                    <View key={label} style={styles.detailRow}>
                                        <Text style={styles.detailLabel}>{label}</Text>
                                        <Text style={styles.detailValue}>{value}</Text>
                                    </View>
                                ))}

                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>Status</Text>
                                    <View style={[styles.statusBadge, { backgroundColor: getStatusBg(selectedOrder.order_status) }]}>
                                        <View style={[styles.statusDot, { backgroundColor: getStatusColor(selectedOrder.order_status) }]} />
                                        <Text style={[styles.statusText, { color: getStatusColor(selectedOrder.order_status) }]}>
                                            {getStatusLabel(selectedOrder.order_status)}
                                        </Text>
                                    </View>
                                </View>

                                {selectedOrder.special_notes && (
                                    <View style={styles.notesBox}>
                                        <Text style={styles.notesLabel}>Special Notes</Text>
                                        <Text style={styles.notesText}>{selectedOrder.special_notes}</Text>
                                    </View>
                                )}

                                {selectedOrder.items && selectedOrder.items.length > 0 && (
                                    <>
                                        <Text style={styles.itemsTitle}>Items</Text>
                                        {selectedOrder.items.map((item: OrderItem) => (
                                            <View key={item.order_item_id} style={styles.itemDetail}>
                                                <View style={{ flex: 1 }}>
                                                    <Text style={styles.itemDetailName}>
                                                        {item.quantity}× item #{item.menu_item_id}
                                                    </Text>
                                                    {item.special_request && (
                                                        <Text style={styles.itemSpecial}>{item.special_request}</Text>
                                                    )}
                                                    <Text style={styles.itemStatus}>{item.order_item_status}</Text>
                                                </View>
                                                <View style={{ alignItems: 'flex-end' }}>
                                                    <Text style={styles.itemDetailPrice}>NPR {item.subtotal.toFixed(2)}</Text>
                                                    <Text style={styles.itemUnit}>@ {item.unit_price}</Text>
                                                </View>
                                            </View>
                                        ))}
                                    </>
                                )}

                                <View style={styles.totalRow}>
                                    <Text style={styles.totalLabel}>Total</Text>
                                    <Text style={styles.totalValue}>NPR {selectedOrder.total_amount?.toFixed(2) ?? '—'}</Text>
                                </View>

                                {canAdvance && getNextStatus(selectedOrder.order_status) && (
                                    <TouchableOpacity
                                        style={[styles.modalActionBtn, { backgroundColor: getStatusColor(getNextStatus(selectedOrder.order_status)!) }]}
                                        onPress={() => {
                                            updateStatusMutation.mutate({
                                                orderId: selectedOrder.order_id,
                                                status:  getNextStatus(selectedOrder.order_status)!,
                                            })
                                            setSelectedOrder(null)
                                        }}
                                    >
                                        <CheckCircle size={16} color={C.white} />
                                        <Text style={styles.modalActionText}>
                                            {selectedOrder.order_status === 'pending'    ? 'Send to Kitchen' :
                                             selectedOrder.order_status === 'in_kitchen' ? 'Mark as Ready'   : 'Mark as Done'}
                                        </Text>
                                    </TouchableOpacity>
                                )}

                                {canDelete && (
                                    <TouchableOpacity
                                        style={styles.modalDeleteBtn}
                                        onPress={() => Alert.alert(
                                            'Delete Order',
                                            `Delete order #${selectedOrder.order_id}?`,
                                            [
                                                { text: 'Cancel', style: 'cancel' },
                                                { text: 'Delete', style: 'destructive', onPress: () => deleteOrderMutation.mutate(selectedOrder.order_id) },
                                            ]
                                        )}
                                    >
                                        <Trash2 size={15} color={C.error} />
                                        <Text style={styles.modalDeleteText}>Delete Order</Text>
                                    </TouchableOpacity>
                                )}

                            </ScrollView>
                        )}
                    </View>
                </View>
            </Modal>
        </View>
    )
}

const styles = StyleSheet.create({
    container:    { flex: 1, backgroundColor: C.black },
    center:       { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.black },
    loadingIcon:  {
        width: 58, height: 58, borderRadius: radius.md,
        backgroundColor: C.orangeTint,
        borderWidth: 1.5, borderColor: C.orange,
        alignItems: 'center', justifyContent: 'center',
    },
    loadingTitle: { fontSize: 15, fontWeight: '700', color: C.offWhite, marginTop: 10 },

    header: {
        backgroundColor: C.charcoal,
        paddingTop: 56, paddingHorizontal: 16, paddingBottom: 16,
        borderBottomWidth: 1, borderBottomColor: C.border,
        gap: 16,
    },
    brand:        { flexDirection: 'row', alignItems: 'center', gap: 12 },
    logoBadge:    {
        width: 40, height: 40, borderRadius: radius.sm,
        backgroundColor: C.orange,
        alignItems: 'center', justifyContent: 'center',
    },
    headerTitle:  { fontSize: 16, fontWeight: '900', color: C.white, letterSpacing: 0.5 },
    headerSub:    { fontSize: 10, color: C.muted, fontWeight: '500', letterSpacing: 0.6, marginTop: 1 },

    statsRow: { flexDirection: 'row', gap: 8 },
    statCard: {
        flex: 1, backgroundColor: C.graphite,
        borderRadius: radius.sm, padding: 10, alignItems: 'center',
        borderWidth: 1, borderColor: C.border,
    },
    statNumber: { fontSize: 20, fontWeight: '900', letterSpacing: -0.5 },
    statLabel:  { fontSize: 9, color: C.muted, fontWeight: '600', marginTop: 2, letterSpacing: 0.5 },

    sectionHeader:    { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12, marginTop: 4 },
    sectionTitle:     { fontSize: 11, fontWeight: '800', color: C.muted, textTransform: 'uppercase', letterSpacing: 1.4 },
    sectionBadge:     { backgroundColor: C.orangeTint, borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 2, borderWidth: 1, borderColor: C.orangeDim },
    sectionBadgeText: { fontSize: 11, fontWeight: '700', color: C.orange },

    scrollView:    { flex: 1 },
    scrollContent: { padding: 16, paddingBottom: 48 },

    empty:      { alignItems: 'center', paddingVertical: 56, gap: 10 },
    emptyIcon:  { width: 72, height: 72, borderRadius: radius.lg, backgroundColor: C.graphite, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
    emptyTitle: { fontSize: 16, fontWeight: '800', color: C.offWhite },
    emptySub:   { fontSize: 12, color: C.muted },

    orderCard: {
        backgroundColor: C.card,
        borderRadius: radius.md,
        padding: 14, marginBottom: 12,
        borderLeftWidth: 4,
        borderWidth: 1, borderColor: C.border,
    },
    orderCardUrgent:    { backgroundColor: C.errorBg, borderColor: '#7A1010' },
    orderCardCompleted: { opacity: 0.5 },

    orderHeader:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    orderHeaderLeft:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
    orderHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    orderNumber:      { fontSize: 15, fontWeight: '900', color: C.white },

    statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, paddingVertical: 4, borderRadius: radius.pill },
    statusDot:   { width: 5, height: 5, borderRadius: 3 },
    statusText:  { fontSize: 10, fontWeight: '700' },

    timeText:   { fontSize: 11, color: C.muted, fontWeight: '600' },
    timeUrgent: { color: C.error },

    orderMeta:     { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
    tableText:     { fontSize: 12, color: C.dim, fontWeight: '600' },
    orderTypePill: { backgroundColor: C.orangeTint, borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 2, borderWidth: 1, borderColor: C.orangeDim },
    orderTypeText: { fontSize: 10, fontWeight: '600', color: C.orange },

    itemsPreview: { marginBottom: 12, gap: 3 },
    itemText:     { fontSize: 12, color: C.dim },
    itemMore:     { fontSize: 11, color: C.muted, fontStyle: 'italic' },

    orderFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTopWidth: 1, borderTopColor: C.border },
    orderTotal:  { fontSize: 15, fontWeight: '900', color: C.orange },

    actions:    { flexDirection: 'row', gap: 6 },
    actionBtn:  { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: radius.sm },
    actionText: { fontSize: 11, fontWeight: '700', color: C.white },
    deleteBtn:  { padding: 7, borderRadius: radius.xs, backgroundColor: C.errorBg, borderWidth: 1, borderColor: '#7A1010', alignItems: 'center', justifyContent: 'center' },

    modalOverlay:   { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' },
    modalContainer: { backgroundColor: C.charcoal, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, borderTopWidth: 1, borderColor: C.border, maxHeight: '88%' },
    modalHeader:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 18, borderBottomWidth: 1, borderBottomColor: C.border },
    modalTitle:     { fontSize: 18, fontWeight: '900', color: C.white, letterSpacing: 0.3 },
    modalCloseBtn:  { width: 30, height: 30, borderRadius: radius.xs, backgroundColor: C.graphite, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.border },
    modalCloseText: { fontSize: 14, color: C.dim, fontWeight: '700' },
    modalScroll:    { padding: 18 },

    detailRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.border },
    detailLabel: { fontSize: 11, fontWeight: '800', color: C.muted, textTransform: 'uppercase', letterSpacing: 1 },
    detailValue: { fontSize: 13, fontWeight: '600', color: C.offWhite },

    notesBox:   { backgroundColor: C.orangeTint, borderRadius: radius.md, borderWidth: 1, borderColor: C.orangeDim, padding: 12, marginTop: 12 },
    notesLabel: { fontSize: 10, fontWeight: '800', color: C.orange, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
    notesText:  { fontSize: 13, color: C.offWhite },

    itemsTitle:      { fontSize: 11, fontWeight: '800', color: C.muted, textTransform: 'uppercase', letterSpacing: 1.2, marginTop: 16, marginBottom: 8 },
    itemDetail:      { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.border },
    itemDetailName:  { fontSize: 13, fontWeight: '600', color: C.offWhite },
    itemSpecial:     { fontSize: 11, color: C.dim, fontStyle: 'italic', marginTop: 2 },
    itemStatus:      { fontSize: 10, color: C.muted, marginTop: 2 },
    itemDetailPrice: { fontSize: 13, fontWeight: '700', color: C.orange },
    itemUnit:        { fontSize: 10, color: C.muted, marginTop: 2 },

    totalRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 14, marginTop: 10, borderTopWidth: 1, borderTopColor: C.border, marginBottom: 16 },
    totalLabel: { fontSize: 14, fontWeight: '800', color: C.offWhite },
    totalValue: { fontSize: 20, fontWeight: '900', color: C.orange },

    modalActionBtn:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: radius.md, marginBottom: 10 },
    modalActionText: { fontSize: 14, fontWeight: '800', color: C.white, letterSpacing: 0.3 },

    modalDeleteBtn:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: radius.md, backgroundColor: C.errorBg, borderWidth: 1, borderColor: '#7A1010', marginBottom: 24 },
    modalDeleteText: { fontSize: 13, fontWeight: '700', color: C.error },
})