import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { householdService, HouseholdRecord } from '../../services/householdService';

export default function HouseholdSearchScreen({ navigation }: { navigation: any }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<HouseholdRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'SYNCED' | 'PENDING'>('ALL');

  useEffect(() => {
    if (searchQuery.trim().length > 1) {
      handleSearch();
    } else if (!searchQuery.trim()) {
      setSearchResults([]);
      setHasSearched(false);
    }
  }, [searchQuery]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    try {
      setLoading(true);
      setHasSearched(true);
      const results = await householdService.searchHouseholds(searchQuery.trim());
      setSearchResults(results);
    } catch (error) {
      console.error('Search households error:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setHasSearched(false);
  };

  const filteredResults = searchResults.filter((item) => {
    if (filterStatus === 'SYNCED') return item.status === 'synced';
    if (filterStatus === 'PENDING') return item.status !== 'synced';
    return true;
  });

  const renderHouseholdItem = ({ item }: { item: HouseholdRecord }) => {
    const isSynced = item.status === 'synced';
    const fullName = `${item.headFirstName || ''} ${item.headLastName || ''}`.trim() || 'Household Head';
    const initials =
      (item.headFirstName?.[0] || 'H') + (item.headLastName?.[0] || 'H');

    return (
      <TouchableOpacity
        style={styles.resultCard}
        onPress={() => navigation.navigate('HouseholdDetails', { household: item })}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          {item.headPhotoUrl ? (
            <Image source={{ uri: item.headPhotoUrl }} style={styles.avatarImg} />
          ) : (
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
          )}

          <View style={styles.householdInfo}>
            <Text style={styles.houseNumber}>{item.houseNumber}</Text>
            <Text style={styles.headName}>{fullName}</Text>
            <Text style={styles.contactDetails}>
              {item.headPhone ? `Tel: ${item.headPhone}` : 'No phone'}{' '}
              {item.headNin ? `• NIN: ${item.headNin}` : ''}
            </Text>
          </View>

          <View style={[styles.badge, isSynced ? styles.badgeSynced : styles.badgePending]}>
            <Ionicons
              name={isSynced ? 'checkmark-circle' : 'time-outline'}
              size={12}
              color={isSynced ? '#059669' : '#d97706'}
            />
            <Text style={[styles.badgeText, isSynced ? styles.badgeTextSynced : styles.badgeTextPending]}>
              {isSynced ? 'SYNCED' : 'OFFLINE'}
            </Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.locationInfo}>
            <Ionicons name="location-outline" size={15} color="#6b7280" />
            <Text style={styles.locationText} numberOfLines={1}>
              {[item.ward, item.lga, item.state].filter(Boolean).join(', ') || 'Location captured'}
            </Text>
          </View>

          <View style={styles.occupantsInfo}>
            <Ionicons name="people-outline" size={15} color="#6b7280" style={{ marginRight: 4 }} />
            <Text style={styles.occupantsText}>
              {item.totalHouseholdMembers || 1} {item.totalHouseholdMembers === 1 ? 'person' : 'residents'}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f9fafb" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Search Households</Text>
        <Text style={styles.subtitle}>
          Look up enrolled households by house code, leader name, phone or NIN
        </Text>
      </View>

      {/* Search Input */}
      <View style={styles.searchSection}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#9ca3af" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Type house number, name, NIN or LGA..."
            placeholderTextColor="#9ca3af"
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            onSubmitEditing={handleSearch}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={clearSearch} style={{ padding: 4 }}>
              <Ionicons name="close-circle" size={18} color="#9ca3af" />
            </TouchableOpacity>
          )}
        </View>

        {/* Quick Filter Chips */}
        {hasSearched && (
          <View style={styles.filtersRow}>
            {(['ALL', 'SYNCED', 'PENDING'] as const).map((st) => (
              <TouchableOpacity
                key={st}
                style={[styles.filterChip, filterStatus === st && styles.filterChipActive]}
                onPress={() => setFilterStatus(st)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    filterStatus === st && styles.filterChipTextActive,
                  ]}
                >
                  {st === 'ALL' ? 'All Results' : st === 'SYNCED' ? 'Synced' : 'Offline Pending'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#013358" />
          <Text style={styles.loadingText}>Searching registry...</Text>
        </View>
      ) : hasSearched && filteredResults.length > 0 ? (
        <FlatList
          data={filteredResults}
          renderItem={renderHouseholdItem}
          keyExtractor={(item) => item.offlineId || item.houseNumber}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      ) : hasSearched && filteredResults.length === 0 ? (
        <View style={styles.centerContainer}>
          <Ionicons name="alert-circle-outline" size={60} color="#9ca3af" />
          <Text style={styles.emptyTitle}>No Matching Households</Text>
          <Text style={styles.emptySubtitle}>
            No records matched &quot;{searchQuery}&quot;. Please verify the house number or leader name.
          </Text>
        </View>
      ) : (
        <View style={styles.centerContainer}>
          <Ionicons name="search-outline" size={72} color="#d1d5db" />
          <Text style={styles.initialTitle}>Instant Registry Lookup</Text>
          <Text style={styles.initialSubtitle}>
            Search by standard House ID (e.g. NG-KAN-...), Head of Household NIN, full name, or phone number.
          </Text>
        </View>
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
    paddingTop: 16,
    paddingBottom: 14,
    backgroundColor: '#f9fafb',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
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
  searchSection: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 52,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#1f2937',
  },
  filtersRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  filterChipActive: {
    backgroundColor: '#013358',
    borderColor: '#013358',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  filterChipTextActive: {
    color: '#ffffff',
  },
  listContainer: {
    padding: 20,
  },
  resultCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#013358',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarImg: {
    width: 46,
    height: 46,
    borderRadius: 23,
    marginRight: 12,
    borderWidth: 1.5,
    borderColor: '#013358',
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  householdInfo: {
    flex: 1,
  },
  houseNumber: {
    fontSize: 15,
    fontWeight: '700',
    color: '#013358',
    letterSpacing: 0.3,
  },
  headName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginTop: 2,
  },
  contactDetails: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  badgeSynced: {
    backgroundColor: '#d1fae5',
  },
  badgePending: {
    backgroundColor: '#fef3c7',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  badgeTextSynced: {
    color: '#065f46',
  },
  badgeTextPending: {
    color: '#92400e',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
    gap: 4,
  },
  locationText: {
    fontSize: 13,
    color: '#6b7280',
    flex: 1,
  },
  occupantsInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  occupantsText: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '500',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6b7280',
  },
  initialTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#374151',
    marginTop: 16,
  },
  initialSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#374151',
    marginTop: 14,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 6,
  },
});
