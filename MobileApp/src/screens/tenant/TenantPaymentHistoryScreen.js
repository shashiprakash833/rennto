import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  Modal,
  Dimensions
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axiosOriginal from 'axios';
import BASE_URL, { fetchWithAuth } from '../../config/Api';
import { useLanguage } from '../../utils/LanguageContext';
import COLORS from '../../theme/colors';
import { useNetwork } from '../../hooks/useNetwork';
import OfflineView from '../../components/OfflineView';

const axios = {
  get: async (url, config = {}) => {
    const res = await fetchWithAuth(url, { ...config, method: 'GET' });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      const err = new Error(`Request failed with status code ${res.status}`);
      err.response = { data, status: res.status };
      throw err;
    }
    return { data, status: res.status };
  },
  post: async (url, body, config = {}) => {
    const isFormData = body instanceof FormData;
    const headers = { ...config.headers };
    if (!isFormData && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }
    
    const res = await fetchWithAuth(url, {
      ...config,
      method: 'POST',
      headers,
      body: isFormData ? body : JSON.stringify(body),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      const err = new Error(`Request failed with status code ${res.status}`);
      err.response = { data, status: res.status };
      throw err;
    }
    return { data, status: res.status };
  }
};

const { width, height } = Dimensions.get('window');

export default function TenantPaymentHistoryScreen({ navigation }) {
  const { isConnected } = useNetwork();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [payments, setPayments] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);

  const fetchHistory = async () => {
    try {
      const phone = await AsyncStorage.getItem('tenantPhone');
      if (!phone) return;

      const response = await axios.get(`${BASE_URL}/api/tenant-payment-history/${encodeURIComponent(phone)}/`);
      setPayments(response.data);
    } catch (error) {
      console.log('FETCH HISTORY ERROR:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (isConnected !== undefined) {
        fetchHistory();
      }
    }, [isConnected])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchHistory();
  };

  const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case 'SUCCESS': return '#22C55E';
      case 'PENDING': return '#F59E0B';
      case 'FAILED': return '#EF4444';
      default: return '#64748B';
    }
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={{ marginTop: 12, color: '#64748B' }}>{t("loading") || "Loading..."}</Text>
      </View>
    );
  }

  if (isConnected === false && payments.length === 0) {
    return <OfflineView />;
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("payment_history") || "Payment History"}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.scrollContent}
      >
        {payments.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="history" size={64} color="#CBD5E1" />
            <Text style={styles.emptyText}>{t("no_payment_history") || "No payment records found."}</Text>
          </View>
        ) : (
          payments.map((payment, index) => (
            <View key={payment.txn_ref || index} style={styles.paymentCard}>
              <View style={styles.cardHeader}>
                <View style={styles.propertyInfo}>
                  <Text style={styles.propertyName}>{payment.property_name || t("property") || 'Property'}</Text>
                  <Text style={styles.paymentDate}>
                    {new Date(payment.created_at).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(payment.status) + '15' }]}>
                  <Text style={[styles.statusText, { color: getStatusColor(payment.status) }]}>
                    {t(payment.status?.toLowerCase()) || payment.status}
                  </Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.cardDetails}>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>{t("amount") || "Amount"}</Text>
                  <Text style={styles.amountValue}>₹{payment.amount?.toLocaleString()}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>{t("transaction_id") || "Transaction ID"}</Text>
                  <Text style={styles.txnValue}>{payment.txn_ref}</Text>
                </View>
              </View>

              {payment.payment_screenshot && (
                <TouchableOpacity 
                  style={styles.screenshotPreview}
                  onPress={() => setSelectedImage(payment.payment_screenshot)}
                >
                  <Image source={{ uri: payment.payment_screenshot }} style={styles.previewImg} />
                  <View style={styles.previewOverlay}>
                    <Ionicons name="eye" size={20} color="#FFF" />
                    <Text style={styles.previewText}>{t("view_receipt") || "View Receipt"}</Text>
                  </View>
                </TouchableOpacity>
              )}
            </View>
          ))
        )}
      </ScrollView>

      {/* Image Preview Modal */}
      <Modal visible={!!selectedImage} transparent={true} animationType="fade">
        <View style={styles.modalContainer}>
          <TouchableOpacity 
            style={styles.modalClose} 
            onPress={() => setSelectedImage(null)}
          >
            <Ionicons name="close-circle" size={40} color="#FFF" />
          </TouchableOpacity>
          {selectedImage && (
            <Image 
              source={{ uri: selectedImage }} 
              style={styles.fullImage} 
              resizeMode="contain" 
            />
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backBtn: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1E293B' },
  scrollContent: { padding: 16 },
  paymentCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  propertyName: { fontSize: 16, fontWeight: 'bold', color: '#1E293B' },
  paymentDate: { fontSize: 12, color: '#64748B', marginTop: 4 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 11, fontWeight: 'bold' },
  divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 12 },
  cardDetails: { flexDirection: 'row', justifyContent: 'space-between' },
  detailLabel: { fontSize: 12, color: '#94A3B8', marginBottom: 4 },
  amountValue: { fontSize: 16, fontWeight: 'bold', color: '#1E293B' },
  txnValue: { fontSize: 12, color: '#64748B', maxWidth: 150 },
  detailItem: { flex: 1 },
  screenshotPreview: {
    marginTop: 12,
    height: 120,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  previewImg: { width: '100%', height: '100%' },
  previewOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  previewText: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
  emptyState: { alignItems: 'center', marginTop: 100 },
  emptyText: { fontSize: 16, color: '#64748B', marginTop: 16 },
  modalContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' },
  modalClose: { position: 'absolute', top: 60, right: 20, zIndex: 10 },
  fullImage: { width: width, height: height * 0.8 },
});


