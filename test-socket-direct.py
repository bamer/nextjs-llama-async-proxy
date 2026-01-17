#!/usr/bin/env python3
"""
Direct Socket.IO test to verify handlers are registered and working
"""

from playwright.sync_api import sync_playwright
import time

def test():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        page = browser.new_page()
        
        print("\n[SOCKET TEST] Testing direct Socket.IO requests\n")
        
        page.goto('http://localhost:3000/')
        time.sleep(2)
        
        # Test 1: Check if socket is connected
        connected = page.evaluate("""
          () => {
            const s = window.io?.sockets;
            return typeof window.socketClient !== 'undefined' ? window.socketClient.isConnected : false;
          }
        """)
        
        print(f"Socket connected: {connected}")
        
        # Test 2: Request metrics directly via socket
        print("\n[TEST] Sending metrics:get request...")
        response = page.evaluate("""
          async () => {
            try {
              const response = await new Promise((resolve, reject) => {
                const timeout = setTimeout(() => reject('Timeout'), 5000);
                window.socketClient.socket.emit('metrics:get', { requestId: 'test123' }, (data) => {
                  clearTimeout(timeout);
                  resolve(data);
                });
              });
              console.log('[TEST] Got ack response:', response);
              return response;
            } catch (e) {
              console.log('[TEST] Error:', e);
              return { error: e };
            }
          }
        """)
        
        print(f"ACK Response: {response}")
        
        # Test 3: Listen for :result event
        print("\n[TEST] Listening for metrics:get:result event...")
        event_received = page.evaluate("""
          async () => {
            return new Promise((resolve) => {
              window.socketClient.socket.on('metrics:get:result', (data) => {
                console.log('[TEST] Received metrics:get:result:', data);
                resolve(data);
              });
              
              // Send request
              window.socketClient.socket.emit('metrics:get', { requestId: 'test456' });
              
              // Timeout after 5 seconds
              setTimeout(() => resolve({ timeout: true }), 5000);
            });
          }
        """)
        
        print(f"Event Response: {event_received}")
        
        time.sleep(1)
        browser.close()

if __name__ == '__main__':
    test()
