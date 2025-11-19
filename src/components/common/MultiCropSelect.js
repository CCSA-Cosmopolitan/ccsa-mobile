import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const CROPS = [
  'Maize', 'Rice', 'Cassava', 'Yam', 'Cocoa', 'Oil Palm', 'Plantain', 'Banana',
  'Tomato', 'Pepper', 'Onion', 'Okra', 'Beans', 'Groundnut', 'Sesame', 'Cotton',
  'Sorghum', 'Millet', 'Cowpea', 'Soybean', 'Sweet Potato', 'Irish Potato',
  'Wheat', 'Watermelon', 'Cucumber', 'Lettuce', 'Cabbage', 'Carrot', 'Spinach',
  'Pineapple', 'Mango', 'Orange', 'Lemon', 'Guava', 'Papaya', 'Avocado',
  'Coffee', 'Tea', 'Ginger', 'Turmeric', 'Garlic', 'Cinnamon', 'Cloves', 'Nutmeg',
];

export default function MultiCropSelect({ 
  selectedValues = [], 
  onValuesChange, 
  placeholder = "Select crops", 
  error = false,
  maxSelections = 5 
}) {
  const [modalVisible, setModalVisible] = useState(false);
  const [tempSelectedValues, setTempSelectedValues] = useState(selectedValues);

  const handleItemToggle = (crop) => {
    const isSelected = tempSelectedValues.includes(crop);
    
    if (isSelected) {
      // Remove from selection
      setTempSelectedValues(prev => prev.filter(item => item !== crop));
    } else {
      // Add to selection (if under limit)
      if (tempSelectedValues.length < maxSelections) {
        setTempSelectedValues(prev => [...prev, crop]);
      }
    }
  };

  const handleConfirm = () => {
    onValuesChange(tempSelectedValues);
    setModalVisible(false);
  };

  const handleCancel = () => {
    setTempSelectedValues(selectedValues);
    setModalVisible(false);
  };

  const displayText = selectedValues.length > 0 
    ? `${selectedValues.length} crop(s) selected`
    : placeholder;

  const renderCropItem = ({ item }) => {
    const isSelected = tempSelectedValues.includes(item);
    
    return (
      <TouchableOpacity
        style={[styles.cropItem, isSelected && styles.selectedCropItem]}
        onPress={() => handleItemToggle(item)}
      >
        <Text style={[styles.cropText, isSelected && styles.selectedCropText]}>
          {item}
        </Text>
        {isSelected && (
          <Ionicons name="checkmark" size={20} color="#013358" />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.selector, error && styles.selectorError]}
        onPress={() => setModalVisible(true)}
      >
        <Text style={[styles.selectorText, selectedValues.length === 0 && styles.placeholderText]}>
          {displayText}
        </Text>
        <Ionicons name="chevron-down" size={20} color="#9ca3af" />
      </TouchableOpacity>

      {selectedValues.length > 0 && (
        <View style={styles.selectedCropsContainer}>
          {selectedValues.map((crop, index) => (
            <View key={index} style={styles.selectedCropChip}>
              <Text style={styles.selectedCropChipText}>{crop}</Text>
              <TouchableOpacity
                onPress={() => onValuesChange(selectedValues.filter(item => item !== crop))}
              >
                <Ionicons name="close" size={16} color="#6b7280" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={handleCancel}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Secondary Crops</Text>
              <Text style={styles.modalSubtitle}>
                Choose up to {maxSelections} crops ({tempSelectedValues.length}/{maxSelections} selected)
              </Text>
            </View>

            <FlatList
              data={CROPS}
              renderItem={renderCropItem}
              keyExtractor={(item) => item}
              numColumns={2}
              contentContainerStyle={styles.cropsList}
              showsVerticalScrollIndicator={false}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
                <Text style={styles.confirmButtonText}>Confirm Selection</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  selector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    backgroundColor: '#f9fafb',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  selectorError: {
    borderColor: '#ef4444',
  },
  selectorText: {
    fontSize: 16,
    color: '#1f2937',
    flex: 1,
  },
  placeholderText: {
    color: '#9ca3af',
  },
  selectedCropsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    gap: 8,
  },
  selectedCropChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    borderColor: '#013358',
    borderWidth: 1,
    borderRadius: 20,
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  selectedCropChipText: {
    fontSize: 14,
    color: '#013358',
    marginRight: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    margin: 20,
    maxHeight: '80%',
    width: '90%',
  },
  modalHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  cropsList: {
    padding: 16,
  },
  cropItem: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    margin: 4,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#ffffff',
  },
  selectedCropItem: {
    backgroundColor: '#eff6ff',
    borderColor: '#013358',
  },
  cropText: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  selectedCropText: {
    color: '#013358',
    fontWeight: '500',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  cancelButton: {
    flex: 1,
    marginRight: 8,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
  },
  confirmButton: {
    flex: 1,
    marginLeft: 8,
    backgroundColor: '#013358',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '500',
  },
});
