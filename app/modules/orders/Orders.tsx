import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
    AlertTriangle,
    ChefHat,
    Clock,
    Eye,
    EyeOff,
    Magnet,
    Play,
    Printer,
    RotateCcw,
    Trash2,
    Users,
    X
} from 'lucide-react-native'
import { useState } from 'react'
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native'
import { Order, OrderStatus } from '../../../shared/types/orders'
import { ordersService } from './services/orderService'

// ─── Design Tokens ────────────────────────────────────────────────────────────
const Colors = {
    background: '#FEF1A8',
    card: '#FFFFFF',
    brand: '#C41E1E',
    brandDark: '#A01818',
    textPrimary: '#1A1A1A',
    textSecondary: '#5C5436',
    border: '#E8D88A',
    
    // Kitchen Display Theme
    kitchenHeader: '#C41E1E',
    kitchenDark: '#1F2937',
    kitchenGray: '#374151',
    
    // Status Colors
    statusPending: '#EAB308',
    statusKitchen: '#3B82F6',
    statusReady: '#22C55E',
    statusCompleted: '#6B7280',
    
    // Priority
    priorityHigh: '#EF4444',
    priorityMedium: '#F59E0B',
    priorityLow: '#FEF1A8',
}

export default function Orders() {
    const [selectedOrder, setSelectedOrder] = useState<string | null>(null)
    const [showTrash, setShowTrash] = useState(false)
    const [showCompleted, setShowCompleted] = useState(true)
    const queryClient = useQueryClient()

    // ── Queries ──
    const { data: allOrders = [], isLoading: allLoading } = useQuery<Order[]>({
        queryKey: ['all-orders'],
        queryFn: () => ordersService.getAllOrders(),
        refetchInterval: 5000,
    })

    const { data: trashOrders = [], isLoading: trashLoading } = useQuery<Order[]>({
        queryKey: ['trash-orders'],
        queryFn: () => ordersService.getTrashOrders(),
        refetchInterval: 10000,
    })

    // ── Mutations ──
    const updateOrderStatusMutation = useMutation({
        mutationFn: ({ orderId, status }: { orderId: string; status: OrderStatus }) =>
            ordersService.updateOrderStatus(orderId, status),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['all-orders'] })
        },
    })

    const moveToTrashMutation = useMutation({
        mutationFn: (orderId: string) => ordersService.moveToTrash(orderId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['all-orders'] })
            queryClient.invalidateQueries({ queryKey: ['trash-orders'] })
        },
    })

    const restoreFromTrashMutation = useMutation({
        mutationFn: (orderId: string) => ordersService.restoreFromTrash(orderId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['all-orders'] })
            queryClient.invalidateQueries({ queryKey: ['trash-orders'] })
        },
    })

    const deletePermanentlyMutation = useMutation({
        mutationFn: (orderId: string) => ordersService.deletePermanently(orderId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['trash-orders'] })
        },
    })

    const clearTrashMutation = useMutation({
        mutationFn: () => ordersService.clearTrash(),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['trash-orders'] })
        },
    })

    const cancelOrderItemMutation = useMutation({
        mutationFn: ({ orderId, productId }: { orderId: string; productId: string }) =>
            ordersService.cancelOrderItem(orderId, productId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['all-orders'] })
        },
    })

    // ── Helpers ──
    const activeOrders = allOrders.filter(order => order.status !== 'completed')
    const displayOrders = showTrash ? trashOrders : (showCompleted ? allOrders : activeOrders)
    const isLoading = showTrash ? trashLoading : allLoading

    const getElapsedTime = (createdAt: string) => {
        const created = new Date(createdAt)
        const now = new Date()
        const diff = now.getTime() - created.getTime()
        const minutes = Math.floor(diff / 60000)
        const hours = Math.floor(minutes / 60)

        if (hours > 0) {
            return `${hours}h${minutes % 60}m`
        }
        return `${minutes}m`
    }

    const getStatusColor = (status: OrderStatus) => {
        switch (status) {
            case 'pending': return Colors.statusPending
            case 'in_kitchen': return Colors.statusKitchen
            case 'ready': return Colors.statusReady
            case 'completed': return Colors.statusCompleted
        }
    }

    const getStatusLabel = (status: OrderStatus) => {
        switch (status) {
            case 'pending': return 'PENDING'
            case 'in_kitchen': return 'IN KITCHEN'
            case 'ready': return 'READY'
            case 'completed': return 'COMPLETED'
        }
    }

    const getNextStatus = (currentStatus: OrderStatus): OrderStatus | null => {
        switch (currentStatus) {
            case 'pending': return 'in_kitchen'
            case 'in_kitchen': return 'ready'
            case 'ready': return 'completed'
            default: return null
        }
    }

    const getNextStatusLabel = (currentStatus: OrderStatus) => {
        switch (currentStatus) {
            case 'pending': return 'START'
            case 'in_kitchen': return 'READY'
            case 'ready': return 'COMPLETE'
            default: return null
        }
    }

    const getPriorityStyle = (elapsedTime: string) => {
        const minutes = parseInt(elapsedTime.replace('m', '').replace('h', ''))
        if (elapsedTime.includes('h') || minutes > 30) {
            return { borderColor: Colors.priorityHigh, backgroundColor: '#FEE2E2' }
        }
        if (minutes > 20) {
            return { borderColor: Colors.priorityMedium, backgroundColor: '#FEF3C7' }
        }
        if (minutes > 10) {
            return { borderColor: Colors.statusPending, backgroundColor: '#FEF9C3' }
        }
        return { borderColor: Colors.border, backgroundColor: Colors.card }
    }

    const getOrderCounts = () => {
        const pending = allOrders.filter(o => o.status === 'pending').length
        const inKitchen = allOrders.filter(o => o.status === 'in_kitchen').length
        const ready = allOrders.filter(o => o.status === 'ready').length
        const completed = allOrders.filter(o => o.status === 'completed').length
        const inTrash = trashOrders.length
        return { pending, inKitchen, ready, completed, inTrash }
    }

    const counts = getOrderCounts()
    const selectedOrderData = displayOrders.find(o => o.id === selectedOrder)

    return (
        <View style={styles.root}>
            {/* ── Header ── */}
            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <View style={styles.headerLeft}>
                        <ChefHat size={28} color={Colors.card} />
                        <Text style={styles.headerTitle}>KITCHEN DISPLAY</Text>
                    </View>
                    <View style={styles.headerRight}>
                        <View style={styles.headerBadge}>
                            <Printer size={18} color={Colors.card} />
                            <Text style={styles.headerBadgeText}>KITCHEN</Text>
                        </View>
                        <View style={styles.headerBadge}>
                            <Clock size={18} color={Colors.card} />
                            <Text style={styles.headerBadgeText}>
                                {new Date().toLocaleTimeString('en-US', {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </Text>
                        </View>
                    </View>
                </View>
            </View>

            {/* ── Stats Bar ── */}
            <View style={styles.statsBar}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={styles.statsRow}>
                        <View style={styles.statItem}>
                            <View style={[styles.statDot, { backgroundColor: Colors.statusPending }]} />
                            <Text style={styles.statText}>PENDING: {counts.pending}</Text>
                        </View>
                        <View style={styles.statItem}>
                            <View style={[styles.statDot, { backgroundColor: Colors.statusKitchen }]} />
                            <Text style={styles.statText}>IN KITCHEN: {counts.inKitchen}</Text>
                        </View>
                        <View style={styles.statItem}>
                            <View style={[styles.statDot, { backgroundColor: Colors.statusReady }]} />
                            <Text style={styles.statText}>READY: {counts.ready}</Text>
                        </View>
                        <View style={styles.statItem}>
                            <View style={[styles.statDot, { backgroundColor: Colors.statusCompleted }]} />
                            <Text style={styles.statText}>COMPLETED: {counts.completed}</Text>
                        </View>
                    </View>
                </ScrollView>

                <View style={styles.filterButtons}>
                    <TouchableOpacity
                        style={[styles.filterBtn, showCompleted && styles.filterBtnActive]}
                        onPress={() => setShowCompleted(!showCompleted)}
                    >
                        {showCompleted ? <Eye size={14} color={Colors.card} /> : <EyeOff size={14} color="#9CA3AF" />}
                        <Text style={[styles.filterBtnText, showCompleted && styles.filterBtnTextActive]}>
                            COMPLETED
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.filterBtn, styles.trashBtn, showTrash && styles.trashBtnActive]}
                        onPress={() => setShowTrash(!showTrash)}
                    >
                        <Trash2 size={14} color={showTrash ? Colors.card : '#9CA3AF'} />
                        <Text style={[styles.filterBtnText, showTrash && styles.filterBtnTextActive]}>
                            TRASH ({counts.inTrash})
                        </Text>
                    </TouchableOpacity>

                    {showTrash && trashOrders.length > 0 && (
                        <TouchableOpacity
                            style={styles.emptyTrashBtn}
                            onPress={() => {
                                Alert.alert(
                                    'Empty Trash',
                                    'Permanently empty trash? This action is irreversible.',
                                    [
                                        { text: 'Cancel', style: 'cancel' },
                                        { text: 'Empty', style: 'destructive', onPress: () => clearTrashMutation.mutate() }
                                    ]
                                )
                            }}
                        >
                            <Text style={styles.emptyTrashBtnText}>EMPTY</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            
            <View style={styles.content}>
                {isLoading ? (
                    <View style={styles.centerContent}>
                        <ActivityIndicator size="large" color={Colors.brand} />
                        <Text style={styles.loadingText}>LOADING...</Text>
                    </View>
                ) : displayOrders.length === 0 ? (
                    <View style={styles.centerContent}>
                        <ChefHat size={64} color="#D1D5DB" />
                        <Text style={styles.emptyTitle}>
                            {showTrash ? 'EMPTY TRASH' : 'NO ORDERS'}
                        </Text>
                        <Text style={styles.emptySubtitle}>
                            {showTrash ? 'No orders in trash' : 'Waiting for new orders...'}
                        </Text>
                    </View>
                ) : (
                    <View style={styles.mainLayout}>
                     
                        <ScrollView style={styles.ordersScroll} contentContainerStyle={styles.ordersGrid}>
                            {displayOrders.map((order) => {
                                const elapsed = getElapsedTime(order.created_at)
                                const priorityStyle = getPriorityStyle(elapsed)
                                const isUrgent = elapsed.includes('h') || parseInt(elapsed) > 20

                                return (
                                    <TouchableOpacity
                                        key={order.id}
                                        style={[
                                            styles.orderCard,
                                            { borderColor: priorityStyle.borderColor, backgroundColor: priorityStyle.backgroundColor }
                                        ]}
                                        onPress={() => setSelectedOrder(selectedOrder === order.id ? null : order.id)}
                                    >
                                        {/* Top Bar */}
                                        <View style={styles.orderCardHeader}>
                                            <View style={styles.orderCardHeaderLeft}>
                                                <Magnet size={14} color="#9CA3AF" />
                                                <Text style={styles.orderNumber}>#{order.order_number}</Text>
                                                <View style={[styles.statusDot, { backgroundColor: getStatusColor(order.status) }]} />
                                            </View>
                                            <View style={styles.orderCardHeaderRight}>
                                                <Users size={14} color="#9CA3AF" />
                                                <Text style={styles.tableName}>{order.table_name}</Text>
                                            </View>
                                        </View>

                                        {/* Content */}
                                        <View style={styles.orderCardBody}>
                                            {/* Info Row */}
                                            <View style={styles.orderInfoRow}>
                                                <View style={styles.orderInfoItem}>
                                                    <Text style={styles.orderInfoLabel}>TIME</Text>
                                                    <Text style={styles.orderInfoValue}>{elapsed}</Text>
                                                </View>
                                                <View style={styles.orderInfoItem}>
                                                    <Text style={styles.orderInfoLabel}>STATUS</Text>
                                                    <Text style={styles.orderInfoValueSmall}>{getStatusLabel(order.status)}</Text>
                                                </View>
                                                <View style={[styles.orderInfoItem, { alignItems: 'flex-end' }]}>
                                                    <Text style={styles.orderInfoLabel}>TOTAL</Text>
                                                    <Text style={styles.orderInfoValue}>NPR {order.total_amount.toFixed(2)}</Text>
                                                </View>
                                            </View>

                                            {/* Items */}
                                            <View style={styles.itemsList}>
                                                {order.items.map((item, index) => (
                                                    <View key={index} style={styles.itemRow}>
                                                        <View style={styles.itemLeft}>
                                                            <View style={[
                                                                styles.itemDot,
                                                                { backgroundColor: item.status === 'cancelled' ? Colors.priorityHigh : Colors.statusReady }
                                                            ]} />
                                                            <Text style={[
                                                                styles.itemName,
                                                                item.status === 'cancelled' && styles.itemNameCancelled
                                                            ]}>
                                                                {item.quantity}x {item.product_name}
                                                            </Text>
                                                        </View>
                                                        <Text style={styles.itemPrice}>
                                                            NPR {item.total_price.toFixed(2)}
                                                        </Text>
                                                    </View>
                                                ))}
                                            </View>

                                            {/* Actions */}
                                            <View style={styles.orderActions}>
                                                <View style={styles.orderActionsLeft}>
                                                    {!showTrash && getNextStatus(order.status) && (
                                                        <TouchableOpacity
                                                            style={styles.actionBtnPrimary}
                                                            onPress={() => {
                                                                updateOrderStatusMutation.mutate({
                                                                    orderId: order.id,
                                                                    status: getNextStatus(order.status)!
                                                                })
                                                            }}
                                                        >
                                                            <Play size={12} color={Colors.card} />
                                                            <Text style={styles.actionBtnPrimaryText}>
                                                                {getNextStatusLabel(order.status)}
                                                            </Text>
                                                        </TouchableOpacity>
                                                    )}
                                                    {showTrash && (
                                                        <TouchableOpacity
                                                            style={[styles.actionBtnPrimary, { backgroundColor: Colors.statusReady }]}
                                                            onPress={() => restoreFromTrashMutation.mutate(order.id)}
                                                        >
                                                            <RotateCcw size={12} color={Colors.card} />
                                                            <Text style={styles.actionBtnPrimaryText}>RESTORE</Text>
                                                        </TouchableOpacity>
                                                    )}
                                                </View>
                                                <View style={styles.orderActionsRight}>
                                                    {!showTrash && (
                                                        <TouchableOpacity
                                                            style={styles.actionBtnWarning}
                                                            onPress={() => {
                                                                Alert.alert(
                                                                    'Move to Trash',
                                                                    'Send this order to trash?',
                                                                    [
                                                                        { text: 'Cancel', style: 'cancel' },
                                                                        { text: 'Trash', style: 'destructive', onPress: () => moveToTrashMutation.mutate(order.id) }
                                                                    ]
                                                                )
                                                            }}
                                                        >
                                                            <Trash2 size={12} color={Colors.card} />
                                                        </TouchableOpacity>
                                                    )}
                                                    {showTrash && (
                                                        <TouchableOpacity
                                                            style={styles.actionBtnDanger}
                                                            onPress={() => {
                                                                Alert.alert(
                                                                    'Delete Permanently',
                                                                    'Permanently delete this order?',
                                                                    [
                                                                        { text: 'Cancel', style: 'cancel' },
                                                                        { text: 'Delete', style: 'destructive', onPress: () => deletePermanentlyMutation.mutate(order.id) }
                                                                    ]
                                                                )
                                                            }}
                                                        >
                                                            <X size={12} color={Colors.card} />
                                                        </TouchableOpacity>
                                                    )}
                                                </View>
                                            </View>
                                        </View>

                                        {/* Urgent Indicator */}
                                        {!showTrash && isUrgent && (
                                            <View style={styles.urgentBadge}>
                                                <AlertTriangle size={18} color={Colors.priorityHigh} />
                                            </View>
                                        )}
                                    </TouchableOpacity>
                                )
                            })}
                        </ScrollView>

                        {/* Right - Details Panel */}
                        <View style={styles.detailsPanel}>
                            {selectedOrderData ? (
                                <ScrollView style={styles.detailsScroll}>
                                    <View style={styles.detailsHeader}>
                                        <Text style={styles.detailsTitle}>ORDER DETAILS</Text>
                                        <TouchableOpacity onPress={() => setSelectedOrder(null)}>
                                            <X size={20} color="#6B7280" />
                                        </TouchableOpacity>
                                    </View>

                                    <View style={styles.detailsSection}>
                                        <Text style={styles.detailsSectionTitle}>Information</Text>
                                        <View style={styles.detailsRow}>
                                            <Text style={styles.detailsLabel}>Number:</Text>
                                            <Text style={styles.detailsValue}>#{selectedOrderData.order_number}</Text>
                                        </View>
                                        <View style={styles.detailsRow}>
                                            <Text style={styles.detailsLabel}>Table:</Text>
                                            <Text style={styles.detailsValue}>{selectedOrderData.table_name}</Text>
                                        </View>
                                        <View style={styles.detailsRow}>
                                            <Text style={styles.detailsLabel}>Time:</Text>
                                            <Text style={styles.detailsValue}>{getElapsedTime(selectedOrderData.created_at)}</Text>
                                        </View>
                                        <View style={styles.detailsRow}>
                                            <Text style={styles.detailsLabel}>Status:</Text>
                                            <Text style={styles.detailsValue}>{getStatusLabel(selectedOrderData.status)}</Text>
                                        </View>
                                    </View>

                                    <View style={styles.detailsSection}>
                                        <Text style={styles.detailsSectionTitle}>Items</Text>
                                        {selectedOrderData.items.map((item, index) => (
                                            <View key={index} style={styles.detailsItemRow}>
                                                <View style={styles.detailsItemLeft}>
                                                    <View style={[
                                                        styles.itemDot,
                                                        { backgroundColor: item.status === 'cancelled' ? Colors.priorityHigh : Colors.statusReady }
                                                    ]} />
                                                    <Text style={[
                                                        styles.detailsItemName,
                                                        item.status === 'cancelled' && styles.itemNameCancelled
                                                    ]}>
                                                        {item.quantity}x {item.product_name}
                                                    </Text>
                                                </View>
                                                <View style={styles.detailsItemRight}>
                                                    <Text style={styles.detailsItemPrice}>
                                                        NPR {item.total_price.toFixed(2)}
                                                    </Text>
                                                    {!showTrash && item.status === 'active' && selectedOrderData.status !== 'completed' && (
                                                        <TouchableOpacity
                                                            style={styles.cancelItemBtn}
                                                            onPress={() => cancelOrderItemMutation.mutate({
                                                                orderId: selectedOrder!,
                                                                productId: item.product_id
                                                            })}
                                                        >
                                                            <X size={12} color={Colors.priorityHigh} />
                                                        </TouchableOpacity>
                                                    )}
                                                </View>
                                            </View>
                                        ))}
                                    </View>

                                    <View style={styles.detailsTotal}>
                                        <Text style={styles.detailsTotalLabel}>Total</Text>
                                        <Text style={styles.detailsTotalValue}>
                                            NPR {selectedOrderData.total_amount.toFixed(2)}
                                        </Text>
                                    </View>
                                </ScrollView>
                            ) : (
                                <View style={styles.centerContent}>
                                    <ChefHat size={48} color="#D1D5DB" />
                                    <Text style={styles.emptyTitle}>Select an order</Text>
                                    <Text style={styles.emptySubtitle}>to see details</Text>
                                </View>
                            )}
                        </View>
                    </View>
                )}
            </View>
        </View>
    )
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: '#F3F4F6',
    },

    // Header
    header: {
        backgroundColor: Colors.kitchenHeader,
        paddingTop: 52,
        paddingHorizontal: 20,
        paddingBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5,
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: Colors.card,
        fontFamily: 'Inter',
    },
    headerRight: {
        flexDirection: 'row',
        gap: 12,
    },
    headerBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    headerBadgeText: {
        fontSize: 12,
        fontWeight: '600',
        color: Colors.card,
        fontFamily: 'Inter',
    },

    // Stats Bar
    statsBar: {
        backgroundColor: Colors.kitchenDark,
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: Colors.kitchenGray,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    statsRow: {
        flexDirection: 'row',
        gap: 20,
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    statDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    statText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#D1D5DB',
        fontFamily: 'Inter',
    },
    filterButtons: {
        flexDirection: 'row',
        gap: 8,
    },
    filterBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
        backgroundColor: Colors.kitchenGray,
    },
    filterBtnActive: {
        backgroundColor: Colors.statusReady,
    },
    filterBtnText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#9CA3AF',
        fontFamily: 'Inter',
    },
    filterBtnTextActive: {
        color: Colors.card,
    },
    trashBtn: {
        // Default trash button styling
    },
    trashBtnActive: {
        backgroundColor: Colors.priorityHigh,
    },
    emptyTrashBtn: {
        backgroundColor: '#991B1B',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
    },
    emptyTrashBtnText: {
        fontSize: 11,
        fontWeight: '600',
        color: Colors.card,
        fontFamily: 'Inter',
    },

    // Content
    content: {
        flex: 1,
    },
    centerContent: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
    },
    loadingText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6B7280',
        marginTop: 8,
        fontFamily: 'Inter',
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#374151',
        fontFamily: 'Inter',
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#9CA3AF',
        fontFamily: 'Inter',
    },

    // Main Layout
    mainLayout: {
        flex: 1,
        flexDirection: 'row',
    },

    // Orders Scroll
    ordersScroll: {
        flex: 2,
    },
    ordersGrid: {
        padding: 16,
        gap: 16,
    },

    // Order Card
    orderCard: {
        borderRadius: 12,
        borderWidth: 2,
        overflow: 'hidden',
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    orderCardHeader: {
        backgroundColor: Colors.kitchenGray,
        paddingHorizontal: 14,
        paddingVertical: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    orderCardHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    orderNumber: {
        fontSize: 16,
        fontWeight: '800',
        color: Colors.card,
        fontFamily: 'Inter',
    },
    statusDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    orderCardHeaderRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    tableName: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors.card,
        fontFamily: 'Inter',
    },

    // Order Card Body
    orderCardBody: {
        padding: 14,
        backgroundColor: Colors.card,
    },
    orderInfoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingBottom: 12,
        borderBottomWidth: 2,
        borderBottomColor: '#E5E7EB',
        marginBottom: 12,
    },
    orderInfoItem: {
        alignItems: 'center',
    },
    orderInfoLabel: {
        fontSize: 10,
        fontWeight: '700',
        color: '#6B7280',
        marginBottom: 2,
        fontFamily: 'Inter',
    },
    orderInfoValue: {
        fontSize: 16,
        fontWeight: '800',
        color: Colors.textPrimary,
        fontFamily: 'Inter',
    },
    orderInfoValueSmall: {
        fontSize: 12,
        fontWeight: '800',
        color: Colors.textPrimary,
        fontFamily: 'Inter',
    },

    // Items
    itemsList: {
        gap: 8,
        marginBottom: 12,
    },
    itemRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 4,
    },
    itemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        flex: 1,
    },
    itemDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    itemName: {
        fontSize: 13,
        fontWeight: '700',
        color: Colors.textPrimary,
        fontFamily: 'Inter',
    },
    itemNameCancelled: {
        textDecorationLine: 'line-through',
        color: Colors.priorityHigh,
    },
    itemPrice: {
        fontSize: 13,
        fontWeight: '700',
        color: '#374151',
        fontFamily: 'Inter',
    },

    // Actions
    orderActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingTop: 12,
        borderTopWidth: 2,
        borderTopColor: '#E5E7EB',
    },
    orderActionsLeft: {
        flexDirection: 'row',
        gap: 8,
    },
    orderActionsRight: {
        flexDirection: 'row',
        gap: 8,
    },
    actionBtnPrimary: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: Colors.statusKitchen,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
    },
    actionBtnPrimaryText: {
        fontSize: 11,
        fontWeight: '800',
        color: Colors.card,
        fontFamily: 'Inter',
    },
    actionBtnWarning: {
        backgroundColor: Colors.priorityMedium,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
    },
    actionBtnDanger: {
        backgroundColor: Colors.priorityHigh,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
    },

    // Urgent Badge
    urgentBadge: {
        position: 'absolute',
        top: 8,
        right: 8,
    },

    // Details Panel
    detailsPanel: {
        flex: 1,
        backgroundColor: Colors.card,
        borderLeftWidth: 1,
        borderLeftColor: '#E5E7EB',
    },
    detailsScroll: {
        flex: 1,
        padding: 20,
    },
    detailsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    detailsTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: Colors.textPrimary,
        fontFamily: 'Inter',
    },
    detailsSection: {
        backgroundColor: '#F9FAFB',
        padding: 16,
        borderRadius: 12,
        marginBottom: 16,
    },
    detailsSectionTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: Colors.textPrimary,
        marginBottom: 12,
        fontFamily: 'Inter',
    },
    detailsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 6,
    },
    detailsLabel: {
        fontSize: 13,
        color: '#6B7280',
        fontFamily: 'Inter',
    },
    detailsValue: {
        fontSize: 13,
        fontWeight: '700',
        color: Colors.textPrimary,
        fontFamily: 'Inter',
    },
    detailsItemRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    detailsItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        flex: 1,
    },
    detailsItemName: {
        fontSize: 13,
        color: Colors.textPrimary,
        fontFamily: 'Inter',
    },
    detailsItemRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    detailsItemPrice: {
        fontSize: 13,
        fontWeight: '700',
        color: '#374151',
        fontFamily: 'Inter',
    },
    cancelItemBtn: {
        padding: 4,
    },
    detailsTotal: {
        backgroundColor: '#F9FAFB',
        padding: 16,
        borderRadius: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    detailsTotalLabel: {
        fontSize: 16,
        fontWeight: '800',
        color: Colors.textPrimary,
        fontFamily: 'Inter',
    },
    detailsTotalValue: {
        fontSize: 18,
        fontWeight: '800',
        color: Colors.textPrimary,
        fontFamily: 'Inter',
    },
})
