import { useEffect, useState } from 'react'
import inventoryService from '../services/inventory'
import type { CreateIngredientRequest, Ingredient, UpdateIngredientRequest } from '../types/inventory'

export const useIngredients = () => {
    const [ingredients, setIngredients] = useState<Ingredient[]>([])
    const [loading, setLoading] = useState(true)
    const [mutating, setMutating] = useState(false)  // separate flag for CUD ops
    const [error, setError] = useState<string | null>(null)

    const fetchIngredients = async () => {
        try {
            setLoading(true)
            setError(null)
            const data = await inventoryService.getAllIngredients()  // ✅ was getIngredient()
            setIngredients(data)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error loading ingredients')
        } finally {
            setLoading(false)
        }
    }

    const createIngredient = async (request: CreateIngredientRequest) => {
        try {
            setMutating(true)
            setError(null)
            const newIngredient = await inventoryService.postIngredient(request)  // ✅ was masterStocksService
            setIngredients(prev => [...prev, newIngredient])
            return newIngredient
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
            setError(null)
            const updated = await inventoryService.putIngredient(id, request)  // ✅ was masterStocksService
            setIngredients(prev => prev.map(ing => ing.id === id ? updated : ing))
            return updated
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
            setError(null)
            await inventoryService.deleteIngredient(id)  // ✅ was masterStocksService
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