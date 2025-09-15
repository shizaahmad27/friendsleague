import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { CreateUserDto, UpdateUserDto } from './dto';
import { User } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

// fjern passord feltet fra user typen
type UserWithoutPassword = Omit<User, 'password'>;

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto): Promise<UserWithoutPassword> {
    const { username, email, phoneNumber, password } = createUserDto;

    // Check if user already exists
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [
          { username },
          ...(email ? [{ email }] : []),
          ...(phoneNumber ? [{ phoneNumber }] : []),
        ],
      },
    });

    if (existingUser) {
      if (existingUser.username === username) {
        throw new ConflictException('Username already exists');
      }
      if (existingUser.email === email) {
        throw new ConflictException('Email already exists');
      }
      if (existingUser.phoneNumber === phoneNumber) {
        throw new ConflictException('Phone number already exists');
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        username,
        email,
        phoneNumber,
        password: hashedPassword,
      },
    });

    // Return user without password (... for å sre feltene ut, inneholder automatisk alle felt)
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { username },
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async findById(id: string): Promise<UserWithoutPassword | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });
    
    if (!user) return null;
    
    // Return user without password
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<UserWithoutPassword> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: updateUserDto,
    });

    // Return user without password
    const { password: _, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword;
  }

  async updateOnlineStatus(id: string, isOnline: boolean): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: {
        isOnline,
        lastSeen: new Date(),
      },
    });
  }

  async validatePassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  async searchUsers(username: string): Promise<UserWithoutPassword[]> {
    const users = await this.prisma.user.findMany({
      where: {
        username: {
          contains: username,
          mode: 'insensitive',
        },
      },
      select: {
        id: true,
        username: true,
        email: true,
        phoneNumber: true,
        avatar: true,
        isOnline: true,
        lastSeen: true,
        createdAt: true,
        updatedAt: true,
        // Exclude password field
      },
      take: 10, // Limit to 10 results
      orderBy: {
        username: 'asc',
      },
    });

    return users;
  }
}
