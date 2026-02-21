import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  RefreshControl,
  TextInput,
  Alert,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useFarmerStore } from '../store/farmerStore';
import LoadingScreen from './LoadingScreen';

export default function FarmersListScreen({ navigation }) {
  const { farmers, loading, fetchFarmers, loadMoreFarmers, pagination, totalCount } = useFarmerStore();
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredFarmers, setFilteredFarmers] = useState([]);
  const [loadingMore, setLoadingMore] = useState(false);

  // Use useFocusEffect to reload farmers when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      console.log('📱 FarmersListScreen focused, fetching farmers...');
      loadFarmers();
    }, [fetchFarmers]) // Add fetchFarmers as dependency
  );

  useEffect(() => {
    filterFarmers();
  }, [farmers, searchQuery]);

  useEffect(() => {
    console.log('Farmers updated:', farmers?.length || 0);
  }, [farmers]);

  const loadFarmers = async () => {
    // Prevent multiple simultaneous calls
    if (loading) {
      console.log('📱 FarmersListScreen: Already loading, skipping...');
      return;
    }
    
    try {
      console.log('📱 FarmersListScreen: Loading farmers...');
      await fetchFarmers(true); // Reset and fetch first page
      console.log('📱 FarmersListScreen: Farmers loaded, count:', farmers?.length || 0);
      console.log('📱 FarmersListScreen: Total count:', totalCount);
    } catch (error) {
      console.error('📱 FarmersListScreen: Error loading farmers:', error);
      Alert.alert('Error', `Failed to load farmers: ${error.message}`);
    }
  };

  const handleLoadMore = async () => {
    if (loadingMore || loading || !pagination?.hasMore) {
      return;
    }

    try {
      setLoadingMore(true);
      await loadMoreFarmers();
    } catch (error) {
      console.error('📱 Error loading more farmers:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadFarmers();
    setRefreshing(false);
  };

  const filterFarmers = () => {
    console.log('📱 FarmersListScreen: Filtering farmers...');
    console.log('📱 Raw farmers from store:', farmers);
    console.log('📱 Raw farmers length:', farmers?.length || 0);
    console.log('📱 Search query:', searchQuery);
    
    if (!farmers || farmers.length === 0) {
      console.log('📱 No farmers to filter');
      setFilteredFarmers([]);
      return;
    }

    if (!searchQuery.trim()) {
      console.log('📱 No search query, showing all farmers');
      setFilteredFarmers(farmers);
      return;
    }

    const filtered = farmers.filter((farmer) => {
      const query = searchQuery.toLowerCase();
      const fullName = `${farmer.firstName || ''} ${farmer.lastName || ''}`.toLowerCase();
      const email = (farmer.email || '').toLowerCase();
      const phone = farmer.phone || '';
      const nin = farmer.nin || '';

      return (
        fullName.includes(query) ||
        email.includes(query) ||
        phone.includes(query) ||
        nin.includes(query)
      );
    });

    console.log('📱 Filtered farmers length:', filtered.length);
    setFilteredFarmers(filtered);
  };

  const renderFarmerCard = ({ item: farmer }) => (
    <TouchableOpacity
      style={styles.farmerCard}
      onPress={() => navigation.navigate('FarmerDetails', { farmerId: farmer.id, farmer })}
    >
      <View style={styles.cardHeader}>
        <View style={styles.avatarContainer}>
          {farmer.photoUrl ? (
            <Image
              source={{ uri: farmer.photoUrl }}
              style={styles.avatarImage}
              defaultSource={require('../../assets/icon.png')}
            />
          ) : (
            <Text style={styles.avatarText}>
              {farmer.firstName?.[0] || '?'}{farmer.lastName?.[0] || '?'}
            </Text>
          )}
        </View>
        <View style={styles.farmerInfo}>
          <Text style={styles.farmerName}>
            {farmer.firstName} {farmer.lastName}
          </Text>
          <Text style={styles.farmerDetails}>
            NIN: {farmer.nin}
          </Text>
          <Text style={styles.farmerDetails}>
            {farmer.phone}
          </Text>
          {farmer.email && (
            <Text style={styles.farmerDetails}>
              {farmer.email}
            </Text>
          )}
        </View>
        <View style={styles.cardActions}>
          <TouchableOpacity
            style={styles.addFarmButton}
            onPress={() => navigation.navigate('AddFarm', { 
              farmerId: farmer.id, 
              farmer: farmer 
            })}
          >
            <Ionicons name="add-circle" size={24} color="#10b981" />
            <Text style={styles.addFarmText}>Add Farm</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.cardFooter}>
        <View style={styles.locationInfo}>
          <Ionicons name="location-outline" size={16} color="#6b7280" />
          <Text style={styles.locationText}>
            {[farmer.ward, farmer.lga, farmer.state].filter(Boolean).join(', ') || 'Location not specified'}
          </Text>
        </View>
        <Text style={styles.registrationDate}>
          Registered: {new Date(farmer.createdAt || farmer.registrationDate || Date.now()).toLocaleDateString()}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="people-outline" size={80} color="#d1d5db" />
      <Text style={styles.emptyTitle}>No Farmers Found</Text>
      <Text style={styles.emptyDescription}>
        {searchQuery ? 'No farmers match your search criteria' : 'Start by adding your first farmer'}
      </Text>
      {!searchQuery && (
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('AddFarmer')}
        >
          <Ionicons name="add" size={20} color="#ffffff" />
          <Text style={styles.addButtonText}>Add First Farmer</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (loading && (!farmers || farmers.length === 0)) {
    return <LoadingScreen message="Loading farmers..." />;
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Registered Farmers</Text>
        <Text style={styles.subtitle}>
          {totalCount || farmers?.length || 0} farmer{(totalCount || farmers?.length || 0) !== 1 ? 's' : ''} registered
          {farmers?.length > 0 && farmers.length < (totalCount || 0) && ` (Showing ${farmers.length})`}
        </Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#9ca3af" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, NIN, phone, or email"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={() => setSearchQuery('')}
            >
              <Ionicons name="close-circle" size={20} color="#9ca3af" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Farmers List */}
      <FlatList
        data={filteredFarmers}
        renderItem={renderFarmerCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={() => {
          if (loadingMore) {
            return (
              <View style={{ padding: 20, alignItems: 'center' }}>
                <Text style={{ color: '#6b7280' }}>Loading more...</Text>
              </View>
            );
          }
          if (pagination?.hasMore) {
            return (
              <View style={{ padding: 20, alignItems: 'center' }}>
                <Text style={{ color: '#9ca3af', fontSize: 12 }}>
                  Scroll down to load more
                </Text>
              </View>
            );
          }
          return null;
        }}
      />

      {/* Floating Add Button */}
      {farmers && farmers.length > 0 && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => navigation.navigate('AddFarmer')}
        >
          <Ionicons name="add" size={28} color="#ffffff" />
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
  },
  searchContainer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1f2937',
  },
  clearButton: {
    padding: 4,
  },
  listContainer: {
    padding: 24,
    paddingBottom: 100,
  },
  farmerCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#013358',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    overflow: 'hidden',
  },
  avatarImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  farmerInfo: {
    flex: 1,
  },
  farmerName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  farmerDetails: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 2,
  },
  cardActions: {
    alignItems: 'center',
    padding: 8,
  },
  addFarmButton: {
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f0fdf4',
    minWidth: 70,
  },
  addFarmText: {
    fontSize: 12,
    color: '#10b981',
    fontWeight: '600',
    marginTop: 2,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 4,
  },
  registrationDate: {
    fontSize: 12,
    color: '#9ca3af',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 32,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#013358',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#013358',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
});
