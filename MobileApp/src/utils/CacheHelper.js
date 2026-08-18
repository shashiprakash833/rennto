import AsyncStorage from '@react-native-async-storage/async-storage';

export const saveCache = async (key, data) => {
  try {
    if (!key) return;
    const cacheKey = `cache_${encodeURIComponent(key)}`;
    await AsyncStorage.setItem(cacheKey, JSON.stringify(data));
  } catch (error) {
    console.log("Save cache error:", error);
  }
};

export const getCache = async (key) => {
  try {
    if (!key) return null;
    const cacheKey = `cache_${encodeURIComponent(key)}`;
    const value = await AsyncStorage.getItem(cacheKey);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    console.log("Get cache error:", error);
    return null;
  }
};

export const removeCache = async (key) => {
  try {
    if (!key) return;
    const cacheKey = `cache_${encodeURIComponent(key)}`;
    await AsyncStorage.removeItem(cacheKey);
  } catch (error) {
    console.log("Remove cache error:", error);
  }
};

export const clearCache = async () => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter(k => k.startsWith('cache_'));
    await AsyncStorage.multiRemove(cacheKeys);
  } catch (error) {
    console.log("Clear cache error:", error);
  }
};

export default {
  saveCache,
  getCache,
  removeCache,
  clearCache
};
