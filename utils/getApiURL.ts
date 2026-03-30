import Constants from 'expo-constants';

export const getApiUrl = (): string => {
    // Add these debug lines at the VERY TOP
    // console.log('🔍 [ENV DEBUG] ========== ENVIRONMENT VARIABLES ==========');
    // console.log('🔍 [ENV DEBUG] process.env.EXPO_PUBLIC_API_URL:', process.env.EXPO_PUBLIC_API_URL);
    // console.log('🔍 [ENV DEBUG] Constants.expoConfig:', Constants.expoConfig);
    // console.log('🔍 [ENV DEBUG] Constants.expoConfig?.extra:', Constants.expoConfig?.extra);
    // console.log('🔍 [ENV DEBUG] ==========================================');

    const BASE_API_URL = Constants.expoConfig?.extra?.API_URL || process.env.EXPO_PUBLIC_API_URL;
    // console.log('🔹 API Base URL:', BASE_API_URL);
    // console.log('🔹 API_URL from app.json:', Constants.expoConfig?.extra?.API_URL);
    return BASE_API_URL;
};