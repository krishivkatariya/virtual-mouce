package com.virtualmouse.ai;

import android.accessibilityservice.AccessibilityService;
import android.accessibilityservice.GestureDescription;
import android.graphics.Path;
import android.view.accessibility.AccessibilityEvent;

public class GestureService extends AccessibilityService {
    
    // Global instance to accept commands from the Web View
    public static GestureService instance = null;

    @Override
    protected void onServiceConnected() {
        super.onServiceConnected();
        instance = this;
    }

    @Override
    public void onAccessibilityEvent(AccessibilityEvent event) {}

    @Override
    public void onInterrupt() {}

    @Override
    public boolean onUnbind(android.content.Intent intent) {
        instance = null;
        return super.onUnbind(intent);
    }

    public void performVirtualClick(float x, float y) {
        Path clickPath = new Path();
        clickPath.moveTo(x, y);
        GestureDescription.StrokeDescription clickStroke = 
            new GestureDescription.StrokeDescription(clickPath, 0, 50);
        GestureDescription.Builder clickBuilder = new GestureDescription.Builder();
        clickBuilder.addStroke(clickStroke);
        dispatchGesture(clickBuilder.build(), null, null);
    }
    
    public void performVirtualScroll(float startX, float startY, float endX, float endY) {
        Path swipePath = new Path();
        swipePath.moveTo(startX, startY);
        swipePath.lineTo(endX, endY);
        GestureDescription.StrokeDescription swipeStroke = 
            new GestureDescription.StrokeDescription(swipePath, 0, 300);
        GestureDescription.Builder swipeBuilder = new GestureDescription.Builder();
        swipeBuilder.addStroke(swipeStroke);
        dispatchGesture(swipeBuilder.build(), null, null);
    }
}
