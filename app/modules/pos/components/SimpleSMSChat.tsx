import { useEffect, useRef, useState } from 'react'
import { AppState, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { useBusinessSettings } from '../../../../shared/hooks/useBusinessSettings'
import { timelineService } from '../services/orderHistoryService'
import { reservationService } from '../services/reservationService'
import { smsTicketService } from '../services/smsTicketService'
import { ReservationEvent, TimelineEvent, TimelineFilters } from '../types/orderHistory'
import { ReservationStatus } from '../types/reservation'
import { normalizePhoneNumber } from '../utils/phoneNormalization'
import ReservationWidget from './ReservationWidget'

interface SimpleSMSChatProps {
    tableId?: string
    tableName?: string
    customerPhone?: string
    customerName?: string
    orderId?: string
    orderTotal?: number
    orderItems?: Array<{
        name: string
        quantity: number
        price: number
    }>
    shouldGenerateTicket?: boolean
}

interface SMSMessage {
    id: string
    message: string
    phone_number: string
    status: string
    provider: string
    created_at: string
    customer_name?: string
}

export default function SimpleSMSChat({
    tableId,
    tableName,
    customerPhone = '',
    customerName = '',
    orderId,
    orderTotal,
    orderItems = [],
    shouldGenerateTicket = false
}: SimpleSMSChatProps) {
    const [phoneNumber, setPhoneNumber] = useState(customerPhone)
    const [customer, setCustomer] = useState(customerName)
    const [message, setMessage] = useState('')
    const [isExpanded, setIsExpanded] = useState(true)
    const [messages, setMessages] = useState<SMSMessage[]>([])
    const [isSendingSMS, setIsSendingSMS] = useState(false)
    const [isLoadingMessages, setIsLoadingMessages] = useState(false)
    const scrollViewRef = useRef<ScrollView>(null)

    const { businessInfo } = useBusinessSettings()

    const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([])
    const [isLoadingTimeline, setIsLoadingTimeline] = useState(false)
    const [timelineFilters, setTimelineFilters] = useState<TimelineFilters>({
        timeFilter: 'all',
        eventType: 'all',
        priority: 'all'
    })

    useEffect(() => {
        if (shouldGenerateTicket && orderId && orderTotal && orderItems.length > 0) {
            generateTicketMessage()
        }
    }, [shouldGenerateTicket, orderId, orderTotal, orderItems])

    const loadMessages = async () => {
        setIsLoadingMessages(true)
        try {
            const allMessages = await smsTicketService.getSMSMessages(20)
            setMessages(allMessages)
        } catch (error) {
            console.error('Error loading messages:', error)
        } finally {
            setIsLoadingMessages(false)
        }
    }

    useEffect(() => {
        loadMessages()
        loadTimelineEvents()
    }, [])

    useEffect(() => {
        const subscription = AppState.addEventListener('change', (nextAppState) => {
            if (nextAppState === 'active') {
                loadMessages()
                loadTimelineEvents()
            }
        })

        return () => subscription.remove()
    }, [])

    const conversationMessages = [...messages].sort((a, b) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    )

    const loadTimelineEvents = async () => {
        setIsLoadingTimeline(true)
        try {
            const events = await timelineService.getFilteredTimelineEvents(timelineFilters)
            setTimelineEvents(events)
        } catch (error) {
            console.error('Error loading timeline events:', error)
        } finally {
            setIsLoadingTimeline(false)
        }
    }

    useEffect(() => {
        loadTimelineEvents()
    }, [timelineFilters])

    const handleConfirmArrival = async (reservationId: string) => {
        try {
            await reservationService.updateReservationStatus(reservationId, 'completed')
            loadTimelineEvents()
        } catch (error) {
            console.error('Error confirming arrival:', error)
        }
    }

    const handleModifyReservation = (reservation: ReservationEvent) => {
        console.log('Modify reservation:', reservation)
    }

    const handleReservationStatusChange = async (reservationId: string, status: ReservationStatus) => {
        try {
            await reservationService.updateReservationStatus(reservationId, status)
            loadTimelineEvents()
        } catch (error) {
            console.error('Error updating reservation status:', error)
        }
    }

    useEffect(() => {
        scrollToBottom()
    }, [conversationMessages])

    const scrollToBottom = () => {
        scrollViewRef.current?.scrollToEnd({ animated: true })
    }

    const generateTicketMessage = () => {
        const businessName = businessInfo?.business_name || 'Zikiro'
        let ticketMessage = `${businessName}\n\n`

        if (orderId) {
            ticketMessage += `Order #${orderId}\n`
        }

        if (tableId) {
            ticketMessage += `Table #${tableId}${tableName ? ` (${tableName})` : ''}\n`
        }

        ticketMessage += `\nOrder Details:\n`

        if (orderItems && orderItems.length > 0) {
            orderItems.forEach(item => {
                const price = item.price || 0
                const quantity = item.quantity || 1
                const name = item.name || 'Product'
                ticketMessage += `• ${name} x${quantity} - ${price.toFixed(2)}€\n`
            })
        } else {
            ticketMessage += `• No items in order\n`
        }

        if (orderTotal) {
            ticketMessage += `\nTotal: ${(orderTotal || 0).toFixed(2)}€\n`
        }

        ticketMessage += `\nThank you for your visit!`

        setMessage(ticketMessage)
    }

    const handleSendSMS = async () => {
        if (!phoneNumber || !message) return

        setIsSendingSMS(true)

        try {
            if (customer) {
                await smsTicketService.ensureContactExists(phoneNumber, customer)
            }

            const normalizedPhone = normalizePhoneNumber(phoneNumber)

            await smsTicketService.sendSMS({
                phone_number: normalizedPhone,
                message,
                customer_name: customer || undefined,
                order_id: orderId,
                table_id: tableId
            })

            setMessage('')
            await loadMessages()
            await loadTimelineEvents()
        } catch (error) {
            console.error('Error sending SMS:', error)
            const failedMessage: SMSMessage = {
                id: Date.now().toString(),
                message,
                phone_number: phoneNumber,
                status: 'failed',
                provider: 'unknown',
                created_at: new Date().toISOString()
            }
            setMessages(prev => [...prev, failedMessage])
        } finally {
            setIsSendingSMS(false)
        }
    }

    const getStatusText = (status: string) => {
        switch (status) {
            case 'sent':
            case 'delivered':
                return '✓'
            case 'failed':
                return '✗'
            default:
                return '⏳'
        }
    }

    const getProviderText = (provider: string) => {
        switch (provider) {
            case 'twilio':
            case 'messagebird':
                return 'Cloud'
            case 'sim800c':
            case 'sim900a':
                return 'SIM'
            default:
                return 'Unknown'
        }
    }

    const FilterButton = ({ value, label, selected }: { value: string; label: string; selected: boolean }) => (
        <TouchableOpacity
            style={[styles.filterButton, selected && styles.filterButtonSelected]}
            onPress={() => setTimelineFilters(prev => ({ ...prev, timeFilter: value as any }))}
        >
            <Text style={[styles.filterButtonText, selected && styles.filterButtonTextSelected]}>{label}</Text>
        </TouchableOpacity>
    )

    const EventTypeButton = ({ value, label, selected }: { value: string; label: string; selected: boolean }) => (
        <TouchableOpacity
            style={[styles.filterButton, selected && styles.filterButtonSelected]}
            onPress={() => setTimelineFilters(prev => ({ ...prev, eventType: value as any }))}
        >
            <Text style={[styles.filterButtonText, selected && styles.filterButtonTextSelected]}>{label}</Text>
        </TouchableOpacity>
    )

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.headerTitle}>SMS Ticket</Text>
                    <Text style={styles.headerSubtitle}>
                        {tableId ? `Table ${tableId}` : 'No table selected'}
                    </Text>
                </View>
                <TouchableOpacity onPress={() => setIsExpanded(!isExpanded)} style={styles.expandButton}>
                    <Text style={styles.expandButtonText}>{isExpanded ? '−' : '+'}</Text>
                </TouchableOpacity>
            </View>

            {isExpanded && (
                <>
                    <View style={styles.messagesContainer}>
                        <ScrollView
                            ref={scrollViewRef}
                            style={styles.messagesScroll}
                            showsVerticalScrollIndicator={false}
                        >
                            {isLoadingMessages ? (
                                <View style={styles.loadingContainer}>
                                    <Text style={styles.loadingText}>Loading messages...</Text>
                                </View>
                            ) : (
                                <View style={styles.contentContainer}>
                                    <View style={styles.filtersRow}>
                                        <FilterButton value="all" label="All" selected={timelineFilters.timeFilter === 'all'} />
                                        <FilterButton value="today" label="Today" selected={timelineFilters.timeFilter === 'today'} />
                                        <FilterButton value="next2hours" label="±2h" selected={timelineFilters.timeFilter === 'next2hours'} />
                                        <FilterButton value="next4hours" label="±4h" selected={timelineFilters.timeFilter === 'next4hours'} />
                                    </View>

                                    <View style={styles.filtersRow}>
                                        <EventTypeButton value="all" label="All" selected={timelineFilters.eventType === 'all'} />
                                        <EventTypeButton value="sms" label="SMS" selected={timelineFilters.eventType === 'sms'} />
                                        <EventTypeButton value="reservation" label="Reservations" selected={timelineFilters.eventType === 'reservation'} />
                                    </View>

                                    {isLoadingTimeline ? (
                                        <View style={styles.loadingContainer}>
                                            <Text style={styles.loadingText}>Loading timeline...</Text>
                                        </View>
                                    ) : timelineEvents.length === 0 ? (
                                        <View style={styles.emptyContainer}>
                                            <Text style={styles.emptyText}>No events found</Text>
                                        </View>
                                    ) : (
                                        timelineEvents.map((event) => {
                                            if (event.type === 'sms') {
                                                const msg = event.data as SMSMessage
                                                return (
                                                    <View key={event.id} style={styles.messageWrapper}>
                                                        <View style={styles.messageBox}>
                                                            <View style={styles.messageHeader}>
                                                                <View style={styles.messageHeaderLeft}>
                                                                    <Text style={styles.phoneNumber}>{msg.phone_number}</Text>
                                                                    {msg.customer_name && (
                                                                        <Text style={styles.customerName}>({msg.customer_name})</Text>
                                                                    )}
                                                                </View>
                                                                <Text style={styles.timestamp}>
                                                                    {timelineService.formatEventTime(event.timestamp)}
                                                                </Text>
                                                            </View>
                                                            <Text style={styles.messageText}>{msg.message}</Text>
                                                            <View style={styles.messageFooter}>
                                                                <View style={styles.messageStatus}>
                                                                    <Text style={styles.statusText}>{getStatusText(msg.status)}</Text>
                                                                    <Text style={styles.providerText}>{getProviderText(msg.provider)}</Text>
                                                                </View>
                                                            </View>
                                                        </View>
                                                    </View>
                                                )
                                            } else if (event.type === 'reservation') {
                                                const reservation = event.data as ReservationEvent
                                                return (
                                                    <ReservationWidget
                                                        key={event.id}
                                                        reservation={reservation}
                                                        priority={event.priority}
                                                        onConfirmArrival={handleConfirmArrival}
                                                        onModifyReservation={handleModifyReservation}
                                                        onStatusChange={handleReservationStatusChange}
                                                        compact={true}
                                                    />
                                                )
                                            }
                                            return null
                                        })
                                    )}
                                </View>
                            )}
                        </ScrollView>
                    </View>

                    <View style={styles.formContainer}>
                        <View style={styles.inputRow}>
                            <View style={styles.inputWrapper}>
                                <Text style={styles.inputLabel}>Phone Number</Text>
                                <TextInput
                                    value={phoneNumber}
                                    onChangeText={setPhoneNumber}
                                    placeholder="+33 6 12 34 56 78"
                                    placeholderTextColor="#9CA3AF"
                                    keyboardType="phone-pad"
                                    style={styles.textInput}
                                />
                            </View>
                            <View style={styles.inputWrapper}>
                                <Text style={styles.inputLabel}>Customer Name</Text>
                                <TextInput
                                    value={customer}
                                    onChangeText={setCustomer}
                                    placeholder="Customer name"
                                    placeholderTextColor="#9CA3AF"
                                    style={styles.textInput}
                                />
                            </View>
                        </View>

                        <View>
                            <Text style={styles.inputLabel}>Message</Text>
                            <TextInput
                                value={message}
                                onChangeText={setMessage}
                                placeholder="Type your message here..."
                                placeholderTextColor="#9CA3AF"
                                multiline
                                numberOfLines={4}
                                style={styles.textArea}
                                textAlignVertical="top"
                            />
                            <View style={styles.messageStats}>
                                <Text style={styles.messageStatsText}>{message.length}/160 characters</Text>
                                <Text style={styles.messageStatsText}>{Math.ceil(message.length / 160)} SMS</Text>
                            </View>
                        </View>

                        <View style={styles.actionButtons}>
                            <TouchableOpacity onPress={generateTicketMessage} style={styles.secondaryButton}>
                                <Text style={styles.secondaryButtonText}>Generate Ticket</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={async () => {
                                    await loadMessages()
                                    await loadTimelineEvents()
                                }}
                                disabled={isLoadingMessages || isLoadingTimeline}
                                style={[styles.secondaryButton, (isLoadingMessages || isLoadingTimeline) && styles.buttonDisabled]}
                            >
                                <Text style={styles.secondaryButtonText}>
                                    {(isLoadingMessages || isLoadingTimeline) ? 'Loading...' : 'Refresh'}
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={handleSendSMS}
                                disabled={!phoneNumber || !message || isSendingSMS}
                                style={[styles.primaryButton, (!phoneNumber || !message || isSendingSMS) && styles.buttonDisabled]}
                            >
                                <Text style={styles.primaryButtonText}>
                                    {isSendingSMS ? 'Sending...' : 'Send SMS'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </>
            )}
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
    },
    headerSubtitle: {
        fontSize: 12,
        color: '#4B5563',
        marginTop: 2,
    },
    expandButton: {
        padding: 4,
    },
    expandButtonText: {
        fontSize: 20,
        color: '#4B5563',
    },
    messagesContainer: {
        minHeight: 200,
        maxHeight: 300,
        padding: 16,
    },
    messagesScroll: {
        flex: 1,
    },
    loadingContainer: {
        paddingVertical: 32,
        alignItems: 'center',
    },
    loadingText: {
        fontSize: 12,
        color: '#6B7280',
    },
    emptyContainer: {
        paddingVertical: 32,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 12,
        color: '#6B7280',
    },
    contentContainer: {
        gap: 12,
    },
    filtersRow: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 8,
    },
    filterButton: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 8,
        backgroundColor: '#FFFFFF',
    },
    filterButtonSelected: {
        backgroundColor: '#DBEAFE',
        borderColor: '#2563EB',
    },
    filterButtonText: {
        fontSize: 12,
        color: '#374151',
    },
    filterButtonTextSelected: {
        color: '#2563EB',
        fontWeight: '500',
    },
    messageWrapper: {
        marginBottom: 12,
    },
    messageBox: {
        backgroundColor: '#F3F4F6',
        borderRadius: 8,
        padding: 12,
        maxWidth: '85%',
    },
    messageHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    messageHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    phoneNumber: {
        fontSize: 10,
        fontWeight: '500',
        color: '#2563EB',
    },
    customerName: {
        fontSize: 10,
        fontWeight: '500',
        color: '#059669',
    },
    timestamp: {
        fontSize: 10,
        color: '#6B7280',
    },
    messageText: {
        fontSize: 12,
        color: '#111827',
    },
    messageFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 8,
    },
    messageStatus: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    statusText: {
        fontSize: 10,
        color: '#374151',
    },
    providerText: {
        fontSize: 10,
        color: '#6B7280',
    },
    formContainer: {
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        gap: 12,
    },
    inputRow: {
        flexDirection: 'row',
        gap: 8,
    },
    inputWrapper: {
        flex: 1,
    },
    inputLabel: {
        fontSize: 10,
        fontWeight: '500',
        color: '#374151',
        marginBottom: 4,
    },
    textInput: {
        width: '100%',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 8,
        fontSize: 12,
        backgroundColor: '#FFFFFF',
    },
    textArea: {
        width: '100%',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 8,
        fontSize: 12,
        backgroundColor: '#FFFFFF',
        minHeight: 80,
    },
    messageStats: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 4,
    },
    messageStatsText: {
        fontSize: 10,
        color: '#6B7280',
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 8,
    },
    secondaryButton: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        backgroundColor: '#F3F4F6',
        borderRadius: 8,
    },
    secondaryButtonText: {
        fontSize: 12,
        color: '#374151',
    },
    primaryButton: {
        flex: 1,
        paddingHorizontal: 12,
        paddingVertical: 8,
        backgroundColor: '#2563EB',
        borderRadius: 8,
        alignItems: 'center',
    },
    primaryButtonText: {
        fontSize: 12,
        color: '#FFFFFF',
        fontWeight: '500',
    },
    buttonDisabled: {
        opacity: 0.5,
    },
})