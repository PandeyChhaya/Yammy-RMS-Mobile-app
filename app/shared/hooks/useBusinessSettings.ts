import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BusinessService } from '../services/businessService';
import {
    DEFAULT_BUSINESS_INFO,
    DEFAULT_SYSTEM_CONFIG,
    DEFAULT_TAX_SETTINGS,
    DEFAULT_USER_PREFERENCES
} from '../types/business';

/**
 * Custom hook for managing business settings with React Query
 * Mobile-compatible version for React Native
 */
export const useBusinessSettings = () => {
    const queryClient = useQueryClient();

    // Business Info Query
    const {
        data: businessInfo,
        isLoading: isLoadingBusinessInfo,
        error: businessInfoError,
    } = useQuery({
        queryKey: ['business-info'],
        queryFn: BusinessService.getBusinessInfo,
        staleTime: 5 * 60 * 1000, // 5 minutes
        retry: 1,
        // Mobile optimization: cache data for offline access
        gcTime: 24 * 60 * 60 * 1000, // 24 hours (formerly cacheTime)
    });

    const saveBusinessInfoMutation = useMutation({
        mutationFn: BusinessService.saveBusinessInfo,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['business-info'] });
        },
        // Mobile: Handle offline scenarios
        onError: (error) => {
            console.error('Failed to save business info:', error);
        },
    });

    // Tax Settings Query
    const {
        data: taxSettings,
        isLoading: isLoadingTaxSettings,
        error: taxSettingsError,
    } = useQuery({
        queryKey: ['tax-settings'],
        queryFn: BusinessService.getTaxSettings,
        staleTime: 5 * 60 * 1000,
        retry: 1,
        gcTime: 24 * 60 * 60 * 1000,
    });

    const saveTaxSettingsMutation = useMutation({
        mutationFn: BusinessService.saveTaxSettings,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tax-settings'] });
        },
        onError: (error) => {
            console.error('Failed to save tax settings:', error);
        },
    });

    // User Preferences Query
    const {
        data: userPreferences,
        isLoading: isLoadingUserPreferences,
        error: userPreferencesError,
    } = useQuery({
        queryKey: ['user-preferences'],
        queryFn: BusinessService.getUserPreferences,
        staleTime: 5 * 60 * 1000,
        retry: 1,
        gcTime: 24 * 60 * 60 * 1000,
    });

    const saveUserPreferencesMutation = useMutation({
        mutationFn: BusinessService.saveUserPreferences,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['user-preferences'] });
        },
        onError: (error) => {
            console.error('Failed to save user preferences:', error);
        },
    });

    // System Config Query
    const {
        data: systemConfig,
        isLoading: isLoadingSystemConfig,
        error: systemConfigError,
    } = useQuery({
        queryKey: ['system-config'],
        queryFn: BusinessService.getSystemConfig,
        staleTime: 5 * 60 * 1000,
        retry: 1,
        gcTime: 24 * 60 * 60 * 1000,
    });

    const saveSystemConfigMutation = useMutation({
        mutationFn: BusinessService.saveSystemConfig,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['system-config'] });
        },
        onError: (error) => {
            console.error('Failed to save system config:', error);
        },
    });

    // Combined loading state
    const isLoading = isLoadingBusinessInfo || isLoadingTaxSettings ||
        isLoadingUserPreferences || isLoadingSystemConfig;

    // Combined error state
    const error = businessInfoError || taxSettingsError ||
        userPreferencesError || systemConfigError;

    // Save all settings mutation
    const saveAllSettingsMutation = useMutation({
        mutationFn: BusinessService.saveAllSettings,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['business-info'] });
            queryClient.invalidateQueries({ queryKey: ['tax-settings'] });
            queryClient.invalidateQueries({ queryKey: ['user-preferences'] });
            queryClient.invalidateQueries({ queryKey: ['system-config'] });
        },
        onError: (error) => {
            console.error('Failed to save all settings:', error);
        },
    });

    return {
        // Data with fallbacks
        businessInfo: businessInfo || DEFAULT_BUSINESS_INFO,
        taxSettings: taxSettings || DEFAULT_TAX_SETTINGS,
        userPreferences: userPreferences || DEFAULT_USER_PREFERENCES,
        systemConfig: systemConfig || DEFAULT_SYSTEM_CONFIG,

        // Loading states
        isLoading,
        isLoadingBusinessInfo,
        isLoadingTaxSettings,
        isLoadingUserPreferences,
        isLoadingSystemConfig,

        // Error states
        error,
        businessInfoError,
        taxSettingsError,
        userPreferencesError,
        systemConfigError,

        // Mutations (using mutateAsync for promise-based calls)
        saveBusinessInfo: saveBusinessInfoMutation.mutateAsync,
        saveTaxSettings: saveTaxSettingsMutation.mutateAsync,
        saveUserPreferences: saveUserPreferencesMutation.mutateAsync,
        saveSystemConfig: saveSystemConfigMutation.mutateAsync,
        saveAllSettings: saveAllSettingsMutation.mutateAsync,

        // Mutation loading states
        isSavingBusinessInfo: saveBusinessInfoMutation.isPending,
        isSavingTaxSettings: saveTaxSettingsMutation.isPending,
        isSavingUserPreferences: saveUserPreferencesMutation.isPending,
        isSavingSystemConfig: saveSystemConfigMutation.isPending,
        isSavingAll: saveAllSettingsMutation.isPending,

        // Mutation error states (useful for mobile error handling)
        businessInfoSaveError: saveBusinessInfoMutation.error,
        taxSettingsSaveError: saveTaxSettingsMutation.error,
        userPreferencesSaveError: saveUserPreferencesMutation.error,
        systemConfigSaveError: saveSystemConfigMutation.error,
        allSettingsSaveError: saveAllSettingsMutation.error,
    };
};