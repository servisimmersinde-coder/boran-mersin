# BORAN MERSIN - Kurye Havuz Sistemi
## "Mersin'in En Hizli Kurye Platformu"

---

## PROJE OZETI

Boran Mersin, Mersin'de hizmet veren bir kurye havuz platformudur.
Anlasmali isletmeler siparis olusturur, sistem otomatik olarak musait ve yakin kuryeleri atar,
kurye isletmeden siparisi alir ve musterisine teslim eder.

### Temel Akis
```
Isletme Siparis Olusturur
        ↓
Sistem Otomatik Kurye Atar (konum + musaitlik + puana gore)
        ↓
Kurye Siparsi Gorur ve Kabul Eder
        ↓
Kurye Isletmeye Gider, Siparisi Alir
        ↓
Kurye Musteriye Gider, Siparisi Teslim Eder
        ↓
Odeme Yapilir (Nakit / Kart / Isletme Faturasi)
        ↓
Siparis Tamamlanir, Rapor Olusturulur
```

---

## 1. TEKNOLOJI KARARLARI

| Katman | Teknoloji | Neden |
|--------|-----------|-------|
| **Mobil Uygulama** | React Native + Expo | Cross-platform (iOS + Android), hizli gelistirme |
| **Backend API** | Node.js + Express | Hizli, olceklenebilir, TypeScript destegi |
| **Veritabani** | PostgreSQL | Guvenilir, relational, PostGIS ile konum destegi |
| **Gercek Zamanli** | Socket.io | Canli takip, bildirim, anlik guncelleme |
| **Harita/Rota** | Google Maps API | Harita, rota optimizasyonu, mesafe hesaplama |
| **Bildirim** | Firebase Cloud Messaging | Push bildirim (iOS + Android) |
| **Sanal POS** | Iyzico / PayTR / Shopier | Kartli odeme entegrasyonu |
| **Dosya Saklama** | Cloudinary / AWS S3 | Profil foto, siparis fotograflari |
| **Hosting** | Railway / Render / AWS | Backend barindirma |
| **CI/CD** | EAS Build (Expo) | App Store / Google Play yayini |

---

## 2. ROL SISTEMI VE YETKILER

### 2.1 Admin (Yonetici)
- Tum kuryeleri goruntuleme/yonetme
- Tum siparisleri goruntuleme
- Isletme kayit/yonetme
- Bolge tanimlama (ilceler, mahaller)
- Fiyatlandirma ayarlama
- Rapor ve istatistik goruntuleme
- Kurye puaplama/yonetme
- Sistem ayarlari

### 2.2 Kurye
- Kayit/giris (telefon + SMS dogrulama)
- Profil duzenleme (ad, soyad, telefon, foto, arac tipi)
- Musaitlik acma/kapama (online/offline)
- Siparis bildirimi alma
- Siparis kabul/ret
- Haritada rota acma (Google Maps navigasyon)
- Siparis durum guncelleme (yolda/teslim edildi)
- Kazanc ve hakedis goruntuleme
- Gunluk/haftalik istatistik

### 2.3 Isletme (Magaza/Bayi)
- Kayit/giris (email + sifre)
- Profil duzenleme (isletme adi, adres, telefon, logo)
- Siparis olusturma (alic bilgileri, paket detaylari)
- Aktif siparisleri takip etme
- Kurye konumu canli izleme
- Siparis gecmisi
- Fatura/borc takibi
- Raporlama

---

## 3. VERITABANI SCHEMASI (PostgreSQL)

### 3.1 kullanicilar
```
id            SERIAL PRIMARY KEY
rol           VARCHAR(20) -- admin, kurye, isletme
ad_soyad      VARCHAR(100)
telefon       VARCHAR(15) UNIQUE
email         VARCHAR(100) UNIQUE
sifre_hash    VARCHAR(255)
profil_foto   TEXT
durum         VARCHAR(10) -- aktif, pasif, beklemede
olusturma_tarihi TIMESTAMP DEFAULT NOW()
son_giris     TIMESTAMP
```

### 3.2 kuryeler (ek tablo)
```
id            SERIAL PRIMARY KEY
kullanici_id  INT REFERENCES kullanicilar(id)
arac_tipi     VARCHAR(20) -- motorlu, bisiklet, yaya
plaka         VARCHAR(20)
lisans_no     VARCHAR(30)
puan          DECIMAL(3,2) DEFAULT 5.00
toplam_teslim INT DEFAULT 0
musait        BOOLEAN DEFAULT false
mevcut_konum  GEOMETRY(POINT, 4326) -- PostGIS
son_konum_tarihi TIMESTAMP
```

### 3.3 isletmeler (ek tablo)
```
id            SERIAL PRIMARY KEY
kullanici_id  INT REFERENCES kullanicilar(id)
isletme_adi   VARCHAR(200)
isletme_turu  VARCHAR(50) -- restoran, market, eczane, diger
adres         TEXT
konum         GEOMETRY(POINT, 4326)
logo          TEXT
calisma_saati VARCHAR(100) -- "09:00-22:00"
```

### 3.4 siparisler
```
id            SERIAL PRIMARY KEY
isletme_id    INT REFERENCES isletmeler(id)
kurye_id      INT REFERENCES kuryeler(id) -- NULL olabilir (havuzda beklerken)
durum         VARCHAR(20) -- bekliyor, atandi, alindi, yolda, teslim, iptal
gonderen_ad    VARCHAR(100)
gonderen_tel   VARCHAR(15)
gonderen_adres TEXT
gonderen_konum GEOMETRY(POINT, 4326)
alic_ad       VARCHAR(100)
alic_tel      VARCHAR(15)
alic_adres    TEXT
alic_konum    GEOMETRY(POINT, 4326)
paket_aciklama TEXT
paket_agirligi DECIMAL -- kg
oncelik       VARCHAR(10) -- normal, acil, vip
ucret         DECIMAL(10,2)
komisyon      DECIMAL(10,2)
odeme_turu    VARCHAR(20) -- nakit, kart, fatura
odeme_durum   VARCHAR(20) -- bekliyor, odedi
fotolar       TEXT[] -- teslim fotograflari
notlar        TEXT
olusturma_tarihi TIMESTAMP DEFAULT NOW()
alis_tarihi   TIMESTAMP
teslim_tarihi TIMESTAMP
iptal_nedeni  TEXT
```

### 3.5 konum_loglari
```
id            SERIAL PRIMARY KEY
kurye_id      INT REFERENCES kuryeler(id)
konum         GEOMETRY(POINT, 4326)
hiz           DECIMAL -- km/s
yol_durumu    VARCHAR(20)
kayit_zamani  TIMESTAMP DEFAULT NOW()
```

### 3.6 bildirimler
```
id            SERIAL PRIMARY KEY
kullanici_id  INT REFERENCES kullanicilar(id)
baslik        VARCHAR(200)
icerik        TEXT
tip           VARCHAR(20) -- siparis, kurye, sistem
okundu        BOOLEAN DEFAULT false
olusturma     TIMESTAMP DEFAULT NOW()
```

### 3.7 finansal_islemler
```
id            SERIAL PRIMARY KEY
kullanici_id  INT REFERENCES kullanicilar(id)
tip           VARCHAR(20) -- kazanc, komisyon, odeme, para_iade
tutar         DECIMAL(10,2)
aciklama      TEXT
siparis_id    INT REFERENCES siparisler(id)
olusturma     TIMESTAMP DEFAULT NOW()
```

---

## 4. API ENDPOINT'LERI

### 4.1 Autentikasyon
```
POST /api/auth/kayit          - Kayit olma
POST /api/auth/giris          - Giris yapma
POST /api/auth/sms-dogrula    - SMS dogrulama
POST /api/auth/sifre-sifirla  - Sifre sifirlama
```

### 4.2 Kurye
```
GET    /api/kurye/profil           - Profil bilgisi
PUT    /api/kurye/profil           - Profil guncelleme
PUT    /api/kurye/musaitlik        - Musaitlik ac/kapa
PUT    /api/kurye/konum            - Konum guncelleme
GET    /api/kurye/siparislerim     - Siparislerim listesi
POST   /api/kurye/siparis-kabul    - Siparis kabul
POST   /api/kurye/siparis-red      - Siparis red
PUT    /api/kurye/durum-guncelle   - Siparis durumu degistir
GET    /api/kurye/kazanc           - Kazanc bilgisi
```

### 4.3 Isletme
```
GET    /api/isletme/profil         - Profil bilgisi
PUT    /api/isletme/profil         - Profil guncelleme
POST   /api/isletme/siparis        - Yeni siparis olustur
GET    /api/isletme/siparislerim   - Siparislerim
GET    /api/isletme/aktif          - Aktif siparisler
GET    /api/isletme/borc           - Borc/fatura bilgisi
```

### 4.4 Siparis
```
GET    /api/siparis/:id            - Siparis detay
GET    /api/siparis/takip/:id      - Siparis takip (public)
PUT    /api/siparis/:id/durum      - Durum guncelleme
POST   /api/siparis/:id/teslim     - Teslim isleme (foto + not)
POST   /api/siparis/:id/iptal      - Siparis iptal
```

### 4.5 Admin
```
GET    /api/admin/dashboard        - Dashboard verileri
GET    /api/admin/kuryeler         - Kurye listesi
PUT    /api/admin/kurye/:id        - Kurye durum guncelle
GET    /api/admin/isletmeler       - Isletme listesi
GET    /api/admin/siparisler       - Tum siparisler
GET    /api/admin/raporlar         - Raporlar
POST   /api/admin/bolge            - Bolge tanimlama
GET    /api/admin/finansal         - Finansal raporlar
```

### 4.6 Harita
```
GET    /api/harita/kuryeler        - Aktif kurye konumlari (real-time)
GET    /api/harita/rota            - Rota hesaplama
GET    /api/harita/mesafe          - Mesafe/sure hesaplama
```

---

## 5. MOBIL UYGULAMA EKRANLARI

### 5.1 Ortak Ekranlar
- Giris/Kayit ekranlari
- Splash screen (Boran Mersin logosu)
- Bildirimler sayfasi
- Profil sayfasi
- Ayarlar

### 5.2 Kurye Uygulamasi
```
├── Giris/Kayit
├── Ana Sayfa (Harita + aktif siparisler)
├── Siparis Bildirimi (popup/toast)
├── Siparis Detayi
│   ├── Alis noktasi (isletme bilgisi)
│   ├── Teslim noktasi (musteri bilgisi)
│   ├── Rota (Google Maps ac)
│   ├── Ucret bilgisi
│   └── Durum guncelleme butonlari
├── Aktif Siparislerim (liste)
├── Siparis Gecmisim
├── Kazanc / Hakedis
├── Gunluk Istatistikler
├── Profilim
├── Musaitlik Ayari (online/offline)
└── Ayarlar
```

### 5.3 Isletme Uygulamasi (Web Paneli oncelikli, sonra mobil)
```
├── Giris/Kayit
├── Dashboard
│   ├── Aktif siparisler
│   ├── Bugunun ozeti
│   └── Hizli siparis olusturma
├── Yeni Siparis Olusturma
│   ├── Alici bilgileri (ad, telefon, adres, harita)
│   ├── Paket bilgileri (aciklama, agirlik, adet)
│   ├── Oncelik secimi
│   └── Odeme turu
├── Aktif Siparisler (canli takip)
├── Siparis Gecmisi
├── Borc / Fatura Takibi
├── Raporlar
│   ├── Gunluk/aylik siparis sayisi
│   ├── Toplam harcama
│   └── Siparis detaylari
└── Isletme Profili
```

---

## 6. GOOGLE PLAY VE APP STORE YAYIN SURECI

### 6.1 Gereksinimler
| Gereksinim | Google Play | App Store |
|------------|-------------|-----------|
| Gelistirici Ucreti | $25 (tek seferlik) | $99/yil |
| Gelistirici Hesabi | Google Play Console | Apple Developer Program |
| Gerekli Dokuman | Gizlilik Politikasi URL | Gizlilik Politikasi + Privacy Manifest |
| Inceleme Suresi | 3-7 gun (ilk) | 24-48 saat (ilk) |
| Guncelleme Inceleme | 24 saat | 24-48 saat |
| Min SDK | API 35 (Android 15) | iOS 16+ |
| Build Format | AAB (Android App Bundle) | IPA (App Store Connect) |

### 6.2 Yayin Adimlari

#### Android (Google Play)
1. Google Play Console hesabi ac ($25 ode)
2. Uygulama olustur (Boran Mersin)
3. Gizlilik politikasi hazirla ve URL yayinla
4. Data Safety bolumunu doldur
5. EAS Build ile AAB olustur: `eas build --platform android --profile production`
6. Store listing hazirla (screenshots, aciklama, logo)
7. AAB yukle → Inceleme gonder
8. 3-7 gun bekle, onaylanir

#### iOS (App Store)
1. Apple Developer Program'a kayit ol ($99/yil)
2. App Store Connect'te uygulama olustur
3. Privacy Manifest (PrivacyInfo.xcprivacy) ekle
4. EAS Build ile IPA olustur: `eas build --platform ios --profile production`
5. TestFlight ile beta testi
6. Store listing hazirla (screenshots, aciklama, keywords)
7. Privacy Nutrition Labels doldur
8. App Store'a yukle → Inceleme gonder
9. 24-48 saat bekle, onaylanir

### 6.3 Gerekli Uygulama Icindekiler
- Uygulama ikonu (1024x1024 PNG)
- Splash screen logosu
- Store screenshots (Android: en az 2, iOS: en az 3 farkli boyut)
- Feature graphic (1024x500, Google Play icin)
- Uygulama aciklamasi (Turkce + Ingilizce)
- Gizlilik politikasi URL'si
- Destek URL'si / e-posta

---

## 7. GELISTIRME AŞAMALARI

### Aşama 1: Altyapi (2-3 hafta)
- [ ] Proje kurulumu (Expo + Node.js + PostgreSQL)
- [ ] Veritabani olusturma ve migration
- [ ] Autentikasyon sistemi (JWT + SMS dogrulama)
- [ ] Temel CRUD API'leri
- [ ] Backend deploy (Railway/Render)
- [ ] Git repo kurulumu

### Aşama 2: Kurye Mobil Uygulamasi (3-4 hafta)
- [ ] Giris/Kayit ekranlari
- [ ] Harita gorunumu (Google Maps entegrasyonu)
- [ ] Konum takibi (background location)
- [ ] Musaitlik sistemi (online/offline)
- [ ] Siparis bildirimi alma
- [ ] Siparis kabul/ret
- [ ] Navigasyon acma (Google Maps)
- [ ] Durum guncelleme (yolda/teslim)
- [ ] Teslim fotografi yukleme
- [ ] Kazanc goruntuleme
- [ ] Profil yonetimi

### Aşama 3: Isletme Web Paneli (2-3 hafta)
- [ ] Giris/Kayit
- [ ] Dashboard
- [ ] Siparis olusturma formu
- [ ] Aktif siparis takibi
- [ ] Canli harita (kurye konumu)
- [ ] Siparis gecmisi
- [ ] Raporlama

### Aşama 4: Admin Paneli (2-3 hafta)
- [ ] Dashboard (istatistikler)
- [ ] Kurye yonetimi
- [ ] Isletme yonetimi
- [ ] Siparis yonetimi
- [ ] Bolge tanimlama
- [ ] Fiyatlandirma ayarlari
- [ ] Finansal raporlar

### Aşama 5: Odeme Sistemi (1-2 hafta)
- [ ] Sanal POS entegrasyonu (Iyzico/PayTR)
- [ ] Kapida odeme akisi
- [ ] Isletme fatura sistemi
- [ ] Kurye hakedis hesaplama

### Aşama 6: Gelistirme ve Yayin (2-3 hafta)
- [ ] UI/UX iyilestirmeleri
- [ ] Performans optimizasyonu
- [ ] Test (unit + integration + e2e)
- [ ] Gizlilik politikasi hazirlama
- [ ] Store listing hazirlama
- [ ] Google Play yayini
- [ ] App Store yayini

---

## 8. TAKTİKSEL OZELLIKLER

### 8.1 Kurye Havuz Sistemi
- Siparis olusturuldugunda havuza duser
- Tum musait kuryelere bildirim gider
- En yakin ve en yuksek pualli kurye once gosterilir
- Kurye 30 saniye icinde kabul etmezse diger kuryelere gecer
- Sure dolursa admin devreye girer

### 8.2 Akilli Kurye Atama Algoritmasi
```
Skor = (mesafe_puani * 0.4) + (kurye_puani * 0.3) + (musaitlik * 0.2) + (yuk_puani * 0.1)

- mesafe_puani: Isletmeye olan uzaklik (yakin = yuksek)
- kurye_puani: Kuryenin toplam puani (4.8+ = yuksek)
- musaitlik: Hic paketi yoksa 1.0, varsa dusuk
- yuk_puani: Mevcut paket sayisi (az = yuksek)
```

### 8.3 Canli Takip
- Kurye konumu her 10 saniyede bir sunucuya gonderilir
- Socket.io ile isletmeye ve admin paneline canli aktarilir
- Google Maps uzerinde kurye marker'i guncellenir
- Musteriye de takip linki gonderilir (SMS/WhatsApp)

### 8.4 Bildirim Sistemi
- Yeni siparis → Kuryeye push bildirim
- Siparis kabul → Isletmeye push bildirim
- Yolda → Musteriye SMS/WhatsApp
- Teslim edildi → Herkese bildirim
- Gecikme uyarisi → Admin + isletme

### 8.5 Fiyatlandirma
```
Taban ucret: 30 TL (0-3 km arasi)
Km basina: 8 TL (3 km uzeri)
Minimum ucret: 35 TL
Acil siparis: +50%
Gece ucreti (22:00-06:00): +30%
Komisyon: Isletmeden %15
```

---

## 9. MOBIL UYGULAMA KURULUMU

### 9.1 Gerekenler
- macOS (iOS icin gerekli, veya EAS Build cloud kullanilabilir)
- Node.js 18+
- Expo CLI
- Google Play Developer Hesabi ($25)
- Apple Developer Hesabi ($99/yil)
- Google Maps API Key

### 9.2 Proje Baslatma
```bash
# Expo ile proje olusturma
npx create-expo-app@latest BoranMersin --template blank-typescript

# Gerekli paketler
npx expo install expo-location expo-notifications
npx expo install @react-navigation/native @react-navigation/bottom-tabs
npx expo install react-native-maps
npx expo install socket.io-client
npx expo install @react-native-async-storage/async-storage
npx expo install expo-secure-store
npx expo install react-native-paper
```

### 9.3 Build ve Yayin
```bash
# Android APK (test icin)
eas build --platform android --profile preview

# Android AAB (Google Play icin)
eas build --platform android --profile production

# iOS (App Store icin)
eas build --platform ios --profile production

# Direkt yukleme
eas submit --platform android
eas submit --platform ios
```

---

## 10. TAHMINI MALIYET ve SURE

| Kalem | Maliyet | Sure |
|-------|---------|------|
| Gelistirme (kodlama) | Sifirdan kendimiz yapacagiz | 10-14 hafta |
| Google Play Developer | $25 (tek sefer) | - |
| Apple Developer | $99/yil | - |
| Sunucu (ilk 3 ay) | ~$50-100/ay | - |
| Google Maps API | $200/ay ucretsiz kredi | - |
| Sanal POS kurulum | 0-500 TL | - |
| SMS servisi (Twilio) | ~$0.01/SMS | - |
| Toplamilk Maliyet | ~$200-400 | - |

---

## 11. KILAVUZLAR

- React Native + Expo: https://docs.expo.dev
- Google Maps React Native: https://github.com/react-native-maps/react-native-maps
- Socket.io: https://socket.io
- EAS Build: https://docs.expo.dev/build/introduction/
- Google Play Console: https://play.google.com/console
- App Store Connect: https://appstoreconnect.apple.com

---

**Proje Baslangic Tarihi: Agustos 2026**
**Hedef Canliya Gecis: Kasim 2026**
