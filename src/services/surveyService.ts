import type { Auth } from 'firebase/auth';
import API_CONFIG from '../config/api';
import type {
  SurveyDetail,
  SurveySummary,
  SurveyFarmerRef,
  SurveyResponseResult,
  AnswerDraft,
} from '../types/survey';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const auth = (require('./firebase') as { auth: Auth }).auth;

const BASE = API_CONFIG.BASE_URL;

// ─── Auth helper ─────────────────────────────────────────────────────────────

async function getIdToken(): Promise<string> {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error('Not authenticated');
  return currentUser.getIdToken();
}

// ─── Generic fetch wrapper ────────────────────────────────────────────────────

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await getIdToken();
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options.headers ?? {}),
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error((data as any).error ?? `Request failed (${res.status})`);
  return data as T;
}

// ─── Service ─────────────────────────────────────────────────────────────────

export const surveyService = {
  /** Fetch all active published surveys available for the mobile app */
  getActiveSurveys: (): Promise<SurveySummary[]> =>
    request<SurveySummary[]>(API_CONFIG.ENDPOINTS.MOBILE_SURVEYS),

  /** Fetch a single survey with all questions and options */
  getSurveyDetail: (surveyId: string): Promise<SurveyDetail> =>
    request<SurveyDetail>(`${API_CONFIG.ENDPOINTS.MOBILE_SURVEYS}/${surveyId}`),

  /** Search enrolled farmers to select one for a survey session */
  searchFarmers: (query: string): Promise<SurveyFarmerRef[]> => {
    const params = new URLSearchParams({ search: query, limit: '20' });
    return request<SurveyFarmerRef[]>(`${API_CONFIG.ENDPOINTS.MOBILE_SURVEY_FARMERS}?${params}`);
  },

  /** Check whether a specific farmer has already completed a survey */
  checkCompletion: (
    surveyId: string,
    farmerId: string,
  ): Promise<{ completed: boolean; responseId: string | null }> =>
    request(`${API_CONFIG.ENDPOINTS.MOBILE_SURVEYS}/${surveyId}/responses?farmerId=${farmerId}`),

  /** Submit a completed survey response */
  submitResponse: (
    surveyId: string,
    farmerId: string,
    answers: AnswerDraft[],
  ): Promise<SurveyResponseResult> =>
    request<SurveyResponseResult>(`${API_CONFIG.ENDPOINTS.MOBILE_SURVEYS}/${surveyId}/responses`, {
      method: 'POST',
      body: JSON.stringify({ farmerId, answers }),
    }),
};
