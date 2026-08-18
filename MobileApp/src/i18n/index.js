import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { loadStoredLanguage } from './languageService';

// --- Static Imports ---
import enCommon from './locales/en/common.json';
import enAuth from './locales/en/auth.json';
import enHome from './locales/en/home.json';
import enProfile from './locales/en/profile.json';
import enProperty from './locales/en/property.json';
import enChat from './locales/en/chat.json';
import enNotifications from './locales/en/notifications.json';
import enPayments from './locales/en/payments.json';
import enSettings from './locales/en/settings.json';
import enErrors from './locales/en/errors.json';
import hiCommon from './locales/hi/common.json';
import hiAuth from './locales/hi/auth.json';
import hiHome from './locales/hi/home.json';
import hiProfile from './locales/hi/profile.json';
import hiProperty from './locales/hi/property.json';
import hiChat from './locales/hi/chat.json';
import hiNotifications from './locales/hi/notifications.json';
import hiPayments from './locales/hi/payments.json';
import hiSettings from './locales/hi/settings.json';
import hiErrors from './locales/hi/errors.json';
import teCommon from './locales/te/common.json';
import teAuth from './locales/te/auth.json';
import teHome from './locales/te/home.json';
import teProfile from './locales/te/profile.json';
import teProperty from './locales/te/property.json';
import teChat from './locales/te/chat.json';
import teNotifications from './locales/te/notifications.json';
import tePayments from './locales/te/payments.json';
import teSettings from './locales/te/settings.json';
import teErrors from './locales/te/errors.json';
import taCommon from './locales/ta/common.json';
import taAuth from './locales/ta/auth.json';
import taHome from './locales/ta/home.json';
import taProfile from './locales/ta/profile.json';
import taProperty from './locales/ta/property.json';
import taChat from './locales/ta/chat.json';
import taNotifications from './locales/ta/notifications.json';
import taPayments from './locales/ta/payments.json';
import taSettings from './locales/ta/settings.json';
import taErrors from './locales/ta/errors.json';
import knCommon from './locales/kn/common.json';
import knAuth from './locales/kn/auth.json';
import knHome from './locales/kn/home.json';
import knProfile from './locales/kn/profile.json';
import knProperty from './locales/kn/property.json';
import knChat from './locales/kn/chat.json';
import knNotifications from './locales/kn/notifications.json';
import knPayments from './locales/kn/payments.json';
import knSettings from './locales/kn/settings.json';
import knErrors from './locales/kn/errors.json';
import mlCommon from './locales/ml/common.json';
import mlAuth from './locales/ml/auth.json';
import mlHome from './locales/ml/home.json';
import mlProfile from './locales/ml/profile.json';
import mlProperty from './locales/ml/property.json';
import mlChat from './locales/ml/chat.json';
import mlNotifications from './locales/ml/notifications.json';
import mlPayments from './locales/ml/payments.json';
import mlSettings from './locales/ml/settings.json';
import mlErrors from './locales/ml/errors.json';
import mrCommon from './locales/mr/common.json';
import mrAuth from './locales/mr/auth.json';
import mrHome from './locales/mr/home.json';
import mrProfile from './locales/mr/profile.json';
import mrProperty from './locales/mr/property.json';
import mrChat from './locales/mr/chat.json';
import mrNotifications from './locales/mr/notifications.json';
import mrPayments from './locales/mr/payments.json';
import mrSettings from './locales/mr/settings.json';
import mrErrors from './locales/mr/errors.json';
import bnCommon from './locales/bn/common.json';
import bnAuth from './locales/bn/auth.json';
import bnHome from './locales/bn/home.json';
import bnProfile from './locales/bn/profile.json';
import bnProperty from './locales/bn/property.json';
import bnChat from './locales/bn/chat.json';
import bnNotifications from './locales/bn/notifications.json';
import bnPayments from './locales/bn/payments.json';
import bnSettings from './locales/bn/settings.json';
import bnErrors from './locales/bn/errors.json';
import guCommon from './locales/gu/common.json';
import guAuth from './locales/gu/auth.json';
import guHome from './locales/gu/home.json';
import guProfile from './locales/gu/profile.json';
import guProperty from './locales/gu/property.json';
import guChat from './locales/gu/chat.json';
import guNotifications from './locales/gu/notifications.json';
import guPayments from './locales/gu/payments.json';
import guSettings from './locales/gu/settings.json';
import guErrors from './locales/gu/errors.json';
import paCommon from './locales/pa/common.json';
import paAuth from './locales/pa/auth.json';
import paHome from './locales/pa/home.json';
import paProfile from './locales/pa/profile.json';
import paProperty from './locales/pa/property.json';
import paChat from './locales/pa/chat.json';
import paNotifications from './locales/pa/notifications.json';
import paPayments from './locales/pa/payments.json';
import paSettings from './locales/pa/settings.json';
import paErrors from './locales/pa/errors.json';
import orCommon from './locales/or/common.json';
import orAuth from './locales/or/auth.json';
import orHome from './locales/or/home.json';
import orProfile from './locales/or/profile.json';
import orProperty from './locales/or/property.json';
import orChat from './locales/or/chat.json';
import orNotifications from './locales/or/notifications.json';
import orPayments from './locales/or/payments.json';
import orSettings from './locales/or/settings.json';
import orErrors from './locales/or/errors.json';

const resources = {
  en: {
    common: enCommon,
    auth: enAuth,
    home: enHome,
    profile: enProfile,
    property: enProperty,
    chat: enChat,
    notifications: enNotifications,
    payments: enPayments,
    settings: enSettings,
    errors: enErrors,
  },
  hi: {
    common: hiCommon,
    auth: hiAuth,
    home: hiHome,
    profile: hiProfile,
    property: hiProperty,
    chat: hiChat,
    notifications: hiNotifications,
    payments: hiPayments,
    settings: hiSettings,
    errors: hiErrors,
  },
  te: {
    common: teCommon,
    auth: teAuth,
    home: teHome,
    profile: teProfile,
    property: teProperty,
    chat: teChat,
    notifications: teNotifications,
    payments: tePayments,
    settings: teSettings,
    errors: teErrors,
  },
  ta: {
    common: taCommon,
    auth: taAuth,
    home: taHome,
    profile: taProfile,
    property: taProperty,
    chat: taChat,
    notifications: taNotifications,
    payments: taPayments,
    settings: taSettings,
    errors: taErrors,
  },
  kn: {
    common: knCommon,
    auth: knAuth,
    home: knHome,
    profile: knProfile,
    property: knProperty,
    chat: knChat,
    notifications: knNotifications,
    payments: knPayments,
    settings: knSettings,
    errors: knErrors,
  },
  ml: {
    common: mlCommon,
    auth: mlAuth,
    home: mlHome,
    profile: mlProfile,
    property: mlProperty,
    chat: mlChat,
    notifications: mlNotifications,
    payments: mlPayments,
    settings: mlSettings,
    errors: mlErrors,
  },
  mr: {
    common: mrCommon,
    auth: mrAuth,
    home: mrHome,
    profile: mrProfile,
    property: mrProperty,
    chat: mrChat,
    notifications: mrNotifications,
    payments: mrPayments,
    settings: mrSettings,
    errors: mrErrors,
  },
  bn: {
    common: bnCommon,
    auth: bnAuth,
    home: bnHome,
    profile: bnProfile,
    property: bnProperty,
    chat: bnChat,
    notifications: bnNotifications,
    payments: bnPayments,
    settings: bnSettings,
    errors: bnErrors,
  },
  gu: {
    common: guCommon,
    auth: guAuth,
    home: guHome,
    profile: guProfile,
    property: guProperty,
    chat: guChat,
    notifications: guNotifications,
    payments: guPayments,
    settings: guSettings,
    errors: guErrors,
  },
  pa: {
    common: paCommon,
    auth: paAuth,
    home: paHome,
    profile: paProfile,
    property: paProperty,
    chat: paChat,
    notifications: paNotifications,
    payments: paPayments,
    settings: paSettings,
    errors: paErrors,
  },
  or: {
    common: orCommon,
    auth: orAuth,
    home: orHome,
    profile: orProfile,
    property: orProperty,
    chat: orChat,
    notifications: orNotifications,
    payments: orPayments,
    settings: orSettings,
    errors: orErrors,
  },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en', // Initialized dynamically in LanguageContext or via helper
    fallbackLng: 'en',
    defaultNS: 'common',
    fallbackNS: ['common', 'auth', 'home', 'profile', 'property', 'chat', 'notifications', 'payments', 'settings', 'errors'],
    interpolation: {
      escapeValue: false, // React already safeguards against XSS
    },
    react: {
      useSuspense: false,
    }
  });

// Pre-load stored language
loadStoredLanguage().then((lang) => {
  i18n.changeLanguage(lang);
}).catch(err => {
  console.warn('Error pre-loading language:', err);
});

export default i18n;
