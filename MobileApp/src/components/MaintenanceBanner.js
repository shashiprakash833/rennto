import React, { useEffect } from "react";
import { StyleSheet, Text, View, Dimensions, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useMaintenance } from "../context/MaintenanceContext";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from "react-native-reanimated";

export default function MaintenanceBanner() {
  const { maintenanceMode, maintenanceMessage, estimatedCompletion } = useMaintenance();
  const insets = useSafeAreaInsets();
  const [collapsed, setCollapsed] = React.useState(false);

  const isReadOnly = maintenanceMode === "READ_ONLY";
  const translateY = useSharedValue(-200);

  useEffect(() => {
    if (isReadOnly) {
      setCollapsed(false); // Reset collapsed state whenever read-only mode triggers
    }
  }, [isReadOnly]);

  useEffect(() => {
    if (isReadOnly && !collapsed) {
      translateY.value = withTiming(0, {
        duration: 500,
        easing: Easing.out(Easing.back(1)),
      });
    } else {
      translateY.value = withTiming(-200, {
        duration: 400,
        easing: Easing.in(Easing.ease),
      });
    }
  }, [isReadOnly, collapsed]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
    };
  });

  if (!isReadOnly) return null;

  const formatCompletionTime = (timeString) => {
    if (!timeString) return "soon";
    try {
      let naiveString = timeString;
      if (naiveString.endsWith("Z")) {
        naiveString = naiveString.slice(0, -1);
      } else if (naiveString.includes("+")) {
        naiveString = naiveString.split("+")[0];
      }
      const date = new Date(naiveString);
      if (isNaN(date.getTime())) return timeString;
      return date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZoneName: "short",
      });
    } catch (e) {
      return timeString;
    }
  };

  return (
    <Animated.View
      style={[
        styles.container,
        { paddingTop: Math.max(insets.top, 10) },
        animatedStyle,
      ]}
    >
      <View style={styles.content}>
        <View style={styles.headerRow}>
          <View style={styles.titleContainer}>
            <MaterialCommunityIcons name="alert-decagram" size={20} color="#FBBF24" style={{ marginRight: 6 }} />
            <Text style={styles.titleText}>Scheduled Maintenance Mode</Text>
          </View>
          <TouchableOpacity
            onPress={() => setCollapsed(true)}
            style={styles.closeButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <MaterialCommunityIcons name="close" size={18} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        <Text style={styles.messageText}>
          {maintenanceMessage || "The system is in Read-Only mode."}
        </Text>

        <View style={styles.footerRow}>
          <Text style={styles.infoText}>
            You can browse, but all saves, bookings, edits, and payments are disabled.
          </Text>
          {estimatedCompletion && (
            <View style={styles.timeTag}>
              <MaterialCommunityIcons name="clock-outline" size={12} color="#FFFFFF" style={{ marginRight: 3 }} />
              <Text style={styles.timeText}>ETA: {formatCompletionTime(estimatedCompletion)}</Text>
            </View>
          )}
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 99999,
    backgroundColor: "#1E1B4B",
    borderBottomWidth: 2,
    borderBottomColor: "#EC4899",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 10,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  titleText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  closeButton: {
    padding: 2,
  },
  messageText: {
    color: "#D1D5DB",
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 8,
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
  },
  infoText: {
    color: "#EC4899",
    fontSize: 11,
    fontWeight: "600",
    flex: 1,
    minWidth: 200,
  },
  timeTag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(139, 92, 246, 0.4)",
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  timeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
  },
});
