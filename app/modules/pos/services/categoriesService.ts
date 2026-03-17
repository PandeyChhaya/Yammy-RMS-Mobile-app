import AsyncStorage from '@react-native-async-storage/async-storage'



export interface Category{
    id:string
    name: string
    color?: string
    taxRateId?: string
    description:string
    tax_rate_id: string
}

const STORAGE_KEY= '@categories'

const generateID= ()=> `${Date.now()}-${Math.random().toString(36).substr(2,9)}`

export const categoryService={
    getCategories: async (): Promise<Category[]> =>{
        try{
              const json = await AsyncStorage.getItem(STORAGE_KEY)
        return json ? JSON.parse(json): []
        }
        catch(error){
            console.error('Error fetching categories', error)
            return[]
        }
      
    },//reading the category and returning

    getCategoryById: async (id:string):Promise<Category | null> =>{
        try{
            const categories= await categoryService.getCategories()
            return categories.find(c=> c.id === id)|| null
        }
        catch(error){
            console.error('error fetching category:', error)
            return null
        }
    },
    createCategory: async (category:Omit<Category, 'id'>): Promise<Category>=>{
        try{
            const existing = await categoryService.getCategories()
            const newCategory: Category ={
                ...category,
                id: generateID()
            }
        const updated = [...existing, newCategory]
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
            return newCategory
    }
    catch(error){
        console.error('Error creating category', error)
        throw error
    }
},//creating and/or updating category

    updateCategory: async(id:string, category: Partial<Category>): Promise<Category>=>{
        try{
            const existing= await categoryService.getCategories()
            const index = existing.findIndex(c => c.id === id)
            if (index === -1) throw new Error ('Category not found')

                existing[index]={...existing[index], ...category}
                await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(existing))
                return existing[index]
            } catch(error){
                console.error('Error updating category:', error)
                throw error;
            }
    },

    deleteCategory: async(id:string): Promise<void> =>{
       try{const existing= await categoryService.getCategories()
        const filtered= existing.filter (c=>c.id !==id)
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))} 
    
        catch (error){
            console.error('Error deleting category:', error)
            throw error
        }
    }//deleting category


}
