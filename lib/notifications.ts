type NotificationType = 'success' | 'error' | 'warning' | 'info';

export class NotificationManager {
  private static instance: NotificationManager;
  private notifications: string[] = [];
  
  static getInstance(): NotificationManager {
    if (!NotificationManager.instance) {
      NotificationManager.instance = new NotificationManager();
    }
    return NotificationManager.instance;
  }
  
  show(message: string, type: NotificationType = 'info') {
    console.log(`${type.toUpperCase()}: ${message}`);
    
    // For now, just log to console
    // You can implement toast notifications later
  } 
  
  success(message: string, duration?: number) {
    this.show(message, 'success', duration);
  }
  
  error(message: string, duration?: number) {
    this.show(message, 'error', duration || 5000);
  }
  
  warning(message: string, duration?: number) {
    this.show(message, 'warning', duration);
  }
  
  info(message: string, duration?: number) {
    this.show(message, 'info', duration);
  }
}

export const notifications = NotificationManager.getInstance();