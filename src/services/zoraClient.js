import { Audio } from 'expo-av';
import { File, Paths } from 'expo-file-system';
import API_CONFIG from '../config/api';
import { auth } from './firebase';

const BASE = (process.env.EXPO_PUBLIC_ZORA_API_URL || 'https://zora.cosmopolitan.edu.ng').replace(/\/$/, '');
let session = null;
let pending = null;
let stopPlayback = null;
let audioGeneration = 0;
async function request(url, options, timeout = 60000) {
  if (!__DEV__ && !url.startsWith('https://')) throw new Error('Zora requires a secure server connection.');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      const error = new Error(data.error || 'Zora is temporarily unavailable.');
      error.status = response.status;
      throw error;
    }
    return response;
  } finally { clearTimeout(timer); }
}
async function accessToken() {
  const user = auth.currentUser;
  if (!user) { session = null; throw new Error('Please sign in to CCSA Mobile.'); }
  if (session?.uid === user.uid && session.expires > Date.now()) return session.token;
  if (pending?.uid === user.uid) return pending.promise;
  const promise = (async () => {
    const firebaseToken = await user.getIdToken();
    const bridge = await request(`${API_CONFIG.BASE_URL}/api/mobile/zora/session`, { method: 'POST', headers: { Authorization: `Bearer ${firebaseToken}` } }, 15000);
    const { assertion } = await bridge.json();
    const exchange = await request(`${BASE}/api/auth/exchange`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ assertion }) }, 15000);
    const data = await exchange.json();
    if (auth.currentUser?.uid !== user.uid) throw new Error('Account changed. Please reopen Zora.');
    session = { uid: user.uid, token: data.token, expires: Date.now() + 6 * 86400000 };
    return data.token;
  })();
  pending = { uid: user.uid, promise };
  try { return await promise; } finally { if (pending?.promise === promise) pending = null; }
}
export async function zoraRequest(path, options = {}) {
  const token = await accessToken();
  try { return await request(BASE + path, { ...options, headers: { ...options.headers, Authorization: `Bearer ${token}` } }); }
  catch (error) { if (error.status === 401 || error.status === 403) session = null; throw error; }
}
export async function askZora(input) {
  return (await zoraRequest('/api/assistant', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) })).json();
}
export async function transcribeZora(uri, language) {
  const form = new FormData();
  form.append('audio', { uri, name: 'question.m4a', type: 'audio/mp4' });
  form.append('language', language);
  const result = await (await zoraRequest('/api/assistant/transcribe', { method: 'POST', body: form })).json();
  if (!result.text) throw new Error('Could not hear you. Please try again.');
  return result.text;
}
export async function stopZoraAudio() { audioGeneration++; if (stopPlayback) await stopPlayback(); }
export async function speakZora(text, language) {
  await stopZoraAudio();
  const generation=audioGeneration;
  const response = await zoraRequest('/api/audio/speech', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text, language }) });
  if(generation!==audioGeneration)return;
  const file = new File(Paths.cache, `zora-${Date.now()}.mp3`);
  file.write(new Uint8Array(await response.arrayBuffer()));
  await Audio.setAudioModeAsync({ allowsRecordingIOS: false, playsInSilentModeIOS: true });
  const { sound } = await Audio.Sound.createAsync({ uri: file.uri });
  if(generation!==audioGeneration){await sound.unloadAsync();file.delete();return;}
  await new Promise((resolve, reject) => {
    let finished = false;
    const finish = async (error) => {
      if (finished) return; finished = true; clearTimeout(timer); stopPlayback = null;
      await sound.unloadAsync().catch(() => {});
      try { file.delete(); } catch {}
      if (error) reject(error); else resolve();
    };
    const timer = setTimeout(() => void finish(new Error('Audio playback timed out.')), 180000);
    stopPlayback = () => finish();
    sound.setOnPlaybackStatusUpdate(status => { if (status.isLoaded && status.didJustFinish) void finish(); else if (!status.isLoaded && status.error) void finish(new Error('Audio playback failed.')); });
    sound.playAsync().catch(error => void finish(error));
  });
}
