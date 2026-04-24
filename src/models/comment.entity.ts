import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';
import { Product } from './product.entity';

@Entity()
export class Comment {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column('text')
    content: string;

    @Column('int', { default: 5 })
    rating: number; // 1 ile 5 arası

    @ManyToOne(() => User, (user) => user.comments, { eager: false })
    @JoinColumn({ name: 'user_id' })
    user: User;

    @ManyToOne(() => Product)
    @JoinColumn({ name: 'product_id' })
    product: Product;

    @CreateDateColumn()
    created_at: Date;
}
