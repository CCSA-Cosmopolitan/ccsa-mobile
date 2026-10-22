import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import API_CONFIG from '../config/api';
import { auth } from './firebase';

const getHouseholdsKey = () => {
  const uid = auth?.currentUser?.uid || 'guest';
  return `@offline_households_${uid}`;
};

export interface HouseholdRecord {
  id?: string;
  offlineId: string;
  houseNumber: string;
  state: string;
  lga: string;
  ward: string;
  pollingUnit: string;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  accuracy?: number | null;
  houseFrontPhotoUrl?: string | null;

  headFirstName: string;
  headMiddleName?: string | null;
  headLastName: string;
  headPhone: string;
  headPhoneVerified?: boolean;
  headGender: string;
  headDateOfBirth?: string | null;
  headMaritalStatus?: string | null;
  headNin?: string | null;
  headPhotoUrl?: string | null;
  headNinVerified?: boolean;
  headEmploymentStatus?: string | null;
  headEducationLevel?: string | null;
  headEmail?: string | null;
  headStateOfOrigin?: string | null;
  headLgaOfOrigin?: string | null;
  headResidenceAddress?: string | null;
  gpsAddress?: string | null;
  locationCapturedAt?: string | null;

  wivesCount: number;
  childrenCount: number;
  otherDependentsCount: number;
  totalHouseholdMembers: number;
  dependentsNotes?: string | null;

  telcoProviders: string[];
  networkType?: string | null;
  commercialCustomersCount: number;

  hasPUE: boolean;
  pueType?: string | null;
  pueEquipment: string[];
  pueDailyHours?: number | null;
  primaryEnergySource?: string | null;

  interventionStatus: string;
  interventionType?: string | null;
  interventionNotes?: string | null;

  status: 'pending' | 'syncing' | 'synced' | 'failed';
  timestamp: string;
  lastSyncAttempt?: string;
  syncError?: string | null;
}

export const householdService = {
  /**
   * Save a household record locally in offline queue
   */
  async saveHouseholdOffline(data: Partial<HouseholdRecord>): Promise<HouseholdRecord> {
    try {
      const offlineId = data.offlineId || `h_offline_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      const record: HouseholdRecord = {
        ...data,
        offlineId,
        houseNumber: data.houseNumber || `NG-TEMP-${Date.now().toString().slice(-6)}`,
        state: data.state || '',
        lga: data.lga || '',
        ward: data.ward || '',
        pollingUnit: data.pollingUnit || '',
        headFirstName: data.headFirstName || '',
        headLastName: data.headLastName || '',
        headPhone: data.headPhone || '',
        headPhoneVerified: Boolean(data.headPhoneVerified),
        headGender: data.headGender || 'MALE',
        wivesCount: Number(data.wivesCount) || 0,
        childrenCount: Number(data.childrenCount) || 0,
        otherDependentsCount: Number(data.otherDependentsCount) || 0,
        totalHouseholdMembers: Number(data.totalHouseholdMembers) || 1,
        telcoProviders: data.telcoProviders || [],
        commercialCustomersCount: Number(data.commercialCustomersCount) || 0,
        hasPUE: Boolean(data.hasPUE),
        pueEquipment: data.pueEquipment || [],
        interventionStatus: data.interventionStatus || 'Captured',
        status: 'pending',
        timestamp: new Date().toISOString(),
      };

      const existing = await this.getOfflineHouseholds();
      const updated = [record, ...existing.filter((h) => h.offlineId !== offlineId)];
      await AsyncStorage.setItem(getHouseholdsKey(), JSON.stringify(updated));

      // Attempt immediate background sync if connected
      this.syncHouseholds().catch(() => {});

      return record;
    } catch (err) {
      console.error('Error saving household offline:', err);
      throw err;
    }
  },

  /**
   * Get all offline households
   */
  async getOfflineHouseholds(): Promise<HouseholdRecord[]> {
    try {
      const json = await AsyncStorage.getItem(getHouseholdsKey());
      return json ? JSON.parse(json) : [];
    } catch {
      return [];
    }
  },

  /**
   * Sync pending households to FIMS server
   */
  async syncHouseholds(): Promise<{ synced: number; failed: number }> {
    const net = await NetInfo.fetch();
    if (!net.isConnected) {
      return { synced: 0, failed: 0 };
    }

    const items = await this.getOfflineHouseholds();
    const pending = items.filter((h) => h.status === 'pending' || h.status === 'failed');
    if (pending.length === 0) return { synced: 0, failed: 0 };

    let token = await auth?.currentUser?.getIdToken();
    if (!token && process.env.NODE_ENV === 'development') {
      token = 'TEST_TOKEN_123';
    }

    let synced = 0;
    let failed = 0;

    try {
      const res = await fetch(`${API_CONFIG.BASE_URL}/api/mobile/households`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(pending),
      });

      if (!res.ok) {
        throw new Error(`Sync failed with HTTP ${res.status}`);
      }

      const data = await res.json();
      const syncedOfflineIds = new Set((data.households || []).map((h: any) => h.offlineId));

      const updated = items.map((h) => {
        if (syncedOfflineIds.has(h.offlineId)) {
          synced++;
          return { ...h, status: 'synced' as const, lastSyncAttempt: new Date().toISOString() };
        }
        return h;
      });

      await AsyncStorage.setItem(getHouseholdsKey(), JSON.stringify(updated));
    } catch (err: any) {
      console.error('Household sync error:', err);
      failed = pending.length;
    }

    return { synced, failed };
  },

  /**
   * Fetch remote households + combine with local offline
   */
  async getCombinedHouseholds(): Promise<HouseholdRecord[]> {
    const local = await this.getOfflineHouseholds();
    try {
      const net = await NetInfo.fetch();
      if (!net.isConnected) return local;

      let token = await auth?.currentUser?.getIdToken();
      if (!token && process.env.NODE_ENV === 'development') {
        token = 'TEST_TOKEN_123';
      }

      const res = await fetch(`${API_CONFIG.BASE_URL}/api/mobile/households`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (res.ok) {
        const data = await res.json();
        const remote: HouseholdRecord[] = (data.households || []).map((r: any) => ({
          ...r,
          offlineId: r.offlineId || r.id,
          status: 'synced' as const,
          timestamp: r.createdAt || new Date().toISOString(),
        }));

        // Merge: keep local pending/syncing, append remote
        const localPending = local.filter((h) => h.status !== 'synced');
        const remoteIds = new Set(remote.map((r) => r.houseNumber));
        const nonDuplicatePending = localPending.filter((h) => !remoteIds.has(h.houseNumber));

        return [...nonDuplicatePending, ...remote];
      }
    } catch (e) {
      console.warn('Could not fetch remote households; using local cache', e);
    }
    return local;
  },

  /**
   * Search households across local and remote cache
   */
  async searchHouseholds(query: string): Promise<HouseholdRecord[]> {
    const list = await this.getCombinedHouseholds();
    if (!query.trim()) return list;
    const q = query.trim().toLowerCase();
    return list.filter((h) => {
      const matchNumber = (h.houseNumber || '').toLowerCase().includes(q);
      const matchFirst = (h.headFirstName || '').toLowerCase().includes(q);
      const matchLast = (h.headLastName || '').toLowerCase().includes(q);
      const matchFull = `${h.headFirstName || ''} ${h.headLastName || ''}`.toLowerCase().includes(q);
      const matchNin = (h.headNin || '').includes(q);
      const matchPhone = (h.headPhone || '').includes(q);
      const matchWard = (h.ward || '').toLowerCase().includes(q);
      const matchLga = (h.lga || '').toLowerCase().includes(q);
      const matchState = (h.state || '').toLowerCase().includes(q);
      return (
        matchNumber ||
        matchFirst ||
        matchLast ||
        matchFull ||
        matchNin ||
        matchPhone ||
        matchWard ||
        matchLga ||
        matchState
      );
    });
  },

  /**
   * Find a household by exact or partial house number
   */
  async getHouseholdByHouseNumber(houseNumber: string): Promise<HouseholdRecord | null> {
    const list = await this.getCombinedHouseholds();
    const clean = houseNumber.trim().toLowerCase();
    return list.find((h) => (h.houseNumber || '').toLowerCase() === clean) ||
      list.find((h) => (h.houseNumber || '').toLowerCase().includes(clean)) || null;
  },

  /**
   * Find a household by head NIN
   */
  async getHouseholdByNin(nin: string): Promise<HouseholdRecord | null> {
    const list = await this.getCombinedHouseholds();
    const clean = nin.trim();
    return list.find((h) => (h.headNin || '').trim() === clean) || null;
  },
};

