import { create } from 'zustand';
import { correctionService, type SearchFarmersResult } from '../services/correctionService';
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

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { offlineCacheService } = require('../services/offlineCacheService') as {
  offlineCacheService: {
    setCache: (key: string, data: unknown, expiryMs?: number) => Promise<void>;
    getCache: (key: string) => Promise<unknown>;
  };
};

const CACHE_KEY_CORRECTION_RESULTS = '@cache_correction_results';
const CACHE_EXPIRY_MS = 4 * 60 * 60 * 1000; // 4 hours

// ─── State shape ─────────────────────────────────────────────────────────────

interface CorrectionState {
  // Search
  filter: CorrectionFilter;
  results: CorrectionFarmerSummary[];
  pagination: CorrectionPagination | null;
  isOffline: boolean;
  searching: boolean;
  searchError: string | null;
  hasSearched: boolean;

  // Detail / edit
  selectedFarmer: CorrectionFarmerDetail | null;
  loadingDetail: boolean;
  detailError: string | null;

  // Save
  saving: boolean;
  saveError: string | null;

  // Farm
  farms: FarmCorrectionDetail[];
  selectedFarm: FarmCorrectionDetail | null;
  loadingFarms: boolean;
  farmError: string | null;
  savingFarm: boolean;
  saveFarmError: string | null;

  // Referee
  savingReferees: boolean;
  saveRefereesError: string | null;

  // Actions
  setFilter: (f: Partial<CorrectionFilter>) => void;
  resetFilter: () => void;
  search: (page?: number) => Promise<void>;
  loadNextPage: () => Promise<void>;
  selectFarmer: (id: string) => Promise<void>;
  clearSelected: () => void;
  updateFarmer: (id: string, changes: Partial<EditableFields>) => Promise<void>;
  loadFarms: (farmerId: string) => Promise<void>;
  selectFarm: (farmId: string) => Promise<void>;
  clearSelectedFarm: () => void;
  updateFarm: (farmId: string, changes: Partial<FarmEditableFields>) => Promise<void>;
  updateReferees: (farmerId: string, ops: RefereeOp[]) => Promise<void>;
}

const DEFAULT_FILTER: CorrectionFilter = {
  search: '',
  state: '',
  lga: '',
  ward: '',
  pollingUnit: '',
  nin: '',
  bvn: '',
};

// ─── Store ───────────────────────────────────────────────────────────────────

export const useCorrectionStore = create<CorrectionState>((set, get) => ({
  filter: { ...DEFAULT_FILTER },
  results: [],
  pagination: null,
  isOffline: false,
  searching: false,
  searchError: null,
  hasSearched: false,

  selectedFarmer: null,
  loadingDetail: false,
  detailError: null,

  saving: false,
  saveError: null,

  farms: [],
  selectedFarm: null,
  loadingFarms: false,
  farmError: null,
  savingFarm: false,
  saveFarmError: null,

  savingReferees: false,
  saveRefereesError: null,

  // ── Filter management ──────────────────────────────────────────────────────

  setFilter: (f) => set((s) => ({ filter: { ...s.filter, ...f } })),

  resetFilter: () =>
    set({
      filter: { ...DEFAULT_FILTER },
      results: [],
      pagination: null,
      hasSearched: false,
      searchError: null,
    }),

  // ── Search ─────────────────────────────────────────────────────────────────

  search: async (page = 1) => {
    set({ searching: true, searchError: null, isOffline: false });
    if (page === 1) set({ results: [] });
    try {
      const { filter } = get();
      const data = await correctionService.searchFarmers(filter, page);
      // Cache first-page results for offline fallback
      if (page === 1) {
        offlineCacheService
          .setCache(CACHE_KEY_CORRECTION_RESULTS, data, CACHE_EXPIRY_MS)
          .catch(() => { /* non-fatal */ });
      }
      set((s) => ({
        results: page === 1 ? data.farmers : [...s.results, ...data.farmers],
        pagination: data.pagination,
        searching: false,
        hasSearched: true,
      }));
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Search failed';
      // Try offline cache on first page
      if (page === 1) {
        try {
          const cached = await offlineCacheService.getCache(CACHE_KEY_CORRECTION_RESULTS) as SearchFarmersResult | null;
          if (cached) {
            set({
              results: cached.farmers,
              pagination: cached.pagination,
              searching: false,
              hasSearched: true,
              isOffline: true,
              searchError: 'Showing cached results (offline)',
            });
            return;
          }
        } catch { /* fall through */ }
      }
      set({ searching: false, searchError: msg, hasSearched: true });
    }
  },

  loadNextPage: async () => {
    const { pagination, searching } = get();
    if (searching || !pagination || pagination.page >= pagination.pages) return;
    await get().search(pagination.page + 1);
  },

  // ── Farmer detail ──────────────────────────────────────────────────────────

  selectFarmer: async (id) => {
    set({ loadingDetail: true, detailError: null, selectedFarmer: null });
    try {
      const farmer = await correctionService.getFarmer(id);
      set({ selectedFarmer: farmer, loadingDetail: false });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to load farmer';
      set({ loadingDetail: false, detailError: msg });
    }
  },

  clearSelected: () =>
    set({ selectedFarmer: null, detailError: null, saveError: null }),

  // ── Update ─────────────────────────────────────────────────────────────────

  updateFarmer: async (id, changes) => {
    set({ saving: true, saveError: null });
    try {
      const updated = await correctionService.updateFarmer(id, changes);
      set((s) => ({
        saving: false,
        selectedFarmer: updated,
        // Refresh the matching entry in the results list
        results: s.results.map((r) =>
          r.id === id ? { ...r, ...updated } : r
        ),
      }));
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Update failed';
      set({ saving: false, saveError: msg });
      throw e;
    }
  },

  // ── Farm correction ────────────────────────────────────────────────────────

  loadFarms: async (farmerId) => {
    set({ loadingFarms: true, farmError: null });
    try {
      const farms = await correctionService.getFarmerFarms(farmerId);
      set({ farms, loadingFarms: false });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to load farms';
      set({ loadingFarms: false, farmError: msg });
    }
  },

  selectFarm: async (farmId) => {
    set({ loadingFarms: true, farmError: null, selectedFarm: null });
    try {
      const farm = await correctionService.getFarm(farmId);
      set({ selectedFarm: farm, loadingFarms: false });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to load farm';
      set({ loadingFarms: false, farmError: msg });
    }
  },

  clearSelectedFarm: () => set({ selectedFarm: null, saveFarmError: null }),

  updateFarm: async (farmId, changes) => {
    set({ savingFarm: true, saveFarmError: null });
    try {
      await correctionService.updateFarm(farmId, changes);
      set({ savingFarm: false });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Farm update failed';
      set({ savingFarm: false, saveFarmError: msg });
      throw e;
    }
  },

  // ── Referee correction ─────────────────────────────────────────────────────

  updateReferees: async (farmerId, ops) => {
    set({ savingReferees: true, saveRefereesError: null });
    try {
      await correctionService.updateReferees(farmerId, ops);
      set({ savingReferees: false });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Referee update failed';
      set({ savingReferees: false, saveRefereesError: msg });
      throw e;
    }
  },
}));
