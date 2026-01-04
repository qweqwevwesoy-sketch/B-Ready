export type UserRole = 'resident' | 'admin';

export interface User {
  uid: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  address?: string;
  birthdate?: string;
  employeeId?: string;
  role: UserRole;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Location {
  lat: number;
  lng: number;
}

export type ReportStatus = 'pending' | 'approved' | 'current' | 'rejected';
export type ReportSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface Report {
  id: string;
  type: string;
  description: string;
  location: Location | null;
  address: string;
  timestamp: string;
  userId: string;
  userName: string;
  severity: ReportSeverity;
  status: ReportStatus;
  category?: string;
  subcategory?: string;
  imageData?: string;
  icon?: string;
  isTemporary?: boolean;
  notes?: string;
}

export interface ChatMessage {
  id?: string;
  reportId: string;
  text?: string;
  imageData?: string;
  userName: string;
  userRole: UserRole;
  timestamp: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  subcategories: string[];
}

export interface NotificationData {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}
