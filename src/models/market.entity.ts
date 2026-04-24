import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { Price } from './price.entity';

@Entity()
export class Market {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column({ nullable: true })
    logo: string;

    @Column({ default: false })
    is_online_active: boolean;

    @Column({ nullable: true })
    website_url: string;

    @Column({ nullable: true })
    app_scheme: string; // e.g., 'migros://'

    @OneToMany(() => Price, (price) => price.market)
    prices: Price[];
}
