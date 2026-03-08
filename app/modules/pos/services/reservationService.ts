import AsyncStorage from '@react-native-async-storage/async-storage'
import {
    CreateReservationRequest,
    Reservation,
    ReservationStatus,
    ReservationWithTable
} from '../types/reservation'
import { tablesService } from './tablesService'

const STORAGE_KEY = '@reservations'

const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

export const reservationService = {
    async createReservation(reservation: CreateReservationRequest): Promise<Reservation> {
        const newReservation: Reservation = {
            id: generateId(),
            ...reservation,  
            status: 'confirmed',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
             duration_minutes: reservation.duration_minutes ?? 60 
        }
        
        const allReservations = await reservationService.getAllReservations()
        allReservations.push(newReservation)
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(allReservations))
        return newReservation
    },

    async getAllReservations(): Promise<Reservation[]> {
        const json = await AsyncStorage.getItem(STORAGE_KEY)
        return json ? JSON.parse(json) : []
    },

    async getReservationsByDate(date: string): Promise<Reservation[]> {
        const all = await reservationService.getAllReservations()
        return all.filter(r => r.reservation_date === date)
    },

    async getTodayReservations(): Promise<Reservation[]> {
        const today = new Date().toISOString().split('T')[0]
        return reservationService.getReservationsByDate(today)
    },

    async updateReservationStatus(id: string, status: ReservationStatus): Promise<void> {  // ✅ FIXED - was string
        const all = await reservationService.getAllReservations()
        const index = all.findIndex(r => r.id === id)
        if (index === -1) throw new Error('Reservation not found')
        
        all[index] = { ...all[index], status, updated_at: new Date().toISOString() }
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(all))
    },

    async deleteReservation(id: string): Promise<void> {
        const all = await reservationService.getAllReservations()
        const filtered = all.filter(r => r.id !== id)
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
    },

    async getReservationsByTable(tableId: string): Promise<Reservation[]> {
        const all = await reservationService.getAllReservations()
        return all.filter(r => r.table_id === tableId)
    },

    async getReservationsWithTableInfo(date: string): Promise<ReservationWithTable[]> {
        const reservations = await reservationService.getReservationsByDate(date)
        const reservationsWithTable: ReservationWithTable[] = []
        

        const allTables = await tablesService.getAllTables()

        for (const reservation of reservations) {
            try {
                
                const table = allTables.find(t => t.id === reservation.table_id)
                
                if (table) {
                    reservationsWithTable.push({
                        ...reservation,
                        table_number: table.number,
                        table_name: table.name,
                        table_capacity: table.capacity
                    })
                } else {
          
                    reservationsWithTable.push({
                        ...reservation,
                        table_number: 0,
                        table_name: 'Unknown Table',
                        table_capacity: 0
                    })
                }
            } catch (error) {
                console.error('Error fetching table info for reservation:', error)
                reservationsWithTable.push({
                    ...reservation,
                    table_number: 0,
                    table_name: 'Unknown Table',
                    table_capacity: 0
                })
            }
        }

        return reservationsWithTable
    },


}