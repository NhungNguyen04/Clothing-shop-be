import { prisma } from '@/prisma/prisma';
import { CreateReviewInput } from '@/schemas';
import { Injectable } from '@nestjs/common';
import { Review } from '@prisma/client';

@Injectable()
export class ReviewService {
    async create(createReviewDto : CreateReviewInput){
        const newReview = await prisma.review.create(
            {
                data: {
                    ...createReviewDto,
                },
                include: {
                    user: true
                }
            }
        );
        
        // Update product statistics directly after creating a review
        try {
            console.log(`Updating review stats for product: ${newReview.productId}`);
            
            const reviewCount = await prisma.review.count({
                where: { productId: newReview.productId }
            });
            
            let averageRating = 0;
            if (reviewCount > 0) {
                const aggregateResult = await prisma.review.aggregate({
                    where: { productId: newReview.productId },
                    _avg: { rating: true },
                });
                
                averageRating = aggregateResult._avg.rating || 0;
            }
            
            const roundedRating = parseFloat(averageRating.toFixed(2));
            console.log(`Product ${newReview.productId} - New stats: Count=${reviewCount}, Avg Rating=${roundedRating}`);
            
            await prisma.product.update({
                where: { id: newReview.productId },
                data: {
                    reviews: reviewCount,
                    averageRating: roundedRating
                }
            });
            
            console.log(`Product ${newReview.productId} statistics updated successfully`);
        } catch (error) {
            console.error('Error updating product review stats:', error);
        }
        
        return newReview;
    }
    
    async update(id: string, updateReviewDto: Partial<CreateReviewInput>) {
        const updatedReview = await prisma.review.update({
            where: { id },
            data: updateReviewDto,
            include: {
                user: true
            }
        });
        
        // Update product statistics directly after updating a review
        try {
            console.log(`Updating review stats for product: ${updatedReview.productId}`);
            
            const reviewCount = await prisma.review.count({
                where: { productId: updatedReview.productId }
            });
            
            let averageRating = 0;
            if (reviewCount > 0) {
                const aggregateResult = await prisma.review.aggregate({
                    where: { productId: updatedReview.productId },
                    _avg: { rating: true },
                });
                
                averageRating = aggregateResult._avg.rating || 0;
            }
            
            const roundedRating = parseFloat(averageRating.toFixed(2));
            console.log(`Product ${updatedReview.productId} - New stats: Count=${reviewCount}, Avg Rating=${roundedRating}`);
            
            await prisma.product.update({
                where: { id: updatedReview.productId },
                data: {
                    reviews: reviewCount,
                    averageRating: roundedRating
                }
            });
            
            console.log(`Product ${updatedReview.productId} statistics updated successfully`);
        } catch (error) {
            console.error('Error updating product review stats:', error);
        }
        
        return updatedReview;
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
    
    async delete(id: string) {
        // First, get the review to know which product to update
        const review = await prisma.review.findUnique({
            where: { id },
            select: { productId: true }
        });
        
        if (!review) {
            throw new Error('Review not found');
        }
        
        // Delete the review
        await prisma.review.delete({
            where: { id }
        });
        
        // Update product statistics directly after deleting a review
        try {
            console.log(`Updating review stats for product: ${review.productId}`);
            
            const reviewCount = await prisma.review.count({
                where: { productId: review.productId }
            });
            
            let averageRating = 0;
            if (reviewCount > 0) {
                const aggregateResult = await prisma.review.aggregate({
                    where: { productId: review.productId },
                    _avg: { rating: true },
                });
                
                averageRating = aggregateResult._avg.rating || 0;
            }
            
            const roundedRating = parseFloat(averageRating.toFixed(2));
            console.log(`Product ${review.productId} - New stats: Count=${reviewCount}, Avg Rating=${roundedRating}`);
            
            await prisma.product.update({
                where: { id: review.productId },
                data: {
                    reviews: reviewCount,
                    averageRating: roundedRating
                }
            });
            
            console.log(`Product ${review.productId} statistics updated successfully`);
        } catch (error) {
            console.error('Error updating product review stats:', error);
        }
        
        return { success: true };
    }
}
