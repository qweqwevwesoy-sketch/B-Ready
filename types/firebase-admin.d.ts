declare module 'firebase-admin/app' {
  export interface App {
    // Type definitions if needed
  }
  export function cert(serviceAccount: object): any;
  export function getApps(): any[];
  export function initializeApp(options?: any, name?: string): any;
}

declare module 'firebase-admin/auth' {
  export function getAuth(app?: any): any;
}

declare module 'firebase-admin/firestore' {
  export function getFirestore(app?: any): any;
}

declare module 'firebase-admin/storage' {
  export function getStorage(app?: any): any;
}