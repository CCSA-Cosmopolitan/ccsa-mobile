import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Controller } from 'react-hook-form';
import { Picker } from '@react-native-picker/picker';
import * as Location from 'expo-location';
import CropSelect from '../common/CropSelect';
import MultiCropSelect from '../common/MultiCropSelect';
import EnhancedCustomSelect from '../common/EnhancedCustomSelect';
import SearchableSelect from '../common/SearchableSelect';
import StateSelect from '../common/StateSelect';
import LGASelect from '../common/LGASelect';
import WardSelect from '../common/WardSelect';
import PollingUnitSelect from '../common/PollingUnitSelect';
import FarmPolygonMapper from '../common/FarmPolygonMapper';
import optimizedLocationService from '../../services/optimizedLocationServiceV2';

const FARM_CATEGORIES = [
  { label: 'Select Farm Category', value: '' },
  { label: 'Arable Farming', value: 'ARABLE' },
  { label: 'Livestock Farming', value: 'LIVESTOCK' },
  { label: 'Mixed Farming', value: 'MIXED' },
  { label: 'Aquaculture', value: 'AQUACULTURE' },
  { label: 'Poultry', value: 'POULTRY' },
  { label: 'Horticulture', value: 'HORTICULTURE' },
];

const FARM_OWNERSHIP = [
  { label: 'Select Ownership Type', value: '' },
  { label: 'Owned', value: 'OWNED' },
  { label: 'Rented', value: 'RENTED' },
  { label: 'Leased', value: 'LEASED' },
  { label: 'Family Land', value: 'FAMILY' },
  { label: 'Community Land', value: 'COMMUNITY' },
];

const FARM_SEASONS = [
  { label: 'Select Farm Season', value: '' },
  { label: 'Wet Season', value: 'WET' },
  { label: 'Dry Season', value: 'DRY' },
  { label: 'Year Round', value: 'YEAR_ROUND' },
];

const CROPS = [
  'Maize', 'Rice', 'Cassava', 'Yam', 'Cocoa', 'Oil Palm', 'Plantain', 'Banana',
  'Tomato', 'Pepper', 'Onion', 'Okra', 'Beans', 'Groundnut', 'Sesame', 'Cotton',
  'Sorghum', 'Millet', 'Cowpea', 'Soybean', 'Sweet Potato', 'Irish Potato',
  'Wheat', 'Watermelon', 'Cucumber', 'Lettuce', 'Cabbage', 'Carrot', 'Spinach',
  'Pineapple', 'Mango', 'Orange', 'Lemon', 'Guava', 'Papaya', 'Avocado',
  'Coffee', 'Tea', 'Ginger', 'Turmeric', 'Garlic', 'Cinnamon', 'Cloves', 'Nutmeg',
];

// Category-specific options
const LIVESTOCK_TYPES = [
  'Cattle', 'Goats', 'Sheep', 'Pigs', 'Rabbits', 'Donkeys', 'Horses', 'Camels'
];

const POULTRY_TYPES = [
  'Chickens (Broilers)', 'Chickens (Layers)', 'Turkeys', 'Ducks', 'Geese', 'Guinea Fowl', 'Quails'
];

const FISH_TYPES = [
  'Catfish', 'Tilapia', 'Carp', 'Mackerel', 'Salmon', 'Prawns', 'Crayfish', 'Snails'
];

const HORTICULTURE_TYPES = [
  'Vegetables', 'Fruits', 'Flowers', 'Ornamental Plants', 'Herbs', 'Spices'
];

const SOIL_TYPES = [
  { label: 'Select Soil Type', value: '' },
  { label: 'Clay', value: 'CLAY' },
  { label: 'Sandy', value: 'SANDY' },
  { label: 'Loamy', value: 'LOAMY' },
  { label: 'Silty', value: 'SILTY' },
  { label: 'Peaty', value: 'PEATY' },
  { label: 'Rocky', value: 'ROCKY' },
];

const SOIL_FERTILITY_LEVELS = [
  { label: 'Select Soil Fertility', value: '' },
  { label: 'Very High', value: 'VERY_HIGH' },
  { label: 'High', value: 'HIGH' },
  { label: 'Medium', value: 'MEDIUM' },
  { label: 'Low', value: 'LOW' },
  { label: 'Very Low', value: 'VERY_LOW' },
];

const YIELD_SEASONS = [
  { label: 'Select Yield Season', value: '' },
  { label: 'First Season (March-July)', value: 'FIRST_SEASON' },
  { label: 'Second Season (August-December)', value: 'SECOND_SEASON' },
  { label: 'Year Round', value: 'YEAR_ROUND' },
  { label: 'Dry Season', value: 'DRY_SEASON' },
  { label: 'Wet Season', value: 'WET_SEASON' },
];

// Helper function to get category-specific options
const getCategoryOptions = (category) => {
  switch (category) {
    case 'LIVESTOCK':
      return LIVESTOCK_TYPES;
    case 'POULTRY':
      return POULTRY_TYPES;
    case 'AQUACULTURE':
      return FISH_TYPES;
    case 'HORTICULTURE':
      return HORTICULTURE_TYPES;
    case 'ARABLE':
    case 'MIXED':
    default:
      return CROPS;
  }
};

// Helper function to get category-specific labels
const getCategoryLabels = (category) => {
  switch (category) {
    case 'LIVESTOCK':
      return {
        primary: 'Primary Livestock',
        secondary: 'Secondary Livestock',
        helper: 'You can select up to 5 additional livestock types raised on this farm'
      };
    case 'POULTRY':
      return {
        primary: 'Primary Poultry',
        secondary: 'Secondary Poultry',
        helper: 'You can select up to 5 additional poultry types raised on this farm'
      };
    case 'AQUACULTURE':
      return {
        primary: 'Primary Fish/Aquatic Species',
        secondary: 'Secondary Fish/Aquatic Species',
        helper: 'You can select up to 5 additional aquatic species farmed'
      };
    case 'HORTICULTURE':
      return {
        primary: 'Primary Horticultural Product',
        secondary: 'Secondary Horticultural Products',
        helper: 'You can select up to 5 additional horticultural products grown'
      };
    case 'ARABLE':
    case 'MIXED':
    default:
      return {
        primary: 'Primary Crop',
        secondary: 'Secondary Crops',
        helper: 'You can select up to 5 secondary crops that are also grown on this farm'
      };
  }
};

export default function FarmInfoStep({ control, errors, setValue, watch, showTitle = true }) {
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [coordinates, setCoordinates] = useState(watch('farmInfo.coordinates'));

  // Watch form values for cascading dropdowns
  const selectedState = watch('farmInfo.state');
  const selectedLocalGovernment = watch('farmInfo.localGovernment');
  const selectedWard = watch('farmInfo.ward');
  const selectedFarmCategory = watch('farmInfo.farmCategory');
  
  // State for dropdown options and loading states
  // Note: Individual select components now handle their own loading

  // Reset dependent fields when parent field changes
  useEffect(() => {
    if (selectedState) {
      setValue('farmInfo.localGovernment', '');
      setValue('farmInfo.ward', '');
      setValue('farmInfo.pollingUnit', '');
    }
  }, [selectedState, setValue]);

  useEffect(() => {
    if (selectedLocalGovernment) {
      setValue('farmInfo.ward', '');
      setValue('farmInfo.pollingUnit', '');
    }
  }, [selectedLocalGovernment, setValue]);

  useEffect(() => {
    if (selectedWard) {
      setValue('farmInfo.pollingUnit', '');
    }
  }, [selectedWard, setValue]);

  // Reset crop/livestock fields when farm category changes
  useEffect(() => {
    if (selectedFarmCategory) {
      setValue('farmInfo.primaryCrop', '');
      setValue('farmInfo.secondaryCrop', []);
    }
  }, [selectedFarmCategory, setValue]);

  const getCurrentLocation = async () => {
    try {
      setLoadingLocation(true);
      
      // Request permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Permission to access location was denied');
        return;
      }

      // Get current location
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const coords = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      setCoordinates(coords);
      setValue('farmInfo.coordinates', coords);
      
      Alert.alert('Location Captured', `Lat: ${coords.latitude.toFixed(6)}, Lng: ${coords.longitude.toFixed(6)}`);
    } catch (error) {
      Alert.alert('Error', 'Failed to get current location');
    } finally {
      setLoadingLocation(false);
    }
  };

  // Custom component for category-specific selection
  const CategorySpecificSelect = ({ category, selectedValue, onValueChange, placeholder, error }) => {
    const options = getCategoryOptions(category);
    
    if (!category || ['ARABLE', 'MIXED'].includes(category)) {
      return (
        <CropSelect
          selectedValue={selectedValue}
          onValueChange={onValueChange}
          placeholder={placeholder}
          error={error}
        />
      );
    }

    return (
      <EnhancedCustomSelect
        options={[
          { label: placeholder, value: '' },
          ...options.map(option => ({ label: option, value: option }))
        ]}
        selectedValue={selectedValue}
        onValueChange={onValueChange}
        placeholder={placeholder}
        title={placeholder}
        icon="leaf-outline"
        error={error}
        searchable={true}
      />
    );
  };

  // Custom component for category-specific multi-selection
  const CategorySpecificMultiSelect = ({ category, selectedValues, onValuesChange, placeholder, error, maxSelections = 5 }) => {
    const options = getCategoryOptions(category);
    
    if (!category || ['ARABLE', 'MIXED'].includes(category)) {
      return (
        <MultiCropSelect
          selectedValues={Array.isArray(selectedValues) ? selectedValues : (selectedValues ? [selectedValues] : [])}
          onValuesChange={onValuesChange}
          placeholder={placeholder}
          error={error}
          maxSelections={maxSelections}
        />
      );
    }

    return (
      <View style={styles.multiSelectContainer}>
        <View style={styles.multiSelectHeader}>
          <Text style={styles.multiSelectLabel}>{placeholder}</Text>
          <Text style={styles.selectedCount}>
            {Array.isArray(selectedValues) ? selectedValues.length : 0}/{maxSelections}
          </Text>
        </View>
        
        <View style={styles.optionsGrid}>
          {options.map((option, index) => {
            const isSelected = Array.isArray(selectedValues) && selectedValues.includes(option);
            const canSelect = !isSelected && (!Array.isArray(selectedValues) || selectedValues.length < maxSelections);
            
            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.optionChip,
                  isSelected && styles.optionChipSelected,
                  (!canSelect && !isSelected) && styles.optionChipDisabled
                ]}
                onPress={() => {
                  if (isSelected) {
                    // Remove from selection
                    const newValues = Array.isArray(selectedValues) 
                      ? selectedValues.filter(v => v !== option)
                      : [];
                    onValuesChange(newValues);
                  } else if (canSelect) {
                    // Add to selection
                    const newValues = Array.isArray(selectedValues) 
                      ? [...selectedValues, option]
                      : [option];
                    onValuesChange(newValues);
                  }
                }}
                disabled={!canSelect && !isSelected}
              >
                <Text style={[
                  styles.optionChipText,
                  isSelected && styles.optionChipTextSelected,
                  (!canSelect && !isSelected) && styles.optionChipTextDisabled
                ]}>
                  {option}
                </Text>
                {isSelected && (
                  <Ionicons name="checkmark-circle" size={16} color="#ffffff" style={styles.checkIcon} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
        
        {error && (
          <Text style={styles.errorText}>Please select at least one option</Text>
        )}
      </View>
    );
  };

  // Get current category labels
  const categoryLabels = getCategoryLabels(selectedFarmCategory);

  return (
    <View style={styles.container}>
      {showTitle && (
        <View style={styles.header}>
          <Ionicons name="leaf-outline" size={48} color="#10b981" />
          <Text style={styles.title}>Farm Information</Text>
          <Text style={styles.description}>
            Add farm details (Optional - can be completed later)
          </Text>
        </View>
      )}

      <View style={styles.form}>
        {/* State */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>State *</Text>
          <Controller
            control={control}
            name="farmInfo.state"
            render={({ field: { onChange, value } }) => (
              <StateSelect
                selectedValue={value}
                onValueChange={onChange}
                placeholder="Select State"
                error={!!errors?.farmInfo?.state}
              />
            )}
          />
          {errors?.farmInfo?.state && (
            <Text style={styles.errorText}>{errors.farmInfo.state.message}</Text>
          )}
        </View>

        {/* Local Government */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Local Government *</Text>
          <Controller
            control={control}
            name="farmInfo.localGovernment"
            render={({ field: { onChange, value } }) => (
              <LGASelect
                selectedState={selectedState}
                selectedValue={value}
                onValueChange={onChange}
                placeholder="Select Local Government"
                error={!!errors?.farmInfo?.localGovernment}
              />
            )}
          />
          {errors?.farmInfo?.localGovernment && (
            <Text style={styles.errorText}>{errors.farmInfo.localGovernment.message}</Text>
          )}
        </View>

        {/* Ward */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Ward *</Text>
          <Controller
            control={control}
            name="farmInfo.ward"
            render={({ field: { onChange, value } }) => (
              <WardSelect
                selectedState={selectedState}
                selectedLGA={selectedLocalGovernment}
                selectedValue={value}
                onValueChange={onChange}
                placeholder="Select Ward"
                error={!!errors?.farmInfo?.ward}
              />
            )}
          />
          {errors?.farmInfo?.ward && (
            <Text style={styles.errorText}>{errors.farmInfo.ward.message}</Text>
          )}
        </View>
        {/* Polling Unit */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Polling Unit *</Text>
          <Controller
            control={control}
            name="farmInfo.pollingUnit"
            render={({ field: { onChange, value } }) => (
              <PollingUnitSelect
                selectedState={selectedState}
                selectedLGA={selectedLocalGovernment}
                selectedWard={selectedWard}
                selectedValue={value}
                onValueChange={onChange}
                placeholder="Select Polling Unit"
                error={!!errors?.farmInfo?.pollingUnit}
              />
            )}
          />
          {errors?.farmInfo?.pollingUnit && (
            <Text style={styles.errorText}>{errors.farmInfo.pollingUnit.message}</Text>
          )}
        </View>

        {/* Farm Location Description */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Farm Location Description</Text>
          <Controller
            control={control}
            name="farmInfo.farmLocation"
            render={({ field: { onChange, onBlur, value } }) => (
              <View style={styles.inputContainer}>
                <Ionicons name="location-outline" size={20} color="#9ca3af" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Additional location details (optional)"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  multiline
                  numberOfLines={2}
                  textAlignVertical="top"
                />
              </View>
            )}
          />
        </View>

        {/* Farm Category */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Farm Category</Text>
          <Controller
            control={control}
            name="farmInfo.farmCategory"
            render={({ field: { onChange, value } }) => (
              <EnhancedCustomSelect
                options={FARM_CATEGORIES}
                selectedValue={value}
                onValueChange={onChange}
                placeholder="Select Farm Category"
                title="Select Farm Category"
                icon="grid-outline"
                error={!!errors?.farmInfo?.farmCategory}
              />
            )}
          />
          {errors?.farmInfo?.farmCategory && (
            <Text style={styles.errorText}>{errors.farmInfo.farmCategory.message}</Text>
          )}
        </View>

        {/* Landforms */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Landforms</Text>
          <Controller
            control={control}
            name="farmInfo.landforms"
            render={({ field: { onChange, value } }) => (
              <View style={styles.radioContainer}>
                <TouchableOpacity
                  style={[styles.radioOption, value === 'lowland' && styles.radioSelected]}
                  onPress={() => onChange('lowland')}
                >
                  <Ionicons
                    name={value === 'lowland' ? 'radio-button-on' : 'radio-button-off'}
                    size={20}
                    color={value === 'lowland' ? '#013358' : '#9ca3af'}
                  />
                  <Text style={styles.radioText}>Lowland</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.radioOption, value === 'highland' && styles.radioSelected]}
                  onPress={() => onChange('highland')}
                >
                  <Ionicons
                    name={value === 'highland' ? 'radio-button-on' : 'radio-button-off'}
                    size={20}
                    color={value === 'highland' ? '#013358' : '#9ca3af'}
                  />
                  <Text style={styles.radioText}>Highland</Text>
                </TouchableOpacity>
              </View>
            )}
          />
        </View>

        {/* Farm Ownership */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Farm Ownership</Text>
          <Controller
            control={control}
            name="farmInfo.farmOwnership"
            render={({ field: { onChange, value } }) => (
              <EnhancedCustomSelect
                options={FARM_OWNERSHIP}
                selectedValue={value}
                onValueChange={onChange}
                placeholder="Select Ownership Type"
                title="Select Farm Ownership"
                icon="person-outline"
                error={!!errors?.farmInfo?.farmOwnership}
              />
            )}
          />
          {errors?.farmInfo?.farmOwnership && (
            <Text style={styles.errorText}>{errors.farmInfo.farmOwnership.message}</Text>
          )}
        </View>

        {/* Primary Crop/Livestock/Poultry/Fish */}
        {selectedFarmCategory && (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{categoryLabels.primary}</Text>
            <Controller
              control={control}
              name="farmInfo.primaryCrop"
              render={({ field: { onChange, value } }) => (
                <CategorySpecificSelect
                  category={selectedFarmCategory}
                  selectedValue={value}
                  onValueChange={onChange}
                  placeholder={`Select primary ${selectedFarmCategory.toLowerCase()}`}
                  error={!!errors.farmInfo?.primaryCrop}
                />
              )}
            />
            {errors.farmInfo?.primaryCrop && (
              <Text style={styles.errorText}>{errors.farmInfo.primaryCrop.message}</Text>
            )}
          </View>
        )}

        {/* Secondary Crops/Livestock/Poultry/Fish */}
        {selectedFarmCategory && (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{categoryLabels.secondary}</Text>
            <Controller
              control={control}
              name="farmInfo.secondaryCrop"
              render={({ field: { onChange, value } }) => (
                <CategorySpecificMultiSelect
                  category={selectedFarmCategory}
                  selectedValues={Array.isArray(value) ? value : (value ? [value] : [])}
                  onValuesChange={onChange}
                  placeholder={`Select secondary ${selectedFarmCategory.toLowerCase()} (optional)`}
                  error={!!errors.farmInfo?.secondaryCrop}
                  maxSelections={5}
                />
              )}
            />
            {errors.farmInfo?.secondaryCrop && (
              <Text style={styles.errorText}>{errors.farmInfo.secondaryCrop.message}</Text>
            )}
            <Text style={styles.helperText}>
              {categoryLabels.helper}
            </Text>
          </View>
        )}

        {/* Farm Season */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Farm Season</Text>
          <Controller
            control={control}
            name="farmInfo.farmSeason"
            render={({ field: { onChange, value } }) => (
              <EnhancedCustomSelect
                options={FARM_SEASONS}
                selectedValue={value}
                onValueChange={onChange}
                placeholder="Select Farm Season"
                title="Select Farm Season"
                icon="calendar-outline"
                error={!!errors?.farmInfo?.farmSeason}
              />
            )}
          />
          {errors?.farmInfo?.farmSeason && (
            <Text style={styles.errorText}>{errors.farmInfo.farmSeason.message}</Text>
          )}
        </View>

        {/* GPS Coordinates */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>GPS Coordinates *</Text>
          <TouchableOpacity
            style={styles.locationButton}
            onPress={getCurrentLocation}
            disabled={loadingLocation}
          >
            <Ionicons
              name={loadingLocation ? "sync" : "location"}
              size={20}
              color="#ffffff"
            />
            <Text style={styles.locationButtonText}>
              {loadingLocation ? 'Getting Location...' : 'Use My Location'}
            </Text>
          </TouchableOpacity>
          
          {coordinates && (
            <View style={styles.coordinatesDisplay}>
              <Text style={styles.coordinatesText}>
                Latitude: {coordinates.latitude.toFixed(6)}
              </Text>
              <Text style={styles.coordinatesText}>
                Longitude: {coordinates.longitude.toFixed(6)}
              </Text>
            </View>
          )}
          
          {errors?.farmInfo?.coordinates && (
            <Text style={styles.errorText}>{errors.farmInfo.coordinates.message}</Text>
          )}
        </View>

        {/* Farm Polygon */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Farm Boundary *</Text>
          <FarmPolygonMapper
            onPolygonUpdate={(polygon) => {
              setValue('farmPolygon', polygon);
            }}
            initialPolygon={watch('farmPolygon') || []}
          />
          <Text style={styles.helperText}>
            Walk around farm boundary to capture the area (minimum 3 points required)
          </Text>
          
          {errors?.farmPolygon && (
            <Text style={styles.errorText}>{errors.farmPolygon.message}</Text>
          )}
        </View>

        {/* Farm Size (Manual Input) */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Farm Size (Hectares)</Text>
          <Controller
            control={control}
            name="farmInfo.farmSize"
            render={({ field: { onChange, onBlur, value } }) => (
              <View style={styles.inputContainer}>
                <Ionicons name="resize-outline" size={20} color="#9ca3af" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter farm size in hectares (auto-calculated from boundary)"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  keyboardType="decimal-pad"
                />
              </View>
            )}
          />
          <Text style={styles.helperText}>
            Size is auto-calculated from farm boundary. You can override this value if needed.
          </Text>
          {errors?.farmInfo?.farmSize && (
            <Text style={styles.errorText}>{errors.farmInfo.farmSize.message}</Text>
          )}
        </View>

        {/* Farming Experience */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Farming Experience (Years)</Text>
          <Controller
            control={control}
            name="farmInfo.farmingExperience"
            render={({ field: { onChange, onBlur, value } }) => (
              <View style={styles.inputContainer}>
                <Ionicons name="time-outline" size={20} color="#9ca3af" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter years of farming experience"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  keyboardType="numeric"
                />
              </View>
            )}
          />
          {errors?.farmInfo?.farmingExperience && (
            <Text style={styles.errorText}>{errors.farmInfo.farmingExperience.message}</Text>
          )}
        </View>

        {/* Soil Type */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Soil Type *</Text>
          <Controller
            control={control}
            name="soilType"
            render={({ field: { onChange, value } }) => (
              <EnhancedCustomSelect
                options={SOIL_TYPES}
                selectedValue={value}
                onValueChange={onChange}
                placeholder="Select Soil Type"
                title="Select Soil Type"
                icon="earth-outline"
                error={!!errors?.soilType}
              />
            )}
          />
          {errors?.soilType && (
            <Text style={styles.errorText}>{errors.soilType.message}</Text>
          )}
        </View>

        {/* Soil pH */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Soil pH Level</Text>
          <Controller
            control={control}
            name="soilPH"
            render={({ field: { onChange, onBlur, value } }) => (
              <View style={styles.inputContainer}>
                <Ionicons name="flask-outline" size={20} color="#9ca3af" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter soil pH level (0-14)"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  keyboardType="decimal-pad"
                />
              </View>
            )}
          />
          <Text style={styles.helperText}>
            Soil pH scale: Acidic (0-6.9), Neutral (7.0), Alkaline (7.1-14)
          </Text>
          {errors?.soilPH && (
            <Text style={styles.errorText}>{errors.soilPH.message}</Text>
          )}
        </View>

        {/* Soil Fertility */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Soil Fertility *</Text>
          <Controller
            control={control}
            name="soilFertility"
            render={({ field: { onChange, value } }) => (
              <EnhancedCustomSelect
                options={SOIL_FERTILITY_LEVELS}
                selectedValue={value}
                onValueChange={onChange}
                placeholder="Select Soil Fertility Level"
                title="Select Soil Fertility"
                icon="trending-up-outline"
                error={!!errors?.soilFertility}
              />
            )}
          />
          {errors?.soilFertility && (
            <Text style={styles.errorText}>{errors.soilFertility.message}</Text>
          )}
        </View>

        {/* Production Year */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Production Year *</Text>
          <Controller
            control={control}
            name="year"
            render={({ field: { onChange, onBlur, value } }) => (
              <View style={styles.inputContainer}>
                <Ionicons name="calendar-outline" size={20} color="#9ca3af" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter production year (e.g., 2024)"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  keyboardType="numeric"
                />
              </View>
            )}
          />
          {errors?.year && (
            <Text style={styles.errorText}>{errors.year.message}</Text>
          )}
        </View>

        {/* Yield Season */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Yield/Harvest Season *</Text>
          <Controller
            control={control}
            name="yieldSeason"
            render={({ field: { onChange, value } }) => (
              <EnhancedCustomSelect
                options={YIELD_SEASONS}
                selectedValue={value}
                onValueChange={onChange}
                placeholder="Select Yield Season"
                title="Select Harvest Season"
                icon="time-outline"
                error={!!errors?.yieldSeason}
              />
            )}
          />
          {errors?.yieldSeason && (
            <Text style={styles.errorText}>{errors.yieldSeason.message}</Text>
          )}
        </View>

        {/* Expected Yield/Production Quantity */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Expected Production Quantity *</Text>
          <Controller
            control={control}
            name="quantity"
            render={({ field: { onChange, onBlur, value } }) => (
              <View style={styles.inputContainer}>
                <Ionicons name="scale-outline" size={20} color="#9ca3af" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter expected quantity (in tons/kg/bags)"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  keyboardType="decimal-pad"
                />
              </View>
            )}
          />
          <Text style={styles.helperText}>
            Specify the expected production quantity with units (e.g., "50 bags", "2.5 tons")
          </Text>
          {errors?.quantity && (
            <Text style={styles.errorText}>{errors.quantity.message}</Text>
          )}
        </View>

        {/* Additional Crop Information (Different from Primary Crop) */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Additional Crop Details</Text>
          <Controller
            control={control}
            name="crop"
            render={({ field: { onChange, onBlur, value } }) => (
              <View style={styles.inputContainer}>
                <Ionicons name="leaf-outline" size={20} color="#9ca3af" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Additional crop information (variety, seed type, etc.)"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  multiline
                  numberOfLines={2}
                  textAlignVertical="top"
                />
              </View>
            )}
          />
          <Text style={styles.helperText}>
            Additional details about crop varieties, seed types, or cultivation methods
          </Text>
          {errors?.crop && (
            <Text style={styles.errorText}>{errors.crop.message}</Text>
          )}
        </View>
      </View>

      <View style={styles.info}>
        <View style={styles.infoItem}>
          <Ionicons name="information-circle-outline" size={20} color="#10b981" />
          <Text style={styles.infoText}>
            Farm information is optional and can be added or updated later
          </Text>
        </View>
        <View style={styles.infoItem}>
          <Ionicons name="location-outline" size={20} color="#10b981" />
          <Text style={styles.infoText}>
            GPS coordinates help with precision agriculture and farm mapping
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 16,
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  form: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    backgroundColor: '#f9fafb',
  },
  inputIcon: {
    marginLeft: 16,
    marginTop: 16,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 12,
    fontSize: 16,
    color: '#1f2937',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    backgroundColor: '#f9fafb',
  },
  picker: {
    height: 50,
  },
  radioContainer: {
    flexDirection: 'row',
    gap: 24,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radioSelected: {
    // Additional styling for selected radio option
  },
  radioText: {
    fontSize: 16,
    color: '#374151',
    marginLeft: 8,
  },
  cropSuggestions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    gap: 8,
  },
  cropButton: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  cropButtonText: {
    fontSize: 12,
    color: '#166534',
    fontWeight: '500',
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#013358',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  locationButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  coordinatesDisplay: {
    backgroundColor: '#f0fdf4',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  coordinatesText: {
    fontSize: 14,
    color: '#166534',
    fontFamily: 'monospace',
  },
  polygonButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eff6ff',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#013358',
    borderStyle: 'dashed',
  },
  polygonButtonText: {
    color: '#013358',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  helperText: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
    fontStyle: 'italic',
  },
  errorText: {
    fontSize: 14,
    color: '#ef4444',
    marginTop: 4,
  },
  info: {
    backgroundColor: '#f0fdf4',
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#065f46',
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
  // Multi-select styles
  multiSelectContainer: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    backgroundColor: '#f9fafb',
    padding: 16,
  },
  multiSelectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  multiSelectLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  selectedCount: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 4,
  },
  optionChipSelected: {
    backgroundColor: '#013358',
    borderColor: '#013358',
  },
  optionChipDisabled: {
    backgroundColor: '#f3f4f6',
    borderColor: '#e5e7eb',
    opacity: 0.6,
  },
  optionChipText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  optionChipTextSelected: {
    color: '#ffffff',
  },
  optionChipTextDisabled: {
    color: '#9ca3af',
  },
  checkIcon: {
    marginLeft: 6,
  },
});
