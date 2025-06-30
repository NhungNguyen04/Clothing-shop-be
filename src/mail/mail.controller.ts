import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { sendVerificationEmail, sendPasswordResetEmail } from './mail.service';

import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';

class SendMailDto {
  @ApiProperty({ example: 'user@example.com', description: 'User email address' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'some-verification-token', description: 'Verification or reset token' })
  @IsString()
  token: string;
}

@ApiTags('mail')
@Controller('mail')
export class MailController {
  @Post('send-verification')
  @ApiOperation({ summary: 'Send verification email' })
  @ApiBody({ type: SendMailDto })
  @ApiResponse({ status: 201, description: 'Verification email sent' })
  async sendVerificationMail(@Body() body: SendMailDto) {
    const { email, token } = body;
    const res = await sendVerificationEmail(email, token);
    console.log("Email response:", res);
    if (!res.ok) {
      return { success: false, message: res || 'Failed to send verification email'}
    }
    return { success: true, message: 'Verification email sent' };
  }

  @Post('send-password-reset')
  @ApiOperation({ summary: 'Send password reset email' })
  @ApiBody({ type: SendMailDto })
  @ApiResponse({ status: 201, description: 'Password reset email sent' })
  async sendPasswordResetMail(@Body() body: SendMailDto) {
    const { email, token } = body;
    const res = await sendPasswordResetEmail(email, token);
    console.log("Email response:", res);
    if (!res.ok) {
      return { success: false, message: res || 'Failed to send password reset email'}
    }
    return { success: true, message: 'Password reset email sent' };
  }
}
