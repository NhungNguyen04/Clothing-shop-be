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
}
