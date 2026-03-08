import AsyncStorage from '@react-native-async-storage/async-storage'

export interface Products{
    id: string
    name: string
    description?: string
    price: number
    cost?: number
    categoryID: string
    categoryName?: string
    stockQuantity?: number
    isActive: boolean
    createdAt: string
    updatedAt: string 
}

const STORAGE_KEY= '@products'

const generateID = () => `${Date.now()}-${Math.random().toString(36).substr(2,9)}`

export const productsService={

        //Read The products
        getProducts: async (): Promise<Products[]> =>{
            try{
                const json = await AsyncStorage.getItem("@products")
            return json ? JSON.parse(json): []
            }
            catch(error){
                console.error('Error fetching products', error)
                return []
            }
            
        },
        //Read products by ID
         getProductById: async (id: string): Promise<Products | null> => {
        try {
            const products = await productsService.getProducts()
            return products.find(p => p.id === id) || null  
        } catch (error) {
            console.error('Error fetching products:', error)
            return null
        }
    },

     //Create new product
     createProduct: async (products:Omit<Products, 'id'>): Promise<Products>=>{
        try{
            const existing = await productsService.getProducts()
            const newProduct: Products ={
                ...products,
                id: generateID()
            }
            const updated = [...existing, newProduct]
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
            return newProduct
        }
        catch(error){
            console.error('Error creating product', error)
            throw error
        }
     },

     //Update existing product
     updateProducts: async (id: string, products: Partial<Products>): Promise<Products> => {
        try {
            const existing = await productsService.getProducts()
            const index = existing.findIndex(p => p.id === id)
            if (index === -1) throw new Error('Product not found')
            existing[index] = { ...existing[index], ...products }
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(existing))
            return existing[index]
        } catch (error) {
            console.error('Error updating products:', error)
            throw error
        }},

    //Delete Product
    deleteProducts: async(id:string): Promise<void>=>{
        try{
            const existing = await productsService.getProducts()
            const filtered = existing.filter(p => p.id !==id)
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))

        }
        catch(error){
            console.error('Error deleting Products:', error)
            throw error
        }
    }
   
        
     
}

