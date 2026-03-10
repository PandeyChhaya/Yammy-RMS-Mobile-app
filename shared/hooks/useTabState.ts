import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { useTabStateForTab } from '../contexts/TabStateManager';

interface UseTabStateOptions {
    tabId: string;
    key: string;
    defaultValue?: any;
    persist?: boolean;
}

// Helper — builds a unique AsyncStorage key per tab and state key
const buildStorageKey = (tabId: string, key: string) => `@tab_${tabId}_${key}`

/**
 * Hook to manage local tab state with automatic AsyncStorage persistence
 *
 * @param options.tabId - Tab ID (e.g. 'table1', 'table2')
 * @param options.key - State key (e.g. 'cart', 'searchQuery')
 * @param options.defaultValue - Default value if nothing is saved
 * @param options.persist - If true, state is saved to AsyncStorage between tab changes
 *
 * @returns [state, setState] - State and update function
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

    const [localState, setLocalState] = useState<T>(defaultValue);

    // Load saved state from AsyncStorage when component mounts
    useEffect(() => {
        const loadSavedState = async () => {
            if (!persist) return

            try {
                const storageKey = buildStorageKey(tabId, key)
                const json = await AsyncStorage.getItem(storageKey)

                if (json !== null) {
                    const saved = JSON.parse(json)
                    setLocalState(saved)
                    setTabState(key, saved) // sync with in-memory manager too
                }
            } catch (error) {
                console.error('Error loading tab state from AsyncStorage:', error)
            }
        }

        loadSavedState()
    }, [tabId, key, persist])

    // Save state to both AsyncStorage and in-memory manager when it changes
    const setState = useCallback((value: T | ((prev: T) => T)) => {
        setLocalState(prevState => {
            const newState = typeof value === 'function'
                ? (value as (prev: T) => T)(prevState)
                : value

            // Save to in-memory manager
            setTabState(key, newState)

            // Save to AsyncStorage if persist is enabled
            if (persist) {
                const storageKey = buildStorageKey(tabId, key)
                AsyncStorage.setItem(storageKey, JSON.stringify(newState))
                    .catch(error => console.error('Error saving tab state:', error))
            }

            return newState
        })
    }, [tabId, key, persist, setTabState])

    return [localState, setState]
}

/**
 * Hook to manage multiple states in a single tab
 *
 * @param tabId - Tab ID
 * @param initialState - Initial state object
 * @param persist - If true, state is saved to AsyncStorage
 *
 * @returns [state, updateState, setStateForKey]
 *
 * @example
 * ```tsx
 * const [filters, updateFilters, setFilter] = useTabStates(
 *   'orders-tab',
 *   { status: 'all', dateRange: 'today', search: '' },
 *   true
 * );
 *
 * // Update multiple values at once
 * updateFilters({ status: 'completed', search: 'pizza' });
 *
 * // Update a single value
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
    const MULTI_KEY = `@tab_${tabId}_multipleStates`

    const [state, setState] = useState<T>(initialState);

    // Load all saved states from AsyncStorage when component mounts
    useEffect(() => {
        const loadSavedStates = async () => {
            if (!persist) return

            try {
                const json = await AsyncStorage.getItem(MULTI_KEY)
                if (json !== null) {
                    const saved = JSON.parse(json)
                    setState({ ...initialState, ...saved })
                    setTabState('multipleStates', saved)
                }
            } catch (error) {
                console.error('Error loading multiple tab states:', error)
            }
        }

        loadSavedStates()
    }, [tabId, persist])

    // Update multiple state values at once
    const updateState = useCallback((updates: Partial<T>) => {
        setState(prev => {
            const newState = { ...prev, ...updates }

            // Save to in-memory manager
            setTabState('multipleStates', newState)

            // Save to AsyncStorage if persist is enabled
            if (persist) {
                AsyncStorage.setItem(MULTI_KEY, JSON.stringify(newState))
                    .catch(error => console.error('Error saving multiple tab states:', error))
            }

            return newState
        })
    }, [persist, setTabState, MULTI_KEY])

    // Returns a setter function for a single key
    const setStateForKey = useCallback(
        (key: keyof T) => (value: T[keyof T]) => {
            updateState({ [key]: value } as Partial<T>)
        },
        [updateState]
    )

    return [state, updateState, setStateForKey]
}

/**
 * Hook to clean up a tab's state from both
 * AsyncStorage and the in-memory manager
 */
export function useTabCleanup(tabId: string) {
    return useCallback(async () => {
        try {
            // Get all keys in AsyncStorage
            const allKeys = await AsyncStorage.getAllKeys()

            // Find keys that belong to this tab
            const tabKeys = allKeys.filter(k => k.startsWith(`@tab_${tabId}_`))

            // Delete all of them
            if (tabKeys.length > 0) {
                await AsyncStorage.multiRemove(tabKeys)
            }
        } catch (error) {
            console.error('Error cleaning up tab state:', error)
        }
    }, [tabId])
}

/**
 * Utility hook to use AsyncStorage state with the currently active tab
 * Automatically uses the active tab ID from AppContext
 *
 * @example
 * ```tsx
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
    const { activeTabId } = useApp()

    return useTabState({
        tabId: activeTabId || 'default',
        key,
        defaultValue,
        persist
    })
}

/**
 * Hook to get the currently active tab ID
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
    const { activeTabId } = useApp()
    return activeTabId
}
