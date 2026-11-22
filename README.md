# Discord Bot di Vercel

Bot Discord berbasis HTTP Interactions yang cocok dijalankan sebagai Vercel Function.
Command yang tersedia: `/ping`, `/halo`, `/kirim`, dan `/help`.

Pesan otomatis dijalankan setiap 10 menit oleh GitHub Actions yang memanggil
endpoint Vercel secara aman.

## 1. Siapkan aplikasi Discord

1. Buka <https://discord.com/developers/applications> dan buat aplikasi.
2. Di **General Information**, salin **Application ID** dan **Public Key**.
3. Di menu **Bot**, buat/reset token lalu salin tokennya.
4. Salin `.env.example` menjadi `.env`, lalu isi semua nilainya.
5. Untuk development, aktifkan Developer Mode di Discord, salin ID server,
   lalu isi `DISCORD_GUILD_ID`. Kosongkan variabel ini untuk command global.
6. Klik kanan channel tujuan, pilih **Copy Channel ID**, lalu isi `CHANNEL_ID`.
7. Isi `AUTO_MESSAGE` dengan teks yang ingin dikirim otomatis.
8. Buat nilai acak panjang untuk `CRON_SECRET`.

Jangan pernah mengunggah `.env` atau membagikan bot token.

## 2. Pasang dependency dan daftarkan command

```powershell
npm install
npm run register
```

## 3. Unggah ke GitHub

```powershell
git init
git add .
git commit -m "Buat Discord bot untuk Vercel"
git branch -M main
git remote add origin https://github.com/USERNAME/NAMA-REPO.git
git push -u origin main
```

## 4. Deploy ke Vercel

Import repository GitHub dari dashboard Vercel. Tambahkan variabel berikut di
**Project Settings > Environment Variables** untuk Production:

- `DISCORD_PUBLIC_KEY`
- `DISCORD_BOT_TOKEN`
- `CHANNEL_ID`
- `AUTO_MESSAGE`
- `CRON_SECRET`

Application ID dan Guild ID hanya dibutuhkan secara lokal oleh
`npm run register`.

Setelah deployment selesai, endpoint bot adalah:

```text
https://NAMA-PROYEK.vercel.app/api/interactions
```

Masukkan URL tersebut ke **Discord Developer Portal > General Information >
Interactions Endpoint URL**, kemudian simpan.

## 5. Aktifkan pesan otomatis setiap 10 menit

Endpoint otomatis tersedia di:

```text
https://NAMA-PROYEK.vercel.app/api/auto-send
```

Di repository GitHub, buka **Settings > Secrets and variables > Actions**, lalu
buat dua repository secret:

- `AUTO_SEND_URL`: URL endpoint `/api/auto-send` di atas.
- `CRON_SECRET`: nilai yang sama persis dengan `CRON_SECRET` di Vercel.

Buka tab **Actions > Auto Send Discord Message**, lalu pilih **Run workflow**
untuk menguji secara manual. Setelah berhasil, GitHub menjalankannya otomatis
setiap 10 menit. Jadwal hanya aktif dari workflow pada branch default.

## 6. Undang aplikasi ke server

Di **OAuth2 > URL Generator**, pilih scope `bot` dan `applications.commands`,
pilih izin **Send Messages**, lalu buka URL yang dibuat Discord.

## Menjalankan secara lokal

```powershell
npm run dev
```

Discord membutuhkan URL HTTPS publik untuk mengirim interactions. Untuk pengujian
lokal, gunakan tunnel HTTPS dan arahkan endpoint Discord ke
`https://URL-TUNNEL/api/interactions`.

> Arsitektur ini mendukung slash command, tombol, dan modal. Membaca pesan biasa,
> voice/music, serta event real-time memerlukan koneksi Gateway yang selalu aktif
> dan sebaiknya tidak dijalankan sebagai Vercel Function.
