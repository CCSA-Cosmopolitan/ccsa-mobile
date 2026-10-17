import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  StatusBar,
  Image,
  ActivityIndicator,
  Animated,
  Alert,
  Share,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import brand from '../theme/brand';
import { consultZora, playZoraSpeech } from '../services/zoraService';

const CROPS = ['Maize', 'Cassava', 'Rice', 'Cowpea', 'Tomato', 'Sorghum', 'Yam'];

const LANGUAGES = [
  { id: 'en', label: 'English', flag: '🇬🇧' },
  { id: 'ha', label: 'Hausa', flag: '🇳🇬' },
  { id: 'yo', label: 'Yorùbá', flag: '🇳🇬' },
  { id: 'ig', label: 'Igbo', flag: '🇳🇬' },
  { id: 'pcm', label: 'Pidgin', flag: '🇳🇬' },
];

const QUICK_PROMPTS = [
  'Holes in maize leaves with caterpillar frass',
  'Cassava leaves wrinkling, yellowing, and stunted',
  'Spindle brown blast spots on rice leaves',
  'Tomato fruit borer with rotting patches',
  'When is the optimal time to spray fertilizer?',
];

export default function ZoraScreen({ navigation, route }) {
  // Pre-filled crop or farmer name if opened from Farmer Details
  const initialCrop = route?.params?.crop || 'Maize';
  const farmerName = route?.params?.farmerName || null;

  const [selectedCrop, setSelectedCrop] = useState(initialCrop);
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [inputText, setInputText] = useState('');
  const [attachedImage, setAttachedImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  // Pulse animation for recording/speaking
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const scrollViewRef = useRef();

  const [conversation, setConversation] = useState([
    {
      id: 'welcome-1',
      role: 'zora',
      diagnosis: 'CCSA Zora Sovereign AI Agronomist',
      text: `Sannu / Ẹ n lẹ / Nnọọ. I am Zora, your agricultural intelligence assistant${
        farmerName ? ` for ${farmerName}` : ''
      }. Ask me about crop pests, leaf diseases, soil treatment, or spray weather in your local language.`,
      sources: ['Cosmopolitan University Center for Climate-Smart Agriculture'],
    },
  ]);

  useEffect(() => {
    if (isRecording || isSpeaking) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.25,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isRecording, isSpeaking]);

  const handlePickImage = async () => {
    Alert.alert('Crop Leaf Pathology', 'Attach a photo of the affected plant or pest:', [
      {
        text: 'Take Photo (Camera)',
        onPress: async () => {
          const { status } = await ImagePicker.requestCameraPermissionsAsync();
          if (status !== 'granted') {
            Alert.alert('Permission Denied', 'Camera permission is required to capture crop diseases.');
            return;
          }
          const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
          });
          if (!result.canceled && result.assets[0]?.uri) {
            setAttachedImage(result.assets[0].uri);
          }
        },
      },
      {
        text: 'Choose from Gallery',
        onPress: async () => {
          const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (status !== 'granted') {
            Alert.alert('Permission Denied', 'Gallery permission is required.');
            return;
          }
          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
          });
          if (!result.canceled && result.assets[0]?.uri) {
            setAttachedImage(result.assets[0].uri);
          }
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleSend = async (customMessage = null) => {
    const textToSend = (customMessage || inputText).trim();
    if (!textToSend && !attachedImage) return;

    const userMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: textToSend || 'Analyzing attached crop leaf photo...',
      crop: selectedCrop,
      imageUri: attachedImage,
      language: selectedLanguage,
    };

    setConversation((prev) => [...prev, userMessage]);
    setInputText('');
    const currentPhoto = attachedImage;
    setAttachedImage(null);
    setLoading(true);

    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      const response = await consultZora({
        message: textToSend,
        language: selectedLanguage,
        crop: selectedCrop,
        region: 'Kano Savanna Agro-Zone',
      });

      const zoraReply = {
        id: `zora-${Date.now()}`,
        role: 'zora',
        diagnosis: response.diagnosis,
        severity: response.severity,
        text: response.explanation,
        steps: response.steps,
        organicAlternative: response.organicAlternative,
        safety: response.safety,
        sources: response.sources,
        online: response.online,
        photoAnalyzed: Boolean(currentPhoto),
      };

      setConversation((prev) => [...prev, zoraReply]);

      // Automatically speak summary in native language
      if (response.spokenText) {
        setIsSpeaking(true);
        playZoraSpeech(response.spokenText, selectedLanguage).finally(() => {
          setIsSpeaking(false);
        });
      }
    } catch (err) {
      Alert.alert('Error', 'Unable to complete diagnosis. Please try again.');
    } finally {
      setLoading(false);
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 200);
    }
  };

  const toggleSpeech = async (text) => {
    if (isSpeaking) {
      await playZoraSpeech('');
      setIsSpeaking(false);
    } else {
      setIsSpeaking(true);
      await playZoraSpeech(text, selectedLanguage);
      setIsSpeaking(false);
    }
  };

  const handleShare = async (item) => {
    try {
      const shareContent = `🌾 *CCSA Zora Agricultural Advisory*\n*Crop:* ${selectedCrop}\n*Diagnosis:* ${item.diagnosis}\n\n*Treatment:* ${item.steps?.[0] || item.text}\n\n*Low-Cost Organic Alternative:* ${item.organicAlternative || 'Dust wood ash or neem powder'}\n\n_Validated by Cosmopolitan University Center for Climate-Smart Agriculture_`;
      await Share.share({ message: shareContent });
    } catch (e) {
      // ignore
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: brand.colors.offWhite }}>
      <StatusBar barStyle="light-content" backgroundColor="#013358" />

      {/* ── Header ── */}
      <View
        style={{
          backgroundColor: '#013358',
          paddingTop: Platform.OS === 'ios' ? 48 : 16,
          paddingBottom: 14,
          paddingHorizontal: 16,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          elevation: 4,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.15,
          shadowRadius: 4,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{
              padding: 8,
              marginRight: 6,
              borderRadius: 8,
              backgroundColor: 'rgba(255,255,255,0.12)',
            }}
          >
            <Ionicons name="arrow-back" size={20} color="#ffffff" />
          </TouchableOpacity>

          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ fontSize: 18, fontWeight: '800', color: '#ffffff', letterSpacing: 0.5 }}>
                CCSA <Text style={{ color: '#10B981' }}>|</Text> Zora
              </Text>
              <View
                style={{
                  backgroundColor: '#059669',
                  paddingHorizontal: 6,
                  paddingVertical: 2,
                  borderRadius: 6,
                  marginLeft: 8,
                }}
              >
                <Text style={{ fontSize: 9, fontWeight: '700', color: '#ffffff', textTransform: 'uppercase' }}>
                  AI Agronomist
                </Text>
              </View>
            </View>
            <Text style={{ fontSize: 11, color: '#DCEAF3', marginTop: 1 }}>
              Sovereign Agricultural Intelligence
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => {
            setConversation([conversation[0]]);
            setAttachedImage(null);
          }}
          style={{
            padding: 8,
            borderRadius: 8,
            backgroundColor: 'rgba(255,255,255,0.12)',
          }}
          title="Clear Conversation"
        >
          <Ionicons name="refresh-outline" size={18} color="#ffffff" />
        </TouchableOpacity>
      </View>

      {/* ── Context & Language Selector Bar ── */}
      <View style={{ backgroundColor: '#ffffff', borderBottomWidth: 1, borderColor: '#e2e8f0' }}>
        {/* Languages horizontal bar */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 8, gap: 6 }}
        >
          {LANGUAGES.map((lang) => {
            const active = selectedLanguage === lang.id;
            return (
              <TouchableOpacity
                key={lang.id}
                onPress={() => setSelectedLanguage(lang.id)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                  borderRadius: 14,
                  backgroundColor: active ? '#059669' : '#f1f5f9',
                  marginRight: 6,
                }}
              >
                <Text style={{ fontSize: 12, marginRight: 4 }}>{lang.flag}</Text>
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: active ? '700' : '500',
                    color: active ? '#ffffff' : '#475569',
                  }}
                >
                  {lang.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Crops horizontal bar */}
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 8 }}>
          <Text style={{ fontSize: 11, fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', marginRight: 8 }}>
            Crop:
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
            {CROPS.map((crop) => {
              const active = selectedCrop === crop;
              return (
                <TouchableOpacity
                  key={crop}
                  onPress={() => setSelectedCrop(crop)}
                  style={{
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    borderRadius: 12,
                    backgroundColor: active ? '#013358' : '#f8fafc',
                    borderWidth: 1,
                    borderColor: active ? '#013358' : '#cbd5e1',
                    marginRight: 6,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: active ? '700' : '500',
                      color: active ? '#ffffff' : '#334155',
                    }}
                  >
                    {crop}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>

      {/* ── Conversation & Diagnosis Stream ── */}
      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {conversation.map((item) => {
          if (item.role === 'user') {
            return (
              <View
                key={item.id}
                style={{
                  alignSelf: 'flex-end',
                  maxWidth: '85%',
                  backgroundColor: '#013358',
                  borderRadius: 16,
                  borderBottomRightRadius: 4,
                  padding: 14,
                  marginBottom: 14,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.1,
                  shadowRadius: 3,
                  elevation: 2,
                }}
              >
                {item.imageUri && (
                  <Image
                    source={{ uri: item.imageUri }}
                    style={{
                      width: '100%',
                      height: 140,
                      borderRadius: 10,
                      marginBottom: 8,
                    }}
                    resizeMode="cover"
                  />
                )}
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                  <View
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.2)',
                      paddingHorizontal: 6,
                      paddingVertical: 2,
                      borderRadius: 6,
                      marginRight: 6,
                    }}
                  >
                    <Text style={{ fontSize: 10, color: '#ffffff', fontWeight: '700' }}>
                      {item.crop}
                    </Text>
                  </View>
                </View>
                <Text style={{ color: '#ffffff', fontSize: 14, lineHeight: 20 }}>
                  {item.text}
                </Text>
              </View>
            );
          }

          // Zora response card
          return (
            <View
              key={item.id}
              style={{
                alignSelf: 'flex-start',
                width: '100%',
                backgroundColor: '#ffffff',
                borderRadius: 18,
                borderTopLeftRadius: 4,
                padding: 16,
                marginBottom: 16,
                borderWidth: 1,
                borderColor: '#e2e8f0',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 6,
                elevation: 2,
              }}
            >
              {/* Header row */}
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: 10,
                }}
              >
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text
                    style={{
                      fontSize: 10,
                      fontWeight: '700',
                      color: '#059669',
                      textTransform: 'uppercase',
                      letterSpacing: 0.8,
                    }}
                  >
                    Diagnosis & Advisory
                  </Text>
                  <Text
                    style={{
                      fontSize: 15,
                      fontWeight: '800',
                      color: '#0f172a',
                      marginTop: 2,
                    }}
                  >
                    {item.diagnosis}
                  </Text>
                </View>

                {item.severity && (
                  <View
                    style={{
                      paddingHorizontal: 8,
                      paddingVertical: 3,
                      borderRadius: 8,
                      backgroundColor:
                        item.severity === 'high'
                          ? '#fee2e2'
                          : item.severity === 'medium'
                          ? '#fef3c7'
                          : '#d1fae5',
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 10,
                        fontWeight: '700',
                        color:
                          item.severity === 'high'
                            ? '#dc2626'
                            : item.severity === 'medium'
                            ? '#d97706'
                            : '#059669',
                        textTransform: 'uppercase',
                      }}
                    >
                      {item.severity} Urgency
                    </Text>
                  </View>
                )}
              </View>

              {/* Spoken explanation */}
              <Text style={{ fontSize: 13, color: '#334155', lineHeight: 20, marginBottom: 12 }}>
                {item.text}
              </Text>

              {/* Certified treatment protocol */}
              {item.steps && item.steps.length > 0 && (
                <View
                  style={{
                    backgroundColor: '#ecfdf5',
                    borderRadius: 12,
                    padding: 12,
                    borderWidth: 1,
                    borderColor: '#a7f3d0',
                    marginBottom: 10,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                    <Ionicons name="medical" size={14} color="#059669" style={{ marginRight: 6 }} />
                    <Text style={{ fontSize: 11, fontWeight: '700', color: '#065f46' }}>
                      Certified Agronomic Treatment
                    </Text>
                  </View>
                  <Text style={{ fontSize: 12, color: '#047857', lineHeight: 18 }}>
                    {item.steps[0]}
                  </Text>
                </View>
              )}

              {/* Low cost organic alternative */}
              {item.organicAlternative && (
                <View
                  style={{
                    backgroundColor: '#fffbeb',
                    borderRadius: 12,
                    padding: 12,
                    borderWidth: 1,
                    borderColor: '#fde68a',
                    marginBottom: 10,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                    <Ionicons name="leaf" size={14} color="#d97706" style={{ marginRight: 6 }} />
                    <Text style={{ fontSize: 11, fontWeight: '700', color: '#92400e' }}>
                      Low-Cost Local Organic Alternative
                    </Text>
                  </View>
                  <Text style={{ fontSize: 12, color: '#b45309', lineHeight: 18 }}>
                    {item.organicAlternative}
                  </Text>
                </View>
              )}

              {/* Savanna Spray Window / Weather safety */}
              {item.safety && (
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                  <Ionicons name="sunny-outline" size={13} color="#64748b" style={{ marginRight: 5 }} />
                  <Text style={{ fontSize: 11, color: '#64748b', flex: 1 }}>
                    {item.safety}
                  </Text>
                </View>
              )}

              {/* Action buttons */}
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'flex-end',
                  alignItems: 'center',
                  gap: 8,
                  paddingTop: 8,
                  borderTopWidth: 1,
                  borderColor: '#f1f5f9',
                }}
              >
                <TouchableOpacity
                  onPress={() => toggleSpeech(item.text)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                    borderRadius: 8,
                    backgroundColor: '#f1f5f9',
                    marginRight: 6,
                  }}
                >
                  <Ionicons
                    name={isSpeaking ? 'pause' : 'volume-high'}
                    size={15}
                    color="#0f172a"
                    style={{ marginRight: 4 }}
                  />
                  <Text style={{ fontSize: 11, fontWeight: '600', color: '#0f172a' }}>
                    {isSpeaking ? 'Pause' : 'Listen Audio'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => handleShare(item)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                    borderRadius: 8,
                    backgroundColor: '#059669',
                  }}
                >
                  <Ionicons name="share-social-outline" size={14} color="#ffffff" style={{ marginRight: 4 }} />
                  <Text style={{ fontSize: 11, fontWeight: '600', color: '#ffffff' }}>
                    WhatsApp Share
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}

        {loading && (
          <View
            style={{
              backgroundColor: '#ffffff',
              borderRadius: 16,
              padding: 16,
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: 16,
              borderWidth: 1,
              borderColor: '#e2e8f0',
            }}
          >
            <ActivityIndicator size="small" color="#059669" style={{ marginRight: 12 }} />
            <Text style={{ fontSize: 13, color: '#64748b', fontWeight: '500' }}>
              Zora is synthesizing agronomic diagnosis in {selectedLanguage.toUpperCase()}...
            </Text>
          </View>
        )}
      </ScrollView>

      {/* ── Quick Symptom Suggestions (shown when conversation is short) ── */}
      {conversation.length <= 2 && (
        <View style={{ position: 'absolute', bottom: 85, left: 0, right: 0, backgroundColor: 'transparent' }}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
          >
            {QUICK_PROMPTS.map((prompt, idx) => (
              <TouchableOpacity
                key={idx}
                onPress={() => handleSend(prompt)}
                style={{
                  backgroundColor: '#ffffff',
                  paddingHorizontal: 12,
                  paddingVertical: 7,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: '#cbd5e1',
                  marginRight: 6,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.05,
                  shadowRadius: 2,
                  elevation: 1,
                }}
              >
                <Text style={{ fontSize: 12, color: '#334155', fontWeight: '500' }}>
                  {prompt}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* ── Attached Image Preview ── */}
      {attachedImage && (
        <View
          style={{
            position: 'absolute',
            bottom: 80,
            left: 16,
            backgroundColor: '#ffffff',
            borderRadius: 12,
            padding: 4,
            borderWidth: 1,
            borderColor: '#e2e8f0',
            flexDirection: 'row',
            alignItems: 'center',
            elevation: 3,
          }}
        >
          <Image source={{ uri: attachedImage }} style={{ width: 44, height: 44, borderRadius: 8 }} />
          <TouchableOpacity
            onPress={() => setAttachedImage(null)}
            style={{ padding: 6 }}
          >
            <Ionicons name="close-circle" size={20} color="#ef4444" />
          </TouchableOpacity>
        </View>
      )}

      {/* ── Bottom Input & Action Bar ── */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderColor: '#e2e8f0',
          paddingHorizontal: 14,
          paddingVertical: 10,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
        }}
      >
        {/* Camera Scanner Button */}
        <TouchableOpacity
          onPress={handlePickImage}
          style={{
            width: 42,
            height: 42,
            borderRadius: 21,
            backgroundColor: '#f1f5f9',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="camera-outline" size={22} color="#013358" />
        </TouchableOpacity>

        {/* Text Input */}
        <TextInput
          placeholder={`Describe ${selectedCrop} symptom...`}
          placeholderTextColor="#94a3b8"
          value={inputText}
          onChangeText={setInputText}
          onSubmitEditing={() => handleSend()}
          style={{
            flex: 1,
            height: 42,
            backgroundColor: '#f8fafc',
            borderWidth: 1,
            borderColor: '#e2e8f0',
            borderRadius: 21,
            paddingHorizontal: 16,
            fontSize: 14,
            color: '#0f172a',
          }}
        />

        {/* Big Mic Button / Send Button */}
        {inputText.trim() || attachedImage ? (
          <TouchableOpacity
            onPress={() => handleSend()}
            style={{
              width: 42,
              height: 42,
              borderRadius: 21,
              backgroundColor: '#059669',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="arrow-up" size={20} color="#ffffff" />
          </TouchableOpacity>
        ) : (
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <TouchableOpacity
              onPress={() => {
                // If text is empty, cycle through a spoken simulation query in selected language
                const sampleVoice =
                  selectedLanguage === 'ha'
                    ? 'Ganyen masara na yana da ramuka'
                    : selectedLanguage === 'yo'
                    ? 'Àrùn kòkòrò ń jẹ àgbàdo mi'
                    : selectedLanguage === 'ig'
                    ? 'Ọka m nwere ọrịa na-acha nchara nchara'
                    : selectedLanguage === 'pcm'
                    ? 'My cassava leaves dey wrinkle and yellow'
                    : `What is the best pest control for my ${selectedCrop}?`;
                handleSend(sampleVoice);
              }}
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: '#059669',
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: '#059669',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.3,
                shadowRadius: 4,
                elevation: 3,
              }}
            >
              <Ionicons name="mic" size={22} color="#ffffff" />
            </TouchableOpacity>
          </Animated.View>
        )}
      </KeyboardAvoidingView>
    </View>
  );
}
