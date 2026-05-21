import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCorrectionStore } from '../../store/correctionStore';
import StateSelect from '../../components/common/StateSelect';
import LGASelect from '../../components/common/LGASelect';
import WardSelect from '../../components/common/WardSelect';
import PollingUnitSelect from '../../components/common/PollingUnitSelect';
import type { CorrectionFarmerSummary } from '../../types/correction';

const PRIMARY = '#013358';
const CARD_BG = '#ffffff';

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const colour =
    status === 'Verified'
      ? { bg: '#dcfce7', text: '#166534' }
      : status === 'Rejected'
      ? { bg: '#fee2e2', text: '#991b1b' }
      : { bg: '#dbeafe', text: '#1e40af' };
  return (
    <View
      style={{
        backgroundColor: colour.bg,
        borderRadius: 12,
        paddingHorizontal: 8,
        paddingVertical: 2,
        alignSelf: 'flex-start',
      }}
    >
      <Text style={{ color: colour.text, fontSize: 11, fontWeight: '600' }}>
        {status}
      </Text>
    </View>
  );
}

// ─── Farmer row card ──────────────────────────────────────────────────────────

function FarmerCard({
  item,
  onPress,
}: {
  item: CorrectionFarmerSummary;
  onPress: () => void;
}) {
  const name = [item.firstName, item.middleName, item.lastName]
    .filter(Boolean)
    .join(' ');
  const location = [item.lga, item.state].filter(Boolean).join(', ');

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={{
        backgroundColor: CARD_BG,
        borderRadius: 12,
        padding: 14,
        marginBottom: 10,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
      }}
    >
      {/* Avatar */}
      <View
        style={{
          width: 42,
          height: 42,
          borderRadius: 21,
          backgroundColor: '#dbeafe',
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 12,
        }}
      >
        <Text style={{ color: PRIMARY, fontWeight: '700', fontSize: 16 }}>
          {item.firstName?.[0] ?? '?'}
        </Text>
      </View>

      {/* Info */}
      <View style={{ flex: 1 }}>
        <Text
          style={{ fontWeight: '700', fontSize: 15, color: '#0f172a', marginBottom: 2 }}
          numberOfLines={1}
        >
          {name}
        </Text>
        <Text style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }} numberOfLines={1}>
          NIN: {item.nin} · {item.phone}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <StatusBadge status={item.status} />
          {location ? (
            <Text style={{ fontSize: 11, color: '#94a3b8' }} numberOfLines={1}>
              {location}
            </Text>
          ) : null}
        </View>
      </View>

      <Ionicons name="chevron-forward" size={16} color="#cbd5e1" style={{ marginLeft: 6 }} />
    </TouchableOpacity>
  );
}

// ─── Filter panel ─────────────────────────────────────────────────────────────

function FilterPanel() {
  const { filter, setFilter } = useCorrectionStore();
  const [showAdvanced, setShowAdvanced] = useState(false);

  return (
    <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
      {/* Name / quick search */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: CARD_BG,
          borderRadius: 10,
          paddingHorizontal: 12,
          height: 44,
          marginBottom: 8,
          borderWidth: 1,
          borderColor: '#e2e8f0',
        }}
      >
        <Ionicons name="search-outline" size={18} color="#94a3b8" style={{ marginRight: 8 }} />
        <TextInput
          style={{ flex: 1, fontSize: 14, color: '#0f172a' }}
          placeholder="Search by name or phone…"
          placeholderTextColor="#94a3b8"
          value={filter.search}
          onChangeText={(v) => setFilter({ search: v })}
          returnKeyType="search"
        />
        {filter.search ? (
          <TouchableOpacity onPress={() => setFilter({ search: '' })}>
            <Ionicons name="close-circle" size={18} color="#94a3b8" />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* NIN / BVN row */}
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
        {(['nin', 'bvn'] as const).map((field) => (
          <View
            key={field}
            style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: CARD_BG,
              borderRadius: 10,
              paddingHorizontal: 10,
              height: 44,
              borderWidth: 1,
              borderColor: '#e2e8f0',
            }}
          >
            <TextInput
              style={{ flex: 1, fontSize: 13, color: '#0f172a' }}
              placeholder={field.toUpperCase()}
              placeholderTextColor="#94a3b8"
              value={filter[field]}
              onChangeText={(v) => setFilter({ [field]: v })}
              keyboardType="number-pad"
              autoCapitalize="none"
            />
            {filter[field] ? (
              <TouchableOpacity onPress={() => setFilter({ [field]: '' })}>
                <Ionicons name="close-circle" size={16} color="#94a3b8" />
              </TouchableOpacity>
            ) : null}
          </View>
        ))}
      </View>

      {/* Advanced toggle */}
      <TouchableOpacity
        onPress={() => setShowAdvanced((v) => !v)}
        style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}
        activeOpacity={0.7}
      >
        <Ionicons
          name={showAdvanced ? 'chevron-up' : 'chevron-down'}
          size={14}
          color="#4f46e5"
        />
        <Text style={{ fontSize: 12, color: '#4f46e5', fontWeight: '600', marginLeft: 4 }}>
          {showAdvanced ? 'Hide location filters' : 'Filter by location'}
        </Text>
      </TouchableOpacity>

      {showAdvanced && (
        <View style={{ gap: 8, marginBottom: 8 }}>
          <StateSelect
            selectedValue={filter.state}
            onValueChange={(v: string) => setFilter({ state: v, lga: '', ward: '', pollingUnit: '' })}
            placeholder="Select State"
            error={null}
          />
          <LGASelect
            selectedState={filter.state}
            selectedValue={filter.lga}
            onValueChange={(v: string) => setFilter({ lga: v, ward: '', pollingUnit: '' })}
            placeholder="Select LGA"
            error={null}
          />
          <WardSelect
            selectedState={filter.state}
            selectedLGA={filter.lga}
            selectedValue={filter.ward}
            onValueChange={(v: string) => setFilter({ ward: v, pollingUnit: '' })}
            placeholder="Select Ward"
            error={null}
          />
          <PollingUnitSelect
            selectedState={filter.state}
            selectedLGA={filter.lga}
            selectedWard={filter.ward}
            selectedValue={filter.pollingUnit}
            onValueChange={(v: string) => setFilter({ pollingUnit: v })}
            placeholder="Select Polling Unit"
            error={null}
          />
        </View>
      )}
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function FarmerSearchScreen({ navigation }: { navigation: any }) {
  const { results, searching, searchError, pagination, hasSearched, search, loadNextPage, resetFilter } =
    useCorrectionStore();

  const handleSearch = () => search(1);

  const handleSelect = (item: CorrectionFarmerSummary) => {
    navigation.navigate('CorrectionDetail', { farmerId: item.id });
  };

  const isFiltersEmpty =
    !useCorrectionStore.getState().filter.search &&
    !useCorrectionStore.getState().filter.nin &&
    !useCorrectionStore.getState().filter.bvn &&
    !useCorrectionStore.getState().filter.state;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#f1f5f9' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="light-content" backgroundColor={PRIMARY} />

      {/* Header */}
      <View
        style={{
          backgroundColor: PRIMARY,
          paddingTop: 52,
          paddingBottom: 16,
          paddingHorizontal: 20,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 12 }}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700' }}>
            Data Correction
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => navigation.navigate('AgentProfile')}
          style={{ padding: 4 }}
        >
          <Ionicons name="person-circle-outline" size={26} color="#fff" />
        </TouchableOpacity>
      </View>

      <FilterPanel />

      {/* Search / Reset row */}
      <View style={{ flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 12 }}>
        <TouchableOpacity
          onPress={handleSearch}
          disabled={searching}
          style={{
            flex: 1,
            backgroundColor: PRIMARY,
            borderRadius: 10,
            height: 44,
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'row',
            opacity: searching ? 0.7 : 1,
          }}
        >
          {searching ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Ionicons name="search" size={16} color="#fff" style={{ marginRight: 6 }} />
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>Search</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={resetFilter}
          style={{
            width: 44,
            height: 44,
            backgroundColor: '#e2e8f0',
            borderRadius: 10,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="refresh" size={18} color="#475569" />
        </TouchableOpacity>
      </View>

      {/* Results */}
      {searchError ? (
        <View style={{ alignItems: 'center', paddingTop: 40, paddingHorizontal: 32 }}>
          <Ionicons name="warning-outline" size={40} color="#f87171" />
          <Text style={{ color: '#ef4444', fontSize: 14, marginTop: 10, textAlign: 'center' }}>
            {searchError}
          </Text>
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}
          renderItem={({ item }) => (
            <FarmerCard item={item} onPress={() => handleSelect(item)} />
          )}
          onEndReached={loadNextPage}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            pagination && pagination.page < pagination.pages && searching ? (
              <ActivityIndicator color={PRIMARY} style={{ padding: 16 }} />
            ) : null
          }
          ListEmptyComponent={
            hasSearched && !searching ? (
              <View style={{ alignItems: 'center', paddingTop: 60 }}>
                <Ionicons name="people-outline" size={48} color="#cbd5e1" />
                <Text style={{ color: '#94a3b8', fontSize: 14, marginTop: 12 }}>
                  No farmers found
                </Text>
              </View>
            ) : !hasSearched ? (
              <View style={{ alignItems: 'center', paddingTop: 60 }}>
                <Ionicons name="search-outline" size={48} color="#cbd5e1" />
                <Text style={{ color: '#94a3b8', fontSize: 14, marginTop: 12, textAlign: 'center' }}>
                  Set filters above and tap Search
                </Text>
              </View>
            ) : null
          }
        />
      )}

      {/* Result count */}
      {pagination && results.length > 0 && (
        <View style={{ paddingHorizontal: 20, paddingBottom: 8 }}>
          <Text style={{ fontSize: 12, color: '#94a3b8' }}>
            Showing {results.length} of {pagination.total} farmers
          </Text>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}
