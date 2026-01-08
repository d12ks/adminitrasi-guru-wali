
# Panduan Lengkap: Dari Kode ke Aplikasi Android

Agar aplikasi berjalan lancar, Anda harus memahami bahwa sistem ini terdiri dari 3 bagian:
1. **Backend (Otak):** Google Apps Script (GAS).
2. **Frontend (Wajah):** Website React yang Anda buat ini.
3. **Android App (Bingkai):** Aplikasi HP yang membuka Frontend.

Ikuti urutan langkah di bawah ini:

---

## TAHAP 1: Deploy Frontend (Website)
*Anda harus "meng-online-kan" kode React ini terlebih dahulu.*

1. **Build Project**
   Buka terminal di folder project ini, lalu ketik:
   ```bash
   npm run build
   ```
   Tunggu sampai selesai. Akan muncul folder baru bernama **`dist`**.

2. **Upload ke Netlify (Gratis)**
   - Buka [Netlify Drop](https://app.netlify.com/drop).
   - **Drag & Drop** folder `dist` tadi ke lingkaran di halaman web Netlify.
   - Tunggu hingga statusnya "Published".

3. **Salin URL Website**
   Netlify akan memberi Anda link, contoh: `https://random-name-123.netlify.app`.
   **Simpan link ini!** Ini yang akan dipakai di Android Studio.

   > **Catatan:** Pastikan URL Google Apps Script (`.../exec`) sudah Anda tempel dengan benar di file `services/gasService.ts` sebelum melakukan Build.

### ⚠️ TAHAP 1.5: Konfigurasi API Key (WAJIB UNTUK AI) ⚠️
Fitur **Bantuan AI** membutuhkan kunci (API Key) dari Google Gemini. Kunci ini **TIDAK** ikut ter-upload otomatis demi keamanan. Anda harus menambahkannya manual di Netlify.

1. Buka dashboard Netlify Anda, klik pada project website yang baru saja di-deploy.
2. Pergi ke **Site settings** > **Environment variables**.
3. Klik tombol **Add a variable**.
4. Isi data berikut:
   - **Key:** `API_KEY`
   - **Value:** (Masukkan API Key Google Gemini Anda di sini)
5. Klik **Create variable**.
6. **PENTING:** Setelah menambahkan variable, Anda harus melakukan **Build Ulang** atau Re-deploy agar settingan ini aktif.
   - Pergi ke tab **Deploys** -> Klik tombol **Trigger deploy** -> **Clear cache and deploy site**.

---

## TAHAP 2: Setup Android Studio

### 1. Buat File `res/xml/provider_paths.xml`
1. Di Android Studio, lihat di sebelah kiri (Project View).
2. Klik kanan pada folder **`res`** -> **New** -> **Android Resource Directory**.
   - Pilih Resource type: **xml**.
   - Klik OK. (Akan muncul folder `xml` di bawah `res`).
3. Klik kanan pada folder **`xml`** yang baru dibuat -> **New** -> **XML Resource File**.
4. Beri nama file: **`provider_paths`** (jangan pakai spasi atau huruf besar).
5. Klik OK.
6. Hapus semua isi file tersebut, dan ganti dengan kode ini:

```xml
<?xml version="1.0" encoding="utf-8"?>
<paths>
    <external-path name="external_files" path="."/>
</paths>
```

### 2. Update `AndroidManifest.xml` (Update Terbaru)
Buka file `manifests/AndroidManifest.xml`.
Copy kode di bawah ini. Kode ini sudah ditambahkan `maxSdkVersion` agar **warning kuning** pada `WRITE_EXTERNAL_STORAGE` hilang.

```xml
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:tools="http://schemas.android.com/tools">

    <!-- IZIN -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    
    <!-- Batasi izin storage hanya untuk Android 12 ke bawah -->
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" android:maxSdkVersion="32" />
    
    <!-- Izin notifikasi wajib untuk Android 13+ -->
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />

    <queries>
        <!-- Agar aplikasi bisa membuka PDF Viewer eksternal -->
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

        <!-- CONFIG FILE PROVIDER -->
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

### 3. Update `MainActivity.java` (Versi Prioritas Tinggi)
Versi ini menggunakan Channel ID baru (`download_channel_new`) untuk memaksa HP mereset pengaturan notifikasi agar muncul sebagai Pop-up (Heads-up).

**PENTING:** Ganti `APP_URL` dengan link Netlify Anda.

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
    // GANTI DENGAN URL NETLIFY ANDA
    private static final String APP_URL = "https://GANTI_DENGAN_LINK_NETLIFY_ANDA.netlify.app";
    // Channel ID diganti agar HP mereset pengaturan prioritas
    private static final String CHANNEL_ID = "download_channel_new";

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // 1. Minta Izin Notifikasi (Wajib untuk Android 13+)
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
            // PENTING: IMPORTANCE_HIGH agar muncul pop-up di layar
            int importance = NotificationManager.IMPORTANCE_HIGH;
            NotificationChannel channel = new NotificationChannel(CHANNEL_ID, name, importance);
            channel.setDescription(description);
            // Aktifkan getar dan lampu
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

                // Setup URI dan Intent
                Uri contentUri = FileProvider.getUriForFile(mContext, mContext.getPackageName() + ".provider", file);
                Intent openIntent = new Intent(Intent.ACTION_VIEW);
                openIntent.setDataAndType(contentUri, "application/pdf");
                openIntent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_ACTIVITY_NEW_TASK);

                PendingIntent pendingIntent = PendingIntent.getActivity(mContext, 0, openIntent, 
                        PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

                // Buat Notifikasi dengan Prioritas MAX
                NotificationCompat.Builder builder = new NotificationCompat.Builder(mContext, CHANNEL_ID)
                        .setSmallIcon(android.R.drawable.stat_sys_download_done)
                        .setContentTitle("Download Selesai")
                        .setContentText("Ketuk untuk membuka " + fileName)
                        .setPriority(NotificationCompat.PRIORITY_MAX) // Memaksa muncul di atas layar
                        .setDefaults(Notification.DEFAULT_ALL)        // Suara & Getar
                        .setContentIntent(pendingIntent)
                        .setAutoCancel(true)
                        .addAction(android.R.drawable.ic_menu_view, "BUKA PDF", pendingIntent);

                NotificationManager notificationManager = (NotificationManager) mContext.getSystemService(Context.NOTIFICATION_SERVICE);
                notificationManager.notify((int) System.currentTimeMillis(), builder.build());

                // Tampilkan Toast juga sebagai cadangan
                Toast.makeText(mContext, "File disimpan di Download", Toast.LENGTH_SHORT).show();

            } catch (Exception e) {
                Toast.makeText(mContext, "Gagal: " + e.getMessage(), Toast.LENGTH_LONG).show();
            }
        }
    }
}
```

## TAHAP 3: Build APK (Sangat Penting)

Karena kita mengubah pengaturan notifikasi, lakukan langkah ini agar "bersih":

1.  **UNINSTALL** aplikasi Guru Wali yang lama di HP/Emulator Anda terlebih dahulu. (Ini wajib agar Channel ID baru terdaftar).
2.  Di Android Studio: **Build** > **Clean Project**.
3.  Lalu **Build** > **Rebuild Project**.
4.  Jalankan kembali di HP.
5.  Saat pertama kali dibuka, **IZINKAN** notifikasi jika diminta.

Sekarang, saat Anda klik unduh PDF, notifikasi akan berbunyi, bergetar, dan muncul pop-up di bagian atas layar dengan tombol "BUKA PDF".

---

## TAHAP 4: Panduan Update Source Code ke GitHub

Jika Anda menggunakan hosting yang terhubung otomatis dengan GitHub (seperti Netlify, Vercel) atau hanya ingin mem-backup kode, ikuti panduan ini.

### 1. Daftar File yang WAJIB Di-update
Pastikan **semua** file di bawah ini ikut ter-upload. Jika salah satu tertinggal, fitur PDF atau AI bisa error.

*   `pages/Reports.tsx`
*   `pages/InputData.tsx`
*   `services/gasService.ts`
*   `types.ts`
*   **`index.html`** (Mengandung script library PDF)
*   **`index.css`** (Mengandung aturan print/margin PDF)

### 2. Cara Update Menggunakan CMD (Terminal)
Ini adalah cara paling aman dan direkomendasikan.

1.  **Buka Terminal**
    Buka folder project Anda di Windows Explorer. Klik kanan di ruang kosong -> **Open in Terminal** (atau ketik `cmd` di address bar atas folder, lalu tekan Enter).

2.  **Cek Status (Opsional)**
    Ketik perintah ini untuk melihat file apa saja yang berubah (berwarna merah):
    ```bash
    git status
    ```

3.  **Pilih Semua File (Add)**
    Ketik perintah ini untuk memasukkan semua file yang berubah ke antrean upload:
    ```bash
    git add .
    ```

4.  **Simpan Perubahan (Commit)**
    Berikan pesan catatan tentang apa yang Anda update:
    ```bash
    git commit -m "Update fitur PDF margin, AI prompt, dan perbaikan UI"
    ```

5.  **Kirim ke GitHub (Push)**
    Ketik perintah ini untuk meng-upload ke repository GitHub Anda:
    ```bash
    git push origin main
    ```
    *(Jika branch utama Anda bernama 'master', ganti 'main' dengan 'master')*

### 3. Cara Update Manual (Via Browser)
Jika Anda tidak menggunakan Git di CMD:

1.  Buka repository GitHub Anda di browser.
2.  Klik tombol **Add file** -> **Upload files**.
3.  **Drag & Drop** file-file yang telah Anda ubah (`Reports.tsx`, `InputData.tsx`, `index.html`, dll) ke area upload.
    *   *PENTING:* Pastikan Anda meletakkan file sesuai struktur foldernya. Lebih aman menggunakan CMD agar tidak salah folder.
4.  Scroll ke bawah, isi pesan di kolom "Commit changes".
5.  Klik tombol hijau **Commit changes**.

### 4. Selesai
Jika hosting Anda (Netlify) terhubung ke GitHub, proses **Build** akan berjalan otomatis dalam 1-2 menit. Setelah selesai, perubahan akan langsung aktif di Website dan Aplikasi Android Anda.
