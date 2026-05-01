import mongoose from 'mongoose';
import { getRecommendationsService } from './src/service/recommendation.service.js';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/smartshelf');
    console.log('Connected to DB');
    
    // get a book 
    const Book = (await import('./src/model/book.model.js')).default;
    const book = await Book.findOne();
    if (!book) {
        console.log('No books in DB');
        process.exit(0);
    }
    console.log(`Getting recommendations for: ${book.title}`);
    
    const recs = await getRecommendationsService(book._id, 3);
    console.log('Recommendations:', recs);
    process.exit(0);
}

run().catch(console.error);
