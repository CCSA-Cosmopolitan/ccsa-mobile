import { auth } from './firebase';
import API_CONFIG from '../config/api';

const API_BASE_URL = API_CONFIG.BASE_URL;

const getAuthToken = async () => {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');
  return await user.getIdToken(true);
};

export const agentService = {
  async getProfile() {
    const token = await getAuthToken();
    const url = `${API_BASE_URL}/api/mobile/agents/profile`;
    const res = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to fetch profile');
    }
    return res.json();
  },

  async updateProfile(updates) {
    const token = await getAuthToken();
    const url = `${API_BASE_URL}/api/mobile/agents/profile`;
    const res = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(updates)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to update profile');
    }
    return res.json();
  },

  async uploadPhoto(uri) {
    // For React Native, we need to convert the local URI to a blob/file or use FormData properly
    // with { uri, type, name }
    const formData = new FormData();
    const filename = uri.split('/').pop() || 'photo.jpg';
    
    // Determine mime type from extension
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : `image`;

    formData.append('file', {
      uri,
      name: filename,
      type
    });

    const url = `${API_BASE_URL}/api/upload/agent-photo`;
    const res = await fetch(url, {
      method: 'POST',
      body: formData,
      headers: {
        // Content-Type is automatically set with boundary for FormData in React Native
      }
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Upload failed');
    }

    return res.json();
  }
};
