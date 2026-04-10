import http.server
import socketserver
import json
import pyautogui
import threading
import sys

# System configurations
pyautogui.FAILSAFE = False
PORT = 8080

class MouseHandler(http.server.SimpleHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200, "ok")
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header("Access-Control-Allow-Headers", "X-Requested-With, Content-type")
        self.end_headers()

    def do_POST(self):
        # Handle cross-origin HTTP POST requests from the Web Hub
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        
        try:
            data = json.loads(post_data.decode('utf-8'))
            action = data.get('action')

            if action == "move":
                # Normalize and move
                x, y = data.get('x'), data.get('y')
                screen_w, screen_h = pyautogui.size()
                pyautogui.moveTo(x * screen_w, y * screen_h, _pause=False)
                
            elif action == "click":
                pyautogui.click(_pause=False)
                
            elif action == "right_click":
                pyautogui.rightClick(_pause=False)
                
            elif action == "scroll":
                dy = data.get('dy')
                pyautogui.scroll(dy, _pause=False)
                
            # Respond to front-end successfully
            self.send_response(200)
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"status": "success"}).encode())
            
        except Exception as e:
            print(f"Error handling gesture payload: {e}")
            self.send_response(500)
            self.end_headers()

def start_server():
    with socketserver.TCPServer(("", PORT), MouseHandler) as httpd:
        print("==============================================")
        print("🌐 PHASE 4: REMOTE CROSS-DEVICE SERVER ACTIVE ")
        print(f"[*] Listening for gestures on PORT {PORT} ")
        print("[*] Open your Phone Browser and load the Web Hub!")
        print("==============================================")
        httpd.serve_forever()

if __name__ == "__main__":
    start_server()
