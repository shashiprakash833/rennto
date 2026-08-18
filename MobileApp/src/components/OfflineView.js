import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import COLORS from '../theme/colors';

export default function OfflineView({ title = "No Internet Connection", subtitle = "No cached data available." }) {
  return (
    <View style={styles.container}>
      <Ionicons name="cloud-offline-outline" size={64} color={COLORS.PRIMARY || "#5F259F"} style={styles.icon} />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#F8F8FC',
  },
  icon: {
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#212121',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#757575',
    textAlign: 'center',
  },
});
