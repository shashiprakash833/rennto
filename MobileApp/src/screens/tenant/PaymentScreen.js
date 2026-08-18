import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View, TouchableOpacity, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLanguage } from "../../utils/LanguageContext";

export default function PaymentScreen1({ navigation }) {
  const { t } = useLanguage();
  return (
    <SafeAreaView style={styles.container}>

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation?.goBack()} style={styles.backCircle}>
          <Ionicons name="chevron-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("payments_method") || "Payments Method"}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.centerContent}>

        {/* PREMIUM COMPOSITIONAL ICON */}
        <View style={styles.illustrationWrapper}>
          {/* Large soft background glow */}
          <View style={styles.iconGlow} />

          {/* Main Icon: Clipboard with a clock inside it */}
          <View style={styles.mainIconCircle}>
            <MaterialCommunityIcons name="clipboard-text-clock-outline" size={90} color="#5F259F" />
          </View>

          {/* Bottom Badge: Floating Shield or Security Check */}
          <View style={styles.floatingBadge}>
            <MaterialCommunityIcons name="shield-check" size={24} color="#FFFFFF" />
          </View>

          {/* Side Badge: Pending Status */}
          <View style={styles.statusBadgeIcon}>
            <Ionicons name="hourglass-outline" size={18} color="#D97706" />
          </View>
        </View>

        <Text style={styles.emptyTitle}>{t("approval_pending") || "Approval Pending"}</Text>

        <Text style={styles.emptySub}>
          {t("residency_request_submitted_desc") || "Your residency request has been submitted. For security reasons, payment methods are enabled only after the owner verifies your profile."}
        </Text>

        <View style={styles.statusLabelContainer}>
          <View style={styles.pulseDot} />
          <Text style={styles.statusText}>{t("waiting_owner_verification") || "Waiting for Owner's Verification"}</Text>
        </View>

      </ScrollView>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  backCircle: { width: 38, height: 38, borderRadius: 19, backgroundColor: "#F8FAFC", alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 22, fontWeight: "800", marginLeft: 15, color: "#0F172A" },

  centerContent: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },

  // PREMIUM ICON STYLES
  illustrationWrapper: {
    width: 220,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20
  },
  iconGlow: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#F5F3FF', // Very light purple glow
    opacity: 0.8,
  },
  mainIconCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 10, // Shadow for Android
    shadowColor: '#5F259F', // Shadow for iOS
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
  },
  floatingBadge: {
    position: 'absolute',
    bottom: 25,
    right: 35,
    backgroundColor: '#10B981', // Success Green
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#FFFFFF',
    elevation: 5,
  },
  statusBadgeIcon: {
    position: 'absolute',
    top: 30,
    left: 30,
    backgroundColor: '#FEF3C7', // Light Amber
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    elevation: 3,
  },

  // TEXT STYLES
  emptyTitle: { fontSize: 24, fontWeight: '900', color: '#1E293B', marginTop: 10 },
  emptySub: { fontSize: 14, color: '#64748B', textAlign: 'center', marginTop: 12, lineHeight: 22 },

  statusLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 35,
    backgroundColor: "#FDF2F2",
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "#FEE2E2",
  },
  pulseDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#EF4444', marginRight: 10 },
  statusText: { color: "#B91C1C", fontWeight: '800', fontSize: 13 },
});