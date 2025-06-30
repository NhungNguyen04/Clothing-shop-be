import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { 
  getVerificationTokenByToken, 
  getPasswordResetTokenByToken, 
  generateVerificationToken, 
  generatePasswordResetToken, 
  getVerificationTokenByEmail,
  getPasswordResetTokenByEmail
} from './token.service';
import { ApiTags, ApiOperation, ApiParam, ApiBody, ApiResponse, ApiQuery } from '@nestjs/swagger';

@ApiTags('token')
@Controller('token')
export class TokenController {
  @ApiOperation({ summary: 'Get verification token by token' })
  @ApiParam({ name: 'token', type: String })
  @ApiResponse({ status: 200, description: 'Verification token found' })
  @Get('verification/:token')
  async getVerificationTokenByToken(@Param('token') token: string) {
    const verificationToken = await getVerificationTokenByToken(token);
    return verificationToken;
  }

  @ApiOperation({ summary: 'Get verification token by email' })
  @ApiResponse({ status: 200, description: 'Verification token found' })
  @ApiQuery({ name: 'email', type: String })
  @Get('verification/email')
  async getVerificationTokenByEmail(
    @Query('email') email: string,
  ) {
    const verificationToken = await getVerificationTokenByEmail(email);
    return verificationToken;
  }

  @ApiOperation({ summary: 'Create verification token' })
  @ApiBody({ schema: { properties: { email: { type: 'string' } } } })
  @ApiResponse({ status: 201, description: 'Verification token created' })
  @Post('verification')
  async createVerificationToken(@Body() body: { email: string }) {
    const { email } = body;
    const token = await generateVerificationToken(email);
    return token;
  }

  @ApiOperation({ summary: 'Get reset token by token' })
  @ApiParam({ name: 'token', type: String })
  @ApiResponse({ status: 200, description: 'Verification token found' })
  @Get('reset/:token')
  async getResetTokenByToken(@Param('token') token: string) {
    const verificationToken = await getPasswordResetTokenByToken(token);
    return verificationToken;
  }

  @ApiOperation({ summary: 'Get reset token by email' })
  @ApiResponse({ status: 200, description: 'Verification token found' })
  @ApiQuery({ name: 'email', type: String })
  @Get('reset/email')
  async getResetTokenByEmail(
    @Query('email') email: string,
  ) {
    const verificationToken = await getPasswordResetTokenByEmail(email);
    return verificationToken;
  }

  @ApiOperation({ summary: 'Create password reset token' })
  @ApiBody({ schema: { properties: { email: { type: 'string' } } } })
  @ApiResponse({ status: 201, description: 'Password reset token created' })
  @Post('reset')
  async createPasswordResetToken(@Body() body: { email: string }) {
    const { email } = body;
    const token = await generatePasswordResetToken(email);
    return token;
  }
}
