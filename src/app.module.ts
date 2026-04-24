import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ScraperModule } from './api/scraper/scraper.module';
import { LoggerModule } from './logger/logger.module';
import { ProductsModule } from './api/products/products.module';
import { AuthModule } from './api/auth/auth.module';
import { CommentsModule } from './api/comments/comments.module';

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        ServeStaticModule.forRoot({
            rootPath: join(__dirname, '..', 'public'), // Serve front-end from /public
        }),
        TypeOrmModule.forRoot({
            type: 'sqlite',
            database: process.env.DB_NAME || 'market.db',
            entities: [__dirname + '/**/*.entity{.ts,.js}'],
            synchronize: true, // Auto-create tables (dev only)
        }),
        ScraperModule,
        LoggerModule,
        ProductsModule,
        AuthModule,
        CommentsModule,
    ],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule { }
