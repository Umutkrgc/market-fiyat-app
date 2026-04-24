import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../../models/product.entity';
import { Price, PriceType } from '../../models/price.entity';
import { Market } from '../../models/market.entity';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(Price)
    private readonly priceRepo: Repository<Price>,
    @InjectRepository(Market)
    private readonly marketRepo: Repository<Market>,
  ) {}

  async findAllProducts() {
    // Eski dummy (placeholder) sahte verileri temizle ki kullanıcı sadece gerçek Puppeteer verilerini görsün
    const dummies = await this.productRepo.find({ where: { image_url: 'https://via.placeholder.com/150' } });
    if (dummies.length > 0) {
        for (const d of dummies) {
            // İlgili fiyatları sil
            await this.priceRepo.delete({ product: { id: d.id } });
            await this.productRepo.delete(d.id);
        }
    }

    const products = await this.productRepo.find();
    const result = [];
    
    for (const prod of products) {
       // Placeholder resimli eski randomLIVE verilerini de temizle
       if(!prod.image_url || prod.image_url.includes('via.placeholder') || prod.image_url.includes('?text=')) continue;

       const prices = await this.priceRepo.find({
           where: { product: { id: prod.id } },
           relations: ['market']
       });
       result.push({ ...prod, priceOptions: prices });
    }
    
    return result;
  }

  async seedDummyData() {
     return { success: false, message: 'Dummy data generation disabled to enforce Real Puppeteer Data.' };
  }


}
