import { OrderStatus } from '@/shared/types/orders'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CheckCircle, ChefHat, Clock, Package, Trash2, Utensils } from 'lucide-react-native'
import { useState } from 'react'
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
  espresso:    '#1C1008',
  roast:       '#3D2010',
  clay:        '#7A4528',
  latte:       '#C8956A',
  cream:       '#FDF6EC',
  parchment:   '#F5E9D4',
  vellum:      '#EDD9BC',
  brass:       '#B5822A',
  brassLight:  '#F7EDD8',
  brassBorder: '#DEC07A',
  brassGlow:   '#B5822A40',
  sage:        '#3B6E52',
  sageLight:   '#EBF4EE',
  sageBorder:  '#9FCFB4',
  terracotta:  '#A03020',
  tcLight:     '#FAECEA',
  tcBorder:    '#E8A898',
  onDark:      '#FDF6EC',
}

const radius = { xs: 6, sm: 10, md: 14, lg: 18, pill: 100 }

export interface OrderItem {
    order_item_id: number
    order_id:      number
    menu_item_id:  number
    quantity:      number
    unit_price:    number
    subtotal:      number
    special_request?: string
    order_item_status: string
}

export interface Order {
    order_id:      number
    table_id:      number
    user_id:       number
    order_type:    string
    order_status:  string
    special_notes?: string
    total_amount?:  number
    created_at:    string
    items?:        OrderItem[]
}



export default function Orders() {
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
    const queryClient = useQueryClient()

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
            case 'pending':    return C.brass
            case 'in_kitchen': return C.roast
            case 'ready':      return C.sage
            case 'completed':  return C.clay
            default:           return C.latte
        }
    }

    const getStatusBgColor = (status: string) => {
        switch (status) {
            case 'pending':    return C.brassLight
            case 'in_kitchen': return C.parchment
            case 'ready':      return C.sageLight
            case 'completed':  return C.vellum
            default:           return C.cream
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

    const activeOrders    = orders.filter(o => o.order_status !== 'completed')
    const completedOrders = orders.filter(o => o.order_status === 'completed')

    if (isLoading) {
        return (
            <View style={styles.center}>
                <View style={styles.loadingIcon}>
                    <Utensils size={26} color={C.brass} />
                </View>
                <ActivityIndicator size="large" color={C.brass} style={{ marginTop: 20 }} />
                <Text style={styles.loadingTitle}>Loading Orders…</Text>
            </View>
        )
    }

    return (
        <View style={styles.container}>

            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <View style={styles.brand}>
                        <View style={styles.logoBadge}>
                            <ChefHat size={18} color={C.cream} />
                        </View>
                        <View>
                            <Text style={styles.headerTitle}>Kitchen Orders</Text>
                            <Text style={styles.headerSub}>Live order management</Text>
                        </View>
                    </View>
                </View>

                {/* Stats */}
                <View style={styles.statsRow}>
                    {[
                        { num: activeOrders.filter(o => o.order_status === 'pending').length,    label: 'Pending',  color: C.brass },
                        { num: activeOrders.filter(o => o.order_status === 'in_kitchen').length, label: 'Cooking',  color: C.latte },
                        { num: activeOrders.filter(o => o.order_status === 'ready').length,      label: 'Ready',    color: C.sage  },
                        { num: completedOrders.length,                                           label: 'Done',     color: C.clay  },
                    ].map(({ num, label, color }) => (
                        <View key={label} style={styles.statCard}>
                            <Text style={[styles.statNumber, { color }]}>{num}</Text>
                            <Text style={styles.statLabel}>{label}</Text>
                        </View>
                    ))}
                </View>
            </View>

            {/* Active Orders */}
            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                {/* Section label */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Active Orders</Text>
                    <View style={styles.sectionBadge}>
                        <Text style={styles.sectionBadgeText}>{activeOrders.length}</Text>
                    </View>
                </View>

                {activeOrders.length === 0 ? (
                    <View style={styles.empty}>
                        <View style={styles.emptyIcon}>
                            <Package size={32} color={C.latte} />
                        </View>
                        <Text style={styles.emptyTitle}>No active orders</Text>
                        <Text style={styles.emptySub}>New orders will appear here</Text>
                    </View>
                ) : (
                    activeOrders.map(order => {
                        const elapsed  = getElapsedTime(order.created_at)
                        const isUrgent = parseInt(elapsed) > 20
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
                                {/* Card header */}
                                <View style={styles.orderHeader}>
                                    <View style={styles.orderHeaderLeft}>
                                        <Text style={styles.orderNumber}>#{order.order_id}</Text>
                                        <View style={[
                                            styles.statusBadge,
                                            { backgroundColor: getStatusBgColor(order.order_status) },
                                        ]}>
                                            <View style={[styles.statusDot, { backgroundColor: getStatusColor(order.order_status) }]} />
                                            <Text style={[styles.statusText, { color: getStatusColor(order.order_status) }]}>
                                                {getStatusLabel(order.order_status)}
                                            </Text>
                                        </View>
                                    </View>
                                    <View style={styles.orderHeaderRight}>
                                        <Clock size={13} color={isUrgent ? C.terracotta : C.latte} />
                                        <Text style={[styles.timeText, isUrgent && styles.timeUrgent]}>{elapsed}</Text>
                                    </View>
                                </View>

                                {/* Table + type */}
                                <View style={styles.orderMeta}>
                                    <Text style={styles.tableText}>Table {order.table_id}</Text>
                                    <View style={styles.orderTypePill}>
                                        <Text style={styles.orderTypeText}>{order.order_type}</Text>
                                    </View>
                                </View>

                                {/* Items preview */}
                                {order.items && (
                                    <View style={styles.itemsPreview}>
                                        {order.items.slice(0, 2).map((item, i) => (
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

                                {/* Footer */}
                                <View style={styles.orderFooter}>
                                    <Text style={styles.orderTotal}>
                                        NPR {order.total_amount?.toFixed(2) ?? '—'}
                                    </Text>
                                    <View style={styles.actions}>
                                        {nextStatus && (
                                            <TouchableOpacity
                                                style={[styles.actionBtn, { backgroundColor: getStatusColor(nextStatus) }]}
                                                onPress={() => updateStatusMutation.mutate({
                                                    orderId: order.order_id,
                                                    status:  nextStatus,
                                                })}
                                            >
                                                <CheckCircle size={12} color={C.cream} />
                                                <Text style={styles.actionText}>
                                                    {order.order_status === 'pending'    ? 'Start'  :
                                                     order.order_status === 'in_kitchen' ? 'Ready'  : 'Done'}
                                                </Text>
                                            </TouchableOpacity>
                                        )}
                                        <TouchableOpacity
                                            style={styles.deleteBtn}
                                            onPress={() => Alert.alert(
                                                'Delete Order',
                                                `Delete order #${order.order_id}?`,
                                                [
                                                    { text: 'Cancel',  style: 'cancel' },
                                                    { text: 'Delete',  style: 'destructive', onPress: () => deleteOrderMutation.mutate(order.order_id) },
                                                ]
                                            )}
                                        >
                                            <Trash2 size={13} color={C.terracotta} />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        )
                    })
                )}

                {/* Completed Section */}
                {completedOrders.length > 0 && (
                    <>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Completed</Text>
                            <View style={[styles.sectionBadge, { backgroundColor: C.vellum }]}>
                                <Text style={[styles.sectionBadgeText, { color: C.clay }]}>{completedOrders.length}</Text>
                            </View>
                        </View>
                        {completedOrders.map(order => (
                            <TouchableOpacity
                                key={order.order_id}
                                style={[styles.orderCard, styles.orderCardCompleted, { borderLeftColor: C.clay }]}
                                onPress={() => setSelectedOrder(order)}
                                activeOpacity={0.82}
                            >
                                <View style={styles.orderHeader}>
                                    <View style={styles.orderHeaderLeft}>
                                        <Text style={[styles.orderNumber, { color: C.clay }]}>#{order.order_id}</Text>
                                        <View style={[styles.statusBadge, { backgroundColor: C.vellum }]}>
                                            <View style={[styles.statusDot, { backgroundColor: C.clay }]} />
                                            <Text style={[styles.statusText, { color: C.clay }]}>Done</Text>
                                        </View>
                                    </View>
                                    <Text style={styles.timeText}>{getElapsedTime(order.created_at)}</Text>
                                </View>
                                <Text style={styles.tableText}>Table {order.table_id}</Text>
                                <Text style={[styles.orderTotal, { color: C.clay, marginTop: 8 }]}>
                                    NPR {order.total_amount?.toFixed(2) ?? '—'}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </>
                )}
            </ScrollView>

            {/* Order Detail Modal */}
            <Modal visible={!!selectedOrder} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>

                        {/* Modal header */}
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Order #{selectedOrder?.order_id}</Text>
                            <TouchableOpacity
                                style={styles.modalCloseBtn}
                                onPress={() => setSelectedOrder(null)}
                            >
                                <Text style={styles.modalCloseText}>✕</Text>
                            </TouchableOpacity>
                        </View>

                        {selectedOrder && (
                            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>

                                {/* Detail rows */}
                                {[
                                    { label: 'Table',  value: `Table ${selectedOrder.table_id}` },
                                    { label: 'Type',   value: selectedOrder.order_type },
                                    { label: 'Time',   value: getElapsedTime(selectedOrder.created_at) },
                                ].map(({ label, value }) => (
                                    <View key={label} style={styles.detailRow}>
                                        <Text style={styles.detailLabel}>{label}</Text>
                                        <Text style={styles.detailValue}>{value}</Text>
                                    </View>
                                ))}

                                {/* Status row */}
                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>Status</Text>
                                    <View style={[styles.statusBadge, { backgroundColor: getStatusBgColor(selectedOrder.order_status) }]}>
                                        <View style={[styles.statusDot, { backgroundColor: getStatusColor(selectedOrder.order_status) }]} />
                                        <Text style={[styles.statusText, { color: getStatusColor(selectedOrder.order_status) }]}>
                                            {getStatusLabel(selectedOrder.order_status)}
                                        </Text>
                                    </View>
                                </View>

                                {/* Special notes */}
                                {selectedOrder.special_notes && (
                                    <View style={styles.notesBox}>
                                        <Text style={styles.notesLabel}>Special Notes</Text>
                                        <Text style={styles.notesText}>{selectedOrder.special_notes}</Text>
                                    </View>
                                )}

                                {/* Items */}
                                {selectedOrder.items && selectedOrder.items.length > 0 && (
                                    <>
                                        <Text style={styles.itemsTitle}>Items</Text>
                                        {selectedOrder.items.map((item) => (
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

                                {/* Total */}
                                <View style={styles.totalRow}>
                                    <Text style={styles.totalLabel}>Total</Text>
                                    <Text style={styles.totalValue}>NPR {selectedOrder.total_amount?.toFixed(2) ?? '—'}</Text>
                                </View>

                                {/* Modal action buttons */}
                                {getNextStatus(selectedOrder.order_status) && (
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
                                        <CheckCircle size={16} color={C.cream} />
                                        <Text style={styles.modalActionText}>
                                            {selectedOrder.order_status === 'pending'    ? 'Send to Kitchen' :
                                             selectedOrder.order_status === 'in_kitchen' ? 'Mark as Ready'   : 'Mark as Done'}
                                        </Text>
                                    </TouchableOpacity>
                                )}

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
                                    <Trash2 size={15} color={C.terracotta} />
                                    <Text style={styles.modalDeleteText}>Delete Order</Text>
                                </TouchableOpacity>

                            </ScrollView>
                        )}
                    </View>
                </View>
            </Modal>
        </View>
    )
}

const styles = StyleSheet.create({
    container:    { flex: 1, backgroundColor: C.cream },
    center:       { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.cream },
    loadingIcon:  {
        width: 58, height: 58, borderRadius: radius.md,
        backgroundColor: C.brassLight,
        borderWidth: 1.5, borderColor: C.brassBorder,
        alignItems: 'center', justifyContent: 'center',
    },
    loadingTitle: { fontSize: 15, fontWeight: '700', color: C.espresso, marginTop: 10 },

    // Header
    header: {
        backgroundColor: C.espresso,
        paddingTop: 52,
        paddingHorizontal: 16,
        paddingBottom: 16,
        shadowColor: C.espresso,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 8,
    },
    headerTop:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
    brand:        { flexDirection: 'row', alignItems: 'center', gap: 11 },
    logoBadge:    {
        width: 38, height: 38, borderRadius: radius.sm,
        backgroundColor: C.brass,
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 1, borderColor: C.brassBorder,
    },
    headerTitle:  { fontSize: 16, fontWeight: '900', color: C.cream, letterSpacing: 0.5 },
    headerSub:    { fontSize: 10, color: C.latte, fontWeight: '500', letterSpacing: 0.6, marginTop: 1 },

    // Stats
    statsRow: { flexDirection: 'row', gap: 10 },
    statCard: {
        flex: 1,
        backgroundColor: '#2A1A05',
        borderRadius: radius.sm,
        padding: 10,
        alignItems: 'center',
        borderWidth: 1, borderColor: '#3D2A10',
    },
    statNumber: { fontSize: 20, fontWeight: '900', letterSpacing: -0.5 },
    statLabel:  { fontSize: 9, color: C.latte, fontWeight: '600', marginTop: 2, letterSpacing: 0.5 },

    // Section header
    sectionHeader: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        marginBottom: 12, marginTop: 4,
    },
    sectionTitle: { fontSize: 11, fontWeight: '800', color: C.clay, textTransform: 'uppercase', letterSpacing: 1.4 },
    sectionBadge: {
        backgroundColor: C.brassLight,
        borderRadius: radius.pill,
        paddingHorizontal: 8, paddingVertical: 2,
        borderWidth: 1, borderColor: C.brassBorder,
    },
    sectionBadgeText: { fontSize: 11, fontWeight: '700', color: C.brass },

    // Scroll
    scrollView:    { flex: 1 },
    scrollContent: { padding: 16, paddingBottom: 48 },

    // Empty
    empty:     { alignItems: 'center', paddingVertical: 56, gap: 10 },
    emptyIcon: {
        width: 72, height: 72, borderRadius: radius.lg,
        backgroundColor: C.brassLight,
        borderWidth: 1.5, borderColor: C.brassBorder,
        alignItems: 'center', justifyContent: 'center',
    },
    emptyTitle: { fontSize: 16, fontWeight: '800', color: C.espresso },
    emptySub:   { fontSize: 12, color: C.clay },

    // Order Card
    orderCard: {
        backgroundColor: C.parchment,
        borderRadius: radius.md,
        padding: 14,
        marginBottom: 12,
        borderLeftWidth: 4,
        borderWidth: 1.5,
        borderColor: C.vellum,
        shadowColor: C.espresso,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
        elevation: 2,
    },
    orderCardUrgent:    { backgroundColor: C.tcLight, borderColor: C.tcBorder },
    orderCardCompleted: { opacity: 0.7 },

    orderHeader:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    orderHeaderLeft:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
    orderHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    orderNumber:      { fontSize: 15, fontWeight: '900', color: C.espresso },

    statusBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 5,
        paddingHorizontal: 8, paddingVertical: 4,
        borderRadius: radius.pill,
    },
    statusDot:  { width: 5, height: 5, borderRadius: 3 },
    statusText: { fontSize: 10, fontWeight: '700' },

    timeText:   { fontSize: 11, color: C.latte, fontWeight: '600' },
    timeUrgent: { color: C.terracotta },

    orderMeta:     { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
    tableText:     { fontSize: 12, color: C.clay, fontWeight: '600' },
    orderTypePill: {
        backgroundColor: C.brassLight,
        borderRadius: radius.pill,
        paddingHorizontal: 8, paddingVertical: 2,
        borderWidth: 1, borderColor: C.brassBorder,
    },
    orderTypeText: { fontSize: 10, fontWeight: '600', color: C.brass },

    itemsPreview: { marginBottom: 12, gap: 3 },
    itemText:     { fontSize: 12, color: C.clay },
    itemMore:     { fontSize: 11, color: C.latte, fontStyle: 'italic' },

    orderFooter: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingTop: 10, borderTopWidth: 1, borderTopColor: C.vellum,
    },
    orderTotal: { fontSize: 15, fontWeight: '900', color: C.brass },

    actions:   { flexDirection: 'row', gap: 6 },
    actionBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        paddingHorizontal: 10, paddingVertical: 6,
        borderRadius: radius.sm,
    },
    actionText: { fontSize: 11, fontWeight: '700', color: C.cream },
    deleteBtn:  {
        padding: 7, borderRadius: radius.xs,
        backgroundColor: C.tcLight,
        borderWidth: 1, borderColor: C.tcBorder,
        alignItems: 'center', justifyContent: 'center',
    },

    // Modal
    modalOverlay:   { flex: 1, backgroundColor: 'rgba(28,16,8,0.6)', justifyContent: 'flex-end' },
    modalContainer: {
        backgroundColor: C.parchment,
        borderTopLeftRadius: radius.lg,
        borderTopRightRadius: radius.lg,
        borderWidth: 1.5, borderColor: C.vellum,
        maxHeight: '88%',
    },
    modalHeader: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        padding: 18,
        borderBottomWidth: 1, borderBottomColor: C.vellum,
    },
    modalTitle:     { fontSize: 16, fontWeight: '900', color: C.espresso, letterSpacing: 0.3 },
    modalCloseBtn:  {
        width: 30, height: 30, borderRadius: radius.xs,
        backgroundColor: C.vellum,
        alignItems: 'center', justifyContent: 'center',
    },
    modalCloseText: { fontSize: 14, color: C.clay, fontWeight: '700' },
    modalScroll:    { padding: 18 },

    detailRow: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1, borderBottomColor: C.vellum,
    },
    detailLabel: { fontSize: 11, fontWeight: '800', color: C.clay, textTransform: 'uppercase', letterSpacing: 1 },
    detailValue: { fontSize: 13, fontWeight: '600', color: C.espresso },

    notesBox: {
        backgroundColor: C.brassLight,
        borderRadius: radius.md,
        borderWidth: 1, borderColor: C.brassBorder,
        padding: 12, marginTop: 12,
    },
    notesLabel: { fontSize: 10, fontWeight: '800', color: C.brass, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
    notesText:  { fontSize: 13, color: C.roast },

    itemsTitle: {
        fontSize: 11, fontWeight: '800', color: C.clay,
        textTransform: 'uppercase', letterSpacing: 1.2,
        marginTop: 16, marginBottom: 8,
    },
    itemDetail: {
        flexDirection: 'row', justifyContent: 'space-between',
        paddingVertical: 10,
        borderBottomWidth: 1, borderBottomColor: C.vellum,
    },
    itemDetailName:  { fontSize: 13, fontWeight: '600', color: C.espresso },
    itemSpecial:     { fontSize: 11, color: C.clay, fontStyle: 'italic', marginTop: 2 },
    itemStatus:      { fontSize: 10, color: C.latte, marginTop: 2 },
    itemDetailPrice: { fontSize: 13, fontWeight: '700', color: C.brass },
    itemUnit:        { fontSize: 10, color: C.clay, marginTop: 2 },

    totalRow: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingTop: 14, marginTop: 10,
        borderTopWidth: 2, borderTopColor: C.brassBorder,
        marginBottom: 16,
    },
    totalLabel: { fontSize: 14, fontWeight: '800', color: C.espresso },
    totalValue: { fontSize: 18, fontWeight: '900', color: C.brass },

    modalActionBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        paddingVertical: 14, borderRadius: radius.md,
        marginBottom: 10,
        shadowColor: C.brass,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.25,
        shadowRadius: 6,
        elevation: 3,
    },
    modalActionText: { fontSize: 14, fontWeight: '800', color: C.cream, letterSpacing: 0.3 },

    modalDeleteBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        paddingVertical: 12, borderRadius: radius.md,
        backgroundColor: C.tcLight,
        borderWidth: 1.5, borderColor: C.tcBorder,
        marginBottom: 24,
    },
    modalDeleteText: { fontSize: 13, fontWeight: '700', color: C.terracotta },
})