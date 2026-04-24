import { Controller, Get, Query } from '@nestjs/common';
import { ScraperService } from './scraper.service';

@Controller('scraper')
export class ScraperController {
  constructor(private readonly scraperService: ScraperService) {}

  @Get('test-migros')
  async testMigrosScraper(@Query('url') url: string) {
    if (!url) {
      return { error: 'Please provide a Migros product URL. Example: ?url=https://www.migros.com.tr/...' };
    }
    return await this.scraperService.scrapeMigrosProduct(url);
  }
}
