import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as puppeteer from 'puppeteer';
import { Market } from '../../models/market.entity';
import { Product } from '../../models/product.entity';
import { Price, PriceType } from '../../models/price.entity';
import { TokenLoggerService } from '../../logger/token-logger.service';

@Injectable()
export class ScraperService {
  private readonly logger = new Logger(ScraperService.name);
  private cache = new Map<string, { data: any, timestamp: number }>();
  private readonly CACHE_TTL = 3600000; // 1 hour

  constructor(
    @InjectRepository(Market)
    private marketRepository: Repository<Market>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(Price)
    private priceRepository: Repository<Price>,
    private tokenLogger: TokenLoggerService,
  ) {}

  async scrapeMigrosProduct(url: string): Promise<any> {
      return { success: false, error: 'Depcrecated for puppeteer live search' };
  }

  async searchProductAcrossMarkets(keyword: string): Promise<any> {
    const cached = this.cache.get(keyword.toLowerCase());
    if (cached && (Date.now() - cached.timestamp < this.CACHE_TTL)) {
      this.logger.log(`Cache hit for keyword: ${keyword}`);
      return cached.data;
    }

    this.logger.log(`Live REAL scraping initiated for keyword: ${keyword}`);
    
    const tokenCost = 5000; 
    this.tokenLogger.logUsage('real_puppeteer_scrape', tokenCost, { keyword });

    let browser;
    try {
        browser = await puppeteer.launch({ 
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox'] 
        });
        const page = await browser.newPage();

        await page.setRequestInterception(true);
        page.on('request', (request) => {
            const rType = request.resourceType();
            if (['font', 'stylesheet'].includes(rType)) {
                request.abort();
            } else {
                request.continue();
            }
        });

        const extractProducts = async (url: string, marketName: string) => {
            this.logger.log(`Tarayıcı bağlanıyor: ${marketName} -> ${url}`);
            try {
                await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
                await new Promise(resolve => setTimeout(resolve, 2500));
                
                const results = await page.evaluate((market) => {
                    const found = [];
                    // Daha hassas element taraması
                    const elements = document.querySelectorAll('li, div[class*="product"], div[class*="card"]');
                    
                    for(let el of elements) {
                        const text = el.textContent || '';
                        
                        // İçinde fiyat baremi içeren en temel kutuları seç
                        if ((text.includes('₺') || text.includes('TL')) && text.trim().length > 5) {
                            const img: any = el.querySelector('img');
                            const linkEl: any = el.querySelector('a') || (el.tagName === 'A' ? el : null);
                            const productUrl = linkEl ? linkEl.href : window.location.href;
                            
                            const priceMatch = text.match(/(\d+[.,]\d+)\s*(TL|₺)/i);
                            let cleanPrice = priceMatch ? parseFloat(priceMatch[1].replace(',','.')) : 0;

                            if(cleanPrice === 0) {
                                const altMatch = text.match(/(\d+)\s*(TL|₺)/i);
                                cleanPrice = altMatch ? parseFloat(altMatch[1]) : 0;
                            }

                                let imgSrc = '';
                                if(img) {
                                    imgSrc = img.getAttribute('data-src') || img.getAttribute('srcset') || img.src;
                                    // Bazı srcset'ler virgülle ayrılmış birden fazla link barındırır. Sadece ilk URL'yi al:
                                    if (imgSrc && imgSrc.includes(' ')) {
                                        imgSrc = imgSrc.split(' ')[0];
                                    }
                                }

                                // Görsel ve fiyat varsa bu bir üründür
                                if (cleanPrice > 0 && imgSrc && !imgSrc.includes('data:image')) {
                                    
                                    // Doğru ismi bulma çabası:
                                    let prodName = '';
                                    
                                    // Şok veya A101'de genellikle h2, h3 veya büyük bir Başlık classı/etiketi adı barındırır.
                                    const titleEl = el.querySelector('h2, h3, .name, .title, .product-name, [class*="title"], [class*="name"]');
                                    if (titleEl) {
                                        prodName = (titleEl.textContent || '').trim();
                                    }
                                    
                                    // Orijinal alt etiketi (Eğer product-thumb gibi jenerik değilse güven)
                                    if (!prodName || prodName.length < 4) {
                                        if (img.alt && img.alt !== 'product-thumb' && img.alt !== 'productImage' && img.alt.length > 3) {
                                            prodName = img.alt.trim();
                                        }
                                    }

                                    // Fallback: Sadece sayılar/TL harici ilk kelime blokları
                                    if (!prodName || prodName.length < 3) {
                                       let lines = text.split('\n').map(t => t.trim());
                                       for(let l of lines) {
                                           if(l.length > 5 && !l.includes('₺') && !l.includes('TL') && !l.includes('%')) {
                                               prodName = l;
                                               break;
                                           }
                                       }
                                    }
                                    
                                    if(!prodName || prodName === 'product-thumb') prodName = `${keyword} (Orijinal)`;

                                    prodName = prodName.replace(/[\n\r\t]/g, ' ').replace(/\s\s+/g, ' ').trim();

                                    // Sadece anahtar kelimeyi (örn: Süt) içeren mantıklı ürünleri al
                                    found.push({
                                        name: `[${market}] ${prodName}`,
                                        cleanName: prodName,
                                        price: cleanPrice,
                                        img: imgSrc,
                                        url: productUrl
                                    });
                                
                                // Çok fazla benzer/farklı boy ürün gelmesini engellemek için (en iyi 4 sonuç)
                                if (found.length >= 4) break;
                            }
                        }
                    }
                    return found;
                }, marketName);
                
                // Aynı isimde dönen tekrarları filtrele
                const uniqueResults = [];
                const seenNames = new Set();
                for (const r of results) {
                    if(!seenNames.has(r.name)) {
                        seenNames.add(r.name);
                        uniqueResults.push(r);
                    }
                }

                return uniqueResults;
            } catch (err) {
                this.logger.error(`Error scraping ${marketName}: ${err.message}`);
                return [];
            }
        };

        const sokResults = await extractProducts(`https://www.sokmarket.com.tr/arama?q=${encodeURIComponent(keyword)}`, "ŞOK");
        const a101Results = await extractProducts(`https://www.a101.com.tr/arama/?search_text=${encodeURIComponent(keyword)}`, "A101");
        
        let allExtracted = [];
        sokResults.forEach(r => allExtracted.push({ marketName: 'ŞOK', item: r }));
        a101Results.forEach(r => allExtracted.push({ marketName: 'A101', item: r }));

        await browser.close();

        if (allExtracted.length === 0) {
            return { success: false, error: 'Bulunamadı veya bot koruması aşılamadı.', products: [] };
        }

        const savedProducts = [];

        // Her bir farklı ürün için veritabanında ayrı "Product" kaydı açıyoruz
        // Böylece "Süt 1 Litre" ile "Süt 500ml" ayrı ürünler olarak arama sonucunda yer alıyor!
        for (const ext of allExtracted) {
            let market = await this.marketRepository.findOne({ where: { name: ext.marketName } });
            if (!market) market = await this.marketRepository.save(this.marketRepository.create({ name: ext.marketName, is_online_active: true }));
            
            // Ürün ismine göre ara (örn: ŞOK Mis Süt 1L)
            let productEntry = await this.productRepository.findOne({ where: { name: ext.item.cleanName } });
            
            if (!productEntry) {
                productEntry = await this.productRepository.save(this.productRepository.create({ 
                    name: ext.item.cleanName, 
                    barcode: 'REAL-' + Date.now().toString() + Math.floor(Math.random()*1000), 
                    image_url: ext.item.img,
                    category: keyword
                }));
            } else {
                 // Eğer ürün varsa ve eski resmi yoksa güncelle (eski görseli temizlemek için)
                 if(!productEntry.image_url || productEntry.image_url.includes('placeholder')) {
                     productEntry.image_url = ext.item.img;
                     await this.productRepository.save(productEntry);
                 }
            }
            
            await this.priceRepository.save(this.priceRepository.create({
                price: ext.item.price,
                product: productEntry,
                market: market,
                price_type: PriceType.ONLINE,
                deep_link_url: ext.item.url
            }));

            // Eklenenleri frontend'e döneceğimiz listeye at (tekrarsız olarak)
            if(!savedProducts.find(p => p.id === productEntry.id)) {
                // Günlük fiyatları yükle
                const prices = await this.priceRepository.find({
                    where: { product: { id: productEntry.id } },
                    relations: ['market']
                });
                savedProducts.push({ ...productEntry, priceOptions: prices });
            }
        }

        const finalResult = { 
            success: true, 
            message: `Gerçek piyasa verisi çekildi.`,
            products: savedProducts 
        };
        
        this.cache.set(keyword.toLowerCase(), { data: finalResult, timestamp: Date.now() });

        return finalResult;

    } catch (e) {
        if (browser) await browser.close();
        this.logger.error(`Puppeteer scrape failed!`, e);
        return { success: false, error: e.message };
    }
  }
}
