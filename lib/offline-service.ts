import type { Report, User } from '@/types';

interface OfflineConfig {
  phpApiUrl: string;
  useLocalBackend: boolean;
}

class OfflineService {
  private config: OfflineConfig;
  private isOnline: boolean = true;

  constructor(config: OfflineConfig) {
    this.config = config;
    this.checkConnectivity();
    this.setupConnectivityListeners();
  }

  private setupConnectivityListeners(): void {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.isOnline = true;
        console.log('🌐 Back online - switching to Firebase mode');
      });

      window.addEventListener('offline', () => {
        this.isOnline = false;
        console.log('📱 Gone offline - switching to local MariaDB mode');
      });
    }
  }

  private async checkConnectivity(): Promise<void> {
    if (typeof window !== 'undefined') {
      this.isOnline = navigator.onLine;
    }
  }

  public shouldUseLocalBackend(): boolean {
    // Use local backend if explicitly configured OR if offline
    return this.config.useLocalBackend || !this.isOnline;
  }

  public getApiBaseUrl(): string {
    return this.shouldUseLocalBackend() ? this.config.phpApiUrl : '';
  }

  // Report operations
  public async createReport(reportData: Partial<Report>): Promise<{ success: boolean; id?: string }> {
    if (this.shouldUseLocalBackend()) {
      return this.createReportLocal(reportData);
    } else {
      // Would use Firebase/Socket.io here
      throw new Error('Firebase mode not implemented in this service');
    }
  }

  public async getReports(filters?: { userId?: string; status?: string }): Promise<Report[]> {
    if (this.shouldUseLocalBackend()) {
      return this.getReportsLocal(filters);
    } else {
      // Would use Firebase/Socket.io here
      throw new Error('Firebase mode not implemented in this service');
    }
  }

  public async updateReport(reportId: string, updates: Partial<Report>): Promise<{ success: boolean }> {
    if (this.shouldUseLocalBackend()) {
      return this.updateReportLocal(reportId, updates);
    } else {
      // Would use Firebase/Socket.io here
      throw new Error('Firebase mode not implemented in this service');
    }
  }

  // Message operations
  public async createMessage(messageData: {
    reportId: string;
    text: string;
    userName: string;
    userRole: string;
    timestamp: string;
  }): Promise<{ success: boolean; id?: string }> {
    if (this.shouldUseLocalBackend()) {
      return this.createMessageLocal(messageData);
    } else {
      // Would use Firebase/Socket.io here
      throw new Error('Firebase mode not implemented in this service');
    }
  }

  public async getMessages(reportId: string): Promise<Record<string, unknown>[]> {
    if (this.shouldUseLocalBackend()) {
      return this.getMessagesLocal(reportId);
    } else {
      // Would use Firebase/Socket.io here
      throw new Error('Firebase mode not implemented in this service');
    }
  }

  // Local PHP API implementations
  private async createReportLocal(reportData: Partial<Report>): Promise<{ success: boolean; id?: string }> {
    try {
      const url = `${this.config.phpApiUrl}/reports`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reportData),
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('❌ Failed to create report locally:', error);
      return { success: false };
    }
  }

  private async getReportsLocal(filters?: { userId?: string; status?: string }): Promise<Report[]> {
    try {
      const url = new URL(`${this.config.phpApiUrl}/reports`);
      if (filters?.userId) url.searchParams.set('user_id', filters.userId);
      if (filters?.status) url.searchParams.set('status', filters.status);

      const response = await fetch(url.toString());
      const reports = await response.json();

      // Transform database format to frontend format
      return reports.map((report: Record<string, unknown>) => ({
        ...report,
        location: report.location_lat && report.location_lng ? {
          lat: parseFloat(report.location_lat as string),
          lng: parseFloat(report.location_lng as string),
        } : null,
        timestamp: report.timestamp,
      })) as Report[];
    } catch (error) {
      console.error('❌ Failed to fetch reports locally:', error);
      return [];
    }
  }

  private async updateReportLocal(reportId: string, updates: Partial<Report>): Promise<{ success: boolean }> {
    try {
      const url = `${this.config.phpApiUrl}/reports`;
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: reportId, ...updates }),
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('❌ Failed to update report locally:', error);
      return { success: false };
    }
  }

  private async createMessageLocal(messageData: {
    reportId: string;
    text: string;
    userName: string;
    userRole: string;
    timestamp: string;
  }): Promise<{ success: boolean; id?: string }> {
    try {
      const url = `${this.config.phpApiUrl}/messages`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messageData),
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('❌ Failed to create message locally:', error);
      return { success: false };
    }
  }

  private async getMessagesLocal(reportId: string): Promise<Record<string, unknown>[]> {
    try {
      const url = `${this.config.phpApiUrl}/messages?report_id=${reportId}`;
      const response = await fetch(url);
      const messages = await response.json();
      return messages;
    } catch (error) {
      console.error('❌ Failed to fetch messages locally:', error);
      return [];
    }
  }

  // Sync operations
  public async syncDataToFirebase(reports: Report[], messages: Record<string, unknown>[]): Promise<{ success: boolean }> {
    try {
      const url = `${this.config.phpApiUrl}/sync`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reports, messages }),
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('❌ Failed to sync data:', error);
      return { success: false };
    }
  }

  // Health check
  public async checkLocalBackendHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.phpApiUrl}/health`);
      const result = await response.json();
      return result.status === 'OK';
    } catch (error) {
      return false;
    }
  }
}

// Create singleton instance
const offlineConfig: OfflineConfig = {
  phpApiUrl: process.env.NEXT_PUBLIC_PHP_API_URL || 'http://localhost:8000/php-backend',
  useLocalBackend: process.env.NEXT_PUBLIC_USE_LOCAL_BACKEND === 'true',
};

export const offlineService = new OfflineService(offlineConfig);
export default offlineService;
