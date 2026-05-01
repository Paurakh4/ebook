import React, { useCallback, useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    Image,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { useRouter } from 'expo-router';
import { getBookRecommendations, RecommendedBook } from './services/recommendationServices';
import { API_BASE_URL } from './constants/api';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface RecommendationSectionProps {
    bookId: string;
}

const IMAGE_BASE_URL = API_BASE_URL.replace('/api', '');

// ─── App Book Card (navigates to BookDetails) ───────────────────────────────
const AppBookCard = ({ item, onPress }: { item: RecommendedBook; onPress: () => void }) => {
    const coverImageUrl = item.coverImageUrl || '';
    const imageUrl = coverImageUrl.startsWith('http')
        ? coverImageUrl
        : coverImageUrl
            ? `${IMAGE_BASE_URL}/${coverImageUrl.replace(/\\/g, '/')}`
            : 'https://via.placeholder.com/150';

    return (
        <TouchableOpacity style={styles.bookCard} onPress={onPress} activeOpacity={0.85}>
            {/* In App badge – top left */}
            <View style={styles.appBadge}>
                <MaterialCommunityIcons name="check-circle" size={10} color="#fff" />
                <Text style={styles.appBadgeText}>In App</Text>
            </View>

            {/* Lock badge – top right, only for premium books */}
            {item.isLocked && (
                <View style={styles.lockBadge}>
                    <MaterialCommunityIcons name="lock" size={10} color="#fff" />
                </View>
            )}

            <Image source={{ uri: imageUrl }} style={styles.coverImage} />
            <View style={styles.bookInfo}>
                <Text style={styles.bookTitle} numberOfLines={2}>{item.title}</Text>
                <Text style={styles.bookAuthor} numberOfLines={1}>{item.author}</Text>
                <View style={styles.ratingRow}>
                    <MaterialCommunityIcons name="star" size={14} color="#FFD700" />
                    <Text style={styles.ratingText}>
                        {item.rating !== null && item.rating !== undefined
                            ? Number(item.rating).toFixed(1)
                            : '—'}
                    </Text>
                </View>
            </View>
        </TouchableOpacity>
    );
};

// ─── CSV Discovery Card (info-only, opens Google search) ────────────────────
const DiscoveryBookCard = ({ item, onImageFailed }: { item: RecommendedBook; onImageFailed: (id: string) => void }) => {
    const coverImageUrl = item.coverImageUrl || '';

    const handleSearch = async () => {
        // Build a clean query — skip author if it's 'Unknown' or blank
        const authorPart =
            item.author && item.author.toLowerCase() !== 'unknown'
                ? ` ${item.author}`
                : '';
        const query = encodeURIComponent(`${item.title}${authorPart} book`);
        const url = `https://www.google.com/search?q=${query}`;
        try {
            await WebBrowser.openBrowserAsync(url);
        } catch (err) {
            Alert.alert('Could not open browser', 'Please search manually: ' + item.title);
        }
    };

    return (
        <TouchableOpacity style={[styles.bookCard, styles.discoveryCard]} onPress={handleSearch} activeOpacity={0.85}>
            <View style={[styles.appBadge, styles.discoveryBadge]}>
                <MaterialCommunityIcons name="compass" size={10} color="#fff" />
                <Text style={styles.appBadgeText}>Discover</Text>
            </View>

            {/* Cover image — if it fails to load, hide the entire card */}
            <Image
                source={{ uri: coverImageUrl }}
                style={styles.coverImage}
                onError={() => onImageFailed(item._id)}
            />

            <View style={styles.bookInfo}>
                <Text style={styles.bookTitle} numberOfLines={2}>{item.title}</Text>

                {/* Author — hide row entirely if unknown */}
                {!!item.author && (
                    <Text style={styles.bookAuthor} numberOfLines={1}>{item.author}</Text>
                )}
                {!item.author && (
                    <Text style={[styles.bookAuthor, { fontStyle: 'italic', color: '#bbb' }]}>
                        Author unknown
                    </Text>
                )}

                {/* Publication year or "Tap to search" hint */}
                {item.year ? (
                    <Text style={styles.yearText}>{item.year}</Text>
                ) : (
                    <View style={styles.ratingRow}>
                        <MaterialCommunityIcons name="web" size={12} color="#8B6F47" />
                        <Text style={[styles.ratingText, { color: '#8B6F47' }]}>Tap to search</Text>
                    </View>
                )}
            </View>
        </TouchableOpacity>
    );
};


// ─── Main Section ────────────────────────────────────────────────────────────
const RecommendationSection: React.FC<RecommendationSectionProps> = ({ bookId }) => {
    const [appBooks, setAppBooks] = useState<RecommendedBook[]>([]);
    const [csvBooks, setCsvBooks] = useState<RecommendedBook[]>([]);
    const [failedImageIds, setFailedImageIds] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    // When a discovery book's cover image fails to load, remove it from the list
    const handleImageFailed = useCallback((id: string) => {
        setFailedImageIds(prev => {
            const next = new Set(prev);
            next.add(id);
            return next;
        });
    }, []);

    // Filter out discovery books whose images failed to load
    const visibleCsvBooks = csvBooks.filter(b => !failedImageIds.has(b._id));

    useEffect(() => {
        const fetchRecommendations = async () => {
            setLoading(true);
            const data = await getBookRecommendations(bookId);
            // Split into app books (have MongoDB _id, not isDiscovery)
            // and CSV discovery books (isDiscovery: true)
            setAppBooks(data.filter(b => !b.isDiscovery));
            setCsvBooks(data.filter(b => b.isDiscovery));
            setLoading(false);
        };

        if (bookId) fetchRecommendations();
    }, [bookId]);

    if (loading) {
        return (
            <View style={styles.loaderContainer}>
                <ActivityIndicator size="small" color="#6B8E23" />
            </View>
        );
    }

    const hasAny = appBooks.length > 0 || visibleCsvBooks.length > 0;
    if (!hasAny) return null;

    return (
        <View style={styles.container}>
            {/* ── Section header ── */}
            <View style={styles.header}>
                <Text style={styles.sectionHeading}>You Might Also Like</Text>
                <MaterialCommunityIcons name="star-face" size={20} color="#6B8E23" />
            </View>

            {/* ── Sub-section: App Books ── */}
            {appBooks.length > 0 && (
                <View style={styles.subSection}>
                    <View style={styles.subHeader}>
                        <View style={[styles.subBadge, { backgroundColor: '#E8F5E9' }]}>
                            <MaterialCommunityIcons name="book-open-variant" size={12} color="#6B8E23" />
                            <Text style={[styles.subBadgeText, { color: '#6B8E23' }]}>In Our Library</Text>
                        </View>
                        <Text style={styles.subHint}>Tap to open</Text>
                    </View>
                    <FlatList
                        data={appBooks}
                        renderItem={({ item }) => (
                            <AppBookCard
                                item={item}
                                onPress={() =>
                                    router.push({
                                        pathname: '/BookDetails',
                                        params: { id: item._id },
                                    })
                                }
                            />
                        )}
                        keyExtractor={(item) => `app-${item._id}`}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.listContent}
                    />
                </View>
            )}

            {/* ── Sub-section: CSV Discovery Books ── */}
            {visibleCsvBooks.length > 0 && (
                <View style={styles.subSection}>
                    <View style={styles.subHeader}>
                        <View style={[styles.subBadge, { backgroundColor: '#FFF3E0' }]}>
                            <MaterialCommunityIcons name="compass-outline" size={12} color="#E67E22" />
                            <Text style={[styles.subBadgeText, { color: '#E67E22' }]}>Discover More</Text>
                        </View>
                        <Text style={styles.subHint}>Tap to search online</Text>
                    </View>
                    <FlatList
                        data={visibleCsvBooks}
                        renderItem={({ item }) => <DiscoveryBookCard item={item} onImageFailed={handleImageFailed} />}
                        keyExtractor={(item) => `csv-${item._id}`}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.listContent}
                    />
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginTop: 24,
        marginBottom: 20,
    },
    loaderContainer: {
        padding: 20,
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 14,
        paddingHorizontal: 4,
    },
    sectionHeading: {
        fontSize: 20,
        fontWeight: '900',
        color: '#333',
        marginRight: 8,
    },
    // ── Sub-sections ──
    subSection: {
        marginBottom: 20,
    },
    subHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10,
        paddingHorizontal: 2,
    },
    subBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
        gap: 4,
    },
    subBadgeText: {
        fontSize: 11,
        fontWeight: '700',
        marginLeft: 4,
    },
    subHint: {
        fontSize: 11,
        color: '#aaa',
        fontStyle: 'italic',
    },
    listContent: {
        paddingRight: 20,
    },
    // ── Cards ──
    bookCard: {
        width: 140,
        marginRight: 14,
        backgroundColor: '#FFF',
        borderRadius: 12,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        marginBottom: 5,
    },
    discoveryCard: {
        borderWidth: 1,
        borderColor: '#FFE0B2',
        backgroundColor: '#FFFAF5',
    },
    coverImage: {
        width: '100%',
        height: 185,
    },

    bookInfo: {
        padding: 8,
    },
    bookTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: '#333',
        height: 34,
    },
    bookAuthor: {
        fontSize: 11,
        color: '#666',
        marginTop: 2,
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
        gap: 3,
    },
    ratingText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#444',
        marginLeft: 3,
    },
    yearText: {
        fontSize: 11,
        color: '#8B6F47',
        marginTop: 4,
        fontWeight: '600',
    },
    // ── Badges on card corners ──
    appBadge: {
        position: 'absolute',
        top: 6,
        left: 6,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#6B8E23',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 10,
        zIndex: 10,
        gap: 3,
    },
    discoveryBadge: {
        backgroundColor: '#E67E22',
    },
    lockBadge: {
        position: 'absolute',
        top: 6,
        right: 6,
        backgroundColor: '#CD5C5C',
        paddingHorizontal: 5,
        paddingVertical: 3,
        borderRadius: 8,
        zIndex: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    appBadgeText: {
        color: '#fff',
        fontSize: 9,
        fontWeight: '800',
        marginLeft: 2,
    },
});

export default RecommendationSection;
