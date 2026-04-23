import { authService } from "../../auth/services/auth.service";
import type {
    CreateIngredientRequest,
    CreateSupplierRequest,
    Ingredient,
    Invoice,
    InvoiceAnalysisRequest,
    InvoiceAnalysisResponse,
    InvoiceItem,
    StockAlert,
    StockDashboardData,
    StockMovement,
    Supplier,
    UpdateIngredientRequest,
    UpdateSupplierRequest,
} from "../types/inventory";

const BASE_URL = 'http://192.168.1.71:5000/api/inventory';

const auth_headers = async () => {
    const token = await authService.getToken();
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
    };
};

// ─── Ingredients ────────────────────────────────────────────────

const postIngredient = async (item: CreateIngredientRequest): Promise<Ingredient> => {
    const response = await fetch(`${BASE_URL}/ingredients`, {
        method: 'POST',
        headers: await auth_headers(),
        body: JSON.stringify(item),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to create ingredient');
    return data;
};

const getAllIngredients = async (): Promise<Ingredient[]> => {
    const response = await fetch(`${BASE_URL}/ingredients`, {
        method: 'GET',
        headers: await auth_headers(),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to load ingredients');
    if (!Array.isArray(data)) throw new Error('Unexpected response format');
    return data;
};

const getIngredient = async (id: string): Promise<Ingredient> => {
    const response = await fetch(`${BASE_URL}/ingredients/${id}`, {
        method: 'GET',
        headers: await auth_headers(),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to load ingredient');
    return data;
};

const putIngredient = async (
    id: string,
    updates: UpdateIngredientRequest
): Promise<Ingredient> => {
    const response = await fetch(`${BASE_URL}/ingredients/${id}`, {
        method: 'PUT',
        headers: await auth_headers(),
        body: JSON.stringify(updates),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to update ingredient');
    return data;
};

const deleteIngredient = async (id: string): Promise<{ message: string }> => {
    const response = await fetch(`${BASE_URL}/ingredients/${id}`, {
        method: 'DELETE',
        headers: await auth_headers(),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to delete ingredient');
    return data;
};

// ─── Suppliers ───────────────────────────────────────────────────

const postSupplier = async (supplier: CreateSupplierRequest): Promise<Supplier> => {
    const response = await fetch(`${BASE_URL}/suppliers`, {
        method: 'POST',
        headers: await auth_headers(),
        body: JSON.stringify(supplier),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to create supplier');
    return data;
};

const getAllSuppliers = async (): Promise<Supplier[]> => {
    const response = await fetch(`${BASE_URL}/suppliers`, {
        method: 'GET',
        headers: await auth_headers(),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to load suppliers');
    if (!Array.isArray(data)) throw new Error('Unexpected response format');
    return data;
};

const getSupplier = async (id: string): Promise<Supplier> => {
    const response = await fetch(`${BASE_URL}/suppliers/${id}`, {
        method: 'GET',
        headers: await auth_headers(),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to load supplier');
    return data;
};

const putSupplier = async (
    id: string,
    updates: UpdateSupplierRequest
): Promise<Supplier> => {
    const response = await fetch(`${BASE_URL}/suppliers/${id}`, {
        method: 'PUT',
        headers: await auth_headers(),
        body: JSON.stringify(updates),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to update supplier');
    return data;
};

const deleteSupplier = async (id: string): Promise<{ message: string }> => {
    const response = await fetch(`${BASE_URL}/suppliers/${id}`, {
        method: 'DELETE',
        headers: await auth_headers(),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to delete supplier');
    return data;
};

// ─── Invoices ────────────────────────────────────────────────────

const getAllInvoices = async (): Promise<Invoice[]> => {
    const response = await fetch(`${BASE_URL}/invoices`, {
        method: 'GET',
        headers: await auth_headers(),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to load invoices');
    if (!Array.isArray(data)) throw new Error('Unexpected response format');
    return data;
};

const getInvoice = async (id: string): Promise<Invoice> => {
    const response = await fetch(`${BASE_URL}/invoices/${id}`, {
        method: 'GET',
        headers: await auth_headers(),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to load invoice');
    return data;
};

const getInvoiceItems = async (invoice_id: string): Promise<InvoiceItem[]> => {
    const response = await fetch(`${BASE_URL}/invoices/${invoice_id}/items`, {
        method: 'GET',
        headers: await auth_headers(),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to load invoice items');
    if (!Array.isArray(data)) throw new Error('Unexpected response format');
    return data;
};

const analyzeInvoice = async (payload: InvoiceAnalysisRequest): Promise<InvoiceAnalysisResponse> => {
    const response = await fetch(`${BASE_URL}/invoices/analyze`, {
        method: 'POST',
        headers: await auth_headers(),
        body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to analyze invoice');
    return data;
};

const deleteInvoice = async (id: string): Promise<{ message: string }> => {
    const response = await fetch(`${BASE_URL}/invoices/${id}`, {
        method: 'DELETE',
        headers: await auth_headers(),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to delete invoice');
    return data;
};

// ─── Stock Movements ─────────────────────────────────────────────

const getStockMovements = async (ingredient_id?: string): Promise<StockMovement[]> => {
    const url = ingredient_id
        ? `${BASE_URL}/movements?ingredient_id=${ingredient_id}`
        : `${BASE_URL}/movements`;
    const response = await fetch(url, {
        method: 'GET',
        headers: await auth_headers(),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to load stock movements');
    if (!Array.isArray(data)) throw new Error('Unexpected response format');
    return data;
};

// ─── Stock Alerts ─────────────────────────────────────────────────

const getStockAlerts = async (): Promise<StockAlert[]> => {
    const response = await fetch(`${BASE_URL}/alerts`, {
        method: 'GET',
        headers: await auth_headers(),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to load stock alerts');
    if (!Array.isArray(data)) throw new Error('Unexpected response format');
    return data;
};

const markAlertAsRead = async (alert_id: string): Promise<{ message: string }> => {
    const response = await fetch(`${BASE_URL}/alerts/${alert_id}/read`, {
        method: 'PUT',
        headers: await auth_headers(),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to mark alert as read');
    return data;
};

// ─── Dashboard ───────────────────────────────────────────────────

const getDashboardData = async (): Promise<StockDashboardData> => {
    const response = await fetch(`${BASE_URL}/dashboard`, {
        method: 'GET',
        headers: await auth_headers(),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to load dashboard data');
    return data;
};

// ─── Export ──────────────────────────────────────────────────────

const inventoryService = {
    // Ingredients
    postIngredient,
    getAllIngredients,
    getIngredient,
    putIngredient,
    deleteIngredient,
    // Suppliers
    postSupplier,
    getAllSuppliers,
    getSupplier,
    putSupplier,
    deleteSupplier,
    // Invoices
    getAllInvoices,
    getInvoice,
    getInvoiceItems,
    analyzeInvoice,
    deleteInvoice,
    // Stock
    getStockMovements,
    getStockAlerts,
    markAlertAsRead,
    // Dashboard
    getDashboardData,
};

export default inventoryService;