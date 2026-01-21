 /**
  * Jest setup file – provides minimal globals that Next.js API routes expect.
  * This resolves the `ReferenceError: Request is not defined` errors seen in tests
  * that import from `next/server`.
  */
global.Request = class Request {
  url: string;
  method: string;
  constructor(url: string, init?: RequestInit) {
    this.url = url;
    this.method = init?.method ?? 'GET';
  }
} as any;
 
global.Response = class Response {
  constructor(body?: any, init?: ResponseInit) {
    this.body = body;
  }
} as any;

// Extend the Response interface to include body for TypeScript safety
interface Response {
  body?: any;
}