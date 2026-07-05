import { useEffect, useState } from 'react'
import { authService } from '../../auth/services/auth.service'
import inventoryService from '../services/inventory'
import type { CreateIngredientRequest, Ingredient, UpdateIngredientRequest } from '../types/inventory'

const auth_headers = async () => {
    const token = await authService.getToken()
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
    }
}


export const useIngredients = () => {
    const [ingredients, setIngredients] = useState<Ingredient[]>([])
    const [loading, setLoading]   = useState(true)
    const [mutating, setMutating] = useState(false)
    const [error, setError]       = useState<string | null>(null)

    const fetchIngredients = async () => {
    try {
        setLoading(true)
        const response = await fetch(`http://192.168.1.71:5000/api/inventory`, {
            headers: await auth_headers(),
        })
        const data = await response.json()
        
        const mapped = data.map((item: any) => ({
            id:            String(item.inventory_id),
            name:          item.item_name,
            category:      item.supplier || 'General', 
            unit:          item.unit,
            current_stock: Number(item.quantity),
            min_stock:     Number(item.reorder_level),
            max_stock:     Number(item.reorder_level) * 3,
            cost_per_unit: Number(item.cost_per_unit),
            is_active:     item.is_active,
            created_at:    item.created_at,
            updated_at:    item.updated_at,
        }))
        setIngredients(mapped)
    } catch (err) {
        setError(err instanceof Error ? err.message : 'Error loading ingredients')
    } finally {
        setLoading(false)
    }
}

    const createIngredient = async (request: CreateIngredientRequest) => {
        try {
            setMutating(true)
            const data = await inventoryService.postIngredient(request)
            await fetchIngredients()
            return data
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error creating ingredient')
            throw err
        } finally {
            setMutating(false)
        }
    }

    const updateIngredient = async (id: string, request: UpdateIngredientRequest) => {
        try {
            setMutating(true)
            await inventoryService.putIngredient(id, request)
            await fetchIngredients()
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error updating ingredient')
            throw err
        } finally {
            setMutating(false)
        }
    }

    const deleteIngredient = async (id: string) => {
        try {
            setMutating(true)
            await inventoryService.deleteIngredient(id)
            setIngredients(prev => prev.filter(ing => ing.id !== id))
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error deleting ingredient')
            throw err
        } finally {
            setMutating(false)
        }
    }

    useEffect(() => {
        fetchIngredients()
    }, [])

    return {
        ingredients,
        loading,
        mutating,
        error,
        refetch: fetchIngredients,
        createIngredient,
        updateIngredient,
        deleteIngredient,
    }
}