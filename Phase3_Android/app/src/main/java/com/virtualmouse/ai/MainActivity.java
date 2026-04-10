package com.virtualmouse.ai;

import android.Manifest;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Bundle;
import android.provider.Settings;
import android.webkit.JavascriptInterface;
import android.webkit.PermissionRequest;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;
import androidx.appcompat.app.AppCompatActivity;

public class MainActivity extends AppCompatActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(Bundle savedInstanceState);
        
        // 1. Request Camera Permission dynamically
        if (checkSelfPermission(Manifest.permission.CAMERA) != PackageManager.PERMISSION_GRANTED) {
            requestPermissions(new String[]{Manifest.permission.CAMERA}, 100);
        }

        // 2. Prompt user to enable Accessibility Service (Global Gesture Control)
        if (GestureService.instance == null) {
            Toast.makeText(this, "CRITICAL: Enable AI Mouse in Accessibility Settings!", Toast.LENGTH_LONG).show();
            startActivity(new Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS));
        }

        // 3. Create the WebView Sandbox directly bridging Phase 2 Code
        WebView webView = new WebView(this);
        setContentView(webView);

        WebSettings webSettings = webView.getSettings();
        webSettings.setJavaScriptEnabled(true);
        webSettings.setDomStorageEnabled(true);
        webSettings.setMediaPlaybackRequiresUserGesture(false);

        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onPermissionRequest(final PermissionRequest request) {
                request.grant(request.getResources()); // Auto-grant camera to the browser
            }
        });
        webView.setWebViewClient(new WebViewClient());

        // 4. Create the Hybrid Bridge between Web MediaPipe AI and Native Android Accessibility
        webView.addJavascriptInterface(new AINativeBridge(), "AndroidManager");

        // Load our Phase 2 code locally from Android Assets
        webView.loadUrl("file:///android_asset/index.html");
    }

    public class AINativeBridge {
        @JavascriptInterface
        public void performClick(float x, float y) {
            if (GestureService.instance != null) {
                GestureService.instance.performVirtualClick(x, y);
            }
        }

        @JavascriptInterface
        public void performScroll(float dy) {
            if (GestureService.instance != null) {
                GestureService.instance.performVirtualScroll(500, 1500, 500, 1500 - dy);
            }
        }
    }
}
