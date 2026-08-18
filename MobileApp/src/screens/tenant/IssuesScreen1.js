import { Ionicons, MaterialCommunityIcons, Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View, TouchableOpacity, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLanguage } from "../../utils/LanguageContext";

export default function IssuesScreen({ navigation }) {
  const { t } = useLanguage();
  return (
    <SafeAreaView style={styles.container}>

      {/* 1. MATCHING HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation?.goBack()} style={styles.backCircle}>
          <Ionicons name="chevron-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("report_issue") || "Report Issue"}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.centerContent}>

        {/* 2. PREMIUM COMPOSITIONAL ICON */}
        <View style={styles.illustrationWrapper}>
          {/* Background Glow */}
          <View style={styles.iconGlow} />

          {/* Main Icon: Maintenance Clipboard */}
          <View style={styles.mainIconCircle}>
            <MaterialCommunityIcons name="tools" size={80} color="#5F259F" />
          </View>

          {/* Floating Badge: Lock/Security icon */}
          <View style={styles.lockBadge}>
            <MaterialCommunityIcons name="lock-outline" size={22} color="#FFFFFF" />
          </View>

          {/* Secondary Badge: Verification Mark */}
          <View style={styles.smallInfoBadge}>
            <Feather name="user-check" size={16} color="#D97706" />
          </View>
        </View>

        {/* 3. CONSISTENT TEXT CONTENT */}
        <Text style={styles.emptyTitle}>{t("verification_required") || "Verification Required"}</Text>

        <Text style={styles.emptySub}>
          {t("cannot_report_issues_desc") || "You cannot report maintenance issues yet. Please wait for the owner to accept your residency request and verify your room details."}
        </Text>

        {/* 4. STATUS INDICATOR */}
        <View style={styles.statusLabelContainer}>
          <View style={styles.pulseDot} />
          <Text style={styles.statusText}>{t("checking_resident_status") || "Checking Resident Status..."}</Text>
        </View>

        {/* Action Suggestion */}
        {/* <TouchableOpacity style={styles.contactBtn}>
          <Text style={styles.contactText}>Contact Support</Text>
        </TouchableOpacity> */}

      </ScrollView>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },

  // Header (Matched exactly to your Payment Screen)
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9'
  },
  backCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#F8FAFC",
    alignItems: 'center',
    justifyContent: 'center'
  },
  headerTitle: { fontSize: 22, fontWeight: "800", marginLeft: 15, color: "#0F172A" },

  centerContent: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },

  // Premium Icon Composition
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
    backgroundColor: '#F5F3FF',
    opacity: 0.8,
  },
  mainIconCircle: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 10,
    shadowColor: '#5F259F',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
  },
  lockBadge: {
    position: 'absolute',
    bottom: 35,
    right: 40,
    backgroundColor: '#64748B', // Slate gray for locked status
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    elevation: 4,
  },
  smallInfoBadge: {
    position: 'absolute',
    top: 40,
    left: 45,
    backgroundColor: '#FEF3C7',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },

  // Text Components
  emptyTitle: { fontSize: 22, fontWeight: '900', color: '#1E293B', marginTop: 10 },
  emptySub: { fontSize: 14, color: '#64748B', textAlign: 'center', marginTop: 12, lineHeight: 22 },

  // Status Label
  statusLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 35,
    backgroundColor: "#FFFBEB",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "#FEF3C7",
  },
  pulseDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#D97706', marginRight: 10 },
  statusText: { color: "#D97706", fontWeight: '800', fontSize: 13 },

  contactBtn: {
    marginTop: 30,
    padding: 10,
  },
  contactText: {
    color: "#5F259F",
    fontWeight: '700',
    fontSize: 14,
    textDecorationLine: 'underline'
  }
});