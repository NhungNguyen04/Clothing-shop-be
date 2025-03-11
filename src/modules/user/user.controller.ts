import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, HttpStatus, BadRequestException, UseGuards, NotFoundException, ConflictException } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/createUser';
import { UpdateUserDto } from './dto/updateUser';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() body: unknown) {
    try {
      const result = CreateUserDto.validate(body);
      
      if (!result.success) {
        throw new BadRequestException(result.error.format());
      }
      
      const newUser = await this.userService.create(result.data);
      
      return {
        success: true,
        message: 'User created successfully',
        data: newUser
      };
    } catch (error) {
      if (error instanceof ConflictException) {
        throw new ConflictException({
          success: false,
          message: error.message,
        });
      }
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException({
        success: false,
        message: 'Failed to create user',
        error: error.message
      });
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async findAll() {
    try {
      const users = await this.userService.findAll();
      return {
        success: true,
        message: 'Users retrieved successfully',
        data: users
      };
    } catch (error) {
      throw new BadRequestException({
        success: false,
        message: 'Failed to retrieve users',
        error: error.message
      });
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      const user = await this.userService.findOne(id);
      return {
        success: true,
        message: 'User retrieved successfully',
        data: user
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException({
        success: false,
        message: 'Failed to retrieve user',
        error: error.message
      });
    }
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: unknown) {
    const result = UpdateUserDto.validate(body);
    
    if (!result.success) {
      throw new BadRequestException(result.error.format());
    }
    
    try {
      const updatedUser = await this.userService.update(id, result.data);
      return {
        success: true,
        message: 'User updated successfully',
        data: updatedUser
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException({
        success: false,
        message: 'Failed to update user',
        error: error.message
      });
    }
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string) {
    try {
      const deletedUser = await this.userService.remove(id);
      return {
        success: true,
        message: 'User deleted successfully',
        data: deletedUser
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException({
        success: false,
        message: 'Failed to delete user',
        error: error.message
      });
    }
  }
}
