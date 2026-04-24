import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from '../../models/user.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private jwtService: JwtService
  ) {}

  async register(email: string, pass: string) {
    const existing = await this.usersRepository.findOne({ where: { email } });
    if (existing) {
      throw new BadRequestException('Bu email adresi ile zaten kayıtlı bir kullanıcı var.');
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(pass, salt);

    const newUser = this.usersRepository.create({
      email,
      password_hash: hash,
      role: 'user'
    });

    await this.usersRepository.save(newUser);
    return { success: true, message: 'Kayıt başarılı! Giriş yapabilirsiniz.' };
  }

  async login(email: string, pass: string) {
    const user = await this.usersRepository.findOne({ where: { email } });
    if (!user) {
      throw new UnauthorizedException('Kullanıcı bulunamadı.');
    }

    const isMatch = await bcrypt.compare(pass, user.password_hash);
    if (!isMatch) {
      throw new UnauthorizedException('Hatalı şifre.');
    }

    const payload = { sub: user.id, username: user.email, role: user.role };
    return {
      access_token: await this.jwtService.signAsync(payload),
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      }
    };
  }
}
