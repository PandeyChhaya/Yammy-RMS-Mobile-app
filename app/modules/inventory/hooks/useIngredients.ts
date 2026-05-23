import { useEffect, useState } from 'react'
import { authService } from '../../auth/services/auth.service'
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
    const [loading, setLoading] = useState(true)
    const [mutating, setMutating] = useState(false) 
    const [error, setError] = useState<string | null>(null)

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
        const response = await fetch(`http://10.115.151.24:5000/api/inventory`, {
            method: 'POST',
            headers: await auth_headers(),
            body: JSON.stringify({
                item_name:     request.name,
                unit:          request.unit,
                quantity:      request.min_stock,
                reorder_level: request.min_stock,
                cost_per_unit: request.cost_per_unit,
                supplier:      request.category,
            }),
        })
        const data = await response.json()
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
        await fetch(`http://10.115.151.24:5000/api/inventory/${id}`, {
            method: 'PUT',
            headers: await auth_headers(),
            body: JSON.stringify({
                item_name:     request.name,
                unit:          request.unit,
                quantity:      request.current_stock,
                reorder_level: request.min_stock,
                cost_per_unit: request.cost_per_unit,
                supplier:      request.category,
            }),
        })
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
        await fetch(`http://10.115.151.24:5000/api/inventory/${id}`, {
            method: 'DELETE',
            headers: await auth_headers(),
        })
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