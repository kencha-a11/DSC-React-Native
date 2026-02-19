import Constants from 'expo-constants';

export const getApiUrl = (): string => {
    const BASE_API_URL = Constants.expoConfig?.extra?.API_URL || process.env.EXPO_PUBLIC_API_URL;
    console.log('🔹 API Base URL:', BASE_API_URL);
    console.log('🔹 API_URL from app.json:', Constants.expoConfig?.extra?.API_URL);
    return BASE_API_URL;
};
