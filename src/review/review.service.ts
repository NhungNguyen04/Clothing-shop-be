import { prisma } from '@/prisma/prisma';
import { CreateReviewInput } from '@/schemas';
import { Injectable } from '@nestjs/common';
import { Review } from '@prisma/client';

@Injectable()
export class ReviewService {
    async create(createReviewDto : CreateReviewInput){
        const newReview = prisma.review.create(
            {
                data: {
                    ...createReviewDto,
                },
                include: {
                    user: true
                }
            }
        )
        return newReview;
    }
    async findAll(productId: string){
        const reviews = await prisma.review.findMany({
            where: {
                productId: productId
            },
            include: {
                user: {
                    select: {
                        image: true,
                        name: true,
                    }
                }
            }
        })
        return reviews;
    }
    async findBySellerId(sellerId: string, page: number = 1, limit: number = 10) {
        const reviews = await prisma.review.findMany({
            where: {
                product: {
                    sellerId: sellerId
                }
            },
            include: {
                user: {
                    select: {
                        name: true,
                    },
                },
                product: {
                    select: {
                        name: true,
                    }
                }
            },
            ...(limit > 0 ? { skip: (page - 1) * limit, take: limit } : {})
        });
        return reviews;
    }
}
