import React, { useEffect, useRef } from 'react';
import { Animated, View, StyleSheet } from 'react-native';

const BlinkingBadge = ({ visible, right = -4, top = -4, size = 10, color = 'red' }) => {
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(opacity, { toValue: 0.1, duration: 600, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 1, duration: 600, useNativeDriver: true })
        ])
      ).start();
    } else {
      opacity.setValue(1);
    }
  }, [visible, opacity]);

  if (!visible) return null;

  return (
    <Animated.View style={[
      styles.badge, 
      { right, top, width: size, height: size, borderRadius: size / 2, backgroundColor: color, opacity }
    ]} />
  );
};

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 }
  }
});

export default BlinkingBadge;
