import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class TokenLoggerService {
  private readonly logger = new Logger(TokenLoggerService.name);
  
  // admin_logs klasörü proje kök dizininde oluşturulacak
  private readonly logDirectory = path.join(process.cwd(), 'admin_logs');
  private readonly logFilePath = path.join(this.logDirectory, 'token_usage.log');

  constructor() {
    this.ensureLogDirectoryExists();
  }

  private ensureLogDirectoryExists() {
    if (!fs.existsSync(this.logDirectory)) {
      // Sadece klasörü oluşturmakla kalmıyor, erişim yetkilerini de sadece
      // sahibi (uygulamayı çalıştıran kullanıcı/admin) okuyup yazabilecek şekilde kısıtlıyoruz (0o700)
      // * Not: Windows üzerinde chmod her zaman beklenen etkiyi göstermeyebilir, 
      // ancak Linux ortamında tam admin-only izolasyonu sağlar.
      fs.mkdirSync(this.logDirectory, { recursive: true, mode: 0o700 });
      this.logger.log(`Created admin-only log directory at: ${this.logDirectory}`);
    }
  }

  /**
   * Hangi işlem için ne kadar token kullanıldığını loglar.
   * @param operation İşlemin adı (örn: 'receipt_ocr', 'product_summary_ai')
   * @param tokenCount Kullanılan token miktarı
   * @param extraInfo Ek detaylar (örn: işlemi yapan userID, prompt bilgisi vb.)
   */
  logUsage(operation: string, tokenCount: number, extraInfo?: any) {
    const timestamp = new Date().toISOString();
    const extraInfoStr = extraInfo ? ` | Details: ${JSON.stringify(extraInfo)}` : '';
    const logMessage = `[${timestamp}] Operation: ${operation} | Tokens Used: ${tokenCount}${extraInfoStr}\n`;

    try {
      fs.appendFileSync(this.logFilePath, logMessage, 'utf8');
      // Sadece konsola kısa bir bilgi verelim, admin paneli loglanamayan detayları içermesin
      this.logger.debug(`Operation '${operation}' used ${tokenCount} tokens. Logged securely.`);
    } catch (error: any) {
      this.logger.error(`Failed to securely write token log: ${error.message}`);
    }
  }
}
