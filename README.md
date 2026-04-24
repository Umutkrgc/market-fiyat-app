# Market Fiyat Karşılaştırma App 🚀

Türkiye'deki market fiyatlarını (ŞOK, A101 vb.) anlık olarak karşılaştıran, Puppeteer tabanlı otonom veri çekme (scraping) ve AI entegrasyonu vizyonuyla geliştirilmiş modern bir web uygulaması.

## 🌟 Özellikler

- **Gerçek Zamanlı Veri Kazıma (Puppeteer):** Market sitelerinden otonom olarak güncel fiyat, ürün görseli ve detay bilgilerini çeker.
- **Akıllı Ürün Filtreleme:** Alakasız sonuçları temizleyen ve gerçek varyasyonları (boy/tür) ayırt eden parser algoritması.
- **Gelişmiş Önbellek (Caching):** Aynı aramaları tekrar etmeyen, performans dostu 1 saatlik bellek sistemi.
- **Glassmorphism Arayüz:** Modern, şeffaf ve kullanıcı dostu görsel tasarım.
- **Yorum ve Puanlama:** Ürünler hakkında kullanıcı değerlendirmeleri.
- **Token Usage Log:** Sistem maliyetlerini takip eden admin loglama sistemi.

## 🛠 Teknoloji Yığını

- **Backend:** NestJS (Node.js)
- **Frontend:** Vanilla JS, CSS (Glassmorphism), HTML
- **Veritabanı:** SQLite & TypeORM
- **Scraping:** Puppeteer (Headless Chrome)
- **Güvenlik:** JWT Auth, Environment Variables (.env)

## 🚀 Kurulum

1. Depoyu klonlayın:
   ```bash
   git clone https://github.com/Umutkrgc/market-fiyat-app.git
   cd market-fiyat-app
   ```

2. Bağımlılıkları kurun:
   ```bash
   npm install
   ```

3. `.env` dosyasını `.env.example` dosyasından kopyalayarak oluşturun ve yapılandırın:
   ```bash
   cp .env.example .env
   ```

4. Uygulamayı başlatın:
   ```bash
   npm run start:dev
   ```

## 📋 Mimari Notlar

Uygulama **NestJS** modüler mimarisini takip eder. `ScraperService` tüm pazar yerleri için merkezi bir robot görevi görür. Veriler ilişkisel olarak SQLite üzerinde `Product`, `Market`, `Price` ve `Comment` entity'leri ile yönetilir.

## 📄 Lisans

MIT
