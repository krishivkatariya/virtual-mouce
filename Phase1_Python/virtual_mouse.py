import cv2
import mediapipe as mp
import pyautogui
import math
import numpy as np
import time
import os

# System configurations
pyautogui.FAILSAFE = False 
SCREEN_W, SCREEN_H = pyautogui.size()
CAM_W, CAM_H = 640, 480
FRAME_R = 100 # Frame reduction for tracking space
SMOOTHING = 5

cap = cv2.VideoCapture(0)
cap.set(3, CAM_W)
cap.set(4, CAM_H)

mp_hands = mp.solutions.hands
hands = mp_hands.Hands(max_num_hands=1, min_detection_confidence=0.75, min_tracking_confidence=0.75)
mp_draw = mp.solutions.drawing_utils

plocX, plocY = 0, 0
last_click_time = 0
last_ss_time = 0

print("====================================")
print(" ADVANCED AI VIRTUAL MOUSE STARTED ")
print("====================================")
print("👉 MOVE: Raise Index Finger")
print("👆👇 SCROLL: Raise Index + Middle Finger, Move Up/Down")
print("🖱️ LEFT CLICK: Pinch Thumb & Index")
print("📋 RIGHT CLICK: Pinch Thumb & Middle")
print("📸 SCREENSHOT: Pinch Thumb & Pinky")
print("[Press ESC in the Camera Window to Exit]")
print("====================================")

while True:
    success, img = cap.read()
    if not success:
        break
    
    img = cv2.flip(img, 1) # Mirror image
    img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    results = hands.process(img_rgb)
    
    # Draw tracking boundary box
    cv2.rectangle(img, (FRAME_R, FRAME_R), (CAM_W - FRAME_R, CAM_H - FRAME_R), (255, 0, 255), 2)
    
    if results.multi_hand_landmarks:
        for hand_landmarks in results.multi_hand_landmarks:
            mp_draw.draw_landmarks(img, hand_landmarks, mp_hands.HAND_CONNECTIONS)
            
            lmList = []
            for id, lm in enumerate(hand_landmarks.landmark):
                h, w, c = img.shape
                lmList.append([int(lm.x * w), int(lm.y * h)])
            
            if len(lmList) > 20:
                # 1. State Variables - Check which fingers point UP (Y of Tip < Y of knuckle)
                index_up = lmList[8][1] < lmList[6][1]
                middle_up = lmList[12][1] < lmList[10][1]
                ring_up = lmList[16][1] < lmList[14][1]
                pinky_up = lmList[20][1] < lmList[18][1]
                
                # Fetch Points
                tx, ty = lmList[4]  # Thumb
                ix, iy = lmList[8]  # Index
                mx, my = lmList[12] # Middle
                px, py = lmList[20] # Pinky
                
                # ----------------------------------------------------
                # FEATURE 1: MOVE MOUSE (Index up, Middle down)
                # ----------------------------------------------------
                if index_up and not middle_up:
                    map_x = np.interp(ix, (FRAME_R, CAM_W - FRAME_R), (0, SCREEN_W))
                    map_y = np.interp(iy, (FRAME_R, CAM_H - FRAME_R), (0, SCREEN_H))
                    
                    clocX = plocX + (map_x - plocX) / SMOOTHING
                    clocY = plocY + (map_y - plocY) / SMOOTHING
                    
                    try:
                        pyautogui.moveTo(clocX, clocY)
                    except:
                        pass
                    plocX, plocY = clocX, clocY

                # ----------------------------------------------------
                # FEATURE 2: SCROLLING (Index up, Middle up)
                # ----------------------------------------------------
                elif index_up and middle_up and not ring_up and not pinky_up:
                    center_y = CAM_H / 2
                    # The higher your hand goes above middle, scroll up. Lower is scroll down.
                    if iy < center_y - 20: 
                        pyautogui.scroll(40) # Scroll Up
                        cv2.putText(img, "SCROLL UP", (50, 100), cv2.FONT_HERSHEY_PLAIN, 2, (0, 255, 255), 3)
                    elif iy > center_y + 20: 
                        pyautogui.scroll(-40) # Scroll Down
                        cv2.putText(img, "SCROLL DOWN", (50, 100), cv2.FONT_HERSHEY_PLAIN, 2, (0, 255, 255), 3)

                # ----------------------------------------------------
                # FEATURE 3 & 4: CLICKING MODULE (Distance mapping)
                # ----------------------------------------------------
                dist_left = math.hypot(ix - tx, iy - ty)
                dist_right = math.hypot(mx - tx, my - ty)
                dist_ss = math.hypot(px - tx, py - ty)
                
                # LEFT CLICK (Thumb + Index Pinch)
                if dist_left < 40 and (time.time() - last_click_time) > 0.5:
                    cv2.circle(img, ((ix+tx)//2, (iy+ty)//2), 15, (0, 255, 0), cv2.FILLED)
                    pyautogui.click()
                    last_click_time = time.time()

                # RIGHT CLICK (Thumb + Middle Pinch)
                if dist_right < 40 and not index_up and (time.time() - last_click_time) > 0.5:
                    cv2.circle(img, ((mx+tx)//2, (my+ty)//2), 15, (255, 0, 0), cv2.FILLED)
                    pyautogui.rightClick()
                    last_click_time = time.time()
                    
                # ----------------------------------------------------
                # FEATURE 5: SCREENSHOT (Thumb + Pinky Pinch)
                # ----------------------------------------------------
                if dist_ss < 40 and (time.time() - last_ss_time) > 2.0:
                    filename = f"capture_{int(time.time())}.png"
                    save_path = os.path.join(os.getcwd(), filename)
                    pyautogui.screenshot(save_path)
                    print(f"[*] Saved Screenshot at: {save_path}")
                    
                    # Flash Visual Cue on successful Screenshot
                    cv2.rectangle(img, (0, 0), (CAM_W, CAM_H), (255, 255, 255), cv2.FILLED)
                    cv2.putText(img, "SNAPSHOT!", (150, 240), cv2.FONT_HERSHEY_DUPLEX, 2, (0, 0, 255), 4)
                    last_ss_time = time.time()

    # View Frame Rate Interface
    cv2.imshow("Advanced AI Mouse Pro", img)
    if cv2.waitKey(1) & 0xFF == 27: # Press Esc to Stop
        break

cap.release()
cv2.destroyAllWindows()
