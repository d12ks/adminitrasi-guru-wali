
# Panduan Lengkap: Guru Wali App

Agar fitur **AI** dan **PDF** berjalan lancar, ikuti panduan konfigurasi API Key di bawah ini dengan teliti.

---

## ⚠️ PENTING: Mengatasi Masalah "API Key Tidak Terbaca"

Masalah yang sering terjadi: Anda sudah setting di GitHub, tapi aplikasi tetap error.
**Penyebab:** GitHub Secrets hanya bekerja jika build dilakukan oleh GitHub. Jika Anda menjalankan `npm run build` di komputer sendiri (Manual Build), GitHub Secrets **TIDAK** akan terbaca.

### PILIH METODE BUILD ANDA:

#### OPSI A: Build Manual di Komputer (Drag & Drop ke Netlify)
*Gunakan cara ini jika Anda menjalankan perintah `npm run build` di terminal laptop Anda.*

1.  **Buat File `.env`**
    Di dalam folder project Anda (sejajar dengan `package.json`), buat file baru bernama **`.env`** (tanpa nama depan, hanya titik env).

2.  **Isi File `.env`**
    Buka file tersebut dengan Notepad/Text Editor, lalu isi kode berikut:
    ```env
    API_KEY=Paste_Kunci_Gemini_Anda_Disini
    ```
    *(Jangan pakai tanda petik)*

3.  **Lakukan Build Ulang**
    Buka terminal, jalankan:
    ```bash
    npm run build
    ```
    Proses ini akan "menanam" kunci dari file `.env` ke dalam file aplikasi di folder `dist`.

4.  **Upload Folder `dist`**
    Drag & drop folder `dist` yang baru ke Netlify Drop.

---

#### OPSI B: Build Otomatis via Netlify (Terhubung Git)
*Gunakan cara ini jika Anda menghubungkan Netlify langsung ke Repository GitHub.*

1.  Buka Dashboard **Netlify**.
2.  Pilih Site Anda > **Site configuration**.
3.  Menu **Environment variables**.
4.  Klik **Add a variable**.
    *   Key: `API_KEY`
    *   Value: `(Isi kunci Gemini Anda)`
5.  Pergi ke menu **Deploys** -> **Trigger deploy** -> **Clear cache and deploy site**.
    *(GitHub Secrets tidak perlu di-setting jika menggunakan cara ini).*

---

## TAHAP SELANJUTNYA: Setup Android Studio

Jika website sudah bisa dibuka dan AI berjalan lancar di browser HP/Laptop, baru lanjutkan membuat APK.

### 1. Buat File `res/xml/provider_paths.xml`
1. Di Android Studio, klik kanan folder **`res`** -> **New** -> **Android Resource Directory** (Pilih type: **xml**).
2. Klik kanan folder **`xml`** -> **New** -> **XML Resource File** -> Beri nama **`provider_paths`**.
3. Isi dengan kode:
```xml
<?xml version="1.0" encoding="utf-8"?>
<paths>
    <external-path name="external_files" path="."/>
</paths>
```

### 2. Update `AndroidManifest.xml`
Pastikan isinya seperti ini (terutama bagian `provider`):

```xml
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:tools="http://schemas.android.com/tools">

    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" android:maxSdkVersion="32" />
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />

    <queries>
        <intent>
            <action android:name="android.intent.action.VIEW" />
            <data android:mimeType="application/pdf" />
        </intent>
        <intent>
            <action android:name="android.intent.action.VIEW" />
            <category android:name="android.intent.category.BROWSABLE" />
            <data android:scheme="https" />
        </intent>
    </queries>

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/Theme.GuruWaliApp"
        android:usesCleartextTraffic="true"
        android:requestLegacyExternalStorage="true"
        tools:targetApi="31">
        
        <activity
            android:name=".MainActivity"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>

        <provider
            android:name="androidx.core.content.FileProvider"
            android:authorities="${applicationId}.provider"
            android:exported="false"
            android:grantUriPermissions="true">
            <meta-data
                android:name="android.support.FILE_PROVIDER_PATHS"
                android:resource="@xml/provider_paths" />
        </provider>

    </application>

</manifest>
```

### 3. Update `MainActivity.java`
Ganti `APP_URL` dengan link Netlify Anda.

```java
package com.guru.wali;

import android.Manifest;
import android.annotation.SuppressLint;
import android.app.AlertDialog;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.util.Base64;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

import androidx.activity.OnBackPressedCallback;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.ActivityCompat;
import androidx.core.app.NotificationCompat;
import androidx.core.content.ContextCompat;
import androidx.core.content.FileProvider;

import java.io.File;
import java.io.FileOutputStream;

public class MainActivity extends AppCompatActivity {

    private WebView myWebView;
    private static final String APP_URL = "https://GANTI_DENGAN_LINK_NETLIFY_ANDA.netlify.app";
    private static final String CHANNEL_ID = "download_channel_new";

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        checkNotificationPermission();
        createNotificationChannel();

        myWebView = new WebView(this);
        setContentView(myWebView);

        WebSettings webSettings = myWebView.getSettings();
        webSettings.setJavaScriptEnabled(true);
        webSettings.setDomStorageEnabled(true);
        webSettings.setLoadWithOverviewMode(true);
        webSettings.setUseWideViewPort(true);

        myWebView.addJavascriptInterface(new WebAppInterface(this), "Android");

        myWebView.setWebViewClient(new WebViewClient());
        myWebView.setWebChromeClient(new WebChromeClient());

        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                if (myWebView != null && myWebView.canGoBack()) myWebView.goBack();
                else showExitConfirmation();
            }
        });

        myWebView.loadUrl(APP_URL);
    }

    private void checkNotificationPermission() {
        if (Build.VERSION.SDK_INT >= 33) {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
                ActivityCompat.requestPermissions(this, new String[]{Manifest.permission.POST_NOTIFICATIONS}, 101);
            }
        }
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            CharSequence name = "File Download";
            String description = "Notifikasi saat file selesai diunduh";
            int importance = NotificationManager.IMPORTANCE_HIGH;
            NotificationChannel channel = new NotificationChannel(CHANNEL_ID, name, importance);
            channel.setDescription(description);
            channel.enableVibration(true);
            channel.enableLights(true);
            
            NotificationManager notificationManager = getSystemService(NotificationManager.class);
            if (notificationManager != null) {
                notificationManager.createNotificationChannel(channel);
            }
        }
    }

    private void showExitConfirmation() {
        new AlertDialog.Builder(this)
                .setTitle("Keluar")
                .setMessage("Tutup aplikasi?")
                .setPositiveButton("Ya", (d, w) -> finish())
                .setNegativeButton("Tidak", null)
                .show();
    }

    public class WebAppInterface {
        Context mContext;

        WebAppInterface(Context c) {
            mContext = c;
        }

        @JavascriptInterface
        public void saveBlob(String base64Data, String fileName) {
            try {
                if (base64Data.contains(",")) {
                    base64Data = base64Data.split(",")[1];
                }

                byte[] pdfAsBytes = Base64.decode(base64Data, 0);
                File path = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS);
                File file = new File(path, fileName);

                FileOutputStream os = new FileOutputStream(file, false);
                os.write(pdfAsBytes);
                os.flush();
                os.close();

                Uri contentUri = FileProvider.getUriForFile(mContext, mContext.getPackageName() + ".provider", file);
                Intent openIntent = new Intent(Intent.ACTION_VIEW);
                openIntent.setDataAndType(contentUri, "application/pdf");
                openIntent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_ACTIVITY_NEW_TASK);

                PendingIntent pendingIntent = PendingIntent.getActivity(mContext, 0, openIntent, 
                        PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

                NotificationCompat.Builder builder = new NotificationCompat.Builder(mContext, CHANNEL_ID)
                        .setSmallIcon(android.R.drawable.stat_sys_download_done)
                        .setContentTitle("Download Selesai")
                        .setContentText("Ketuk untuk membuka " + fileName)
                        .setPriority(NotificationCompat.PRIORITY_MAX)
                        .setDefaults(Notification.DEFAULT_ALL)
                        .setContentIntent(pendingIntent)
                        .setAutoCancel(true)
                        .addAction(android.R.drawable.ic_menu_view, "BUKA PDF", pendingIntent);

                NotificationManager notificationManager = (NotificationManager) mContext.getSystemService(Context.NOTIFICATION_SERVICE);
                notificationManager.notify((int) System.currentTimeMillis(), builder.build());

                Toast.makeText(mContext, "File disimpan di Download", Toast.LENGTH_SHORT).show();

            } catch (Exception e) {
                Toast.makeText(mContext, "Gagal: " + e.getMessage(), Toast.LENGTH_LONG).show();
            }
        }
    }
}
```
