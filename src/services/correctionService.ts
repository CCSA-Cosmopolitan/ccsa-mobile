import type { Auth } from 'firebase/auth';
import API_CONFIG from '../config/api';

// firebase.js is an untyped JS module — use require with explicit cast
// eslint-disable-next-line @typescript-eslint/no-require-imports
const auth = (require('./firebase') as { auth: Auth }).auth;
import type {
  CorrectionFarmerSummary,
  CorrectionFarmerDetail,
  CorrectionFilter,
  CorrectionPagination,
  EditableFields,
  FarmCorrectionDetail,
  FarmEditableFields,
  RefereeOp,
} from '../types/correction';

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

export interface SearchFarmersResult {
  farmers: CorrectionFarmerSummary[];
  pagination: CorrectionPagination;
}

export const correctionService = {
  /**
   * Search farmers with optional filters. Returns paginated summary list.
   */
  searchFarmers: (
    filter: Partial<CorrectionFilter>,
    page = 1,
  ): Promise<SearchFarmersResult> => {
    const params = new URLSearchParams({ page: String(page), limit: '20' });
    for (const [key, value] of Object.entries(filter)) {
      if (value) params.set(key, value as string);
    }
    const base = API_CONFIG.ENDPOINTS.CORRECTION_FARMERS;
    return request<SearchFarmersResult>(`${base}?${params}`);
  },

  /**
   * Fetch full farmer record including referees.
   */
  getFarmer: (id: string): Promise<CorrectionFarmerDetail> =>
    request<CorrectionFarmerDetail>(`${API_CONFIG.ENDPOINTS.CORRECTION_FARMERS}/${id}`),

  /**
   * Submit a partial update. Only EDITABLE_FIELDS are accepted by the server.
   */
  updateFarmer: (
    id: string,
    changes: Partial<EditableFields>,
  ): Promise<CorrectionFarmerDetail> =>
    request<CorrectionFarmerDetail>(`${API_CONFIG.ENDPOINTS.CORRECTION_FARMERS}/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(changes),
    }),

  // ── Farm correction ──────────────────────────────────────────────────────────

  /**
   * List all farms for a farmer.
   */
  getFarmerFarms: (farmerId: string): Promise<FarmCorrectionDetail[]> =>
    request<FarmCorrectionDetail[]>(`${API_CONFIG.ENDPOINTS.CORRECTION_FARMERS}/${farmerId}/farms`),

  /**
   * Fetch a single farm detail record.
   */
  getFarm: (farmId: string): Promise<FarmCorrectionDetail> =>
    request<FarmCorrectionDetail>(`/api/mobile/correction/farms/${farmId}`),

  /**
   * Submit a farm correction (creates pending DataCorrection with correctionType=FARM).
   */
  updateFarm: (
    farmId: string,
    changes: Partial<FarmEditableFields>,
  ): Promise<{ pending: true; correctionId: string; message: string }> =>
    request(`/api/mobile/correction/farms/${farmId}`, {
      method: 'PATCH',
      body: JSON.stringify(changes),
    }),

  // ── Referee correction ───────────────────────────────────────────────────────

  /**
   * Submit referee add/update/delete operations as a pending correction.
   */
  updateReferees: (
    farmerId: string,
    ops: RefereeOp[],
  ): Promise<{ pending: true; correctionId: string; message: string }> =>
    request(`${API_CONFIG.ENDPOINTS.CORRECTION_FARMERS}/${farmerId}/referees`, {
      method: 'POST',
      body: JSON.stringify({ ops }),
    }),
};
