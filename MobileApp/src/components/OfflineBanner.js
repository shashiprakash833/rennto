import React, { useEffect, useRef } from 'react';
import { StyleSheet, Text, View, Animated, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNetwork } from '../hooks/useNetwork';

export default function OfflineBanner() {
  const { isConnected } = useNetwork();
  const insets = useSafeAreaInsets();
  const animation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animation, {
      toValue: isConnected ? 0 : 1,
      duration: 350,
      useNativeDriver: true,
    }).start();
  }, [isConnected]);

  const translateY = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [-100, 0],
  });

  return (
    <Animated.View
      style={[
        styles.container,
        {
          paddingTop: Math.max(insets.top, 10),
          transform: [{ translateY }],
        },
      ]}
    >
      <View style={styles.content}>
        <Ionicons name="cloud-offline-outline" size={20} color="#FFFFFF" style={styles.icon} />
        <View style={styles.textContainer}>
          <Text style={styles.title}>No Internet Connection</Text>
          <Text style={styles.subtitle}>Showing cached data</Text>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 99999,
    backgroundColor: '#EF4444',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  icon: {
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  subtitle: {
    color: '#FEE2E2',
    fontSize: 11,
    marginTop: 1,
  },
});
