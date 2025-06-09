import { CreateReviewInput, createReviewSchema } from '@/schemas';
import { ReviewService } from '@/src/review/review.service';
import { Controller, Post, Body, Get, Param, Query, Patch, Delete } from '@nestjs/common';
import { Review } from '@prisma/client';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiQuery } from '@nestjs/swagger';

@ApiTags('Reviews')
@Controller('reviews')
export class ReviewController {
    constructor(private readonly reviewService: ReviewService) {}

    @ApiOperation({ summary: 'Create a new review' })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                userId: { type: 'string', example: 'user-uuid' },
                productId: { type: 'string', example: 'product-uuid' },
                rating: { type: 'number', example: 4.5 },
                comment: { type: 'string', example: 'Great product, very satisfied!' }
            },
            required: ['userId', 'productId', 'rating']
        }
    })
    @ApiResponse({ status: 201, description: 'Review created successfully' })
    @ApiResponse({ status: 400, description: 'Validation failed' })
    @Post()
    async create(@Body() createReviewDto: CreateReviewInput){
        try {
            createReviewDto.rating = Number(createReviewDto.rating);
            const validationResult = createReviewSchema.safeParse(createReviewDto);
            if (!validationResult.success) {
                return {
                    success: false,
                    message: 'Validation failed',
                    error: validationResult.error.format(),
                    data: null
                }
            }
            const result = await this.reviewService.create(validationResult.data);
            return {
                success: true,
                message: 'Review created successfully',
                error: null,
                data: result
            }
        } catch (error) {
            return {
                success: false,
                message: error.message || 'Failed to process request',
                error: error.response?.error || error.name,
                data: null
                };
        }
    }

    @ApiOperation({ summary: 'Get reviews by product ID' })
    @ApiParam({ name: 'productId', description: 'Product ID' })
    @ApiResponse({ status: 200, description: 'Returns product reviews' })
    @Get('/:productId')
    async findAll(@Param('productId') productId: string){
        try {
            const result = await this.reviewService.findAll(productId);
            return {
                success: true,
                message: 'Reviews fetched successfully',
                error: null,
                data: result
            }
        } catch (error) {
            return {
                success: false,
                message: error.message || 'Failed to fetch reviews',
                error: error.response?.error || error.name,
                data: null
            }
        }
    }

    @ApiOperation({ summary: 'Get reviews by seller ID' })
    @ApiParam({ name: 'sellerId', description: 'Seller ID' })
    @ApiQuery({ name: 'page', required: false, description: 'Page number' })
    @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
    @ApiResponse({ status: 200, description: 'Returns seller reviews' })
    @Get('/seller/:sellerId')
    async findBySellerId(@Param('sellerId') sellerId: string, @Query('page') page: string = '0', @Query('limit') limit: string = '0') {
        try {
            const pageNumber = parseInt(page, 10);
            const limitNumber = parseInt(limit, 10);
            const result = await this.reviewService.findBySellerId(sellerId, pageNumber, limitNumber);
            return {
                success: true,
                message: 'Reviews fetched successfully for seller',
                error: null,
                data: result
            }
        } catch (error) {
            return {
                success: false,
                message: error.message || 'Failed to fetch reviews for seller',
                error: error.response?.error || error.name,
                data: null
            }
        }
    }

    @ApiOperation({ summary: 'Update a review' })
    @ApiParam({ name: 'reviewId', description: 'Review ID' })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                rating: { type: 'number', example: 5 },
                comment: { type: 'string', example: 'Updated comment' },
                images: { type: 'array', items: { type: 'string' }, example: ['image1.jpg', 'image2.jpg'] }
            }
        }
    })
    @ApiResponse({ status: 200, description: 'Review updated successfully' })
    @ApiResponse({ status: 400, description: 'Validation failed' })
    @Patch('/:reviewId')
    async update(@Param('reviewId') reviewId: string, @Body() updateReviewDto: Partial<CreateReviewInput>) {
        try {
            const validationResult = createReviewSchema.partial().safeParse(updateReviewDto);
            if (!validationResult.success) {
                return {
                    success: false,
                    message: 'Validation failed',
                    error: validationResult.error.format(),
                    data: null
                }
            }
            const result = await this.reviewService.update(reviewId, validationResult.data);
            return {
                success: true,
                message: 'Review updated successfully',
                error: null,
                data: result
            }
        } catch (error) {
            return {
                success: false,
                message: error.message || 'Failed to update review',
                error: error.response?.error || error.name,
                data: null
            }
        }
    }

    @ApiOperation({ summary: 'Delete a review' })
    @ApiParam({ name: 'reviewId', description: 'Review ID' })
    @ApiResponse({ status: 200, description: 'Review deleted successfully' })
    @ApiResponse({ status: 404, description: 'Review not found' })
    @Delete('/:reviewId')
    async delete(@Param('reviewId') reviewId: string) {
        try {
            const result = await this.reviewService.delete(reviewId);
            return {
                success: true,
                message: 'Review deleted successfully',
                error: null,
                data: result
            }
        } catch (error) {
            return {
                success: false,
                message: error.message || 'Failed to delete review',
                error: error.response?.error || error.name,
                data: null
            }
        }
    }
}
