import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../../users/services/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { LoginDto } from '../dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(identifier: string, pass: string): Promise<any> {
    const user = await this.usersService.findByIdentifier(identifier);
    
    if (user && (await bcrypt.compare(pass, user.passwordHash))) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { passwordHash, ...result } = user;
      return result;
    }
    
    return null;
  }

  // ATUALIZADO: Agora retorna o nome completo para o novo layout de login
  async checkUserExistence(identifier: string) {
    const user = await this.usersService.findByIdentifier(identifier);
    
    if (!user) {
      return { exists: false };
    }

    return { 
      exists: true,
      name: user.name, // <--- Alterado de user.name.split(' ')[0] para user.name
      email: user.email
    };
  }

  async login(loginDto: LoginDto) {
    const identifier = (loginDto as any).identifier || loginDto.email;
    
    const user = await this.validateUser(identifier, loginDto.password);
    
    if (!user) {
      throw new UnauthorizedException('Credenciais incorretas.');
    }

    const payload = { 
      email: user.email, 
      sub: user.id, 
      roles: user.roles 
    };

    return {
      access_token: this.jwtService.sign(payload),
      user,
    };
  }
}