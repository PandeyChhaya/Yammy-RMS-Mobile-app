import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, ReactNode, useContext, useEffect, useReducer } from 'react';

interface UserSettings {
    leftHandedMode: boolean
    // Other user settings can be added here
}

type UserSettingsAction =
    | { type: 'SET_LEFT_HANDED_MODE'; payload: boolean }
    | { type: 'LOAD_SETTINGS'; payload: UserSettings }

interface UserSettingsContextType {
    settings: UserSettings
    setLeftHandedMode: (enabled: boolean) => void
    loadSettings: () => void
}

const defaultSettings: UserSettings = {
    leftHandedMode: false,
}

function userSettingsReducer(state: UserSettings, action: UserSettingsAction): UserSettings {
    switch (action.type) {
        case 'SET_LEFT_HANDED_MODE':
            const newSettings = { ...state, leftHandedMode: action.payload }
            // Save to AsyncStorage (async operation handled outside reducer)
            AsyncStorage.setItem('userSettings', JSON.stringify(newSettings))
                .catch(err => console.error('Error saving settings:', err))
            return newSettings
        case 'LOAD_SETTINGS':
            return action.payload
        default:
            return state
    }
}

const UserSettingsContext = createContext<UserSettingsContextType | undefined>(undefined)

export function UserSettingsProvider({ children }: { children: ReactNode }) {
    const [settings, dispatch] = useReducer(userSettingsReducer, defaultSettings)

    const setLeftHandedMode = (enabled: boolean) => {
        dispatch({ type: 'SET_LEFT_HANDED_MODE', payload: enabled })
    }

    const loadSettings = async () => {
        try {
            const savedSettings = await AsyncStorage.getItem('userSettings')
            if (savedSettings) {
                const parsedSettings = JSON.parse(savedSettings)
                dispatch({ type: 'LOAD_SETTINGS', payload: parsedSettings })
            }
        } catch (error) {
            console.error('Error loading settings:', error)
        }
    }

    useEffect(() => {
        loadSettings()
    }, [])

    const contextValue: UserSettingsContextType = {
        settings,
        setLeftHandedMode,
        loadSettings,
    }

    return (
        <UserSettingsContext.Provider value={contextValue}>
            {children}
        </UserSettingsContext.Provider>
    )
}

export function useUserSettings() {
    const context = useContext(UserSettingsContext)
    if (context === undefined) {
        throw new Error('useUserSettings must be used within a UserSettingsProvider')
    }
    return context
}