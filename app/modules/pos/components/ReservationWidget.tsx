import { AlertCircle, Calendar, CheckCircle, Clock, MoreVertical, Phone, Users, XCircle } from 'lucide-react-native'
import { useState } from 'react'
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { ReservationEvent } from '../types/orderHistory'
import { ReservationStatus } from '../types/reservation'

interface ReservationWidgetProps {
    reservation: ReservationEvent
    priority: 'low' | 'medium' | 'high' | 'urgent'
    onConfirmArrival: (reservationId: string) => void
    onModifyReservation: (reservation: ReservationEvent) => void
    onStatusChange: (reservationId: string, status: ReservationStatus) => void
    compact?: boolean
}

export default function ReservationWidget({
    reservation,
    priority,
    onConfirmArrival,
    onModifyReservation,
    onStatusChange,
    compact = false
}: ReservationWidgetProps) {
    const [showActions, setShowActions] = useState(false)

    const getPriorityColors = () => {
        switch (priority) {
            case 'urgent':
                return { bg: '#FFEDD5', border: '#FDBA74', text: '#9A3412' }
            case 'high':
                return { bg: '#DBEAFE', border: '#93C5FD', text: '#1E3A8A' }
            case 'medium':
                return { bg: '#F3F4F6', border: '#D1D5DB', text: '#1F2937' }
            case 'low':
                return { bg: '#D1FAE5', border: '#6EE7B7', text: '#065F46' }
        }
    }

    const getTableNumber = () => {
        if (reservation.table_number) {
            return reservation.table_number
        }
        if (reservation.table_id) {
            const match = reservation.table_id.match(/(\d+)/)
            return match ? match[1] : reservation.table_id.substring(0, 8)
        }
        return 'Unknown'
    }

    const getStatusText = () => {
        if (reservation.isOverdue) {
            return `OVERDUE`
        }

        if (reservation.minutesUntil < 15) {
            return `ARRIVING IN ${reservation.minutesUntil}min`
        }

        if (reservation.minutesUntil < 60) {
            return `ARRIVING IN ${reservation.minutesUntil}min`
        }

        return `RESERVED FOR ${reservation.reservation_time}`
    }

    const getStatusIconProps = () => {
        if (reservation.isOverdue) {
            return { size: 16, color: '#EF4444' }
        }

        if (reservation.minutesUntil < 15) {
            return { size: 16, color: '#F97316' }
        }

        if (reservation.minutesUntil < 60) {
            return { size: 16, color: '#3B82F6' }
        }

        return { size: 16, color: '#6B7280' }
    }

    const StatusIcon = () => {
        const props = getStatusIconProps()
        
        if (reservation.isOverdue) {
            return <AlertCircle {...props} />
        }

        if (reservation.minutesUntil < 15) {
            return <AlertCircle {...props} />
        }

        if (reservation.minutesUntil < 60) {
            return <Clock {...props} />
        }

        return <Calendar {...props} />
    }

    const formatTime = (time: string) => {
        const [hours, minutes] = time.split(':')
        return `${hours}:${minutes}`
    }

    const handleQuickAction = (action: string) => {
        setShowActions(false)

        switch (action) {
            case 'confirm':
                onConfirmArrival(reservation.id)
                break
            case 'modify':
                onModifyReservation(reservation)
                break
            case 'cancel':
                onStatusChange(reservation.id, 'cancelled')
                break
            case 'no_show':
                onStatusChange(reservation.id, 'no_show')
                break
        }
    }

    const colors = getPriorityColors()

    if (compact) {
        return (
            <View style={[styles.compactContainer, { backgroundColor: colors.bg, borderColor: colors.border }]}>
                <View style={styles.compactHeader}>
                    <View style={styles.compactHeaderLeft}>
                        <StatusIcon />
                        <Text style={[styles.compactStatusText, { color: colors.text }]}>
                            {getStatusText()}
                        </Text>
                    </View>
                    <Text style={[styles.compactTime, { color: colors.text }]}>
                        {formatTime(reservation.reservation_time)}
                    </Text>
                </View>

                <View style={styles.compactBody}>
                    <View style={styles.compactTableRow}>
                        <Text style={styles.compactTableText}>Table {getTableNumber()}</Text>
                        <View style={styles.compactPeopleBadge}>
                            <Text style={styles.compactPeopleText}>{reservation.party_size} people</Text>
                        </View>
                    </View>

                    <View>
                        <Text style={styles.compactCustomerName}>{reservation.customer_name}</Text>
                        {reservation.customer_phone && (
                            <Text style={[styles.compactPhone, { color: colors.text }]}>
                                {reservation.customer_phone}
                            </Text>
                        )}
                    </View>
                </View>
            </View>
        )
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.bg, borderColor: colors.border }]}>
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <StatusIcon />
                    <Text style={[styles.statusText, { color: colors.text }]}>
                        {getStatusText()}
                    </Text>
                </View>

                <View style={styles.headerRight}>
                    <Text style={[styles.time, { color: colors.text }]}>
                        {formatTime(reservation.reservation_time)}
                    </Text>

                    <TouchableOpacity
                        onPress={() => setShowActions(!showActions)}
                        style={styles.moreButton}
                    >
                        <MoreVertical size={16} color={colors.text} />
                    </TouchableOpacity>
                </View>
            </View>

            <Modal
                visible={showActions}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowActions(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowActions(false)}
                >
                    <View style={styles.actionsMenu}>
                        <TouchableOpacity
                            onPress={() => handleQuickAction('confirm')}
                            style={styles.actionItem}
                        >
                            <CheckCircle size={16} color="#10B981" />
                            <Text style={styles.actionText}>Confirmer arrivée</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => handleQuickAction('modify')}
                            style={styles.actionItem}
                        >
                            <Calendar size={16} color="#3B82F6" />
                            <Text style={styles.actionText}>Modifier</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => handleQuickAction('cancel')}
                            style={styles.actionItem}
                        >
                            <XCircle size={16} color="#EF4444" />
                            <Text style={styles.actionText}>Annuler</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => handleQuickAction('no_show')}
                            style={styles.actionItem}
                        >
                            <AlertCircle size={16} color="#F97316" />
                            <Text style={styles.actionText}>Marquer absent</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>

            <View style={styles.body}>
                <View style={styles.infoRow}>
                    <View style={styles.infoLeft}>
                        <View style={styles.infoItem}>
                            <Calendar size={16} color={colors.text} />
                            <Text style={[styles.infoText, { color: colors.text }]}>
                                Table {getTableNumber()}
                            </Text>
                        </View>
                        <View style={styles.infoItem}>
                            <Users size={16} color={colors.text} />
                            <Text style={[styles.infoSmallText, { color: colors.text }]}>
                                {reservation.party_size} people
                            </Text>
                        </View>
                    </View>
                </View>

                <View style={styles.customerInfo}>
                    <Text style={styles.customerName}>{reservation.customer_name}</Text>

                    {reservation.customer_phone && (
                        <View style={styles.phoneRow}>
                            <Phone size={16} color="#4B5563" />
                            <Text style={styles.phoneText}>{reservation.customer_phone}</Text>
                        </View>
                    )}
                </View>

                {reservation.special_requests && (
                    <View style={styles.specialRequests}>
                        <Text style={styles.specialRequestsText}>"{reservation.special_requests}"</Text>
                    </View>
                )}
            </View>

            <View style={styles.quickActions}>
                <TouchableOpacity
                    onPress={() => handleQuickAction('confirm')}
                    style={styles.quickActionButton}
                >
                    <Text style={styles.quickActionText}>Confirmer arrivée</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => handleQuickAction('modify')}
                    style={styles.quickActionButton}
                >
                    <Text style={styles.quickActionText}>Modifier</Text>
                </TouchableOpacity>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    compactContainer: {
        borderRadius: 8,
        borderWidth: 2,
        padding: 12,
        marginBottom: 12,
    },
    compactHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    compactHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    compactStatusText: {
        fontSize: 12,
        fontWeight: '600',
    },
    compactTime: {
        fontSize: 10,
        opacity: 0.75,
    },
    compactBody: {
        marginTop: 8,
        gap: 4,
    },
    compactTableRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    compactTableText: {
        fontSize: 12,
        fontWeight: '500',
    },
    compactPeopleBadge: {
        backgroundColor: 'rgba(255, 255, 255, 0.5)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    compactPeopleText: {
        fontSize: 10,
    },
    compactCustomerName: {
        fontSize: 12,
        fontWeight: '500',
    },
    compactPhone: {
        fontSize: 10,
        opacity: 0.75,
        marginLeft: 8,
    },
    container: {
        borderRadius: 12,
        borderWidth: 2,
        padding: 16,
        marginBottom: 16,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    time: {
        fontSize: 12,
        opacity: 0.75,
    },
    moreButton: {
        padding: 4,
        borderRadius: 999,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    actionsMenu: {
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        paddingVertical: 4,
        minWidth: 180,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 5,
    },
    actionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        gap: 8,
    },
    actionText: {
        fontSize: 12,
        color: '#111827',
    },
    body: {
        gap: 8,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    infoLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    infoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    infoText: {
        fontSize: 12,
        fontWeight: '500',
    },
    infoSmallText: {
        fontSize: 12,
    },
    customerInfo: {
        gap: 4,
    },
    customerName: {
        fontSize: 12,
        fontWeight: '500',
        color: '#111827',
    },
    phoneRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    phoneText: {
        fontSize: 12,
        color: '#4B5563',
    },
    specialRequests: {
        backgroundColor: 'rgba(255, 255, 255, 0.5)',
        padding: 8,
        borderRadius: 8,
    },
    specialRequestsText: {
        fontSize: 12,
        fontStyle: 'italic',
        opacity: 0.75,
        color: '#111827',
    },
    quickActions: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 12,
    },
    quickActionButton: {
        flex: 1,
        paddingHorizontal: 12,
        paddingVertical: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.5)',
        borderRadius: 8,
        alignItems: 'center',
    },
    quickActionText: {
        fontSize: 12,
        fontWeight: '500',
        color: '#111827',
    },
})