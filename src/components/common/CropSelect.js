import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const CROPS = [
  'Maize', 'Rice', 'Cassava', 'Yam', 'Cocoa', 'Oil Palm', 'Plantain', 'Banana',
  'Tomato', 'Pepper', 'Onion', 'Okra', 'Beans', 'Groundnut', 'Sesame', 'Cotton',
  'Sorghum', 'Millet', 'Cowpea', 'Soybean', 'Sweet Potato', 'Irish Potato',
  'Wheat', 'Watermelon', 'Cucumber', 'Lettuce', 'Cabbage', 'Carrot', 'Spinach',
  'Pineapple', 'Mango', 'Orange', 'Lemon', 'Guava', 'Papaya', 'Avocado',
  'Coffee', 'Tea', 'Ginger', 'Turmeric', 'Garlic', 'Cinnamon', 'Cloves', 'Nutmeg'
];

export default function CropSelect({ selectedValue, onValueChange, placeholder, error }) {
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCrops = CROPS.filter(crop =>
    crop.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelect = (crop) => {
    onValueChange(crop);
    setModalVisible(false);
    setSearchQuery('');
  };

  const renderCropItem = ({ item }) => (
    <TouchableOpacity
      style={styles.cropItem}
      onPress={() => handleSelect(item)}
    >
      <Text style={styles.cropItemText}>{item}</Text>
      {selectedValue === item && (
        <Ionicons name="checkmark" size={20} color="#013358" />
      )}
    </TouchableOpacity>
  );

  return (
    <View>
      <TouchableOpacity
        style={[styles.selectButton, error && styles.selectButtonError]}
        onPress={() => setModalVisible(true)}
      >
        <Ionicons name="leaf-outline" size={20} color="#9ca3af" style={styles.selectIcon} />
        <Text style={[styles.selectText, !selectedValue && styles.placeholderText]}>
          {selectedValue || placeholder}
        </Text>
        <Ionicons name="chevron-down" size={20} color="#9ca3af" />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <Ionicons name="close" size={24} color="#374151" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Select Crop</Text>
            <View style={styles.headerSpacer} />
          </View>

          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#9ca3af" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search crops..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
          </View>

          <FlatList
            data={filteredCrops}
            renderItem={renderCropItem}
            keyExtractor={(item) => item}
            style={styles.cropList}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    backgroundColor: '#f9fafb',
    paddingVertical: 16,
    paddingHorizontal: 16,
    minHeight: 56,
  },
  selectButtonError: {
    borderColor: '#ef4444',
  },
  selectIcon: {
    marginRight: 12,
  },
  selectText: {
    flex: 1,
    fontSize: 16,
    color: '#1f2937',
  },
  placeholderText: {
    color: '#9ca3af',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    backgroundColor: '#ffffff',
  },
  closeButton: {
    padding: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  headerSpacer: {
    width: 32,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 20,
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
  cropList: {
    flex: 1,
  },
  cropItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  cropItemText: {
    fontSize: 16,
    color: '#1f2937',
  },
});
