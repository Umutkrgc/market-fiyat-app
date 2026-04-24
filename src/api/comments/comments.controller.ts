import { Controller, Get, Post, Param, Body, UseGuards, Request } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { JwtAuthGuard } from '../auth/jwt.guard';

@Controller('comments')
export class CommentsController {
    constructor(private readonly dictService: CommentsService) {}

    // Get comments for a product (Accessible by public)
    @Get('product/:id')
    async getProductComments(@Param('id') productId: string) {
        const comments = await this.dictService.getCommentsForProduct(productId);
        // Omit password hashes
        return comments.map(c => ({
            id: c.id,
            content: c.content,
            rating: c.rating,
            created_at: c.created_at,
            user: c.user ? c.user.email.split('@')[0] : 'Anonim'
        }));
    }

    // Add a comment (Requires login)
    @UseGuards(JwtAuthGuard)
    @Post('product/:id')
    async addComment(
        @Param('id') productId: string,
        @Body() body: { content: string; rating: number },
        @Request() req
    ) {
        const userId = req.user.sub;
        return await this.dictService.addComment(userId, productId, body.content, body.rating);
    }
}
