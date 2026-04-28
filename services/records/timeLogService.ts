// services/records/timeLogService.ts
import api from '@/api/axios';

export interface TimeLog {
    id: number;
    user: {
        id: number;
        name: string;
        email?: string;
    };
    start_time: string | null;
    end_time: string | null;
    status: 'logged_in' | 'logged_out';
    created_at: string;
    updated_at: string;
    duration?: number;
}

export interface TimeLogResponse {
    data: TimeLog[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

export const getTimeLogs = async (params?: {
    page?: number;
    per_page?: number;
    user_id?: number;
    date?: string;
    status?: 'online' | 'offline';
}): Promise<TimeLogResponse> => {
    const response = await api.get('/logs/time', { params });
    return response.data;
};