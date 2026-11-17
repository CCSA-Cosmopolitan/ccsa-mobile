import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import API_CONFIG from '../config/api';
import { auth } from './firebase';

const getHouseholdsKey = () => {
  const uid = auth?.currentUser?.uid;
  return uid ? `@offline_households_${uid}` : '@offline_households_guest';
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
  houseType?: string | null;

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
  headOccupation?: string | null;
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

  hasLivestock?: boolean;
  cattleCount?: number;
  horsesCount?: number;
  sheepCount?: number;
  goatsCount?: number;
  poultryCount?: number;
  donkeysCount?: number;
  otherAnimalsCount?: number;
  livestockNotes?: string | null;
  totalAnimalsCount?: number;

  telcoProviders: string[];
  networkType?: string | null;
  commercialCustomersCount: number;

  hasPUE: boolean;
  pueType?: string | null;
  pueEquipment: string[];
  pueDailyHours?: number | null;
  primaryEnergySource?: string | null;
  waterSource?: string | null;

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
        houseType: data.houseType || null,
        state: data.state || '',
        lga: data.lga || '',
        ward: data.ward || '',
        pollingUnit: data.pollingUnit || '',
        headFirstName: data.headFirstName || '',
        headLastName: data.headLastName || '',
        headPhone: data.headPhone || '',
        headPhoneVerified: Boolean(data.headPhoneVerified),
        headGender: data.headGender || 'MALE',
        headEmploymentStatus: data.headEmploymentStatus || null,
        headOccupation: data.headOccupation || null,
        wivesCount: Number(data.wivesCount) || 0,
        childrenCount: Number(data.childrenCount) || 0,
        otherDependentsCount: Number(data.otherDependentsCount) || 0,
        totalHouseholdMembers: Number(data.totalHouseholdMembers) || 1,
        hasLivestock: Boolean(data.hasLivestock),
        cattleCount: Number(data.cattleCount) || 0,
        horsesCount: Number(data.horsesCount) || 0,
        sheepCount: Number(data.sheepCount) || 0,
        goatsCount: Number(data.goatsCount) || 0,
        poultryCount: Number(data.poultryCount) || 0,
        donkeysCount: Number(data.donkeysCount) || 0,
        otherAnimalsCount: Number(data.otherAnimalsCount) || 0,
        livestockNotes: data.livestockNotes || null,
        totalAnimalsCount: Number(data.totalAnimalsCount) || (
          (Number(data.cattleCount) || 0) +
          (Number(data.horsesCount) || 0) +
          (Number(data.sheepCount) || 0) +
          (Number(data.goatsCount) || 0) +
          (Number(data.poultryCount) || 0) +
          (Number(data.donkeysCount) || 0) +
          (Number(data.otherAnimalsCount) || 0)
        ),
        telcoProviders: data.telcoProviders || [],
        commercialCustomersCount: Number(data.commercialCustomersCount) || 0,
        hasPUE: Boolean(data.hasPUE),
        pueEquipment: data.pueEquipment || [],
        primaryEnergySource: data.primaryEnergySource || null,
        waterSource: data.waterSource || null,
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
   * Get all offline households (with automatic orphan migration from guest/legacy storage)
   */
  async getOfflineHouseholds(): Promise<HouseholdRecord[]> {
    try {
      const key = getHouseholdsKey();
      const json = await AsyncStorage.getItem(key);
      let items: HouseholdRecord[] = json ? JSON.parse(json) : [];

      // If user is authenticated, check for any unmigrated records in legacy or guest storage
      const uid = auth?.currentUser?.uid;
      if (uid) {
        let migrated = false;
        for (const fallbackKey of ['@offline_households_guest', '@offline_households']) {
          if (fallbackKey !== key) {
            try {
              const orphanJson = await AsyncStorage.getItem(fallbackKey);
              if (orphanJson) {
                const orphanItems: HouseholdRecord[] = JSON.parse(orphanJson);
                if (Array.isArray(orphanItems) && orphanItems.length > 0) {
                  const existingKeys = new Set(items.map((h) => h.offlineId || h.id || h.houseNumber));
                  const newItems = orphanItems.filter(
                    (h) => !existingKeys.has(h.offlineId || h.id || h.houseNumber)
                  );
                  if (newItems.length > 0) {
                    items = [...items, ...newItems];
                    migrated = true;
                  }
                }
                // Clear orphan key after migrating
                await AsyncStorage.removeItem(fallbackKey);
              }
            } catch (orphanErr) {
              console.warn('Error migrating orphan households:', orphanErr);
            }
          }
        }
        if (migrated) {
          await AsyncStorage.setItem(key, JSON.stringify(items));
        }
      }

      return items;
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
      const returnedHouseholds: any[] = data.households || [];
      const returnedByOfflineId = new Map(returnedHouseholds.map((h: any) => [h.offlineId, h]));

      // Re-read current items in case new records were added during the sync call
      const currentItems = await this.getOfflineHouseholds();

      const updated = currentItems.map((h) => {
        const serverMatch = returnedByOfflineId.get(h.offlineId);
        if (serverMatch) {
          synced++;
          return {
            ...h,
            id: serverMatch.id || h.id,
            houseNumber: serverMatch.houseNumber || h.houseNumber,
            status: 'synced' as const,
            lastSyncAttempt: new Date().toISOString(),
            syncError: null,
          };
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
   * Fetch remote households + robustly merge with local offline storage
   * Ensures that no locally captured record ever disappears from the agent's view.
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

      // Fetch with limit=1000 so the agent sees all their captured records
      const res = await fetch(`${API_CONFIG.BASE_URL}/api/mobile/households?limit=1000`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (res.ok) {
        const data = await res.json();
        const remoteList: any[] = data.households || [];

        // Build a robust map of local records first (keyed by offlineId, server id, or houseNumber)
        const recordMap = new Map<string, HouseholdRecord>();

        for (const loc of local) {
          const key = loc.offlineId || loc.id || loc.houseNumber;
          if (key) recordMap.set(key, loc);
        }

        // Merge in remote records
        for (const r of remoteList) {
          const remoteRecord: HouseholdRecord = {
            ...r,
            offlineId: r.offlineId || r.id,
            id: r.id,
            houseNumber: r.houseNumber,
            status: 'synced',
            timestamp: r.createdAt || new Date().toISOString(),
          };

          // Find if matching local record exists
          let matchedKey: string | null = null;
          for (const [k, existing] of recordMap.entries()) {
            if (
              (r.offlineId && existing.offlineId === r.offlineId) ||
              (r.id && existing.id === r.id) ||
              (r.houseNumber && existing.houseNumber === r.houseNumber)
            ) {
              matchedKey = k;
              break;
            }
          }

          if (matchedKey) {
            const existing = recordMap.get(matchedKey)!;
            recordMap.set(matchedKey, {
              ...existing,
              ...remoteRecord,
              status: 'synced',
            });
          } else {
            const newKey = remoteRecord.offlineId || remoteRecord.id || remoteRecord.houseNumber;
            if (newKey) recordMap.set(newKey, remoteRecord);
          }
        }

        const mergedList = Array.from(recordMap.values()).sort((a, b) => {
          const timeA = new Date(a.timestamp || 0).getTime();
          const timeB = new Date(b.timestamp || 0).getTime();
          return timeB - timeA;
        });

        // Cache the complete merged list back to AsyncStorage
        await AsyncStorage.setItem(getHouseholdsKey(), JSON.stringify(mergedList));

        return mergedList;
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

