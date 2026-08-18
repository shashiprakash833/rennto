import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import COLORS from "../../theme/colors";

export default function PrivacySecurityScreen({ navigation }) {
  const [isTwoFactorAuth, setIsTwoFactorAuth] = React.useState(false);
  const [isBiometric, setIsBiometric] = React.useState(true);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.TEXT_PRIMARY} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy & Security</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Security Settings</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <View style={styles.rowInfo}>
                <Ionicons name="finger-print" size={24} color={COLORS.PRIMARY} />
                <Text style={styles.rowLabel}>Biometric Login</Text>
              </View>
              <Switch
                value={isBiometric}
                onValueChange={setIsBiometric}
                trackColor={{ false: "#D1D5DB", true: COLORS.PRIMARY_LIGHT }}
              />
            </View>
            <View style={[styles.row, styles.lastRow]}>
              <View style={styles.rowInfo}>
                <Ionicons name="shield-checkmark" size={24} color={COLORS.PRIMARY} />
                <Text style={styles.rowLabel}>Two-Factor Authentication</Text>
              </View>
              <Switch
                value={isTwoFactorAuth}
                onValueChange={setIsTwoFactorAuth}
                trackColor={{ false: "#D1D5DB", true: COLORS.PRIMARY_LIGHT }}
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Actions</Text>
          <View style={styles.card}>
            <TouchableOpacity style={styles.row}>
              <View style={styles.rowInfo}>
                <Ionicons name="key" size={24} color="#F59E0B" />
                <Text style={styles.rowLabel}>Change Password</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.row, styles.lastRow]}>
              <View style={styles.rowInfo}>
                <Ionicons name="trash" size={24} color={COLORS.ERROR} />
                <Text style={[styles.rowLabel, { color: COLORS.ERROR }]}>Delete Account</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  backBtn: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.TEXT_PRIMARY,
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.TEXT_SECONDARY,
    textTransform: "uppercase",
    marginBottom: 12,
    marginLeft: 4,
  },
  card: {
    backgroundColor: "white",
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  lastRow: {
    borderBottomWidth: 0,
  },
  rowInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  rowLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.TEXT_PRIMARY,
  },
});
