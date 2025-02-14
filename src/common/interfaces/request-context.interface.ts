export interface RequestContext {
  requestId: string;
  ip: string;
  userAgent?: string;
  timestamp: Date;
}

export class RequestContext {
  private static context = new Map<string, any>();

  static set(data: Partial<RequestContext>): void {
    this.context.set('context', data);
  }

  static get(): Partial<RequestContext> {
    return this.context.get('context') || {};
  }
}
