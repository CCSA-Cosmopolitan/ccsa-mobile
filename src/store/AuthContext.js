import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../services/firebase';
import API_CONFIG from '../config/api';

const FIMS_CACHE_PREFIX = '@fims_profile_';

// Fetch role + profile from FIMS platform using Firebase ID token.
// Returns profile object on success, { __deactivated: true } on 403, null on any other failure.
const fetchFimsProfile = async (firebaseUser) => {
  try {
    const idToken = await firebaseUser.getIdToken();
    const response = await fetch(`${API_CONFIG.BASE_URL}/api/mobile/auth/me`, {
      headers: { Authorization: `Bearer ${idToken}` },
    });
    if (response.status === 403) return { __deactivated: true };
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
};

// Build enriched user object merging Firebase identity with FIMS profile.
const buildUserData = (firebaseUser, fimsProfile) => ({
  id: firebaseUser.uid,
  email: firebaseUser.email,
  displayName:
    firebaseUser.displayName ??
    fimsProfile?.displayName ??
    fimsProfile?.firstName ??
    null,
  emailVerified: firebaseUser.emailVerified,
  createdAt: firebaseUser.metadata?.creationTime,
  lastSignInTime: firebaseUser.metadata?.lastSignInTime,
  // FIMS enrichment — defaults preserve existing enrollment-agent behaviour
  role: fimsProfile?.role ?? 'agent',
  fimsUserId: fimsProfile?.userId ?? null,
  firstName: fimsProfile?.firstName ?? null,
  lastName: fimsProfile?.lastName ?? null,
});

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!auth) {
      setError('Firebase authentication service is not available');
      setLoading(false);
      return;
    }

    const unsubscribe = auth.onAuthStateChanged(
      async (firebaseUser) => {
        try {
          if (firebaseUser) {
            // Try live FIMS profile fetch
            let fimsProfile = await fetchFimsProfile(firebaseUser);

            if (fimsProfile?.__deactivated) {
              await auth.signOut();
              setError('Your account has been deactivated. Contact your administrator.');
              setLoading(false);
              return;
            }

            // Fall back to cached profile when offline
            if (!fimsProfile) {
              try {
                const cached = await AsyncStorage.getItem(`${FIMS_CACHE_PREFIX}${firebaseUser.uid}`);
                if (cached) fimsProfile = JSON.parse(cached);
              } catch {}
            } else {
              // Persist fresh profile for offline use
              try {
                await AsyncStorage.setItem(
                  `${FIMS_CACHE_PREFIX}${firebaseUser.uid}`,
                  JSON.stringify(fimsProfile)
                );
              } catch {}
            }

            setUser(buildUserData(firebaseUser, fimsProfile));
          } else {
            setUser(null);
          }
        } catch (err) {
          console.error('🔥 Auth state change error:', err);
          setError(err.message);
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    return () => { if (unsubscribe) unsubscribe(); };
  }, []);

  // requiredRoles: string[] | null — if supplied, the user's role must be in the list
  const signIn = async (email, password, requiredRoles = null) => {
    try {
      setLoading(true);
      setError(null);
      
      if (!auth || !auth.signInWithEmailAndPassword) {
        throw new Error('Firebase auth is not initialized');
      }

      const userCredential = await auth.signInWithEmailAndPassword(email, password);
      const firebaseUser = userCredential.user;

      let fimsProfile = await fetchFimsProfile(firebaseUser);
      if (fimsProfile?.__deactivated) {
        await auth.signOut();
        throw new Error('Your account has been deactivated. Contact your administrator.');
      }
      if (fimsProfile) {
        try {
          await AsyncStorage.setItem(
            `${FIMS_CACHE_PREFIX}${firebaseUser.uid}`,
            JSON.stringify(fimsProfile)
          );
        } catch {}
      }

      const userData = buildUserData(firebaseUser, fimsProfile);

      // Role guard — reject before storing user to prevent UI flicker
      if (requiredRoles?.length && userData.role && !requiredRoles.includes(userData.role)) {
        await auth.signOut();
        throw new Error('Access denied. Your account is not authorised for this module. Please use the correct login entry point.');
      }

      setUser(userData);
      return userData;
    } catch (error) {
      console.error('🔥 Sign in error:', error);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email, password, additionalData = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      if (!auth || !auth.createUserWithEmailAndPassword) {
        throw new Error('Firebase auth is not initialized');
      }

      const userCredential = await auth.createUserWithEmailAndPassword(email, password);
      const firebaseUser = userCredential.user;

      // Update profile if displayName provided
      if (additionalData.displayName && auth.updateProfile) {
        try {
          await auth.updateProfile(firebaseUser, {
            displayName: additionalData.displayName
          });
        } catch (profileError) {
          console.warn('🔥 Profile update failed:', profileError);
        }
      }

      const userData = {
        id: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName || additionalData.displayName,
        emailVerified: firebaseUser.emailVerified,
        createdAt: firebaseUser.metadata?.creationTime,
        lastSignInTime: firebaseUser.metadata?.lastSignInTime,
        ...additionalData
      };
      
      setUser(userData);
      return userData;
    } catch (error) {
      console.error('🔥 Sign up error:', error);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setError(null);
      if (user?.id) {
        try { await AsyncStorage.removeItem(`${FIMS_CACHE_PREFIX}${user.id}`); } catch {}
      }
      await auth.signOut();
      setUser(null);
    } catch (error) {
      console.error('🔥 Sign out error:', error);
      setError(error.message);
      throw error;
    }
  };

  const resetPassword = async (email) => {
    try {
      setError(null);
      
      if (!auth || !auth.sendPasswordResetEmail) {
        throw new Error('Firebase auth is not initialized');
      }

      await auth.sendPasswordResetEmail(email);
    } catch (error) {
      console.error('🔥 Password reset error:', error);
      setError(error.message);
      throw error;
    }
  };

  const updateUserProfile = async (profileData) => {
    try {
      setLoading(true);
      setError(null);
      
      if (!auth || !auth.updateProfile || !user) {
        throw new Error('Firebase auth is not initialized or user not logged in');
      }

      await auth.updateProfile(auth.currentUser, profileData);
      
      // Update local user state
      setUser(prevUser => ({
        ...prevUser,
        ...profileData
      }));
    } catch (error) {
      console.error('🔥 Profile update error:', error);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateUserPassword = async (newPassword, currentPassword) => {
    try {
      setLoading(true);
      setError(null);
      
      if (!auth || !auth.updatePassword || !auth.reauthenticateWithCredential || !user) {
        throw new Error('Firebase auth is not initialized or user not logged in');
      }

      // Re-authenticate user first
      const credential = auth.EmailAuthProvider?.credential(user.email, currentPassword);
      if (credential) {
        await auth.reauthenticateWithCredential(auth.currentUser, credential);
      }
      
      await auth.updatePassword(auth.currentUser, newPassword);
    } catch (error) {
      console.error('🔥 Password update error:', error);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    loading,
    error,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updateUserProfile,
    updateUserPassword,
    setError
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
