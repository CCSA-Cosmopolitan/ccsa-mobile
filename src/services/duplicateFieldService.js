import API_CONFIG from '../config/api';
import { auth } from './firebase';

class DuplicateFieldService {
  constructor() {
    this.cache = new Map();
  }

  // Check for duplicate fields in farmers database
  async checkDuplicateField(fieldName, fieldValue, excludeId = null) {
    try {
      console.log(`🔍 DuplicateFieldService: Checking ${fieldName} = "${fieldValue}"`);
      
      if (!fieldValue || fieldValue.trim() === '') {
        return { isDuplicate: false, record: null };
      }

      // Check cache first
      const cacheKey = `${fieldName}:${fieldValue}`;
      if (this.cache.has(cacheKey)) {
        console.log(`💾 DuplicateFieldService: Found cached result for ${cacheKey}`);
        return this.cache.get(cacheKey);
      }

      const headers = {
        'Content-Type': 'application/json',
      };

      try {
        const token = await auth?.currentUser?.getIdToken();
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
      } catch (tokenErr) {
        console.warn('Could not retrieve auth token for duplicate check:', tokenErr);
      }

      // Make API call to check for duplicates
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/api/farmers/check-duplicate`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify({
            field: fieldName,
            value: fieldValue,
            excludeId,
          }),
        }
      );

      if (!response.ok) {
        console.warn(`⚠️ DuplicateFieldService: API error ${response.status}`);
        return { isDuplicate: false, record: null };
      }

      const data = await response.json();
      
      const result = {
        isDuplicate: data.exists || false,
        record: data.record || null,
      };

      // Cache the result for 5 minutes
      this.cache.set(cacheKey, result);
      setTimeout(() => {
        this.cache.delete(cacheKey);
      }, 5 * 60 * 1000);

      console.log(`✅ DuplicateFieldService: ${fieldName} check complete - duplicate: ${result.isDuplicate}`);
      return result;

    } catch (error) {
      console.error(`❌ DuplicateFieldService: Error checking ${fieldName}:`, error);
      return { isDuplicate: false, record: null };
    }
  }

  // Check multiple fields at once
  async checkMultipleFields(fields, excludeId = null) {
    try {
      const checks = fields.map(({ fieldName, fieldValue }) => 
        this.checkDuplicateField(fieldName, fieldValue, excludeId)
      );

      const results = await Promise.all(checks);
      
      const duplicates = results
        .map((result, index) => ({
          fieldName: fields[index].fieldName,
          fieldValue: fields[index].fieldValue,
          ...result,
        }))
        .filter(result => result.isDuplicate);

      return {
        hasDuplicates: duplicates.length > 0,
        duplicates,
      };

    } catch (error) {
      console.error('❌ DuplicateFieldService: Error checking multiple fields:', error);
      return { hasDuplicates: false, duplicates: [] };
    }
  }

  // Check common farmer fields
  async checkFarmerDuplicates(farmerData, excludeId = null) {
    const fieldsToCheck = [];

    if (farmerData.nin) {
      fieldsToCheck.push({ fieldName: 'NIN', fieldValue: farmerData.nin });
    }

    if (farmerData.contactInfo?.phoneNumber) {
      fieldsToCheck.push({ 
        fieldName: 'Phone Number', 
        fieldValue: farmerData.contactInfo.phoneNumber 
      });
    }

    if (farmerData.contactInfo?.email) {
      fieldsToCheck.push({ 
        fieldName: 'Email', 
        fieldValue: farmerData.contactInfo.email 
      });
    }

    if (farmerData.bankInfo?.accountNumber && farmerData.bankInfo?.bankName) {
      fieldsToCheck.push({ 
        fieldName: 'Bank Account', 
        fieldValue: `${farmerData.bankInfo.bankName}:${farmerData.bankInfo.accountNumber}` 
      });
    }

    if (fieldsToCheck.length === 0) {
      return { hasDuplicates: false, duplicates: [] };
    }

    return this.checkMultipleFields(fieldsToCheck, excludeId);
  }

  // Clear cache
  clearCache() {
    this.cache.clear();
    console.log('🧹 DuplicateFieldService: Cache cleared');
  }

  // Get cache stats
  getCacheStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

// Create and export singleton instance
export const duplicateFieldService = new DuplicateFieldService();
export default duplicateFieldService;
