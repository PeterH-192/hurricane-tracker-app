export interface NotificationService {
  send(
    to: string,
    message: string,
    metadata?: Record<string, unknown>
  ): Promise<{ id: string; success: boolean }>;
}

export { MockSmsService } from "./mock-sms";
export { MockEmailService } from "./mock-email";
