export interface FirebaseError {
  code: string;
  message: string;
}

export function isFirebaseError(error: unknown): error is FirebaseError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'message' in error &&
    typeof (error as FirebaseError).code === 'string' &&
    typeof (error as FirebaseError).message === 'string'
  );
}

