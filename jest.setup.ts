/**
 * Jest setup file – provides minimal globals that Next.js API routes expect.
 * This resolves the `ReferenceError: Request is not defined` errors seen in tests
 * that import from `next/server`.
 */
(global as any).Request = class Request {
  url: string;
  method: string;
  constructor(url: string, init: RequestInit | undefined) {
    this.url = url;
    this.method = (init && init.method) ?? 'GET';
  }
};

(global as any).Response = class Response {
  body: unknown;
  constructor(body?: unknown) {
    this.body = body;
  }
};
