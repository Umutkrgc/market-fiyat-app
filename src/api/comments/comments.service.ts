import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from '../../models/comment.entity';
import { Product } from '../../models/product.entity';
import { User } from '../../models/user.entity';

@Injectable()
export class CommentsService {
    constructor(
        @InjectRepository(Comment) private commentRepo: Repository<Comment>,
        @InjectRepository(Product) private productRepo: Repository<Product>,
        @InjectRepository(User) private userRepo: Repository<User>,
    ) {}

    async getCommentsForProduct(productId: string) {
        return await this.commentRepo.find({
            where: { product: { id: productId } },
            relations: ['user'],
            order: { created_at: 'DESC' }
        });
    }

    async addComment(userId: string, productId: string, content: string, rating: number) {
        const user = await this.userRepo.findOne({ where: { id: userId } });
        const product = await this.productRepo.findOne({ where: { id: productId } });
        
        if (!user || !product) {
            throw new NotFoundException('Kullanıcı veya ürün bulunamadı.');
        }

        const comment = this.commentRepo.create({
            content,
            rating,
            user,
            product
        });

        await this.commentRepo.save(comment);
        return { success: true, comment };
    }
}
