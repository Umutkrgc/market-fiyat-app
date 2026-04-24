import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Comment } from '../../models/comment.entity';
import { Product } from '../../models/product.entity';
import { User } from '../../models/user.entity';
import { CommentsService } from './comments.service';
import { CommentsController } from './comments.controller';

@Module({
    imports: [TypeOrmModule.forFeature([Comment, Product, User])],
    providers: [CommentsService],
    controllers: [CommentsController]
})
export class CommentsModule {}
