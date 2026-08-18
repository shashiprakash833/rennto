import React from "react";
import { TouchableOpacity, Text, StyleSheet, Alert } from "react-native";
import { useMaintenance } from "../context/MaintenanceContext";

export default function DisabledActionButton({
  onPress,
  children,
  style,
  disabledStyle,
  disabled: customDisabled,
  title,
  textStyle,
  ...props
}) {
  const { maintenanceMode } = useMaintenance();
  const isReadOnly = maintenanceMode === "READ_ONLY";

  const handlePress = (e) => {
    if (isReadOnly) {
      console.log(
        "Maintenance Mode",
        "This action is temporarily unavailable during scheduled maintenance. You can continue to browse other parts of the application."
      );
      return;
    }
    if (onPress) {
      onPress(e);
    }
  };

  return (
    <TouchableOpacity
      {...props}
      onPress={handlePress}
      disabled={customDisabled}
      style={[
        style,
        isReadOnly && (disabledStyle || styles.readOnlyDisabled),
      ]}
      activeOpacity={isReadOnly ? 0.7 : props.activeOpacity}
    >
      {isReadOnly && title ? (
        <Text style={[styles.defaultText, textStyle]}>Unavailable During Maintenance</Text>
      ) : (
        children || (title ? <Text style={[styles.defaultText, textStyle]}>{title}</Text> : null)
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  readOnlyDisabled: {
    opacity: 0.5,
  },
  defaultText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});
