// services/superadminService.ts
import api from '@/api/axios';

export interface UserRoleDistribution {
    total_cashiers: number;
    total_managers: number;
    total_superadmins: number;
}

export interface MonthlyLogin {
    month: string;
    total_logins: number;
    cashier_logins: number;
    manager_logins: number;
}

export interface PeakHour {
    hour: string;
    level: string;
    avg_logins: number;
    avg_actions: number;
}

export interface SystemHealth {
    database_size: string;
    last_backup: string;
    failed_jobs_count: number;
}

export const getUserRoleDistribution = async (): Promise<UserRoleDistribution> => {
    const response = await api.get('/superadmin/user-roles');
    return response.data.data;
};

export const getMonthlyLogins = async (year?: number): Promise<MonthlyLogin[]> => {
    const params = year ? { year } : {};
    const response = await api.get('/superadmin/monthly-logins', { params });
    return response.data.data;
};

export const getPeakHours = async (): Promise<PeakHour[]> => {
    const response = await api.get('/superadmin/peak-hours');
    return response.data.data;
};

export const getSystemHealth = async (): Promise<SystemHealth> => {
    const response = await api.get('/superadmin/system-health');
    return response.data.data;
};