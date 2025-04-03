import { CreateReviewInput, createReviewSchema } from '@/schemas';
import { ReviewService } from '@/src/review/review.service';
import { Controller, Post, Body, Get, Param, Query } from '@nestjs/common';
import { Review } from '@prisma/client';

@Controller('reviews')
export class ReviewController {
    constructor(private readonly reviewService: ReviewService) {}

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
}
