import { create } from 'zustand';
import { surveyService } from '../services/surveyService';
import type {
  SurveySummary,
  SurveyDetail,
  SurveyFarmerRef,
  AnswerDraft,
} from '../types/survey';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { offlineCacheService } = require('../services/offlineCacheService') as {
  offlineCacheService: {
    setCache: (key: string, data: unknown, expiryMs?: number) => Promise<void>;
    getCache: (key: string) => Promise<unknown>;
  };
};

const CACHE_KEY_SURVEYS = '@cache_active_surveys';
const CACHE_KEY_SURVEY_DETAIL = (id: string) => `@cache_survey_detail_${id}`;
const CACHE_EXPIRY_MS = 6 * 60 * 60 * 1000; // 6 hours

// ─── State shape ─────────────────────────────────────────────────────────────

interface SurveyState {
  // Survey list
  surveys: SurveySummary[];
  surveysOffline: boolean;
  loadingSurveys: boolean;
  surveysError: string | null;

  // Selected survey
  selectedSurvey: SurveyDetail | null;
  loadingDetail: boolean;
  detailError: string | null;

  // Farmer selection
  farmerQuery: string;
  farmerResults: SurveyFarmerRef[];
  searchingFarmers: boolean;
  selectedFarmer: SurveyFarmerRef | null;
  farmerAlreadyCompleted: boolean;

  // Answer drafts: questionId → AnswerDraft
  answers: Record<string, AnswerDraft>;

  // Submission
  submitting: boolean;
  submitError: string | null;
  submittedResponseId: string | null;

  // Actions
  loadSurveys: () => Promise<void>;
  selectSurvey: (surveyId: string) => Promise<void>;
  clearSurvey: () => void;

  setFarmerQuery: (q: string) => void;
  searchFarmers: () => Promise<void>;
  selectFarmer: (farmer: SurveyFarmerRef) => Promise<void>;
  clearFarmer: () => void;

  setAnswer: (questionId: string, draft: Partial<AnswerDraft>) => void;
  resetAnswers: () => void;

  submitSurvey: () => Promise<void>;
  resetSession: () => void;
}

// ─── Store ───────────────────────────────────────────────────────────────────

export const useSurveyStore = create<SurveyState>((set, get) => ({
  surveys: [],
  surveysOffline: false,
  loadingSurveys: false,
  surveysError: null,

  selectedSurvey: null,
  loadingDetail: false,
  detailError: null,

  farmerQuery: '',
  farmerResults: [],
  searchingFarmers: false,
  selectedFarmer: null,
  farmerAlreadyCompleted: false,

  answers: {},

  submitting: false,
  submitError: null,
  submittedResponseId: null,

  // ── Survey list ────────────────────────────────────────────────────────────

  loadSurveys: async () => {
    set({ loadingSurveys: true, surveysError: null, surveysOffline: false });
    try {
      const surveys = await surveyService.getActiveSurveys();
      // Cache for offline fallback
      offlineCacheService
        .setCache(CACHE_KEY_SURVEYS, surveys, CACHE_EXPIRY_MS)
        .catch(() => { /* non-fatal */ });
      set({ surveys, loadingSurveys: false });
    } catch (e: any) {
      // Try offline cache
      try {
        const cached = await offlineCacheService.getCache(CACHE_KEY_SURVEYS) as SurveySummary[] | null;
        if (cached) {
          set({
            surveys: cached,
            loadingSurveys: false,
            surveysOffline: true,
            surveysError: 'Showing cached surveys (offline)',
          });
          return;
        }
      } catch { /* fall through */ }
      set({ surveysError: e.message, loadingSurveys: false });
    }
  },

  // ── Survey detail ──────────────────────────────────────────────────────────

  selectSurvey: async (surveyId: string) => {
    set({ loadingDetail: true, detailError: null, selectedSurvey: null });
    try {
      const survey = await surveyService.getSurveyDetail(surveyId);
      // Cache for offline fallback
      offlineCacheService
        .setCache(CACHE_KEY_SURVEY_DETAIL(surveyId), survey, CACHE_EXPIRY_MS)
        .catch(() => { /* non-fatal */ });
      // Pre-populate answer drafts with empty values
      const answers: Record<string, AnswerDraft> = {};
      for (const q of survey.questions) {
        answers[q.id] = { questionId: q.id, answerText: null, selectedOptionIds: [] };
      }
      set({ selectedSurvey: survey, answers, loadingDetail: false });
    } catch (e: any) {
      // Try offline cache
      try {
        const cached = await offlineCacheService.getCache(CACHE_KEY_SURVEY_DETAIL(surveyId)) as SurveyDetail | null;
        if (cached && Array.isArray(cached.questions)) {
          const answers: Record<string, AnswerDraft> = {};
          for (const q of cached.questions) {
            answers[q.id] = { questionId: q.id, answerText: null, selectedOptionIds: [] };
          }
          set({ selectedSurvey: cached, answers, loadingDetail: false, detailError: 'Showing cached survey (offline)' });
          return;
        }
      } catch { /* fall through */ }
      set({ detailError: e.message, loadingDetail: false });
    }
  },

  clearSurvey: () =>
    set({
      selectedSurvey: null,
      detailError: null,
      answers: {},
      selectedFarmer: null,
      farmerAlreadyCompleted: false,
      submittedResponseId: null,
      submitError: null,
    }),

  // ── Farmer selection ───────────────────────────────────────────────────────

  setFarmerQuery: (q) => set({ farmerQuery: q }),

  searchFarmers: async () => {
    const { farmerQuery } = get();
    if (!farmerQuery.trim()) return;
    set({ searchingFarmers: true });
    try {
      const results = await surveyService.searchFarmers(farmerQuery.trim());
      set({ farmerResults: results, searchingFarmers: false });
    } catch {
      set({ searchingFarmers: false });
    }
  },

  selectFarmer: async (farmer: SurveyFarmerRef) => {
    const { selectedSurvey } = get();
    set({ selectedFarmer: farmer, farmerAlreadyCompleted: false });
    if (!selectedSurvey) return;
    try {
      const { completed } = await surveyService.checkCompletion(selectedSurvey.id, farmer.id);
      set({ farmerAlreadyCompleted: completed });
    } catch {
      // Non-fatal — proceed anyway
    }
  },

  clearFarmer: () =>
    set({ selectedFarmer: null, farmerAlreadyCompleted: false, farmerResults: [] }),

  // ── Answers ────────────────────────────────────────────────────────────────

  setAnswer: (questionId, draft) =>
    set((state) => ({
      answers: {
        ...state.answers,
        [questionId]: { ...state.answers[questionId], ...draft },
      },
    })),

  resetAnswers: () => {
    const { selectedSurvey } = get();
    if (!selectedSurvey) return;
    const answers: Record<string, AnswerDraft> = {};
    for (const q of selectedSurvey.questions) {
      answers[q.id] = { questionId: q.id, answerText: null, selectedOptionIds: [] };
    }
    set({ answers });
  },

  // ── Submit ─────────────────────────────────────────────────────────────────

  submitSurvey: async () => {
    const { selectedSurvey, selectedFarmer, answers } = get();
    if (!selectedSurvey || !selectedFarmer) return;
    set({ submitting: true, submitError: null });
    try {
      const draftList = Object.values(answers);
      const result = await surveyService.submitResponse(
        selectedSurvey.id,
        selectedFarmer.id,
        draftList,
      );
      set({ submitting: false, submittedResponseId: result.id });
    } catch (e: any) {
      set({ submitting: false, submitError: e.message });
    }
  },

  resetSession: () =>
    set({
      selectedSurvey: null,
      selectedFarmer: null,
      farmerAlreadyCompleted: false,
      answers: {},
      submitting: false,
      submitError: null,
      submittedResponseId: null,
      farmerQuery: '',
      farmerResults: [],
    }),
}));
