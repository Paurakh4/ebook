import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import { fileURLToPath } from 'url';
import Book from '../model/book.model.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// In-memory cache so the 77 MB CSV is only parsed once per server lifecycle
let cachedBooks = null;

const loadCSVBooks = () => {
    return new Promise((resolve, reject) => {
        if (cachedBooks) return resolve(cachedBooks);

        console.log('[Recommendations] Loading books dataset into memory...');
        const results = [];
        const csvFilePath = path.join(__dirname, '../data/books_dataset.csv');

        fs.createReadStream(csvFilePath)
            .pipe(csv({ separator: ';' }))
            .on('data', (row) => results.push(row))
            .on('end', () => {
                console.log(`[Recommendations] Loaded ${results.length} books from dataset.`);
                cachedBooks = results;
                resolve(cachedBooks);
            })
            .on('error', reject);
    });
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Strip punctuation, lowercase, split on whitespace → filter out short stop-words */
const tokenize = (str = '') =>
    str
        .toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(/\s+/)
        .filter((w) => w.length > 3);

/**
 * Genre → representative keywords so we can score CSV books by genre even
 * though the CSV dataset has no genre column.
 */
const GENRE_KEYWORDS = {
    fiction:        ['fiction', 'novel', 'story', 'tales', 'narrative'],
    fantasy:        ['fantasy', 'dragon', 'magic', 'wizard', 'kingdom', 'quest', 'elf', 'dwarf'],
    mystery:        ['mystery', 'detective', 'crime', 'murder', 'thriller', 'suspense', 'clue'],
    romance:        ['romance', 'love', 'heart', 'passion', 'desire', 'kiss', 'wedding'],
    'sci-fi':       ['science', 'space', 'galaxy', 'alien', 'robot', 'future', 'cyber', 'star'],
    biography:      ['life', 'story', 'memoir', 'autobiography', 'biography', 'journal', 'diary'],
    history:        ['history', 'war', 'empire', 'ancient', 'century', 'revolution', 'battle'],
    horror:         ['horror', 'ghost', 'haunted', 'fear', 'dark', 'evil', 'demon', 'phantom'],
    adventure:      ['adventure', 'journey', 'voyage', 'expedition', 'treasure', 'island', 'escape'],
    'self-help':    ['success', 'habit', 'mindset', 'power', 'guide', 'better', 'improve', 'achieve'],
    children:       ['children', 'kids', 'fairy', 'tales', 'illustrated', 'little', 'bedtime'],
    poetry:         ['poetry', 'poems', 'verse', 'sonnets', 'ballad', 'lyric'],
};

/** Returns a genre-match bonus score for a CSV row title given the source genre */
const csvGenreScore = (rowTitle, sourceGenre) => {
    if (!sourceGenre) return 0;
    const genreKey = sourceGenre.toLowerCase();
    const keywords = GENRE_KEYWORDS[genreKey] || [];
    if (keywords.length === 0) return 0;

    const rowWords = tokenize(rowTitle);
    const hits = keywords.filter((kw) => rowWords.includes(kw)).length;
    return hits * 3; // +3 per matching genre keyword in the title
};

// ─── Main Service ─────────────────────────────────────────────────────────────

/**
 * Returns combined recommendations from:
 *   • MongoDB  (app books the user CAN read) — marked isDiscovery: false
 *   • CSV dataset (discovery books, NOT in app) — marked isDiscovery: true
 *
 * @param {string} bookId   - MongoDB _id of the source book
 * @param {number} appLimit - max app-book recs
 * @param {number} csvLimit - max CSV discovery recs
 */
export const getRecommendationsService = async (bookId, appLimit = 4, csvLimit = 6) => {
    try {
        const sourceBook = await Book.findById(bookId);
        if (!sourceBook) throw new Error('Source book not found');

        const titleWords = tokenize(sourceBook.title);
        const seenTitles = new Set([sourceBook.title.toLowerCase()]);
        const seenISBNs  = new Set();

        // ── 1. App Books (MongoDB) ──────────────────────────────────────────
        const dbRaw = await Book.aggregate([
            { $match: { _id: { $ne: sourceBook._id } } },
            {
                $addFields: {
                    score: {
                        $add: [
                            // Same author → biggest signal
                            { $cond: [{ $eq: ['$author', sourceBook.author] }, 10, 0] },
                            // Same genre → strong signal
                            { $cond: [{ $eq: ['$genre', sourceBook.genre] }, 6, 0] },
                            // Rating contribution (0-2.5 pts)
                            { $multiply: [{ $ifNull: ['$rating', 0] }, 0.5] },
                        ],
                    },
                },
            },
            // Title word overlap bonus (computed in JS below; $setIntersection with
            // a JS array requires Mongo 5+, so keep it simple and add title score in JS)
            { $match: { score: { $gte: 0 } } }, // keep all, we filter in JS
            {
                $project: {
                    title: 1, author: 1, genre: 1,
                    coverImageUrl: 1, rating: 1,
                    score: 1, isLocked: 1, isbn: 1,
                    isDiscovery: { $literal: false },
                },
            },
        ]);

        // Add title-word overlap in JS (more reliable than $replaceAll regex in Mongo)
        const appBooks = dbRaw
            .map((book) => {
                const bookTitleWords = tokenize(book.title);
                const overlap = titleWords.filter((w) => bookTitleWords.includes(w)).length;
                return { ...book, score: (book.score || 0) + overlap * 2 };
            })
            .filter((book) => book.score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, appLimit);

        // Track seen titles so CSV doesn't repeat them
        for (const b of appBooks) {
            if (b.title) seenTitles.add(b.title.toLowerCase());
            if (b.isbn)  seenISBNs.add(b.isbn);
        }

        // ── 2. CSV Discovery Books ──────────────────────────────────────────
        const datasetBooks = await loadCSVBooks();
        const csvScored    = [];   // books that scored > 0 (strong matches)
        const csvFallback  = [];   // books with cover image, scored = 0 (fill-in)

        for (const row of datasetBooks) {
            const rawTitle = row['Book-Title'];
            if (!rawTitle || !rawTitle.trim()) continue;

            const titleLower = rawTitle.trim().toLowerCase();
            const isbn       = (row['ISBN'] || '').trim();

            // Skip source book, already-seen titles, duplicate ISBNs
            if (seenTitles.has(titleLower)) continue;
            if (isbn && seenISBNs.has(isbn)) continue;

            // Sanitize author — treat 'Unknown', blank, or purely numeric as absent
            const rawAuthor   = (row['Book-Author'] || '').trim();
            const cleanAuthor =
                rawAuthor && !/^(unknown|n\/a|na|\d+)$/i.test(rawAuthor)
                    ? rawAuthor
                    : '';

            // Pick best cover image once per row (used in both paths)
            // Reject known Amazon placeholder / broken image URLs:
            //  - blank or non-http
            //  - contains "nophoto" or "no-image"
            //  - filename is all digits (e.g. ".../01.jpg" — BX 1px placeholders)
            //  - URL too short to be a real image path
            const isValidCover = (url) => {
                if (!url) return false;
                const trimmed = url.trim();
                if (!trimmed.startsWith('http')) return false;
                if (trimmed.length < 30) return false; // too short = placeholder
                const lower = trimmed.toLowerCase();
                if (lower.includes('nophoto') || lower.includes('no-image') || lower.includes('no_image')) return false;
                // BX placeholder pattern: filename is just digits like "01.jpg"
                const filename = lower.split('/').pop() || '';
                if (/^\d+\.\w+$/.test(filename)) return false;
                return true;
            };

            const bestCover = [
                row['Image-URL-L'],
                row['Image-URL-M'],
                row['Image-URL-S'],
            ].find((u) => isValidCover(u)) || '';

            // Skip books that have no valid cover image
            if (!bestCover) continue;

            let csvScore = 0;

            // Author exact match
            if (cleanAuthor && sourceBook.author &&
                cleanAuthor.toLowerCase() === sourceBook.author.toLowerCase()) {
                csvScore += 10;
            }

            // Partial author match (last name)
            if (csvScore === 0 && cleanAuthor && sourceBook.author) {
                const srcLast = sourceBook.author.split(' ').pop()?.toLowerCase();
                if (srcLast && srcLast.length > 3 &&
                    cleanAuthor.toLowerCase().includes(srcLast)) {
                    csvScore += 4;
                }
            }

            // Title word overlap
            const rowTitleWords = tokenize(rawTitle);
            const overlap = titleWords.filter((w) => rowTitleWords.includes(w)).length;
            csvScore += overlap * 2;

            // Genre keyword match against CSV title words
            csvScore += csvGenreScore(rawTitle, sourceBook.genre);

            const entry = {
                _id: isbn || rawTitle,
                isbn: isbn || null,
                title: rawTitle.trim(),
                author: cleanAuthor,
                coverImageUrl: bestCover,
                year: (row['Year-Of-Publication'] || '').trim(),
                publisher: (row['Publisher'] || '').trim(),
                score: csvScore,
                isDiscovery: true,
                rating: null,
            };

            if (csvScore > 0) {
                csvScored.push(entry);
                if (isbn) seenISBNs.add(isbn);
                seenTitles.add(titleLower);
            } else if (bestCover) {
                // Has a cover image → eligible as a fallback discovery book
                csvFallback.push(entry);
            }
        }

        csvScored.sort((a, b) => b.score - a.score);
        let csvBooks = csvScored.slice(0, csvLimit);


        // ── Fallback: fill remaining CSV slots from the already-built fallback pool ──
        // csvFallback was populated in the same loop above — no second pass needed.
        if (csvBooks.length < csvLimit) {
            const needed = csvLimit - csvBooks.length;

            // Fisher-Yates shuffle so we don't always surface the same top-of-file books
            for (let i = csvFallback.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [csvFallback[i], csvFallback[j]] = [csvFallback[j], csvFallback[i]];
            }

            csvBooks = [...csvBooks, ...csvFallback.slice(0, needed)];
        }


        // ── 3. Fallback: if NO app-book matches, include trending app books ──
        let finalAppBooks = appBooks;
        if (appBooks.length === 0) {
            const trending = await Book.find({ _id: { $ne: sourceBook._id } })
                .sort({ rating: -1 })
                .limit(appLimit)
                .lean();
            finalAppBooks = trending.map((b) => ({ ...b, isDiscovery: false, score: 0 }));
        }

        // Return app books first (they can be read), then CSV discoveries
        return [...finalAppBooks, ...csvBooks];

    } catch (error) {
        console.error('[RecommendationService] Error:', error.message);
        throw error;
    }
};

/**
 * Trending books fallback (used by other consumers)
 */
export const getTrendingRecommendationsService = async (limit = 10) => {
    return await Book.find().sort({ rating: -1, createdAt: -1 }).limit(limit);
};
