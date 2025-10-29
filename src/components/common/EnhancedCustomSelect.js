import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const EnhancedCustomSelect = ({ 
  options = [], 
  selectedValue, 
  onValueChange, 
  placeholder = 'Select an option',
  style,
  error = false,
  disabled = false,
  icon = 'options-outline',
  searchable = true,
  title = 'Select Option'
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Ensure options is always an array
  const safeOptions = Array.isArray(options) ? options : [];

  // Filter options based on search query
  const filteredOptions = searchable 
    ? safeOptions.filter(option => 
        option.label && option.label.toLowerCase().includes(searchQuery.toLowerCase())
      ).filter((option, index, self) => 
        index === self.findIndex(o => o.value === option.value)
      )
    : safeOptions;

  const handleSelect = (option) => {
    if (onValueChange) {
      onValueChange(option.value);
    }
    setModalVisible(false);
    setSearchQuery('');
  };

  const getSelectedOptionLabel = () => {
    if (selectedValue === null || selectedValue === undefined) return placeholder;
    const selectedOption = safeOptions.find(option => 
      String(option.value) === String(selectedValue)
    );
    return selectedOption ? selectedOption.label : placeholder;
  };

  const renderOptionItem = ({ item }) => {
    const isSelected = String(item.value) === String(selectedValue);
    return (
      <TouchableOpacity
        style={[
          styles.optionItem,
          isSelected && styles.selectedOption
        ]}
        onPress={() => handleSelect(item)}
      >
        <Text style={[
          styles.optionText,
          isSelected && styles.selectedOptionText
        ]}>
          {item.label || 'Unnamed Option'}
        </Text>
        {isSelected && (
          <Ionicons name="checkmark" size={20} color="#013358" />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity
        style={[
          styles.selectButton,
          error && styles.selectButtonError,
          disabled && styles.selectButtonDisabled
        ]}
        onPress={() => !disabled && setModalVisible(true)}
        disabled={disabled}
      >
        <Ionicons 
          name={icon} 
          size={20} 
          color={disabled ? '#9ca3af' : '#9ca3af'} 
          style={styles.selectIcon} 
        />
        <Text style={[
          styles.selectText,
          !selectedValue && styles.placeholderText,
          disabled && styles.disabledText
        ]}>
          {getSelectedOptionLabel()}
        </Text>
        <Ionicons 
          name="chevron-down" 
          size={20} 
          color={disabled ? '#9ca3af' : '#9ca3af'} 
        />
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
            <Text style={styles.modalTitle}>{title}</Text>
            <View style={styles.headerSpacer} />
          </View>

          {searchable && (
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color="#9ca3af" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder={`Search ${title.toLowerCase()}...`}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus
              />
            </View>
          )}

          <FlatList
            data={filteredOptions}
            renderItem={renderOptionItem}
            keyExtractor={(item, index) => item.value ? String(item.value) : `option-${index}`}
            style={styles.optionsList}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyList}>
                <Text style={styles.emptyText}>
                  {searchQuery ? 'No matches found' : 'No options available'}
                </Text>
              </View>
            }
          />
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
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
  selectButtonDisabled: {
    backgroundColor: '#f9fafb',
    borderColor: '#e5e7eb',
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
  disabledText: {
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
  optionsList: {
    flex: 1,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  selectedOption: {
    backgroundColor: '#eff6ff',
  },
  optionText: {
    fontSize: 16,
    color: '#1f2937',
    flex: 1,
  },
  selectedOptionText: {
    color: '#013358',
    fontWeight: '500',
  },
  emptyList: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#9ca3af',
    fontStyle: 'italic',
  },
});

export default EnhancedCustomSelect;
