import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
  Platform,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const CustomSelect = ({ 
  options = [], 
  selectedValue, 
  onValueChange, 
  placeholder = 'Select an option',
  style,
  error = false,
  disabled = false 
}) => {
  const [modalVisible, setModalVisible] = useState(false);

  // Ensure options is always an array
  const safeOptions = Array.isArray(options) ? options : [];
  
  // Debug logging
  if (modalVisible && safeOptions.length > 0) {
    console.log('📱 Modal opened on', Platform.OS, 'with', safeOptions.length, 'options');
    console.log('First option:', safeOptions[0]);
  }
  
  // Find selected option, ensuring value comparison works for different types
  const selectedOption = safeOptions.find(option => {
    if (selectedValue === null || selectedValue === undefined) return false;
    return String(option.value) === String(selectedValue);
  });
  
  const displayText = selectedOption ? selectedOption.label : placeholder;

  // Use modal approach for both iOS and Android for consistency
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
        <Text style={[
          styles.selectButtonText,
          !selectedValue && styles.placeholderText,
          disabled && styles.disabledText
        ]}>
          {displayText}
        </Text>
        <Ionicons 
          name="chevron-down" 
          size={20} 
          color={disabled ? '#9ca3af' : '#6b7280'} 
        />
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={Platform.OS === 'android'}
        presentationStyle={Platform.OS === 'ios' ? 'pageSheet' : undefined}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        {Platform.OS === 'ios' ? (
          // iOS Modal Content - Simple structure for pageSheet with SafeAreaView
          <SafeAreaView style={styles.iosModalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#374151" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>{placeholder}</Text>
              <View style={styles.headerSpacer} />
            </View>
            
            {safeOptions.length > 0 ? (
              <FlatList
                data={safeOptions}
                keyExtractor={(item, index) => item.value ? String(item.value) : `option-${index}`}
                renderItem={({ item }) => {
                  const isSelected = String(item.value) === String(selectedValue);
                  return (
                    <TouchableOpacity
                      style={[
                        styles.optionItem,
                        isSelected && styles.selectedOption
                      ]}
                      onPress={() => {
                        console.log('✅ Option selected:', item.label, item.value);
                        if (onValueChange) {
                          onValueChange(item.value);
                        }
                        setModalVisible(false);
                      }}
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
                }}
                style={styles.optionsList}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 20 }}
                ListEmptyComponent={
                  <View style={styles.emptyList}>
                    <Text style={styles.emptyText}>No options available</Text>
                  </View>
                }
              />
            ) : (
              <View style={styles.emptyList}>
                <Text style={styles.emptyText}>No options available</Text>
              </View>
            )}
          </SafeAreaView>
        ) : (
          // Android Modal Content - With overlay
          <View style={styles.modalOverlay}>
            <TouchableOpacity 
              style={styles.modalBackdrop}
              activeOpacity={1}
              onPress={() => setModalVisible(false)}
            />
            <View style={styles.androidModalContent}>
              <View style={styles.modalHeader}>
                <TouchableOpacity
                  onPress={() => setModalVisible(false)}
                  style={styles.closeButton}
                >
                  <Ionicons name="close" size={24} color="#374151" />
                </TouchableOpacity>
                <Text style={styles.modalTitle}>{placeholder}</Text>
                <View style={styles.headerSpacer} />
              </View>
              
              <FlatList
                data={safeOptions}
                keyExtractor={(item, index) => item.value ? String(item.value) : `option-${index}`}
                renderItem={({ item }) => {
                  const isSelected = String(item.value) === String(selectedValue);
                  return (
                    <TouchableOpacity
                      style={[
                        styles.optionItem,
                        isSelected && styles.selectedOption
                      ]}
                      onPress={() => {
                        console.log('Option selected:', item.label, item.value);
                        if (onValueChange) {
                          onValueChange(item.value);
                        }
                        setModalVisible(false);
                      }}
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
                }}
                style={styles.optionsList}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 20 }}
                ListEmptyComponent={
                  <View style={styles.emptyList}>
                    <Text style={styles.emptyText}>No options available</Text>
                  </View>
                }
              />
            </View>
          </View>
        )}
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    backgroundColor: '#f9fafb',
    minHeight: 56,
  },
  selectButtonError: {
    borderColor: '#ef4444',
  },
  selectButtonDisabled: {
    backgroundColor: '#f9fafb',
    borderColor: '#e5e7eb',
  },
  selectButtonText: {
    fontSize: 16,
    color: '#1f2937',
    flex: 1,
  },
  placeholderText: {
    color: '#9ca3af',
  },
  disabledText: {
    color: '#9ca3af',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    flex: 1,
  },
  androidModalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    minHeight: '40%',
  },
  iosModalContent: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '80%',
    minHeight: '50%',
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  closeButton: {
    padding: 4,
  },
  headerSpacer: {
    width: 32,
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

export default CustomSelect;
