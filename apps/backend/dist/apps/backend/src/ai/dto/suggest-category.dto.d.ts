export declare class SuggestCategoryDto {
    description: string;
}
export interface CategorySuggestion {
    category: string;
    subcategory: string | null;
    confidence: number;
}
