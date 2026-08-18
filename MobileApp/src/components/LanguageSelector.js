import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../utils/LanguageContext';
import COLORS from '../theme/colors';

const { height } = Dimensions.get('window');

const languages = [
  { id: 'en', name: 'English', subName: 'Default', char: 'A' },
  { id: 'hi', name: 'हिन्दी', subName: 'Hindi', char: 'अ' },
  { id: 'te', name: 'తెలుగు', subName: 'Telugu', char: 'త' },
  { id: 'kn', name: 'ಕನ್ನಡ', subName: 'Kannada', char: 'ಕ' },
  { id: 'ta', name: 'தமிழ்', subName: 'Tamil', char: 'த' },
  { id: 'ml', name: 'മലയാളം', subName: 'Malayalam', char: 'മ' },
  { id: 'mr', name: 'मराठी', subName: 'Marathi', char: 'म' },
  { id: 'bn', name: 'বাংলা', subName: 'Bengali', char: 'বা' },
  { id: 'gu', name: 'ગુજરાતી', subName: 'Gujarati', char: 'ગુ' },
  { id: 'pa', name: 'ਪੰਜਾਬੀ', subName: 'Punjabi', char: 'ਪੰ' },
  { id: 'or', name: 'ଓଡ଼ିଆ', subName: 'Odia', char: 'ଓ' },
];

export default function LanguageSelector({ visible, onClose }) {
  const { language, changeLanguage, t } = useLanguage();

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{t("select_language") || "Select Language"}</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#64748B" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollArea}>
            {languages.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.modalOption,
                  language === item.id && styles.selectedOption
                ]}
                onPress={async () => {
                  await changeLanguage(item.id);
                  onClose();
                }}
              >
                <View style={styles.optionIconContainer}>
                  <Text style={styles.optionChar}>{item.char}</Text>
                </View>
                <View style={styles.labelContainer}>
                  <Text style={[
                    styles.optionLabel,
                    language === item.id && styles.selectedText
                  ]}>
                    {item.name}
                  </Text>
                  <Text style={styles.optionSubLabel}>{item.subName}</Text>
                </View>
                {language === item.id && (
                  <Ionicons name="checkmark-circle" size={24} color={COLORS.PRIMARY_LIGHT || "#7A3FC4"} />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>

          <TouchableOpacity
            style={styles.modalCancelBtn}
            onPress={onClose}
          >
            <Text style={styles.modalCancelText}>{t("cancel") || "Cancel"}</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: height * 0.8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
  },
  scrollArea: {
    marginBottom: 16,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 8,
    borderRadius: 16,
  },
  selectedOption: {
    backgroundColor: '#F5F3FF',
  },
  optionIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  optionChar: {
    fontSize: 18,
    fontWeight: '600',
    color: '#475569',
  },
  labelContainer: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#334155',
  },
  selectedText: {
    color: '#7A3FC4',
  },
  optionSubLabel: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  modalCancelBtn: {
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    marginTop: 8,
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#475569',
  },
});
