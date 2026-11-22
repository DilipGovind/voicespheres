package com.voicesphere.app;

import android.Manifest;
import android.annotation.SuppressLint;
import android.content.Context;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.net.ConnectivityManager;
import android.net.NetworkCapabilities;
import android.net.NetworkInfo;
import android.os.Build;
import android.os.Bundle;
import android.util.TypedValue;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.CookieManager;
import android.webkit.PermissionRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.widget.Button;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.TextView;

import androidx.activity.OnBackPressedCallback;
import androidx.annotation.NonNull;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import com.getcapacitor.BridgeActivity;
import com.getcapacitor.BridgeWebChromeClient;
import com.getcapacitor.WebViewListener;

public class MainActivity extends BridgeActivity {

    private static final int MIC_PERMISSION_REQUEST_CODE = 1001;
    private PermissionRequest pendingPermissionRequest;

    private FrameLayout overlayContainer;
    private LinearLayout loadingLayout;
    private LinearLayout errorLayout;
    private TextView errorSubtitle;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // 1. Configure Android WebView settings for modern JavaScript, DOM storage, cookies, and WebRTC
        configureWebView();

        // 2. Build native loading and error UI overlays
        setupNativeOverlays();

        // 3. Register WebView listener for lifecycle, polyfill injection, and error recovery
        setupWebViewListeners();

        // 4. Register Android hardware back-button dispatcher
        setupBackNavigation();

        // 5. Check / request initial microphone permission
        checkMicrophonePermission();

        // 6. Safe MobileAds SDK Initialization
        initializeMobileAds();
    }

    private void initializeMobileAds() {
        try {
            com.google.android.gms.ads.MobileAds.initialize(this, initializationStatus -> {});
        } catch (Throwable ignored) {
            // Graceful fallback if Google Play Services are unavailable
        }
    }

    @SuppressLint("SetJavaScriptEnabled")
    private void configureWebView() {
        if (getBridge() == null) return;
        WebView webView = getBridge().getWebView();
        if (webView == null) return;

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);
        settings.setSupportZoom(false);
        settings.setBuiltInZoomControls(false);

        CookieManager cookieManager = CookieManager.getInstance();
        cookieManager.setAcceptCookie(true);
        cookieManager.setAcceptThirdPartyCookies(webView, true);

        // Security: Enable WebView debugging ONLY in Debug builds, disable in Release builds
        WebView.setWebContentsDebuggingEnabled(BuildConfig.DEBUG);
        if (BuildConfig.DEBUG) {
            webView.clearCache(true);
        }

        // Custom WebChromeClient to reliably grant WebRTC audio capture
        webView.setWebChromeClient(new BridgeWebChromeClient(getBridge()) {
            @Override
            public void onPermissionRequest(final PermissionRequest request) {
                runOnUiThread(() -> {
                    boolean needsAudio = false;
                    for (String r : request.getResources()) {
                        if (PermissionRequest.RESOURCE_AUDIO_CAPTURE.equals(r)) {
                            needsAudio = true;
                            break;
                        }
                    }

                    if (needsAudio) {
                        if (ContextCompat.checkSelfPermission(MainActivity.this, Manifest.permission.RECORD_AUDIO)
                                == PackageManager.PERMISSION_GRANTED) {
                            request.grant(request.getResources());
                        } else {
                            pendingPermissionRequest = request;
                            ActivityCompat.requestPermissions(
                                MainActivity.this,
                                new String[]{Manifest.permission.RECORD_AUDIO},
                                MIC_PERMISSION_REQUEST_CODE
                            );
                        }
                    } else {
                        super.onPermissionRequest(request);
                    }
                });
            }
        });
    }

    private void setupNativeOverlays() {
        ViewGroup root = findViewById(android.R.id.content);
        if (root == null) return;

        overlayContainer = new FrameLayout(this);
        overlayContainer.setLayoutParams(new FrameLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            ViewGroup.LayoutParams.MATCH_PARENT
        ));

        // Loading Layout
        loadingLayout = new LinearLayout(this);
        loadingLayout.setOrientation(LinearLayout.VERTICAL);
        loadingLayout.setGravity(Gravity.CENTER);
        loadingLayout.setBackgroundColor(Color.parseColor("#080a10"));
        loadingLayout.setLayoutParams(new FrameLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            ViewGroup.LayoutParams.MATCH_PARENT
        ));

        // VoiceSphere Title
        TextView titleView = new TextView(this);
        titleView.setText("VoiceSphere");
        titleView.setTextSize(TypedValue.COMPLEX_UNIT_SP, 28);
        titleView.setTextColor(Color.parseColor("#38bdf8"));
        titleView.setTypeface(Typeface.DEFAULT_BOLD);
        titleView.setGravity(Gravity.CENTER);

        // Progress Bar
        ProgressBar progressBar = new ProgressBar(this);
        LinearLayout.LayoutParams pbParams = new LinearLayout.LayoutParams(
            dpToPx(48), dpToPx(48)
        );
        pbParams.topMargin = dpToPx(24);
        pbParams.bottomMargin = dpToPx(16);
        progressBar.setLayoutParams(pbParams);

        // Loading Subtitle
        TextView subtitleView = new TextView(this);
        subtitleView.setText("Connecting to Global Edge Voice Network...");
        subtitleView.setTextSize(TypedValue.COMPLEX_UNIT_SP, 14);
        subtitleView.setTextColor(Color.parseColor("#94a3b8"));
        subtitleView.setGravity(Gravity.CENTER);

        loadingLayout.addView(titleView);
        loadingLayout.addView(progressBar);
        loadingLayout.addView(subtitleView);

        // Error Layout
        errorLayout = new LinearLayout(this);
        errorLayout.setOrientation(LinearLayout.VERTICAL);
        errorLayout.setGravity(Gravity.CENTER);
        errorLayout.setBackgroundColor(Color.parseColor("#080a10"));
        errorLayout.setPadding(dpToPx(24), dpToPx(24), dpToPx(24), dpToPx(24));
        errorLayout.setLayoutParams(new FrameLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            ViewGroup.LayoutParams.MATCH_PARENT
        ));
        errorLayout.setVisibility(View.GONE);

        TextView errTitle = new TextView(this);
        errTitle.setText("Connection Problem");
        errTitle.setTextSize(TypedValue.COMPLEX_UNIT_SP, 22);
        errTitle.setTextColor(Color.parseColor("#f87171"));
        errTitle.setTypeface(Typeface.DEFAULT_BOLD);
        errTitle.setGravity(Gravity.CENTER);

        errorSubtitle = new TextView(this);
        errorSubtitle.setText("Unable to reach VoiceSphere. Please check your internet connection.");
        errorSubtitle.setTextSize(TypedValue.COMPLEX_UNIT_SP, 14);
        errorSubtitle.setTextColor(Color.parseColor("#cbd5e1"));
        errorSubtitle.setGravity(Gravity.CENTER);
        LinearLayout.LayoutParams subParams = new LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.WRAP_CONTENT,
            ViewGroup.LayoutParams.WRAP_CONTENT
        );
        subParams.topMargin = dpToPx(12);
        subParams.bottomMargin = dpToPx(24);
        errorSubtitle.setLayoutParams(subParams);

        // Retry Button
        Button retryButton = new Button(this);
        retryButton.setText("Retry Connection");
        retryButton.setTextSize(TypedValue.COMPLEX_UNIT_SP, 15);
        retryButton.setTextColor(Color.BLACK);
        retryButton.setTypeface(Typeface.DEFAULT_BOLD);
        GradientDrawable btnBg = new GradientDrawable();
        btnBg.setColor(Color.parseColor("#f59e0b"));
        btnBg.setCornerRadius(dpToPx(24));
        retryButton.setBackground(btnBg);
        retryButton.setPadding(dpToPx(32), dpToPx(12), dpToPx(32), dpToPx(12));
        retryButton.setOnClickListener(v -> retryConnection());

        errorLayout.addView(errTitle);
        errorLayout.addView(errorSubtitle);
        errorLayout.addView(retryButton);

        overlayContainer.addView(loadingLayout);
        overlayContainer.addView(errorLayout);
        root.addView(overlayContainer);
    }

    private void setupWebViewListeners() {
        if (getBridge() == null) return;

        getBridge().addWebViewListener(new WebViewListener() {
            @Override
            public void onPageStarted(WebView webView) {
                runOnUiThread(() -> {
                    showLoading();
                    injectPolyfills(webView);
                });
            }

            @Override
            public void onPageLoaded(WebView webView) {
                runOnUiThread(() -> {
                    hideLoading();
                    injectPolyfills(webView);
                });
            }

            @Override
            public void onReceivedError(WebView webView) {
                runOnUiThread(() -> {
                    showError("Unable to connect to the voice network. Please check your connection.");
                });
            }

            @Override
            public void onReceivedHttpError(WebView webView) {
                runOnUiThread(() -> {
                    if (!isNetworkAvailable()) {
                        showError("Network unreachable. Please check your internet connection.");
                    }
                });
            }
        });
    }

    private void injectPolyfills(WebView webView) {
        if (webView == null) return;
        String js =
            "(function() {" +
            "  try {" +
            "    if (!window.speechSynthesis) {" +
            "      window.speechSynthesis = {" +
            "        speaking: false, paused: false, pending: false, onvoiceschanged: null," +
            "        getVoices: function() { return []; }," +
            "        speak: function(u) { if (u && u.onend) setTimeout(u.onend, 50); }," +
            "        cancel: function() {}, pause: function() {}, resume: function() {}" +
            "      };" +
            "    } else if (typeof window.speechSynthesis.getVoices !== 'function') {" +
            "      window.speechSynthesis.getVoices = function() { return []; };" +
            "    }" +
            "    if (!window.SpeechRecognition && !window.webkitSpeechRecognition) {" +
            "      var DummyRec = function() {" +
            "        this.continuous = false; this.interimResults = false; this.lang = 'en-US';" +
            "        this.onstart = null; this.onend = null; this.onerror = null; this.onresult = null;" +
            "        this.start = function() {}; this.stop = function() {}; this.abort = function() {};" +
            "      };" +
            "      window.SpeechRecognition = DummyRec;" +
            "      window.webkitSpeechRecognition = DummyRec;" +
            "    }" +
            "  } catch(e) { console.warn('Polyfill error:', e); }" +
            "})();";
        webView.evaluateJavascript(js, null);
    }

    private void showLoading() {
        if (overlayContainer != null) overlayContainer.setVisibility(View.VISIBLE);
        if (loadingLayout != null) loadingLayout.setVisibility(View.VISIBLE);
        if (errorLayout != null) errorLayout.setVisibility(View.GONE);
    }

    private void hideLoading() {
        if (loadingLayout != null) loadingLayout.setVisibility(View.GONE);
        if (errorLayout != null) errorLayout.setVisibility(View.GONE);
        if (overlayContainer != null) overlayContainer.setVisibility(View.GONE);
    }

    private void showError(String msg) {
        if (overlayContainer != null) overlayContainer.setVisibility(View.VISIBLE);
        if (loadingLayout != null) loadingLayout.setVisibility(View.GONE);
        if (errorSubtitle != null && msg != null) errorSubtitle.setText(msg);
        if (errorLayout != null) errorLayout.setVisibility(View.VISIBLE);
    }

    private void retryConnection() {
        showLoading();
        if (getBridge() != null && getBridge().getWebView() != null) {
            getBridge().getWebView().reload();
        }
    }

    private boolean isNetworkAvailable() {
        try {
            ConnectivityManager cm = (ConnectivityManager) getSystemService(Context.CONNECTIVITY_SERVICE);
            if (cm == null) return false;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                android.net.Network net = cm.getActiveNetwork();
                if (net == null) return false;
                NetworkCapabilities caps = cm.getNetworkCapabilities(net);
                return caps != null && (
                    caps.hasTransport(NetworkCapabilities.TRANSPORT_WIFI) ||
                    caps.hasTransport(NetworkCapabilities.TRANSPORT_CELLULAR) ||
                    caps.hasTransport(NetworkCapabilities.TRANSPORT_ETHERNET)
                );
            } else {
                NetworkInfo ni = cm.getActiveNetworkInfo();
                return ni != null && ni.isConnectedOrConnecting();
            }
        } catch (Exception e) {
            return true;
        }
    }

    private void setupBackNavigation() {
        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                WebView webView = getBridge() != null ? getBridge().getWebView() : null;
                if (webView != null && webView.canGoBack()) {
                    webView.goBack();
                } else {
                    setEnabled(false);
                    getOnBackPressedDispatcher().onBackPressed();
                }
            }
        });
    }

    private void checkMicrophonePermission() {
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.RECORD_AUDIO)
                != PackageManager.PERMISSION_GRANTED) {
            ActivityCompat.requestPermissions(
                this,
                new String[]{Manifest.permission.RECORD_AUDIO},
                MIC_PERMISSION_REQUEST_CODE
            );
        }
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, @NonNull String[] permissions, @NonNull int[] grantResults) {
        if (requestCode == MIC_PERMISSION_REQUEST_CODE) {
            boolean granted = grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED;
            if (pendingPermissionRequest != null) {
                if (granted) {
                    pendingPermissionRequest.grant(pendingPermissionRequest.getResources());
                } else {
                    pendingPermissionRequest.deny();
                }
                pendingPermissionRequest = null;
            }
        }
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
    }

    private int dpToPx(int dp) {
        return (int) TypedValue.applyDimension(
            TypedValue.COMPLEX_UNIT_DIP,
            dp,
            getResources().getDisplayMetrics()
        );
    }
}
