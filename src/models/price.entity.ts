import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn } from 'typeorm';
import { Product } from './product.entity';
import { Market } from './market.entity';

export enum PriceType {
    ONLINE = 'ONLINE',
    SHELF = 'SHELF',
    CATALOG = 'CATALOG',
}

@Entity()
export class Price {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column('float')
    price: number;

    @Column('float', { nullable: true })
    old_price: number; // For discount tracking

    @Column({
        type: 'text', // sqlite supports text for enums usually, or simple varchar
        default: PriceType.ONLINE
    })
    price_type: PriceType;

    @ManyToOne(() => Product, { eager: true })
    product: Product;

    @ManyToOne(() => Market, (market) => market.prices, { eager: true })
    market: Market;

    @Column({ nullable: true })
    branch_id: string; // ID of the specific branch if SHELF price

    @Column({ nullable: true })
    user_id: string; // ID of the user who added this price (if crowdsourced)

    @Column({ default: false })
    verified_by_user: boolean;

    @Column({ nullable: true })
    deep_link_url: string; // specific link to product page

    @CreateDateColumn()
    last_checked_at: Date;
}
