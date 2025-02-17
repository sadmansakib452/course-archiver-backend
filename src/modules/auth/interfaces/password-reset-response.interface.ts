export interface PasswordResetResponse {
  success: boolean;
  statusCode: number;
  message: string;
  timestamp: Date;
  details?: {
    password?: string;
    error?: string;
  };
}
