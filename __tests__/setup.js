/**
 * Jest Setup File
 * Adds global polyfills needed for jsdom
 */

// Add TextEncoder and TextDecoder for jsdom
if (typeof global.TextEncoder === 'undefined') {
  const { TextEncoder, TextDecoder } = await import('util');
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder;
}
