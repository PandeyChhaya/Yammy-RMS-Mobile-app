import { useCallback, useEffect, useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { useTabStateForTab } from '../contexts/TabStateManager';

interface UseTabStateOptions {
    tabId: string;
    key: string;
    defaultValue?: any;
    persist?: boolean;
}

/**
 * Hook pour gérer l'état local d'un onglet avec persistance automatique
 * Hook to manage local tab state with automatic persistence
 * 
 * @param options - Options de configuration
 * @param options.tabId - ID de l'onglet / Tab ID
 * @param options.key - Clé de l'état / State key
 * @param options.defaultValue - Valeur par défaut / Default value
 * @param options.persist - Si true, l'état est persisté entre les changements d'onglet / If true, state persists between tab changes
 * 
 * @returns [state, setState] - État et fonction de mise à jour / State and update function
 * 
 * @example
 * ```tsx
 * const [searchQuery, setSearchQuery] = useTabState({
 *   tabId: 'products-tab',
 *   key: 'searchQuery',
 *   defaultValue: '',
 *   persist: true
 * });
 * ```
 */
export function useTabState<T = any>({
    tabId,
    key,
    defaultValue,
    persist = true
}: UseTabStateOptions): [T, (value: T | ((prev: T) => T)) => void] {
    const { setTabState, getTabState } = useTabStateForTab(tabId);
    
    const [localState, setLocalState] = useState<T>(() => {
        // Essayer de récupérer l'état sauvegardé
        // Try to retrieve saved state
        if (persist) {
            const saved = getTabState(key);
            if (saved !== undefined) {
                return saved;
            }
        }
        return defaultValue;
    });

    // Sauvegarder l'état quand il change
    // Save state when it changes
    const setState = useCallback((value: T | ((prev: T) => T)) => {
        setLocalState(prevState => {
            const newState = typeof value === 'function' 
                ? (value as (prev: T) => T)(prevState) 
                : value;

            // Sauvegarder dans le cache si persist est activé
            // Save to cache if persist is enabled
            if (persist) {
                setTabState(key, newState);
            }

            return newState;
        });
    }, [key, persist, setTabState]);

    // Restaurer l'état depuis le cache si nécessaire
    // Restore state from cache if necessary
    useEffect(() => {
        if (persist) {
            const saved = getTabState(key);
            if (saved !== undefined && saved !== localState) {
                setLocalState(saved);
            }
        }
    }, [key, persist, getTabState, localState]);

    return [localState, setState];
}

/**
 * Hook pour gérer plusieurs états dans un onglet
 * Hook to manage multiple states in a tab
 * 
 * @param tabId - ID de l'onglet / Tab ID
 * @param initialState - État initial / Initial state
 * @param persist - Si true, l'état est persisté / If true, state is persisted
 * 
 * @returns [state, updateState, setStateForKey] - État, fonction de mise à jour, et setter par clé
 * 
 * @example
 * ```tsx
 * const [filters, updateFilters, setFilter] = useTabStates(
 *   'orders-tab',
 *   { status: 'all', dateRange: 'today', search: '' },
 *   true
 * );
 * 
 * // Update multiple values
 * updateFilters({ status: 'completed', search: 'pizza' });
 * 
 * // Update single value
 * const setStatus = setFilter('status');
 * setStatus('pending');
 * ```
 */
export function useTabStates<T extends Record<string, any>>(
    tabId: string,
    initialState: T,
    persist = true
): [T, (updates: Partial<T>) => void, (key: keyof T) => (value: T[keyof T]) => void] {
    const { setTabState, getTabState } = useTabStateForTab(tabId);
    
    const [state, setState] = useState<T>(() => {
        if (persist) {
            const saved = getTabState('multipleStates');
            if (saved) {
                return { ...initialState, ...saved };
            }
        }
        return initialState;
    });

    const updateState = useCallback((updates: Partial<T>) => {
        setState(prev => {
            const newState = { ...prev, ...updates };
            if (persist) {
                setTabState('multipleStates', newState);
            }
            return newState;
        });
    }, [persist, setTabState]);

    const setStateForKey = useCallback((key: keyof T) => (value: T[keyof T]) => {
        updateState({ [key]: value } as Partial<T>);
    }, [updateState]);

    return [state, updateState, setStateForKey];
}

/**
 * Hook pour nettoyer l'état d'un onglet
 * Hook to clean up tab state
 * 
 * Note: clearTab functionality is not implemented in the current TabStateManager
 */
export function useTabCleanup(_tabId: string) {
    return useCallback(() => {
        // clearTab functionality not implemented in TabStateManager
        // Add implementation when TabStateManager supports it
    }, []);
}

/**
 * Hook utilitaire pour utiliser le système de cache avec l'onglet actif
 * Utility hook to use cache system with the active tab
 * Utilise automatiquement l'ID de l'onglet actif depuis AppContext
 * Automatically uses the active tab ID from AppContext
 * 
 * @example
 * ```tsx
 * // In a component within the active tab
 * const [selectedCategory, setSelectedCategory] = useActiveTabState(
 *   'selectedCategory',
 *   null,
 *   true
 * );
 * ```
 */
export function useActiveTabState<T = any>(
    key: string,
    defaultValue?: T,
    persist = true
): [T, (value: T | ((prev: T) => T)) => void] {
    const { activeTabId } = useApp();

    return useTabState({
        tabId: activeTabId || 'default',
        key,
        defaultValue,
        persist
    });
}

/**
 * Hook pour obtenir l'ID de l'onglet actif
 * Hook to get the active tab ID
 * 
 * @returns Active tab ID or null if no tab is active
 * 
 * @example
 * ```tsx
 * const activeTabId = useActiveTabId();
 * console.log('Current tab:', activeTabId);
 * ```
 */
export function useActiveTabId(): string | null {
    const { activeTabId } = useApp();
    return activeTabId;
}