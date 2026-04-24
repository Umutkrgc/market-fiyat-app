import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { Product } from '../../models/product.entity';
import { Price } from '../../models/price.entity';
import { Market } from '../../models/market.entity';
import { ScraperModule } from '../scraper/scraper.module';

@Module({
  imports: [TypeOrmModule.forFeature([Product, Price, Market]), ScraperModule],
  controllers: [ProductsController],
  providers: [ProductsService],
})
export class ProductsModule {}
