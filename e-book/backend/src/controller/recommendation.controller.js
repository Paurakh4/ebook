import { getRecommendationsService } from '../service/recommendation.service.js';
import successResponse from '../utils/success.response.js';
import { AppError } from '../utils/error.js';

/**
 * Get recommendations for a specific book
 */
export const getBookRecommendations = async (req, res, next) => {
    try {
        const { bookId } = req.params;
        const appLimit = parseInt(req.query.appLimit) || 4;  // app books (readable)
        const csvLimit = parseInt(req.query.csvLimit) || 6;  // CSV discovery books

        if (!bookId) {
            throw new AppError('Book ID is required', 400);
        }

        const recommendations = await getRecommendationsService(bookId, appLimit, csvLimit);

        successResponse({
            success: true,
            data: recommendations
        }, res);
    } catch (error) {
        next(error);
    }
};
