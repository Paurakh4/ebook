import apiClient from './apiClient';

export interface RecommendedBook {
    _id: string;
    title: string;
    author: string;
    genre?: string;
    coverImageUrl: string;
    rating: number | null;
    isbn: string;
    isDiscovery?: boolean;   // true = from CSV dataset, NOT in app
    isLocked?: boolean;      // true = premium-only app book
    year?: string;
    publisher?: string;
    score?: number;
}

export const getBookRecommendations = async (bookId: string): Promise<RecommendedBook[]> => {
    try {
        const response = await apiClient.get(`/recommendation/${bookId}`);
        return response.data.data;
    } catch (error) {
        console.error('[Recommendation Service Error]', error);
        return [];
    }
};
