import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  Alert,
  SafeAreaView,
  StatusBar,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { householdService, HouseholdRecord } from '../../services/householdService';

export default function HouseholdListScreen({ navigation }: { navigation: any }) {
  const [households, setHouseholds] = useState<HouseholdRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadHouseholds();
    });
    return unsubscribe;
  }, [navigation]);

  const loadHouseholds = async () => {
    try {
      setLoading(true);
      const data = await householdService.getCombinedHouseholds();
      setHouseholds(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleManualSync = async () => {
    try {
      setSyncing(true);
      const result = await householdService.syncHouseholds();
      Alert.alert(
        'Sync Complete',
        `Synced: ${result.synced} records${result.failed > 0 ? ` | Failed: ${result.failed}` : ''}`
      );
      loadHouseholds();
    } catch (e: any) {
      Alert.alert('Sync Error', e.message || 'Could not sync records');
    } finally {
      setSyncing(false);
    }
  };

  const filtered = households.filter((h) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      h.houseNumber.toLowerCase().includes(q) ||
      h.headFirstName.toLowerCase().includes(q) ||
      h.headLastName.toLowerCase().includes(q) ||
      (h.headNin && h.headNin.includes(q)) ||
      h.ward.toLowerCase().includes(q) ||
      h.lga.toLowerCase().includes(q)
    );
  });

  const pendingCount = households.filter((h) => h.status !== 'synced').length;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f9fafb" />

      {/* ── Header matching FarmersListScreen ── */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Enrolled Households</Text>
            <Text style={styles.subtitle}>
              {households.length} household{households.length !== 1 ? 's' : ''} captured
              {pendingCount > 0 ? ` • ${pendingCount} offline pending sync` : ' • All records synced'}
            </Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              onPress={handleManualSync}
              disabled={syncing}
              style={[styles.syncBtn, syncing && { opacity: 0.6 }]}
            >
              {syncing ? (
                <ActivityIndicator size="small" color="#013358" />
              ) : (
                <>
                  <Ionicons name="cloud-upload-outline" size={16} color="#013358" style={{ marginRight: 4 }} />
                  <Text style={styles.syncBtnText}>Sync</Text>
                </>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => navigation.navigate('HouseholdCapture')}
            >
              <Ionicons name="add" size={18} color="#ffffff" />
              <Text style={styles.addButtonText}>Enroll</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* ── Search Bar ── */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#9ca3af" style={styles.searchIcon} />
          <TextInput
            placeholder="Search house code, leader name, NIN or ward…"
            placeholderTextColor="#9ca3af"
            value={search}
            onChangeText={setSearch}
            style={styles.searchInput}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')} style={{ padding: 4 }}>
              <Ionicons name="close-circle" size={18} color="#9ca3af" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ── List Content ── */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#013358" />
          <Text style={{ marginTop: 12, color: '#6b7280', fontSize: 14 }}>
            Loading household registry...
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.offlineId || item.houseNumber}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                loadHouseholds();
              }}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="home-outline" size={64} color="#d1d5db" />
              <Text style={styles.emptyTitle}>No Households Found</Text>
              <Text style={styles.emptySub}>
                {search
                  ? 'No households match your search query.'
                  : 'Start capturing households with NIN verification & GPS.'}
              </Text>
              {!search && (
                <TouchableOpacity
                  style={styles.emptyButton}
                  onPress={() => navigation.navigate('HouseholdCapture')}
                >
                  <Ionicons name="add" size={18} color="#ffffff" style={{ marginRight: 6 }} />
                  <Text style={styles.emptyButtonText}>Capture Household</Text>
                </TouchableOpacity>
              )}
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => navigation.navigate('HouseholdDetails', { household: item })}
              activeOpacity={0.7}
            >
              <View style={styles.cardHeader}>
                {item.headPhotoUrl ? (
                  <Image source={{ uri: item.headPhotoUrl }} style={styles.avatarImg} />
                ) : (
                  <View style={styles.avatarBox}>
                    <Text style={styles.avatarText}>
                      {(item.headFirstName?.[0] || 'H') + (item.headLastName?.[0] || 'H')}
                    </Text>
                  </View>
                )}

                <View style={{ flex: 1 }}>
                  <Text style={styles.houseNumber}>{item.houseNumber}</Text>
                  <Text style={styles.leaderName}>
                    {item.headFirstName} {item.headLastName}
                  </Text>
                  <Text style={styles.contactDetails}>
                    {item.headPhone || 'No phone'} • NIN: {item.headNin || 'N/A'}
                  </Text>
                </View>

                <View
                  style={[
                    styles.syncBadge,
                    item.status === 'synced' ? styles.syncedBadge : styles.pendingBadge,
                  ]}
                >
                  <Ionicons
                    name={item.status === 'synced' ? 'checkmark-circle' : 'time-outline'}
                    size={11}
                    color={item.status === 'synced' ? '#059669' : '#d97706'}
                  />
                  <Text
                    style={[
                      styles.syncText,
                      item.status === 'synced' ? styles.syncedText : styles.pendingText,
                    ]}
                  >
                    {item.status === 'synced' ? 'SYNCED' : 'OFFLINE'}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#9ca3af" style={{ marginLeft: 6 }} />
              </View>

              <View style={styles.cardDivider} />

              <View style={styles.cardDetails}>
                <View style={styles.detailRow}>
                  <Ionicons name="location-outline" size={14} color="#64748b" />
                  <Text style={styles.detailText}>
                    {[item.ward, item.lga, item.state].filter(Boolean).join(', ')} • PU: {item.pollingUnit}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Ionicons name="people-outline" size={14} color="#64748b" />
                  <Text style={styles.detailText}>
                    {item.totalHouseholdMembers} Residents ({item.wivesCount} Spouses, {item.childrenCount} Children)
                  </Text>
                </View>

                {item.hasPUE && (
                  <View style={[styles.detailRow, { marginTop: 4 }]}>
                    <Ionicons name="flash" size={14} color="#d97706" />
                    <Text style={[styles.detailText, { color: '#b45309', fontWeight: '600' }]}>
                      PUE Business: {item.pueType || 'Active'}
                    </Text>
                  </View>
                )}
              </View>

              {/* Telco pills */}
              {((item.telcoProviders && item.telcoProviders.length > 0) || item.networkType) && (
                <View style={styles.telcoRow}>
                  {(item.telcoProviders || []).map((t) => (
                    <View key={t} style={styles.telcoPill}>
                      <Text style={styles.telcoPillText}>{t}</Text>
                    </View>
                  ))}
                  {item.networkType && (
                    <View style={[styles.telcoPill, { backgroundColor: '#f1f5f9' }]}>
                      <Text style={[styles.telcoPillText, { color: '#64748b' }]}>{item.networkType}</Text>
                    </View>
                  )}
                </View>
              )}
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  syncBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e0f2fe',
    borderWidth: 1,
    borderColor: '#bae6fd',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  syncBtnText: {
    color: '#013358',
    fontSize: 13,
    fontWeight: '600',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#013358',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  searchContainer: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d1d5db',
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 15,
    color: '#1f2937',
  },
  listContent: {
    padding: 20,
    paddingBottom: 40,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  avatarBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#e0f2fe',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarImg: {
    width: 44,
    height: 44,
    borderRadius: 10,
    marginRight: 12,
    borderWidth: 1.5,
    borderColor: '#013358',
  },
  avatarText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#013358',
  },
  houseNumber: {
    fontSize: 15,
    fontWeight: '800',
    color: '#013358',
  },
  leaderName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1f2937',
    marginTop: 1,
  },
  contactDetails: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  syncBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
    marginLeft: 8,
  },
  syncedBadge: {
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  pendingBadge: {
    backgroundColor: '#fef3c7',
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  syncText: {
    fontSize: 10,
    fontWeight: '800',
  },
  syncedText: {
    color: '#059669',
  },
  pendingText: {
    color: '#d97706',
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 12,
  },
  cardDetails: {
    gap: 6,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 13,
    color: '#475569',
  },
  telcoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#f1f5f9',
  },
  telcoPill: {
    backgroundColor: '#e2e8f0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  telcoPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#334155',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#374151',
    marginTop: 16,
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#013358',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});
