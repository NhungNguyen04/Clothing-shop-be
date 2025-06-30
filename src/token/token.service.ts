import { prisma } from '@/prisma/prisma';
import {v4 as uuidv4} from 'uuid';

export const getPasswordResetTokenByToken = async (token: string) => {
  try {
    const passwordResetToken = await prisma.passwordResetToken.findUnique({
      where: {
        token
      }
    })

    return passwordResetToken;
  } catch {
    return null;
  }
}

export const getPasswordResetTokenByEmail = async (email: string) => {
  try {
    const passwordResetToken = await prisma.passwordResetToken.findFirst({
      where: {
        email
      }
    })

    return passwordResetToken;
  } catch {
    return null;
  }
} 

export const getVerificationTokenByToken = async (token: string) => {
  try {
    const verificationToken = await prisma.verificationToken.findUnique({
      where: {token}
    });
    return verificationToken;
  } catch {
    return null;
  }
}

export const getVerificationTokenByEmail = async (email: string) => {
  try {
    const verificationToken = await prisma.verificationToken.findFirst({
      where: {email}
    });
    return verificationToken;
  } catch {
    return null;
  }
}

export const generateVerificationToken = async (email: string) => {
  const token = uuidv4();
  const expires = new Date(new Date().getTime() + 3600 * 1000);

  const existingToken = await getVerificationTokenByEmail(email);

  if (existingToken) {
    await prisma.verificationToken.delete({
      where: {id: existingToken.id}
    })
  }

  const verificationToken = await prisma.verificationToken.create({
    data: {
      email,
      token,
      expires
    }
  });

  return verificationToken;
}

export const generatePasswordResetToken = async (email: string) => {
  const token = uuidv4();
  const expires = new Date(new Date().getTime() + 3600 * 1000);

  const existingToken = await getPasswordResetTokenByEmail(email);

  if (existingToken) {
    await prisma.passwordResetToken.delete({
      where: {id: existingToken.id}
    })
  }

  const passwordResetToken = await prisma.passwordResetToken.create({
    data: {
      email,
      token,
      expires
    }
  });

  return passwordResetToken;
}