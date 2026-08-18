import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';

const LANGUAGE_KEY = 'userLanguage';
const SUPPORTED_LANGUAGES = ['en', 'hi', 'te', 'ta', 'kn', 'ml', 'mr', 'bn', 'gu', 'pa', 'or'];
const DEFAULT_LANGUAGE = 'en';

export const getDeviceLanguage = () => {
  try {
    const locales = Localization.getLocales();
    if (locales && locales.length > 0) {
      const deviceLang = locales[0].languageCode;
      if (SUPPORTED_LANGUAGES.includes(deviceLang)) {
        return deviceLang;
      }
    }
  } catch (error) {
    console.error('Error detecting device language:', error);
  }
  return DEFAULT_LANGUAGE;
};

export const loadStoredLanguage = async () => {
  try {
    const saved = await AsyncStorage.getItem(LANGUAGE_KEY);
    if (saved && SUPPORTED_LANGUAGES.includes(saved)) {
      return saved;
    }
    // First launch detection
    const detected = getDeviceLanguage();
    await AsyncStorage.setItem(LANGUAGE_KEY, detected);
    return detected;
  } catch (error) {
    console.error('Error loading stored language:', error);
    return DEFAULT_LANGUAGE;
  }
};

export const saveSelectedLanguage = async (lang) => {
  try {
    if (SUPPORTED_LANGUAGES.includes(lang)) {
      await AsyncStorage.setItem(LANGUAGE_KEY, lang);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error saving selected language:', error);
    return false;
  }
};
