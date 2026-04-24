import { Controller, Get, Post, Query } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ScraperService } from '../scraper/scraper.service';

@Controller('products')
export class ProductsController {
  constructor(
      private readonly productsService: ProductsService,
      private readonly scraperService: ScraperService
  ) {}

  @Get()
  async getProducts() {
    return await this.productsService.findAllProducts();
  }

  @Post('seed')
  async seedData() {
    return await this.productsService.seedDummyData();
  }

  @Get('search-live')
  async searchLive(@Query('q') query: string) {
    if (!query) return { success: false, error: 'Query required' };
    return await this.scraperService.searchProductAcrossMarkets(query);
  }
}
