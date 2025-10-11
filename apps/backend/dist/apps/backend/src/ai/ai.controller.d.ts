import { AiService } from './ai.service';
import { AnalyzeSpendingDto, SpendingAnalysisResponse } from './dto/analyze-spending.dto';
import { AnomaliesResponse, DetectAnomaliesDto } from './dto/detect-anomalies.dto';
import { GetRecommendationsDto, RecommendationsResponse } from './dto/get-recommendations.dto';
import { PredictFutureDto, PredictionResponse } from './dto/predict-future.dto';
import { CategorySuggestion, SuggestCategoryDto } from './dto/suggest-category.dto';
export declare class AiController {
    private readonly aiService;
    constructor(aiService: AiService);
    suggestCategory(dto: SuggestCategoryDto): CategorySuggestion;
    analyzeSpending(dto: AnalyzeSpendingDto): Promise<SpendingAnalysisResponse>;
    predictFuture(dto: PredictFutureDto): Promise<PredictionResponse>;
    detectAnomalies(dto: DetectAnomaliesDto): Promise<AnomaliesResponse>;
    getRecommendations(dto: GetRecommendationsDto): Promise<RecommendationsResponse>;
}
