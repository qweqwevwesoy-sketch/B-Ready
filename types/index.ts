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
  profilePictureUrl?: string;
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
  userPhone?: string;
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

export interface SafetyTip {
  id: string;
  icon: string;
  title: string;
  items: string[];
  category: 'disaster' | 'emergency_kit';
  order: number;
  created_by?: string;
  updated_at: string;
}

export interface EmergencyKitItem {
  id: string;
  title: string;
  items: string[];
  order: number;
  created_by?: string;
  updated_at: string;
}

export interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  type: 'fire' | 'police' | 'medical' | 'barangay' | 'other';
  address: string;
  location: Location;
  description?: string;
  created_at: string;
  updated_at: string;
}
