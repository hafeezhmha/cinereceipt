export interface ReceiptData {
    username: string;
    year: number;
    totals: {
        films: number;
        rewatches: number;
        minutes: number;
        average_rating: number;
    };
    top_directors: { name: string; count: number }[];
    top_actors: { name: string; count: number }[];
    top_films: { title: string; rating: number }[];
    monthly_breakdown: Record<string, number>;
    ai_taste_profile?: string | null;
    reviews_count?: number;
}
