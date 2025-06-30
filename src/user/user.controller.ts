import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, HttpStatus, BadRequestException, UseGuards, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { createUserSchema, updateUserSchema } from '@/schemas';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Users')
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @ApiOperation({ summary: 'Create a new user' })
  @ApiBody({ 
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string' },
        password: { type: 'string' },
        name: { type: 'string' }
      },
      required: ['email', 'password', 'name']
    }
  })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 409, description: 'User already exists' })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() body: unknown) {
    try {
      const result = createUserSchema.safeParse(body);
      
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

  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({ status: 200, description: 'Returns all users' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
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

  @ApiOperation({ summary: 'Get user by ID' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'Returns user details' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
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
  
  @ApiOperation({ summary: 'Update user' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiBody({ 
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', minLength: 2, description: 'Name must be at least 2 characters', nullable: true },
        email: { type: 'string', format: 'email', description: 'Valid email address', nullable: true },
        password: { type: 'string', minLength: 6, description: 'Password must be at least 6 characters', nullable: true },
        phoneNumber: { type: 'string', nullable: true },
        image: { type: 'string', nullable: true }
        // Address property removed
      }
    }
  })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: unknown)  {
    const result = updateUserSchema.safeParse(body);
    
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

  @ApiOperation({ summary: 'Delete user' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 400, description: 'User has related records' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiBearerAuth()
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
      Logger.log(error);
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2003') {
          throw new BadRequestException({
            success: false,
            message: 'Failed to delete user',
            error: 'User has associated records in other tables and cannot be deleted'
          })
        }
      }
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

  @ApiOperation({ summary: 'Update role' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiBody({ 
    schema: {
      type: 'object',
      properties: {
        role: { type: 'string', enum: ['CUSTOMER', 'ADMIN', 'SELLER'], description: 'Role must be either CUSTOMER, SELLER or ADMIN' }
      },
      required: ['role']
    }
  })
  @ApiResponse({ status: 200, description: 'Role updated successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Patch(':id/role')
  async updateRole(@Param('id') id: string, @Body() body: { role: string }) {
    const { role } = body;

    const allowedRoles = ['CUSTOMER', 'ADMIN', 'SELLER'];
    if (!role || !allowedRoles.includes(role)) {
      throw new BadRequestException({
        success: false,
        message: 'Invalid role. Must be either CUSTOMER, SELLER or ADMIN.'
      });
    }

    try {
      const updatedUser = await this.userService.updateRole(id, role as 'CUSTOMER' | 'SELLER' | 'ADMIN');
      return {
        success: true,
        message: 'Role updated successfully',
        data: updatedUser
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException({
        success: false,
        message: 'Failed to update role',
        error: error.message
      });
    }
  }

  @ApiOperation({ summary: 'Verify email' })
  @ApiParam({ name: 'userId', description: 'User id' })
  @ApiResponse({ status: 200, description: 'Email verified successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 409, description: 'Email is already verified' })
  @ApiResponse({ status: 400, description: 'Failed to verify email' })
  @Patch(':userId/verify')
  async verifyEmail(@Param('userId') userId: string) {
    try {
      const verifiedUser = await this.userService.verifyEmail(userId);
      return {
        success: true,
        message: 'Email verified successfully',
        data: verifiedUser
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      if (error instanceof ConflictException) {
        throw new ConflictException({
          success: false,
          message: error.message
        });
      }
      throw new BadRequestException({
        success: false,
        message: 'Failed to verify email',
        error: error.message
      });
    }
  }
}
