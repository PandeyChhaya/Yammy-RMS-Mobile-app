import { ReservationEvent, TimelineEvent, TimelineFilters, TimelineGroup, TimelineStats } from '../types/orderHistory'
import { Reservation } from '../types/reservation'
import { reservationService } from './reservationService'
import { smsTicketService } from './smsTicketService'

export const timelineService = {
    async getTimelineEvents(limit: number = 50): Promise<TimelineEvent[]> {
        try {
            const [smsMessages, todayReservations] = await Promise.all([
                smsTicketService.getSMSMessages(limit * 2),
                reservationService.getReservationsWithTableInfo(new Date().toISOString().split('T')[0])
            ])

            const reservationEvents = todayReservations
                .filter(reservation => reservation.status !== 'cancelled')
                .map(reservation => ({
                    id: `res-${reservation.id}`,
                    type: 'reservation' as const,
                    timestamp: `${reservation.reservation_date}T${reservation.reservation_time}`,
                    data: reservation,
                    priority: timelineService.calculateReservationPriority(reservation)
                }))

            const smsEvents = smsMessages.map(sms => ({
                id: `sms-${sms.id}`,
                type: 'sms' as const,
                timestamp: sms.created_at,
                data: sms,
                priority: 'low' as const
            }))

            const now = new Date()
            const allEvents = [...smsEvents, ...reservationEvents]

            return allEvents.sort((a, b) => {
                const timeA = new Date(a.timestamp).getTime()
                const timeB = new Date(b.timestamp).getTime()
                const nowTime = now.getTime()

                if (timeA <= nowTime && timeB <= nowTime) {
                    return timeA - timeB
                }

                if (timeA > nowTime && timeB > nowTime) {
                    return timeA - timeB
                }

                if (timeA <= nowTime && timeB > nowTime) {
                    return -1
                }
                if (timeA > nowTime && timeB <= nowTime) {
                    return 1
                }

                return 0
            })
        } catch (error) {
            console.error('Error loading timeline events:', error)
            return []
        }
    },

    calculateReservationPriority(reservation: any): 'low' | 'medium' | 'high' | 'urgent' {
        const now = new Date()
        const reservationTime = new Date(`${reservation.reservation_date}T${reservation.reservation_time}`)
        const minutesUntil = Math.floor((reservationTime.getTime() - now.getTime()) / (1000 * 60))

        if (minutesUntil < 0) return 'low'
        if (minutesUntil < 15) return 'urgent'
        if (minutesUntil < 60) return 'high'
        return 'medium'
    },

    async getFilteredTimelineEvents(filters: TimelineFilters): Promise<TimelineEvent[]> {
        const allEvents = await timelineService.getTimelineEvents(100)

        let filteredEvents = allEvents

        if (filters.timeFilter !== 'all') {
            const now = new Date()
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

            filteredEvents = filteredEvents.filter(event => {
                const eventTime = new Date(event.timestamp)

                switch (filters.timeFilter) {
                    case 'today':
                        return eventTime >= today
                    case 'next2hours':
                        const in2Hours = new Date(now.getTime() + 2 * 60 * 60 * 1000)
                        const past2Hours = new Date(now.getTime() - 2 * 60 * 60 * 1000)
                        return eventTime >= past2Hours && eventTime <= in2Hours
                    case 'next4hours':
                        const in4Hours = new Date(now.getTime() + 4 * 60 * 60 * 1000)
                        const past4Hours = new Date(now.getTime() - 4 * 60 * 60 * 1000)
                        return eventTime >= past4Hours && eventTime <= in4Hours
                    default:
                        return true
                }
            })
        }

        if (filters.eventType && filters.eventType !== 'all') {
            filteredEvents = filteredEvents.filter(event => event.type === filters.eventType)
        }

        if (filters.priority && filters.priority !== 'all') {
            filteredEvents = filteredEvents.filter(event => event.priority === filters.priority)
        }

        return filteredEvents
    },

    async getTimelineStats(): Promise<TimelineStats> {
        const events = await timelineService.getTimelineEvents(100)

        const smsCount = events.filter(e => e.type === 'sms').length
        const reservationCount = events.filter(e => e.type === 'reservation').length

        const upcomingReservations = events.filter(e =>
            e.type === 'reservation' &&
            (e.priority === 'high' || e.priority === 'urgent')
        ).length

        const urgentReservations = events.filter(e =>
            e.type === 'reservation' &&
            e.priority === 'urgent'
        ).length

        return {
            totalEvents: events.length,
            smsCount,
            reservationCount,
            upcomingReservations,
            urgentReservations
        }
    },

    groupEventsByTime(events: TimelineEvent[]): TimelineGroup[] {
        const groups: { [key: string]: TimelineEvent[] } = {}

        events.forEach(event => {
            const eventTime = new Date(event.timestamp)
            const timeKey = eventTime.toLocaleTimeString('fr-FR', {
                hour: '2-digit',
                minute: '2-digit'
            })

            if (!groups[timeKey]) {
                groups[timeKey] = []
            }
            groups[timeKey].push(event)
        })

        const now = new Date()
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

        return Object.entries(groups)
            .map(([time, events]) => ({
                time,
                events: events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()),
                isToday: new Date(events[0].timestamp) >= today,
                isUpcoming: new Date(events[0].timestamp) > now
            }))
            .sort((a, b) => a.time.localeCompare(b.time))
    },

    enrichReservationEvent(reservation: any): ReservationEvent {
        const now = new Date()
        const reservationTime = new Date(`${reservation.reservation_date}T${reservation.reservation_time}`)
        const minutesUntil = Math.floor((reservationTime.getTime() - now.getTime()) / (1000 * 60))

        return {
            ...reservation,
            minutesUntil,
            isUpcoming: minutesUntil > 0,
            isOverdue: minutesUntil < 0
        }
    },

    getReservationStatusText(reservation: ReservationEvent): string {
        if (reservation.isOverdue) {
            return 'LATE'
        }

        if (reservation.minutesUntil < 15) {
            return `ARRIVES IN ${reservation.minutesUntil}minutes`
        }

        if (reservation.minutesUntil < 60) {
            return `ARRIVES IN ${reservation.minutesUntil}minutes`
        }

        return `RESERVED FOR ${reservation.reservation_time}`
    },

    getReservationStatusColor(reservation: ReservationEvent): string {
        if (reservation.isOverdue) {
            return '#EF4444'
        }

        if (reservation.minutesUntil < 15) {
            return '#F97316'
        }

        if (reservation.minutesUntil < 60) {
            return '#3B82F6'
        }

        return '#6B7280'
    },

    getReservationStatusBackgroundColor(reservation: ReservationEvent): string {
        if (reservation.isOverdue) {
            return '#FEE2E2'
        }

        if (reservation.minutesUntil < 15) {
            return '#FFEDD5'
        }

        if (reservation.minutesUntil < 60) {
            return '#DBEAFE'
        }

        return '#F3F4F6'
    },

    getReservationStatusBorderColor(reservation: ReservationEvent): string {
        if (reservation.isOverdue) {
            return '#FCA5A5'
        }

        if (reservation.minutesUntil < 15) {
            return '#FDBA74'
        }

        if (reservation.minutesUntil < 60) {
            return '#93C5FD'
        }

        return '#D1D5DB'
    },

    formatEventTime(timestamp: string): string {
        const date = new Date(timestamp)
        const now = new Date()
        const diffMs = now.getTime() - date.getTime()
        const diffMins = Math.floor(diffMs / (1000 * 60))

        if (diffMins < 1) {
            return 'Just\'now'
        }

        if (diffMins < 60) {
            return `Minutes ${diffMins}ago`
        }

        if (diffMins < 1440) {
            const hours = Math.floor(diffMins / 60)
            return `Hours ${hours}ago`
        }

        return date.toLocaleTimeString('np-NPR', {
            hour: '2-digit',
            minute: '2-digit'
        })
    },

    shouldShowReservation(reservation: Reservation): boolean {
        const now = new Date()
        const reservationTime = new Date(`${reservation.reservation_date}T${reservation.reservation_time}`)
        const hoursUntil = (reservationTime.getTime() - now.getTime()) / (1000 * 60 * 60)

        return hoursUntil >= -1 && hoursUntil <= 4
    },

    getNextReservation(events: TimelineEvent[]): Reservation | null {
        const now = new Date()
        const upcomingReservations = events
            .filter(e => e.type === 'reservation')
            .map(e => e.data as Reservation)
            .filter(r => {
                const reservationTime = new Date(`${r.reservation_date}T${r.reservation_time}`)
                return reservationTime > now && r.status === 'confirmed'
            })
            .sort((a, b) => {
                const timeA = new Date(`${a.reservation_date}T${a.reservation_time}`)
                const timeB = new Date(`${b.reservation_date}T${b.reservation_time}`)
                return timeA.getTime() - timeB.getTime()
            })

        return upcomingReservations[0] || null
    }
}