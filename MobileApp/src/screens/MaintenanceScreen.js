import React, { useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  StatusBar,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from "react-native-reanimated";
import { useMaintenance } from "../context/MaintenanceContext";

const { width } = Dimensions.get("window");

export default function MaintenanceScreen() {
  const {
    maintenanceMessage,
    estimatedCompletion,
    checkMaintenance,
  } = useMaintenance();

  const [refreshing, setRefreshing] = React.useState(false);

  // Breathing & spinning animation for the main icon
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(1.0, { duration: 1500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    rotation.value = withRepeat(
      withTiming(360, { duration: 8000, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  const animatedIconStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: scale.value },
        { rotate: `${rotation.value}deg` },
      ],
    };
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    await checkMaintenance();
    setTimeout(() => {
      setRefreshing(false);
    }, 800);
  };

  const formatCompletionTime = (timeString) => {
    if (!timeString) return "Soon";
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
        weekday: "short",
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
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1E1B4B" />
      <LinearGradient
        colors={["#1E1B4B", "#312E81", "#0F172A"]}
        style={styles.gradient}
      >
        <View style={styles.content}>
          <Animated.View style={[styles.iconContainer, animatedIconStyle]}>
            <LinearGradient
              colors={["#8B5CF6", "#EC4899"]}
              style={styles.iconGradient}
            >
              <MaterialCommunityIcons name="tools" size={60} color="#FFFFFF" />
            </LinearGradient>
          </Animated.View>

          <Text style={styles.title}>Under Scheduled Maintenance</Text>

          <View style={styles.messageBox}>
            <Text style={styles.messageText}>
              {maintenanceMessage ||
                "We are currently performing scheduled system updates to improve performance and add new features. We will be back shortly!"}
            </Text>
          </View>

          {estimatedCompletion && (
            <View style={styles.timeBox}>
              <MaterialCommunityIcons name="clock-outline" size={20} color="#F3F4F6" style={{ marginRight: 8 }} />
              <Text style={styles.timeLabel}>Estimated Completion:</Text>
              <Text style={styles.timeValue}>{formatCompletionTime(estimatedCompletion)}</Text>
            </View>
          )}

          <Text style={styles.subtext}>
            Owner and Tenant access is temporarily disabled during this window. Thank you for your patience.
          </Text>

          <TouchableOpacity
            style={styles.refreshButton}
            onPress={handleRefresh}
            disabled={refreshing}
            activeOpacity={0.8}
          >
            {refreshing ? (
              <ActivityIndicator color="#1E1B4B" size="small" />
            ) : (
              <>
                <MaterialCommunityIcons
                  name="refresh"
                  size={20}
                  color="#1E1B4B"
                  style={{ marginRight: 6 }}
                />
                <Text style={styles.refreshText}>Check Again</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  content: {
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  iconContainer: {
    width: 130,
    height: 130,
    borderRadius: 65,
    marginBottom: 35,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#8B5CF6",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
  iconGradient: {
    width: "100%",
    height: "100%",
    borderRadius: 65,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 20,
    letterSpacing: 0.5,
  },
  messageBox: {
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderColor: "rgba(255, 255, 255, 0.15)",
    borderWidth: 1,
    borderRadius: 16,
    padding: 20,
    width: "100%",
    marginBottom: 25,
  },
  messageText: {
    fontSize: 16,
    color: "#E2E8F0",
    textAlign: "center",
    lineHeight: 24,
  },
  timeBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(139, 92, 246, 0.2)",
    borderColor: "rgba(139, 92, 246, 0.4)",
    borderWidth: 1,
    borderRadius: 30,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  timeLabel: {
    fontSize: 14,
    color: "#F3F4F6",
    marginRight: 6,
  },
  timeValue: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  subtext: {
    fontSize: 14,
    color: "#94A3B8",
    textAlign: "center",
    marginBottom: 40,
    lineHeight: 20,
    paddingHorizontal: 10,
  },
  refreshButton: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    minWidth: 180,
  },
  refreshText: {
    color: "#1E1B4B",
    fontSize: 16,
    fontWeight: "700",
  },
});
