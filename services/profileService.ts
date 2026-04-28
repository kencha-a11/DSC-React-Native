// services/profileService.ts
import api from '@/api/axios';

// ==================== Types ====================

export interface UserProfile {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    phone_number: string | null;
    role: 'cashier' | 'manager' | 'superadmin';
    account_status: string;
    created_at?: string;
    updated_at?: string;
}

export interface UpdateProfileData {
    first_name?: string;
    last_name?: string;
    email?: string;
    phone_number?: string;
}

export interface UpdatePasswordData {
    current_password: string;
    new_password: string;
    new_password_confirmation: string;
}

export interface ApiResponse<T = any> {
    status: 'success' | 'error';
    message?: string;
    data?: T;
}

// ==================== API Functions ====================

/**
 * Get the authenticated user's full profile
 */
export const getUserProfile = async (): Promise<UserProfile> => {
    try {
        const response = await api.get('/user/profile', {
            headers: {
                'Cache-Control': 'no-cache'
            }
        });
        // Response structure: { status: 'success', data: { ...user } }
        return response.data.data;
    } catch (error) {
        console.error('Get user profile error:', error);
        throw error;
    }
};

/**
 * Update the authenticated user's profile information
 */
export const updateUserProfile = async (data: UpdateProfileData): Promise<UserProfile> => {
    try {
        const response = await api.put('/user/profile', data);
        return response.data.data;
    } catch (error) {
        console.error('Update user profile error:', error);
        throw error;
    }
};

/**
 * Update the authenticated user's password
 */
export const updateUserPassword = async (data: UpdatePasswordData): Promise<void> => {
    try {
        await api.put('/user/profile/password', {
            current_password: data.current_password,
            new_password: data.new_password,
            new_password_confirmation: data.new_password_confirmation,
        });
    } catch (error) {
        console.error('Update user password error:', error);
        throw error;
    }
};

/**
 * Helper: Extract error message from API response
 */
export const getProfileErrorMessage = (error: any): string => {
    if (error.response?.status === 422) {
        const errors = error.response.data?.errors;
        if (errors) {
            const firstError = Object.values(errors)[0] as string[];
            if (firstError && firstError[0]) {
                return firstError[0];
            }
        }
        return error.response.data?.message || 'Validation failed';
    }
    
    if (error.response?.status === 401) {
        return 'Current password is incorrect';
    }
    
    if (error.response?.status === 403) {
        return 'You do not have permission to perform this action';
    }
    
    if (error.response?.status >= 500) {
        return 'Server error. Please try again later.';
    }
    
    return error.response?.data?.message || error.message || 'An error occurred';
};