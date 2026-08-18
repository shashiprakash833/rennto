import React, { useState, useEffect, useRef, useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Alert, ActivityIndicator, Animated, StatusBar, Platform, Dimensions, TextInput, Image, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axiosOriginal from 'axios';
import BASE_URL, { fetchWithAuth } from '../../config/Api';
import { Svg, Circle, G, Line, Path, Rect } from 'react-native-svg';
import { useMaintenance } from '../../context/MaintenanceContext';
import { OwnerAccountContext } from '../../context/OwnerAccountContext';

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
    const res = await fetchWithAuth(url, {
      ...config,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(config.headers || {}) },
      body: JSON.stringify(body),
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
import { useLanguage } from '../../utils/LanguageContext';
import * as DocumentPicker from 'expo-document-picker';
import DateTimePicker from '@react-native-community/datetimepicker';

const { width, height } = Dimensions.get('window');


// Color Palette
const COLORS = {
  primaryBlue: '#8B5CF6',
  successGreen: '#22C55E',
  warningOrange: '#F59E0B',
  dangerRed: '#EF4444',
  background: '#F8FAFC',
  cardBg: '#FFFFFF',
  textPrimary: '#1E293B',
  textSecondary: '#64748B',
  textLight: '#94A3B8',
  glassBg: 'rgba(255, 255, 255, 0.8)',
  glassBorder: 'rgba(255, 255, 255, 0.3)',
};

// Returns ISO 8601 format (YYYY-MM-DD) required by the Django DateField API
const getDynamicDueDate = (daysOffset = 10) => {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

// Returns human-readable format (e.g. "1 Aug 2026") for display in the UI
const getDynamicDueDateDisplay = (daysOffset = 10) => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
};

const OwnerPaymentScreen = () => {
  const { maintenanceMode } = useMaintenance();
  const isReadOnly = maintenanceMode === 'READ_ONLY';
  const { selectedAccount } = useContext(OwnerAccountContext);
  const checkReadOnly = () => {
    if (isReadOnly) {
      Alert.alert(
        "Maintenance Mode",
        "This action is temporarily unavailable during scheduled maintenance. You can continue to browse other parts of the application."
      );
      return true;
    }
    return false;
  };
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tenantData, setTenantData] = useState([]);

  const [stats, setStats] = useState({
    collected: 0,
    pending: 0,
    tenants: 0,
    collectedCount: 0,
    pendingCount: 0,
    cashCount: 0,
  });

  const getInitialMonth = () => {
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];
    const date = new Date();
    return `${months[date.getMonth()]} ${date.getFullYear()}`;
  };
  const [selectedMonth, setSelectedMonth] = useState(getInitialMonth());
  const [filterTab, setFilterTab] = useState('all');
  const [showPendingModal, setShowPendingModal] = useState(false);
  const [showUpiModal, setShowUpiModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [customMessage, setCustomMessage] = useState('');

  const [selectedProof, setSelectedProof] = useState(null);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [filterByDate, setFilterByDate] = useState(false);
  const [showPartialPaymentModal, setShowPartialPaymentModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showCashPartialModal, setShowCashPartialModal] = useState(false);
  const [cashPartialData, setCashPartialData] = useState({
    paidAmount: 0,
    remainingBalance: 0,
    remainingDueDate: '',
    tenantNote: ''
  });
  const [partialPaymentData, setPartialPaymentData] = useState({
    paidAmount: 0,
    remainingBalance: 0,
    remainingDueDate: '',
    tenantNote: ''
  });
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedRejectProof, setSelectedRejectProof] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  // Add these to your existing useState hooks
  const [verificationQueue, setVerificationQueue] = useState([]);
  const [selectedScreenshot, setSelectedScreenshot] = useState(null);

  // UPI and QR State
  const [upiId, setUpiId] = useState("");
  const [qrCode, setQrCode] = useState(null); // URL from backend
  const [newQrCode, setNewQrCode] = useState(null); // Newly picked asset
  const [savingBank, setSavingBank] = useState(false);
  const [loadingBank, setLoadingBank] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [isSetupMode, setIsSetupMode] = useState(false);
  const [setupDismissed, setSetupDismissed] = useState(false);
  const [upiError, setUpiError] = useState("");
  const [qrError, setQrError] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [phoneError, setPhoneError] = useState("");

  // Rehydrate OwnerPhone if empty (e.g. after refresh or app restart)
  useEffect(() => {
    const checkPhone = async () => {
      const stored = await AsyncStorage.getItem("ownerPhone");
      if (stored) {
        console.log("Rehydrating Owner Payment with:", stored);
        setPhoneNumber(stored);
      }
    };
    checkPhone();
  }, []);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // UPI Validation helper
  const validateUpi = (id) => {
    if (!id) return "UPI ID is required";
    if (id.length > 30) return "Maximum 30 characters allowed";

    // Check for spaces
    if (/\s/.test(id)) return "Spaces are not allowed";

    // Check for exactly one @
    const atCount = (id.match(/@/g) || []).length;
    if (atCount !== 1) return "Must have exactly one @";

    // Valid formats like name@paytm or user123@ybl
    // Allowed before @: letters, numbers, . _ -
    const upiRegex = /^[a-zA-Z0-9.\-_]+@[a-zA-Z]{2,}$/;
    if (!upiRegex.test(id)) return "Invalid UPI format";

    return "";
  };

  const validatePhone = (phone) => {
    if (!phone) return "Phone number is required";
    if (phone.length !== 10) return "Enter 10 digit number";
    return "";
  };

  const handlePhoneChange = (text) => {
    // Only allow digits and limit to 10
    const cleaned = text.replace(/[^0-9]/g, '').slice(0, 10);
    setPhoneNumber(cleaned);
    setPhoneError(validatePhone(cleaned));
  };

  const handleUpiChange = (text) => {
    // Remove spaces immediately
    const cleaned = text.replace(/\s/g, '');
    setUpiId(cleaned);
    setUpiError(validateUpi(cleaned));
  };

  useEffect(() => {
    const initializeData = async () => {
      let upi = "";
      let qr = null;

      try {
        const phone = await AsyncStorage.getItem("ownerPhone");
        if (phone) {
          // 1. Check local storage first for speed
          const setupStatus = await AsyncStorage.getItem(`setup_complete_${phone}`);

          // 2. Fetch from server to be sure
          const response = await fetchWithAuth(`${BASE_URL}/api/owner_data/${encodeURIComponent(phone.trim())}/`);
          const data = await response.json();

          if (response.ok && data.step1) {
            upi = data.step1.upiId || "";
            qr = data.step1.qrCode || null;
            const phoneNumber = data.step1.phoneNumber || "";
            setUpiId(upi);
            setPhoneNumber(phoneNumber);
            setQrCode(qr ? (qr.startsWith('http') ? qr : `${BASE_URL}${qr}`) : null);

            // If server has data, it means setup was done elsewhere or previously
            if (upi || qr) {
              await AsyncStorage.setItem(`setup_complete_${phone}`, "true");
            }
          }

          // 3. Final decision: If we have local flag OR server data, skip setup
          if (setupStatus === "true" || upi || qr) {
            setIsSetupMode(false);
          } else {
            setIsSetupMode(true);
          }
        }
      } catch (error) {
        console.log("Init fetch error:", error);
      }

      await fetchPayments();
      setHasInitialized(true);
    };
    initializeData();

    // Background polling for payment updates
    const pollId = setInterval(() => {
      fetchPayments(true);
    }, 10000);

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      )
    ]).start();

    return () => clearInterval(pollId);
  }, [selectedAccount]);

  const fetchPayments = async (isBackground = false) => {
    try {
      if (!isBackground && !refreshing) setLoading(true);
      const phone = await AsyncStorage.getItem('ownerPhone');
      if (!phone) {
        if (!isBackground) setLoading(false);
        setRefreshing(false);
        return;
      }

      const response = await axios.get(`${BASE_URL}/api/owner-payments/${encodeURIComponent(phone)}/`);
      const data = response.data;
      if (!Array.isArray(data)) {
        if (!isBackground) setLoading(false);
        setRefreshing(false);
        return;
      }

      // Calculate total paid per tenant first
      const tenantAggregation = new Map();
      data.forEach(item => {
        const key = item.tenant_phone || item.tenant_name || 'Unknown';
        if (!tenantAggregation.has(key)) {
          tenantAggregation.set(key, { total_paid: 0, latest_total_rent: item.total_rent || item.amount || 0 });
        }
        if (item.status === 'SUCCESS') {
          tenantAggregation.get(key).total_paid += (item.amount || 0);
        }
      });

      // Map API data to UI format
      const formattedData = data.map((item, index) => {
        const date = new Date(item.created_at);
        const agg = tenantAggregation.get(item.tenant_phone || item.tenant_name || 'Unknown');
        
        let mappedStatus = 'due';
        if (item.status === 'SUCCESS') mappedStatus = 'paid';
        else if (item.status === 'FAILED' || item.status === 'REJECTED') mappedStatus = 'failed';

        return {
          id: item.id || index,
          name: item.tenant_name || 'Unknown',
          room: item.property_name || 'N/A',
          floor_number: item?.floor_number ?? 'N/A',
          room_number: item?.room_number ?? 'N/A',
          bed_number: item?.bed_number ?? null,
          amount: item?.amount ?? 0,
          total_rent: item?.total_rent ?? agg.latest_total_rent,
          total_paid_so_far: agg.total_paid,
          dueDate: date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
          dueTime: date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
          status: mappedStatus,
          original_status: item.status,
          paidDate: item.status === 'SUCCESS' ? date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : null,
          paymentMethod: item.payment_screenshot ? 'UPI' : (item.status === 'SUCCESS' ? 'Cash' : null),
          payment_screenshot: item.payment_screenshot ? (item.payment_screenshot.startsWith('http') ? item.payment_screenshot : `${BASE_URL}${item.payment_screenshot}`) : null,
          txn_ref: item.txn_ref,
          tenant_phone: item.tenant_phone,
          description: item.description // Get the tenant message/note
        };
      });

      // Remove duplicates by tenant phone or name to ensure one card per tenant
      const uniqueDataMap = new Map();
      formattedData.forEach(item => {
        const key = item.tenant_phone || item.name;
        if (!uniqueDataMap.has(key)) {
          uniqueDataMap.set(key, item);
        } else {
          const existing = uniqueDataMap.get(key);
          const getPriority = (status) => status === 'due' ? 3 : (status === 'paid' ? 2 : 1);
          if (getPriority(item.status) > getPriority(existing.status)) {
            uniqueDataMap.set(key, item);
          }
        }
      });
      const uniqueData = Array.from(uniqueDataMap.values());

      const uiData = uniqueData.map(tenant => {
        const pending = (tenant.total_rent || 0) - (tenant.total_paid_so_far || 0);
        return {
          ...tenant,
          status: pending > 0 ? 'due' : 'paid'
        };
      });

      setTenantData(uiData);

      // Populate verification queue with payments that have screenshots or are cash payments but are still pending
      const queue = uniqueData
        .filter(item => (item.payment_screenshot || (item.txn_ref && item.txn_ref.startsWith('CASH-'))) && item.status === 'due')
        .map(item => ({
          id: item.id,
          tenantId: item.id,
          name: item.name,
          room: item.room,
          amount: item.amount,
          total_rent: item.total_rent,
          total_paid_so_far: item.total_paid_so_far,
          proofImage: item.payment_screenshot,
          timestamp: item.dueDate + ', ' + item.dueTime,
          txn_ref: item.txn_ref,
          tenant_phone: item.tenant_phone,
          description: item.description
        }));

      setVerificationQueue(queue);

      // Update stats
      const collected = formattedData.filter(t => t.status === 'paid').reduce((sum, t) => sum + t.amount, 0);
      const pending = uniqueData.reduce((sum, t) => sum + Math.max(0, (t.total_rent || 0) - (t.total_paid_so_far || 0)), 0);
      const collectedCount = formattedData.filter(t => t.status === 'paid').length;
      const pendingCount = uniqueData.filter(t => (t.total_rent || 0) - (t.total_paid_so_far || 0) > 0).length;
      const cashCount = formattedData.filter(t => t.paymentMethod === 'Cash').length;

      setStats({
        collected,
        pending,
        tenants: uniqueData.length,
        collectedCount,
        pendingCount,
        cashCount,
      });

    } catch (error) {
      console.error("Error fetching payments:", error);
      Alert.alert('Error', 'Failed to fetch payment details.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPayments(false);
  };

  const fetchBankDetails = async () => {
    try {
      setLoadingBank(true);
      const phone = await AsyncStorage.getItem("ownerPhone");
      if (!phone) {
        setLoadingBank(false);
        return;
      }
      const response = await fetchWithAuth(`${BASE_URL}/api/owner_data/${encodeURIComponent(phone.trim())}/`);
      const data = await response.json();
      if (response.ok && data.step1) {
        setUpiId(data.step1.upiId || "");
        setPhoneNumber(data.step1.phoneNumber || "");
        const qr = data.step1.qrCode;
        setQrCode(qr ? (qr.startsWith('http') ? qr : `${BASE_URL}${qr}`) : null);
      }
    } catch (error) {
      console.log("Fetch bank error:", error);
    } finally {
      setLoadingBank(false);
    }
  };

  const pickQrCode = async () => {
    const res = await DocumentPicker.getDocumentAsync({
      type: "image/*",
    });

    if (!res.canceled && res.assets && res.assets.length > 0) {
      const asset = res.assets[0];
      if (asset.size > 5242880) {
        Alert.alert("Error", "Image size limit is 5MB");
      } else {
        setNewQrCode(asset);
        // Visual feedback for picking
        // Alert.alert("Success", "QR Code selected! Click 'Save' to update.");
      }
    }
  };

  const handleSaveBank = async () => {
    if (checkReadOnly()) return;
    const upiErr = validateUpi(upiId);
    const phoneErr = validatePhone(phoneNumber);
    const hasQr = newQrCode || qrCode;

    if (upiErr || phoneErr || !hasQr) {
      if (upiErr) setUpiError(upiErr);
      if (phoneErr) setPhoneError(phoneErr);
      if (!hasQr) setQrError("Upload Screenshot");
      Alert.alert("Required Fields", "Please fix the errors above to continue.");
      return;
    }

    setSavingBank(true);
    try {
      const phone = await AsyncStorage.getItem("ownerPhone");
      if (!phone) return;

      const formData = new FormData();
      formData.append("upiId", upiId);
      formData.append("phoneNumber", phoneNumber);

      if (newQrCode) {
        formData.append("qrCode", {
          uri: newQrCode.uri,
          name: newQrCode.name || "Qr_code.jpg",
          type: newQrCode.mimeType || "Image/jpeg",
        });
      }

      const response = await fetchWithAuth(`${BASE_URL}/api/owner_profile_update/${encodeURIComponent(phone.trim())}/`, {
        method: 'PUT',
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        // Update local storage so we never see setup again for this phone
        if (phone) {
          await AsyncStorage.setItem(`setup_complete_${phone}`, "true");
        }

        // Update local state immediately with what we sent
        // This ensures the UI doesn't flicker back to old data
        if (newQrCode) {
          // If server returned a path, use it, else keep local URI for instant update
          const serverQr = result.qrCode || result.step1?.qrCode;
          if (serverQr) {
            setQrCode(serverQr.startsWith('http') ? serverQr : `${BASE_URL}${serverQr}`);
          } else {
            setQrCode(newQrCode.uri);
          }
        }

        // Update UPI ID from server response if available, otherwise keep current
        const serverUpi = result.upiId || result.step1?.upiId;
        if (serverUpi) {
          setUpiId(serverUpi);
        }

        const serverPhone = result.phoneNumber || result.step1?.phoneNumber;
        if (serverPhone) {
          setPhoneNumber(serverPhone);
        }

        setNewQrCode(null);

        // EXIT Setup Mode immediately if we were in it
        setIsSetupMode(false);

        // Refresh payments to update stats/dashboard
        await fetchPayments();

        setShowUpiModal(false);
        // Alert.alert("Success", "Payment details updated successfully!");
      } else {
        const errorMsg = result.message || result.error || "Failed to update payment details";
        Alert.alert("Error", errorMsg);
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Something went wrong");
    } finally {
      setSavingBank(false);
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'paid':
        return { bg: '#F0FDF4', color: '#22C55E', label: 'PAID', icon: 'checkmark-circle' };
      case 'due':
        return { bg: '#FFF7ED', color: '#F59E0B', label: 'DUE', icon: 'time' };
      case 'request_sent':
        return { bg: '#FEF3C7', color: '#F59E0B', label: 'REQUEST SENT', icon: 'time' };
      default:
        return { bg: '#F1F5F9', color: '#64748B', label: 'UNKNOWN', icon: 'help-circle' };
    }
  };

  const handleSendReminder = async (tenantName, tenantPhone, amount = null) => {
    if (checkReadOnly()) return;
    try {
      if (!tenantPhone) {
        Alert.alert('Error', `Missing phone number for ${tenantName}. Cannot send reminder.`);
        return;
      }
      setLoading(true);
      await axios.post(`${BASE_URL}/api/send-tenant-notification/`, {
        tenantPhone: tenantPhone,
        title: amount ? 'Payment Request' : 'Rent Payment Reminder',
        message: amount
          ? `Hi ${tenantName}, please pay ₹${amount.toLocaleString()} for your rent.`
          : `Hi ${tenantName}, this is a reminder for your rent payment. Please pay as soon as possible.`,
        type: amount ? 'PAYMENT_REQUEST' : 'REMINDER',
        amount: amount
      });
      setLoading(false);
      Alert.alert('Success', `Reminder sent to ${tenantName} successfully.`);
    } catch (error) {
      console.log('REMINDER ERROR:', error);
      setLoading(false);
      Alert.alert('Error', 'Failed to send reminder. Please try again.');
    }
  };

  const handleSendReminderToAll = async () => {
    if (checkReadOnly()) return;
    try {
      console.log("Starting bulk reminders...");
      const pendingTenants = tenantData.filter(t => t.status === 'due');
      console.log("Pending tenants count:", pendingTenants.length);

      if (pendingTenants.length === 0) {
        Alert.alert('No Pending Payments', 'All tenants have already paid for this month.');
        return;
      }

      setLoading(true);
      let successCount = 0;

      for (const tenant of pendingTenants) {
        if (tenant.tenant_phone) {
          try {
            await axios.post(`${BASE_URL}/api/send-tenant-notification/`, {
              tenantPhone: tenant.tenant_phone,
              title: 'Urgent Rent Payment Reminder',
              message: `Hi ${tenant.name}, this is a reminder for your rent payment of ₹${tenant.amount.toLocaleString()} for ${selectedMonth}. Please pay at your earliest convenience.`,
              type: 'REMINDER',
              amount: tenant.amount
            });
            successCount++;
          } catch (err) {
            console.log(`Failed to send to ${tenant.name}:`, err.message);
          }
        }
      }

      setLoading(false);
      Alert.alert('Success', `Reminders sent to ${successCount} tenants successfully.`);
      setShowPendingModal(false);
    } catch (error) {
      console.log('BULK REMINDER ERROR:', error);
      setLoading(false);
      Alert.alert('Error', 'Failed to process bulk reminders: ' + error.message);
    }
  };

  const handleSendRequest = (tenantName) => {
    Alert.alert('Request Sent', `Payment request sent to ${tenantName}.`);
  };

  const handleMonthChange = (direction) => {
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];
    const currentMonthIndex = months.findIndex(m => selectedMonth.startsWith(m));
    let newMonthIndex = currentMonthIndex + direction;

    if (newMonthIndex < 0) newMonthIndex = 11;
    if (newMonthIndex > 11) newMonthIndex = 0;

    const currentYear = parseInt(selectedMonth.split(' ')[1]);
    let newYear = currentYear;

    if (newMonthIndex === 0 && currentMonthIndex === 11) newYear = currentYear + 1;
    if (newMonthIndex === 11 && currentMonthIndex === 0) newYear = currentYear - 1;

    setSelectedMonth(`${months[newMonthIndex]} ${newYear}`);
    setFilterByDate(false);
  };

  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      const months = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];
      const month = months[selectedDate.getMonth()];
      const year = selectedDate.getFullYear();
      setSelectedMonth(`${month} ${year}`);
      setSelectedDate(selectedDate);
      setFilterByDate(true);
    }
  };

  const handleManualStatusChange = async (tenantId, newStatus, txn_ref) => {
    if (checkReadOnly()) return;
    try {
      setLoading(true);
      await axios.post(`${BASE_URL}/api/update-payment/`, {
        txn_ref: txn_ref,
        status: newStatus === 'paid' ? 'SUCCESS' : 'FAILED'
      });

      Alert.alert('Status Updated', `Tenant payment status has been updated to ${newStatus}.`);
      fetchPayments(); // Refresh data
      setShowFilterModal(false);
    } catch (error) {
      console.error("Error updating status:", error);
      Alert.alert('Error', 'Failed to update payment status.');
    } finally {
      setLoading(false);
    }
  };

  const handleFullCashPaid = (tenant) => {
    if (checkReadOnly()) return;
    Alert.alert(
      'Full Cash Payment',
      `Confirm full cash payment of ₹${tenant.amount.toLocaleString()} from ${tenant.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, Full Paid',
          onPress: async () => {
            try {
              setLoading(true);
              await axios.post(`${BASE_URL}/api/update-payment/`, {
                txn_ref: tenant.txn_ref,
                status: 'SUCCESS'
              });

             
              fetchPayments(); // Refresh data
            } catch (error) {
              console.error("Error marking cash payment:", error);
              Alert.alert('Error', 'Failed to update payment status.');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleMarkAsCashPaid = (tenant) => {
    if (checkReadOnly()) return;
    setSelectedTenant(tenant);
    setCashPartialData({
      paidAmount: tenant.amount * 0.5,
      remainingBalance: tenant.amount * 0.5,
      remainingDueDate: getDynamicDueDate(10),          // YYYY-MM-DD for API
      remainingDueDateDisplay: getDynamicDueDateDisplay(10), // Human-readable for UI
      tenantNote: tenant.description || ""
    });
    setShowCashPartialModal(true);
  };


  
  const handleSendMessage = async () => {
    if (checkReadOnly()) return;
    if (customMessage.trim() && selectedTenant?.tenant_phone) {
      try {
        await axios.post(`${BASE_URL}/api/send-tenant-notification/`, {
          tenantPhone: selectedTenant.tenant_phone || selectedTenant.phone,
          title: 'Message from Owner',
          message: customMessage
        });
        Alert.alert('Message Sent', `Message sent to ${selectedTenant.name}.`);
        setShowMessageModal(false);
        setCustomMessage('');
        setSelectedTenant(null);
      } catch (error) {
        Alert.alert('Error', 'Failed to send message.');
      }
    } else {
      Alert.alert('Error', 'Please enter a message and select a valid tenant.');
    }
  };

  const handleVerifyPayment = async (proofId, tenantId, txn_ref, tenantPhone, tenantName) => {
    if (checkReadOnly()) return;
    try {
      console.log("Verifying payment:", txn_ref);

      // Optimistic UI update: Remove from queue immediately
      setVerificationQueue(prev => prev.filter(item => item.txn_ref !== txn_ref));

      setLoading(true);
      await axios.post(`${BASE_URL}/api/update-payment/`, {
        txn_ref: txn_ref,
        status: 'SUCCESS'
      });

      // ✅ Close the modal IMMEDIATELY — before alert or refresh
      setLoading(false);
      setShowVerifyModal(false);

      // 🔔 Notify tenant in the background (non-blocking)
      if (tenantPhone) {
        axios.post(`${BASE_URL}/api/send-tenant-notification/`, {
          tenantPhone: tenantPhone,
          title: 'Payment Verified!',
          message: `Hi ${tenantName || 'Tenant'}, your rent payment has been successfully verified by the owner.`
        }).catch(err => console.warn("Verify notification failed (non-blocking):", err?.response?.data || err.message));
      }

      Alert.alert('Success', 'Payment verified and notification sent to tenant.');
      // Refresh in background after modal is already closed
      fetchPayments();
    } catch (error) {
      console.error("Error verifying payment:", error.response?.data || error.message);
      Alert.alert('Error', `Failed to verify payment: ${error.response?.data?.error || error.message}`);
      // Re-fetch to restore queue if error
      await fetchPayments();
    } finally {
      setLoading(false);
    }
  };

  const handleRejectPayment = (proofId, txn_ref, tenantPhone, tenantName) => {
    setShowVerifyModal(false);
    setTimeout(() => {
      setSelectedRejectProof({ proofId, txn_ref, tenantPhone, tenantName });
      setRejectionReason('');
      setShowRejectModal(true);
    }, 400); // Wait for previous modal animation to finish
  };
  const submitRejectPayment = async () => {
    if (checkReadOnly() || !selectedRejectProof) return;
    const { txn_ref, tenantPhone, tenantName } = selectedRejectProof;
    if (!rejectionReason.trim()) {
      Alert.alert('Error', 'Please enter a rejection reason.');
      return;
    }
    try {
      console.log("Rejecting payment:", txn_ref);

      // Optimistic UI update: Remove from queue immediately
      setVerificationQueue(prev => prev.filter(item => item.txn_ref !== txn_ref));

      setLoading(true);
      await axios.post(`${BASE_URL}/api/update-payment/`, {
        txn_ref: txn_ref,
        status: 'FAILED',
        rejection_reason: rejectionReason
      });

      // ✅ Close the modal IMMEDIATELY — before alert or refresh
      // This prevents the "No payment proofs" empty state from flickering on screen.
      setLoading(false);
      setShowVerifyModal(false);
      setRejectionReason('');

      // 🔔 Notify tenant in the background (non-blocking)
      if (tenantPhone) {
        axios.post(`${BASE_URL}/api/send-tenant-notification/`, {
          tenantPhone: tenantPhone,
          title: 'Payment Rejected',
          message: `Hi ${tenantName || 'Tenant'}, your payment proof was rejected by the owner. Reason: ${rejectionReason}`
        });
      }

      Alert.alert('Rejected', 'Payment proof rejected and tenant notified.');
      await fetchPayments(); // Refresh full data
      setShowRejectModal(false);
      setShowVerifyModal(false);
      setSelectedRejectProof(null);
    } catch (error) {
      console.error("Error rejecting payment:", error.response?.data || error.message);
      Alert.alert('Error', `Failed to reject payment: ${error.response?.data?.error || error.message}`);
      // Re-fetch to restore queue if error
      await fetchPayments();
    } finally {
      setLoading(false);
    }
  };

  const handleSetReminder = async (proof) => {
    if (!proof) {
      Alert.alert('Error', 'No payment proof selected.');
      return;
    }

    setLoading(true);
    let paymentUpdateFailed = false;

    // Step 1: Update payment record (optional — failure doesn't block notification)
    if (proof.txn_ref) {
      try {
        await axios.post(`${BASE_URL}/api/update-payment/`, {
          txn_ref: proof.txn_ref,
          status: 'SUCCESS',
          remaining_balance: partialPaymentData.remainingBalance,
          next_due_date: partialPaymentData.remainingDueDate // YYYY-MM-DD format
        });
        console.log("Payment updated for partial:", proof.txn_ref);
      } catch (updateErr) {
        paymentUpdateFailed = true;
        console.warn("Payment update failed (non-critical for notification):", updateErr?.response?.data || updateErr.message);
      }
    }

    // Step 2: Always send tenant notification regardless of payment update result
    if (proof.tenant_phone) {
      try {
        await axios.post(`${BASE_URL}/api/send-tenant-notification/`, {
          tenantPhone: proof.tenant_phone,
          title: 'Partial Payment — Remaining Balance',
          message: `Hi ${proof.name || 'Tenant'}, we have acknowledged your partial payment. Please pay the remaining balance of ₹${partialPaymentData.remainingBalance} by ${partialPaymentData.remainingDueDateDisplay || partialPaymentData.remainingDueDate}.`
        });
        console.log("Partial payment notification sent to:", proof.tenant_phone);
      } catch (notifErr) {
        console.warn("Tenant notification failed:", notifErr?.response?.data || notifErr.message);
      }
    }

    // Step 3: Always close modals and refresh — regardless of errors above
    setLoading(false);
    setShowPartialPaymentModal(false);
    setShowVerifyModal(false);

    if (paymentUpdateFailed) {
      Alert.alert('Partial Success', 'Reminder sent to tenant, but payment record could not be updated. Please check your connection.');
    } else {
      Alert.alert('Success', 'Partial payment confirmed and reminder sent to tenant.');
    }

    fetchPayments(); // Refresh in background
  };

  const handleConfirmCashPartial = async () => {
    if (checkReadOnly()) return;
    if (selectedTenant?.txn_ref) {
      try {
        await axios.post(`${BASE_URL}/api/update-payment/`, {
          txn_ref: selectedTenant.txn_ref,
          status: 'SUCCESS',
          remaining_balance: cashPartialData.remainingBalance,
          next_due_date: cashPartialData.remainingDueDate
        });
        await fetchPayments();
      } catch (error) {
        console.log("Error updating partial cash:", error);
      }
    }

    // Update tenant status to partial paid
    setTenantData(tenantData.map(t =>
      t.id === selectedTenant.id ? { ...t, status: 'partial', paymentMethod: 'Cash', paidDate: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) } : t
    ));
    // Set the tenant for messaging
    setCustomMessage(`Hi ${selectedTenant.name}, you have paid ₹${cashPartialData.paidAmount.toLocaleString()} in cash out of ₹${selectedTenant.amount.toLocaleString()}. Remaining balance of ₹${cashPartialData.remainingBalance.toLocaleString()} is due by ${cashPartialData.remainingDueDateDisplay || cashPartialData.remainingDueDate}. Please complete the payment on time.`);
    // Open the message modal
    setShowMessageModal(true);
    // Close the cash partial modal
    setShowCashPartialModal(false);
  };

  const filteredTenants = tenantData.filter(tenant => {
    if (filterByDate) {
      const selectedDateString = selectedDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
      if (tenant.dueDate !== selectedDateString && tenant.paidDate !== selectedDateString) return false;
    } else {
      const monthShort = selectedMonth.substring(0, 3);
      const yearStr = selectedMonth.split(' ')[1];
      const monthYearStr = `${monthShort} ${yearStr}`;
      if (!tenant.dueDate?.includes(monthYearStr) && !tenant.paidDate?.includes(monthYearStr)) return false;
    }

    if (filterTab === 'all') return true;
    if (filterTab === 'due') return tenant.status === 'due';
    if (filterTab === 'paid') return tenant.status === 'paid';
    if (filterTab === 'request_sent') return tenant.status === 'request_sent';
    return true;
  });

  const dueTenants = tenantData.filter(t => t.status === 'due');

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primaryBlue} />
        <Text style={{ marginTop: 12, color: COLORS.textSecondary }}>{t("Loading") || "Loading..."}</Text>
      </View>
    );
  }

  // If payment setup is not done, show the setup UI instead of the dashboard
  if (hasInitialized && isSetupMode) {
    return (
      <SafeAreaView style={styles.setupGateContainer}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent={true} />
        <View style={styles.setupGateContent}>
          <View style={styles.setupGateCard}>
            <View style={styles.setupGateHeader}>
              <View style={styles.setupGateIconCircle}>
                <Animated.View style={[styles.setupGatePulse, { transform: [{ scale: pulseAnim }] }]} />
                <MaterialCommunityIcons name="wallet-plus" size={40} color="#8B5CF6" />
              </View>
              <Text style={styles.setupGateTitle}>{t("Activate payments") || "Activate Payments"}</Text>
              <Text style={styles.setupGateSubtitle}>
                {t("Setup payment desc") || "Enable seamless rent collection. Your tenants will see this to pay you directly."}
              </Text>
            </View>

            <View style={styles.setupGateBody}>
              <View style={styles.setupGateInputGroup}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={styles.setupGateLabel}>{t("Upi id") || "UPI ID"}</Text>
                  {upiError && <Text style={{ fontSize: 11, color: COLORS.dangerRed, fontWeight: '700' }}>{upiError}</Text>}
                </View>
                <View style={[
                  styles.setupGateInput,
                  upiId && styles.setupGateInputActive,
                  !!upiError && { borderColor: COLORS.dangerRed }
                ]}>
                  <MaterialCommunityIcons name="at" size={20} color={upiError ? COLORS.dangerRed : (upiId ? "#8B5CF6" : "#94A3B8")} />
                  <TextInput
                    style={styles.setupGateTextInput}
                    placeholder="91888XXXXX@upi"
                    placeholderTextColor="#94A3B8"
                    value={upiId}
                    onChangeText={handleUpiChange}
                    autoCapitalize="none"
                    keyboardType="default"
                  />
                  {upiId && !upiError && <Ionicons name="checkmark-circle" size={18} color="#10B981" />}
                </View>
              </View>

              <View style={styles.setupGateInputGroup}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={styles.setupGateLabel}>{t("Phone number") || "Phone Number"}</Text>
                  {phoneError && <Text style={{ fontSize: 11, color: COLORS.dangerRed, fontWeight: '700' }}>Invalid Phone</Text>}
                </View>
                <View style={[
                  styles.setupGateInput,
                  phoneNumber && styles.setupGateInputActive,
                  !!phoneError && { borderColor: COLORS.dangerRed }
                ]}>
                  <MaterialCommunityIcons name="phone" size={20} color={phoneError ? COLORS.dangerRed : (phoneNumber ? "#8B5CF6" : "#94A3B8")} />
                  <TextInput
                    style={styles.setupGateTextInput}
                    placeholder="Enter 10 digit number"
                    placeholderTextColor="#94A3B8"
                    value={phoneNumber}
                    onChangeText={handlePhoneChange}
                    keyboardType="numeric"
                  />
                  {phoneNumber.length === 10 && !phoneError && <Ionicons name="checkmark-circle" size={18} color="#10B981" />}
                </View>
              </View>

              <View style={styles.setupGateQrGroup}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <Text style={styles.setupGateLabel}>{t("Payment qr") || "Payment QR"}</Text>
                  {qrError && <Text style={{ fontSize: 11, color: COLORS.dangerRed, fontWeight: '700' }}>Upload Screenshot</Text>}
                </View>
                <TouchableOpacity
                  style={[
                    styles.setupGateQrBox,
                    (newQrCode || qrCode) && styles.setupGateQrBoxActive,
                    !!qrError && { borderColor: COLORS.dangerRed }
                  ]}
                  onPress={() => {
                    pickQrCode();
                    setQrError("");
                  }}
                  activeOpacity={0.8}
                >
                  {(newQrCode || qrCode) ? (
                    <View style={styles.setupGateQrPreview}>
                      <Image
                        source={{ uri: newQrCode ? newQrCode.uri : qrCode }}
                        style={styles.setupGateQrImage}
                      />
                      <View style={styles.setupGateQrBadge}>
                        <Ionicons name="camera" size={12} color="#FFF" />
                        <Text style={styles.setupGateQrBadgeText}>{t("Change") || "Change"}</Text>
                      </View>
                    </View>
                  ) : (
                    <View style={styles.setupGateQrPlaceholder}>
                      <Ionicons name="qr-code-outline" size={32} color={qrError ? COLORS.dangerRed : "#8B5CF6"} />
                      <Text style={[styles.setupGateQrText, qrError && { color: COLORS.dangerRed }]}>
                        {qrError ? "Upload Required" : (t("Upload qr") || "Upload QR")}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[styles.setupGateBtn, (savingBank || !upiId || !!upiError || !phoneNumber || !!phoneError || !(newQrCode || qrCode)) && styles.setupGateBtnDisabled]}
                onPress={handleSaveBank}
                disabled={!!(savingBank || !upiId || upiError || !phoneNumber || phoneError || !(newQrCode || qrCode))}
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={['#8B5CF6', '#6D28D9']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.setupGateBtnGradient}
                >
                  {savingBank ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <>
                      <Text style={styles.setupGateBtnText}>{t("Complete setup") || "Complete Setup"}</Text>
                      <Ionicons name="arrow-forward" size={18} color="#FFF" />
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              <View style={styles.setupGateFooter}>
                <Ionicons name="shield-checkmark" size={14} color="#94A3B8" />
                <Text style={styles.setupGateFooterText}>Secure & Encrypted</Text>
              </View>
            </View>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent={true} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primaryBlue]} />
        }
      >
        <Animated.View style={{ opacity: fadeAnim }}>
          {/* Header */}
          <LinearGradient
            colors={['#5F259F', '#7C3AED', '#8B5CF6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.header}
          >
            <View style={styles.headerTop}>
              <View style={styles.headerLeft}>
                <Text style={[styles.headerTitle, { color: '#FFFFFF' }]}>{t("Payments") || "Payments"}</Text>
                {upiId ? (
                  <View style={[styles.activeUpiBadge, { backgroundColor: 'rgba(255,255,255,0.2)', borderColor: 'rgba(255,255,255,0.4)' }]}>
                    <MaterialCommunityIcons name="check-decagram" size={14} color="#4ADE80" />
                    <Text style={[styles.activeUpiText, { color: '#FFF' }]}>{upiId}</Text>
                  </View>
                ) : (
                  <Text style={[styles.headerSubtitle, { color: 'rgba(255,255,255,0.75)' }]}>{t("Manage payments") || "Manage your property payments"}</Text>
                )}
              </View>
            </View>

            {/* Calendar + Edit Payment Details side by side */}
            <View style={styles.headerActions}>
              <TouchableOpacity
                style={[styles.monthSelector, { backgroundColor: 'rgba(255,255,255,0.15)', flex: 1, marginRight: 8 }]}
                onPress={() => setShowDatePicker(true)}
              >
                <Ionicons name="calendar" size={18} color="#FFF" />
                <Text style={[styles.monthText, { color: '#FFF', marginHorizontal: 8 }]}>
                  {filterByDate ? selectedDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : selectedMonth}
                </Text>
                <Ionicons name="chevron-down" size={14} color="rgba(255,255,255,0.7)" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.setupPaymentBtn}
                onPress={() => setShowUpiModal(true)}
              >
                <LinearGradient
                  colors={['rgba(255,255,255,0.25)', 'rgba(255,255,255,0.1)']}
                  style={[styles.setupPaymentGradient, { borderWidth: 1, borderColor: 'rgba(255,255,255,0.35)' }]}
                >
                  {qrCode ? (
                    <Image source={{ uri: qrCode }} style={styles.miniQrPreview} />
                  ) : (
                    <MaterialCommunityIcons name="qrcode-edit" size={18} color="#FFF" />
                  )}
                  <Text style={[styles.setupPaymentText, { color: '#FFF' }]}>
                    {upiId || qrCode ? (t("Edit payment details") || "Edit") : (t("Payment setup") || "Setup")}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {showDatePicker && (
              <DateTimePicker
                value={selectedDate}
                mode="date"
                display="default"
                onChange={onDateChange}
              />
            )}
          </LinearGradient>

          {/* Enhanced Verification Alert */}
          {verificationQueue.length > 0 && (
            <TouchableOpacity
              style={styles.premiumVerificationAlert}
              onPress={() => {
                setSelectedProof(verificationQueue[0]);
                setShowVerifyModal(true);
              }}
            >
              <LinearGradient
                colors={['#8B5CF6', '#7C3AED']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.verificationGradient}
              >
                <View style={styles.alertContent}>
                  <View style={styles.alertIconCircle}>
                    <MaterialCommunityIcons name="lightning-bolt" size={20} color="#F59E0B" />
                  </View>
                  <View>
                    <Text style={styles.alertTitle}>
                      {t("Action required") || "Action Required"}
                    </Text>
                    <Text style={styles.alertText}>
                      {verificationQueue.length} {verificationQueue.length > 1 ? t("New payments uploaded") || 'new payments uploaded' : t("New payment uploaded") || 'new payment uploaded'}
                    </Text>
                  </View>
                </View>
                <View style={styles.alertActionBtn}>
                  <Text style={styles.alertActionText}>{t("Verify now") || "Verify Now"}</Text>
                  <Ionicons name="chevron-forward" size={16} color="#FFF" />
                </View>
              </LinearGradient>
            </TouchableOpacity>
          )}

          {/* Summary Cards */}
          <View style={styles.summaryCards}>


            <TouchableOpacity
              style={[styles.summaryCard, styles.summaryCardBlue, filterTab === 'all' && styles.summaryCardActive]}
              onPress={() => setFilterTab('all')}
            >
              <View style={styles.summaryIcon}>
                <Ionicons name="people" size={24} color={COLORS.primaryBlue} />
              </View>
              <View style={styles.summaryContent}>
                <Text style={styles.summaryLabel}>{t("Total tenants") || "Total Tenants"}</Text>
                <Text style={styles.summaryValue}>{stats.tenants}</Text>
                <Text style={styles.summarySubtext}>{t("This month") || "This Month"}</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.summaryCard, styles.summaryCardGreen, filterTab === 'paid' && styles.summaryCardActive]}
              onPress={() => setFilterTab('paid')}
            >
              <View style={styles.summaryIcon}>
                <Ionicons name="wallet" size={24} color={COLORS.successGreen} />
              </View>
              <View style={styles.summaryContent}>
                <Text style={styles.summaryLabel}>{t("Total collected") || "Total Collected"}</Text>
                <Text style={styles.summaryValue}>₹{stats.collected.toLocaleString()}</Text>
                <Text style={styles.summarySubtext}>{stats.collectedCount} {t("Payments") || "Payments"}</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.summaryCard, styles.summaryCardOrange, filterTab === 'due' && styles.summaryCardActive]}
              onPress={() => setFilterTab('due')}
            >
              <View style={styles.summaryIcon}>
                <Ionicons name="time" size={24} color={COLORS.warningOrange} />
              </View>
              <View style={styles.summaryContent}>
                <Text style={styles.summaryLabel}>{t("Total pending") || "Total Pending"}</Text>
                <Text style={styles.summaryValue}>₹{stats.pending.toLocaleString()}</Text>
                <Text style={styles.summarySubtext}>{stats.pendingCount} {t("Payments") || "Payments"}</Text>
              </View>
            </TouchableOpacity>


          </View>

          {/* Tenant List Header */}
          <View style={styles.listHeader}>
            <Text style={styles.listTitle}>
              {filterTab === 'all' ? (t("All tenants") || "All Tenants") :
                filterTab === 'paid' ? (t("Collected payments") || "Collected Payments") :
                  (t("Pending payments") || "Pending Payments")}
            </Text>

          </View>

          {/* Tenant List */}
          <View style={styles.tenantList}>
            {filteredTenants.map((tenant, index) => {
              if (!tenant) return null;
              const statusStyle = getStatusStyle(tenant.status);

              // Unified Card UI
              return (
                <View key={`${tenant.id}-${tenant.txn_ref || index}`} style={styles.unifiedCard}>
                  <View style={styles.unifiedCardHeader}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <View style={styles.tenantAvatarUnified}>
                        <Text style={styles.tenantInitialUnified}>{(tenant.name || 'U').charAt(0)}</Text>
                      </View>
                      <View style={styles.unifiedCardTitleBox}>
                        <Text style={styles.unifiedTenantName}>{tenant.name}</Text>
                        <Text style={styles.unifiedTenantRoom}>{tenant.room || "N/A"}</Text>
                      </View>
                    </View>
                    <View style={[styles.statusBadgeUnified, { backgroundColor: statusStyle.bg }]}>
                      <Ionicons name={statusStyle.icon} size={12} color={statusStyle.color} />
                      <Text style={[styles.statusTextUnified, { color: statusStyle.color }]}>{t(statusStyle.label?.toLowerCase()) || statusStyle.label}</Text>
                    </View>
                  </View>

                  <View style={styles.unifiedCardBody}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                      <View style={styles.infoBoxUnified}>
                        <Text style={styles.infoLabelUnified}>{t("Floor") || "Floor"}</Text>
                        <Text style={styles.infoValueUnified}>{tenant?.floor_number ?? 'N/A'}</Text>
                      </View>
                      <View style={styles.infoBoxUnified}>
                        <Text style={styles.infoLabelUnified}>{t("Room") || "Room"}</Text>
                        <Text style={styles.infoValueUnified}>{tenant?.room_number ?? 'N/A'}</Text>
                      </View>
                      {tenant?.bed_number !== null && tenant?.bed_number !== undefined && (
                        <View style={styles.infoBoxUnified}>
                          <Text style={styles.infoLabelUnified}>{t("Bed") || "Bed"}</Text>
                          <Text style={styles.infoValueUnified}>{tenant.bed_number}</Text>
                        </View>
                      )}
                    </View>

                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#F8FAFC', borderRadius: 8, padding: 8 }}>
                      <View style={styles.infoBoxUnified}>
                        <Text style={styles.infoLabelUnified}>{t("Due Date") || "Due Date"}</Text>
                        <Text style={styles.infoValueUnified}>{tenant.dueDate}</Text>
                      </View>
                      <View style={styles.infoBoxUnified}>
                        <Text style={styles.infoLabelUnified}>{tenant.status === 'paid' ? (t("Paid Amount") || "Paid Amount") : (t("Pending Amount") || "Pending Amount")}</Text>
                        <Text style={[styles.infoValueUnified, { color: tenant.status === 'paid' ? COLORS.successGreen : COLORS.dangerRed }]}>₹{tenant.status === 'paid' ? (tenant.total_paid_so_far || tenant.amount || 0).toLocaleString() : Math.max(0, (tenant.total_rent || 0) - (tenant.total_paid_so_far || 0)).toLocaleString()}</Text>
                      </View>
                    </View>
                  </View>

                  {tenant.status === 'due' && (
                    <View style={styles.unifiedActionRow}>
                      <TouchableOpacity
                        style={styles.actionBtnUnifiedMark}
                        onPress={() => handleMarkAsCashPaid(tenant)}
                      >
                        <Text style={styles.actionBtnTextUnified}>{t("Mark cash") || "Mark Cash"}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.actionBtnUnifiedFull}
                        onPress={() => handleFullCashPaid(tenant)}
                      >
                        <Text style={styles.actionBtnTextUnifiedLight}>{t("Full paid") || "Full Paid"}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.actionBtnUnifiedMsg}
                        onPress={() => {
                          setSelectedTenant(tenant);
                          setShowMessageModal(true);
                        }}
                      >
                        <Ionicons name="chatbubble-ellipses" size={16} color={COLORS.primaryBlue} />
                      </TouchableOpacity>
                    </View>
                  )}
                  {tenant.status !== 'due' && tenant.payment_screenshot && (
                    <View style={styles.unifiedActionRowSingle}>
                      <TouchableOpacity
                        style={styles.viewScreenshotBtnUnified}
                        onPress={() => setSelectedScreenshot(tenant.payment_screenshot)}
                      >
                        <Ionicons name="image-outline" size={14} color={COLORS.primaryBlue} />
                        <Text style={styles.viewScreenshotTextUnified}>{t("View proof") || "View Proof"}</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              );
            })}
          </View>

          {/* Reminder Section */}
          <View style={styles.reminderSection}>
            <View style={styles.reminderContent}>
              <View style={styles.reminderText}>
                <Text style={styles.reminderTitle}>{t("Stay on top of payments") || "Stay on top of your payments"}</Text>
                <Text style={styles.reminderSubtitle}>{t("Send reminders pending") || "Send reminders to tenants with pending payments."}</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.reminderBtn}
              onPress={() => setShowPendingModal(true)}
            >
              <Text style={styles.reminderBtnText}>{t("Send reminder all") || "Send Reminder to All"}</Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: 100 }} />
        </Animated.View>
      </ScrollView>

      {/* Pending Payments Modal */}
      <Modal visible={showPendingModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setShowPendingModal(false)}
          />
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>{t("Send reminders") || "Send Reminders"}</Text>
                <Text style={styles.modalSubtitle}>{dueTenants.length} {t("Tenants with due") || "Tenants with due payments"}</Text>
              </View>
              <TouchableOpacity onPress={() => setShowPendingModal(false)}>
                <Ionicons name="close-circle" size={32} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.pendingList} showsVerticalScrollIndicator={false}>
              {dueTenants.map((tenant) => {
                const statusStyle = getStatusStyle(tenant.status);
                return (
                  <View key={tenant.id} style={styles.pendingItem}>
                    <View style={styles.pendingLeft}>
                      <View style={[styles.tenantAvatar, { backgroundColor: '#FEE2E2' }]}>
                        <Text style={[styles.tenantInitial, { color: COLORS.dangerRed }]}>{tenant.name.charAt(0)}</Text>
                      </View>
                      <View style={styles.pendingInfo}>
                        <Text style={styles.pendingName}>{tenant.name}</Text>
                        <Text style={styles.pendingRoom}>{tenant.room}</Text>
                        <View style={styles.pendingMeta}>
                          <Ionicons name="calendar" size={12} color={COLORS.textLight} />
                          <Text style={styles.pendingDue}>{t("Due") || "Due"}: {tenant.dueDate}, {tenant.dueTime}</Text>
                        </View>
                      </View>
                    </View>
                    <View style={styles.pendingRight}>
                      <Text style={styles.pendingAmount}>₹{tenant.amount.toLocaleString()}</Text>
                      <TouchableOpacity
                        style={styles.sendRemindBtn}
                        onPress={() => handleSendReminder(tenant.name, tenant.tenant_phone, tenant.amount)}
                      >
                        <Ionicons name="send-outline" size={14} color={COLORS.primaryBlue} />
                        <Text style={styles.sendRemindText}>{t("Send") || "Send"}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </ScrollView>

            <TouchableOpacity
              style={styles.sendAllRemindBtn}
              onPress={handleSendReminderToAll}
            >
              <Text style={styles.sendAllRemindText}>{t("Send reminder all") || "Send Reminder to All"}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Message Modal */}
      <Modal visible={showMessageModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setShowMessageModal(false)}
          />
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>{t("Send message") || "Send Message"}</Text>
                <Text style={styles.modalSubtitle}>
                  {selectedTenant?.name} - {selectedTenant?.room}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowMessageModal(false)}>
                <Ionicons name="close-circle" size={32} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.messageModalBody}>
              <View style={styles.quickMessageContainer}>
                <Text style={styles.quickMessageTitle}>{t("Quick messages") || "Quick Messages"}</Text>
                <TouchableOpacity
                  style={styles.quickMessageBtn}
                  onPress={() => setCustomMessage(t("Payment reminder msg") || 'Please pay your rent by the due date.')}
                >
                  <Text style={styles.quickMessageText}>{t("Payment reminder") || "Payment Reminder"}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.quickMessageBtn}
                  onPress={() => setCustomMessage(t("Overdue notice msg") || 'Your rent is overdue. Please pay immediately.')}
                >
                  <Text style={styles.quickMessageText}>{t("Overdue notice") || "Overdue Notice"}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.quickMessageBtn}
                  onPress={() => setCustomMessage(t("Payment received msg") || 'Thank you for your payment!')}
                >
                  <Text style={styles.quickMessageText}>{t("Payment received") || "Payment Received"}</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.customMessageTitle}>{t("Custom message") || "Custom Message"}</Text>
              <TextInput
                style={styles.customMessageInput}
                placeholder={t("Type message here") || "Type your message here..."}
                placeholderTextColor={COLORS.textLight}
                value={customMessage}
                onChangeText={setCustomMessage}
                multiline
                numberOfLines={4}
              />

              <TouchableOpacity
                style={styles.sendMessageBtn}
                onPress={handleSendMessage}
              >
                <Ionicons name="send" size={20} color="#FFF" />
                <Text style={styles.sendMessageText}>{t("Send message") || "Send Message"}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>




      {/* --- PREMIUM VERIFICATION MODAL --- */}
      <Modal visible={showVerifyModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.verificationModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t("Verify payment") || "Verify Payment"}</Text>
              <TouchableOpacity onPress={() => setShowVerifyModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>



              {/* Verification Requests for Selected Date */}
              <View style={styles.requestsList}>
                {verificationQueue.length > 0 ? (
                  verificationQueue.map((proof) => (
                    <View key={proof.id} style={styles.proofCard}>
                      <View style={styles.proofHeader}>
                        <View style={styles.proofTenantInfo}>
                          <View style={styles.proofAvatar}>
                            <Text style={styles.proofAvatarText}>{proof.name.charAt(0)}</Text>
                          </View>
                          <View>
                            <Text style={styles.proofName}>{proof.name}</Text>
                            <Text style={styles.proofRoom}>{proof.room}</Text>
                          </View>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                          <Text style={{ fontSize: 12, color: '#6B7280' }}>Total Rent: ₹{proof.total_rent?.toLocaleString()}</Text>
                          <Text style={styles.proofAmount}>Paid: ₹{proof.amount.toLocaleString()}</Text>
                          <Text style={{ fontSize: 12, color: '#EF4444', fontWeight: 'bold' }}>
                            Remaining: ₹{Math.max(0, (proof.total_rent || 0) - (proof.total_paid_so_far || 0) - proof.amount).toLocaleString()}
                          </Text>
                        </View>
                      </View>

                      {proof.proofImage ? (
                        <>
                          <Text style={[styles.proofLabel, { marginTop: 12 }]}>{t("Payment screenshot") || "Payment Screenshot"}</Text>

                          {proof.description && (
                            <View style={styles.notifMessageContainer}>
                              <Ionicons name="chatbubble-ellipses-outline" size={16} color="#6366F1" />
                              <Text style={styles.notifMessage}>{proof.description}</Text>
                            </View>
                          )}

                          <TouchableOpacity
                            style={styles.screenshotPlaceholder}
                            onPress={() => setSelectedScreenshot(proof.proofImage)}
                          >
                            <View style={{ width: '100%', height: '100%' }}>
                              <Image
                                source={{ uri: proof.proofImage }}
                                style={styles.screenshotImage}
                              />
                              <View style={styles.zoomBadge}>
                                <Ionicons name="expand" size={16} color="#FFF" />
                                <Text style={styles.zoomText}>{t("Tap to zoom") || "Tap to Zoom"}</Text>
                              </View>
                            </View>
                          </TouchableOpacity>
                        </>
                      ) : (
                        <View style={styles.cashPaymentNoticeContainer}>
                          <View style={styles.cashNoticeHeader}>
                            <MaterialCommunityIcons name="cash-multiple" size={32} color="#10B981" />
                            <Text style={styles.cashNoticeTitle}>Cash Payment Requested</Text>
                          </View>
                          <Text style={styles.cashNoticeSubtitle}>The tenant has requested to pay in cash.</Text>
                          {proof.description && (
                            <View style={styles.cashNoteContainer}>
                              <Text style={styles.cashNoteLabel}>Tenant's Note:</Text>
                              <Text style={styles.cashNoteText}>"{proof.description}"</Text>
                            </View>
                          )}
                        </View>
                      )}

                      <View style={styles.proofFooter}>
                        <Text style={styles.proofTimestamp}>{proof.timestamp}</Text>
                        <View style={styles.proofActions}>
                          <TouchableOpacity
                            style={styles.partialBtn}
                            onPress={() => {
                              setSelectedProof(proof);
                              const remaining = Math.max(0, (proof.total_rent || 0) - (proof.total_paid_so_far || 0) - proof.amount);
                              setPartialPaymentData({
                                paidAmount: proof.amount,
                                remainingBalance: remaining,
                                // ISO format for API; display version used in UI messages
                                remainingDueDate: getDynamicDueDate(10),
                                remainingDueDateDisplay: getDynamicDueDateDisplay(10),
                                tenantNote: proof.description || ""
                              });
                              setShowPartialPaymentModal(true);
                            }}
                          >
                            <Ionicons name="percent" size={18} color="#FFF" />
                            <Text style={styles.partialBtnText}>{t("Remaining") || "Remaining"}</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.rejectSmallBtn}
                            onPress={() => handleRejectPayment(proof.id, proof.txn_ref, proof.tenant_phone, proof.name)}
                          >
                            <Ionicons name="close" size={10} color="#FFF" />
                            <Text style={styles.rejectSmallText}>{t("Reject") || "Reject"}</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.verifySmallBtn}
                            onPress={() => handleVerifyPayment(proof.id, proof.tenantId, proof.txn_ref, proof.tenant_phone, proof.name)}
                          >
                            <Ionicons name="checkmark" size={18} color="#FFF" />
                            <Text style={styles.verifySmallText}>{t("Verify") || "Verify"}</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  ))
                ) : (
                  <View style={styles.noProofsContainer}>
                    <MaterialCommunityIcons name="check-circle-outline" size={64} color={COLORS.successGreen} />
                    <Text style={styles.noProofsText}>{t("No payment proofs") || "No Payment Proofs"}</Text>
                    <Text style={styles.noProofsSubtext}>{t("All payments verified") || "All payments verified for this date"}</Text>
                  </View>
                )}
              </View>
            </ScrollView>

            {/* Full Image Modal INSIDE VerifyModal for better visibility */}
            <Modal visible={!!selectedScreenshot} transparent={true} animationType="fade" onRequestClose={() => setSelectedScreenshot(null)}>
              <View style={styles.fullImageModalContainer}>
                <TouchableOpacity
                  style={styles.fullImageCloseBtn}
                  onPress={() => setSelectedScreenshot(null)}
                >
                  <Ionicons name="arrow-back" size={28} color="#FFF" />
                </TouchableOpacity>
                {selectedScreenshot && (
                  <Image
                    source={{ uri: selectedScreenshot }}
                    style={styles.fullImagePreview}
                    resizeMode="contain"
                  />
                )}
              </View>
            </Modal>
          </View>
        </View>
      </Modal>
      {/* Reject Payment Modal */}
      <Modal visible={showRejectModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.rejectModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t("Reject payment") || "Reject Payment"}</Text>
              <TouchableOpacity onPress={() => setShowRejectModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>
            <View style={{ paddingVertical: 20 }}>
              <Text style={styles.rejectLabel}>{t("Reason for Rejection") || "Reason for Rejection"}</Text>
              <TextInput
                style={styles.rejectInput}
                placeholder={t("e.g. Screenshot blurry, Amount incorrect") || "e.g. Screenshot blurry, Amount incorrect"}
                value={rejectionReason}
                onChangeText={setRejectionReason}
                multiline
              />
            </View>
            <TouchableOpacity 
              style={styles.rejectConfirmBtn}
              onPress={submitRejectPayment}
            >
              <Text style={styles.rejectConfirmText}>{t("Confirm Rejection") || "Confirm Rejection"}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* --- PARTIAL PAYMENT APPROVAL MODAL --- */}
      <Modal visible={showPartialPaymentModal} transparent animationType="slide" onRequestClose={() => setShowPartialPaymentModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.partialModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Partial Payment Approval</Text>
              <View style={styles.headerActions}>
                <TouchableOpacity onPress={() => setShowPartialPaymentModal(false)} style={styles.closeBtn}>
                  <Ionicons name="close" size={24} color={COLORS.textPrimary} />
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.tenantSummary}>
                <View style={styles.tenantAvatar}>
                  <Text style={styles.tenantAvatarText}>{selectedProof?.name?.charAt(0) || 'T'}</Text>
                </View>
                <View style={styles.tenantInfo}>
                  <Text style={styles.tenantName}>{selectedProof?.name}</Text>
                  <Text style={styles.tenantRoom}>{selectedProof?.room}</Text>
                </View>
                <Text style={styles.totalAmount}>₹{selectedProof?.amount?.toLocaleString()}</Text>
              </View>

              <View style={styles.modernPaymentSection}>
                {/* Modern Edit Amount Card */}
                <View style={styles.editAmountCard}>
                  <Text style={styles.editAmountLabel}>{t("Paid Amount") || "Paid Amount"}</Text>
                  <View style={styles.editAmountRow}>
                    <Text style={styles.currencySymbol}>₹</Text>
                    {isEditMode ? (
                      <TextInput
                        style={styles.editAmountInput}
                        value={partialPaymentData.paidAmount.toString()}
                        onChangeText={(text) => {
                          const paid = parseFloat(text) || 0;
                          setPartialPaymentData({
                            ...partialPaymentData,
                            paidAmount: paid,
                            remainingBalance: selectedProof?.amount - paid
                          });
                        }}
                        keyboardType="numeric"
                        autoFocus={true}
                        onBlur={() => setIsEditMode(false)}
                      />
                    ) : (
                      <Text style={styles.editAmountValue}>{partialPaymentData.paidAmount.toLocaleString()}</Text>
                    )}

                    <TouchableOpacity
                      onPress={() => setIsEditMode(!isEditMode)}
                      style={styles.modernEditBtn}
                    >
                      <Ionicons name={isEditMode ? "checkmark" : "pencil"} size={20} color={isEditMode ? "#16A34A" : COLORS.primaryBlue} />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Remaining Info Cards */}
                <View style={styles.remainingInfoRow}>
                  <View style={styles.remainingInfoCard}>
                    <Text style={styles.remainingInfoLabel}>{t("Remaining Balance") || "Remaining Balance"}</Text>
                    <Text style={styles.remainingInfoValueDanger}>₹{partialPaymentData.remainingBalance.toLocaleString()}</Text>
                  </View>
                  <View style={styles.remainingInfoCard}>
                    <Text style={styles.remainingInfoLabel}>{t("Due Date") || "Due Date"}</Text>
                    <Text style={styles.remainingInfoValue}>{partialPaymentData.remainingDueDateDisplay || partialPaymentData.remainingDueDate}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.noteSection}>
                <Text style={styles.noteLabel}>Tenant Note</Text>
                <Text style={styles.noteText}>{partialPaymentData.tenantNote}</Text>
              </View>

              <TouchableOpacity
                style={styles.setReminderBtn}
                onPress={() => handleSetReminder(selectedProof)}
              >
                <Ionicons name="alarm-outline" size={18} color="#FFF" />
                <Text style={styles.setReminderText}>Set Reminder</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* --- CASH PARTIAL PAYMENT MODAL --- */}
      <Modal visible={showCashPartialModal} transparent animationType="slide" onRequestClose={() => setShowCashPartialModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.partialModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Cash Partial Payment</Text>
              <View style={styles.headerActions}>
                <TouchableOpacity onPress={() => setShowCashPartialModal(false)} style={styles.closeBtn}>
                  <Ionicons name="close" size={24} color={COLORS.textPrimary} />
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.tenantSummary}>
                <View style={styles.tenantAvatar}>
                  <Text style={styles.tenantAvatarText}>{selectedTenant?.name?.charAt(0) || 'T'}</Text>
                </View>
                <View style={styles.tenantInfo}>
                  <Text style={styles.tenantName}>{selectedTenant?.name}</Text>
                  <Text style={styles.tenantRoom}>{selectedTenant?.room}</Text>
                </View>
                <Text style={styles.totalAmount}>₹{selectedTenant?.amount?.toLocaleString()}</Text>
              </View>

              <View style={styles.modernPaymentSection}>
                {/* Modern Edit Amount Card */}
                <View style={styles.editAmountCard}>
                  <Text style={styles.editAmountLabel}>{t("Paid Amount (Cash)") || "Paid Amount (Cash)"}</Text>
                  <View style={styles.editAmountRow}>
                    <Text style={styles.currencySymbol}>₹</Text>
                    {isEditMode ? (
                      <TextInput
                        style={styles.editAmountInput}
                        value={cashPartialData.paidAmount.toString()}
                        onChangeText={(text) => {
                          const paid = parseFloat(text) || 0;
                          setCashPartialData({
                            ...cashPartialData,
                            paidAmount: paid,
                            remainingBalance: selectedTenant?.amount - paid
                          });
                        }}
                        keyboardType="numeric"
                        autoFocus={true}
                        onBlur={() => setIsEditMode(false)}
                      />
                    ) : (
                      <Text style={styles.editAmountValue}>{cashPartialData.paidAmount.toLocaleString()}</Text>
                    )}

                    <TouchableOpacity
                      onPress={() => setIsEditMode(!isEditMode)}
                      style={styles.modernEditBtn}
                    >
                      <Ionicons name={isEditMode ? "checkmark" : "pencil"} size={20} color={isEditMode ? "#16A34A" : COLORS.primaryBlue} />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Remaining Info Cards */}
                <View style={styles.remainingInfoRow}>
                  <View style={styles.remainingInfoCard}>
                    <Text style={styles.remainingInfoLabel}>{t("Remaining Balance") || "Remaining Balance"}</Text>
                    <Text style={styles.remainingInfoValueDanger}>₹{cashPartialData.remainingBalance.toLocaleString()}</Text>
                  </View>
                  <View style={styles.remainingInfoCard}>
                    <Text style={styles.remainingInfoLabel}>{t("Due Date") || "Due Date"}</Text>
                    <Text style={styles.remainingInfoValue}>{cashPartialData.remainingDueDateDisplay || cashPartialData.remainingDueDate}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.noteSection}>
                <Text style={styles.noteLabel}>Tenant Note</Text>
                <Text style={styles.noteText}>{cashPartialData.tenantNote}</Text>
              </View>

              <TouchableOpacity
                style={styles.setReminderBtn}
                onPress={handleConfirmCashPartial}
              >
                <Ionicons name="checkmark-circle-outline" size={18} color="#FFF" />
                <Text style={styles.setReminderText}>Confirm & Send Reminder</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Full Image Modal for Verification */}
      <Modal visible={!!selectedScreenshot} transparent={true} animationType="fade" onRequestClose={() => setSelectedScreenshot(null)}>
        <View style={styles.fullImageModalContainer}>
          <TouchableOpacity
            style={styles.fullImageCloseBtn}
            onPress={() => setSelectedScreenshot(null)}
          >
            <Ionicons name="arrow-back" size={28} color="#FFF" />
          </TouchableOpacity>
          {selectedScreenshot && (
            <Image
              source={{ uri: selectedScreenshot }}
              style={styles.fullImagePreview}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>

      {/* UPI QR Setup Modal (Edit Mode) */}
      <Modal visible={showUpiModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setShowUpiModal(false)}
          />
          <View style={styles.modalContentPremium}>
            <View style={styles.modalHeaderPremium}>
              <View>
                <Text style={styles.modalTitlePremium}>{t("Payment settings") || "Payment Settings"}</Text>
                <Text style={styles.modalSubtitlePremium}>{t("Manage receiving details") || "Manage how you receive rent"}</Text>
              </View>
              <TouchableOpacity onPress={() => setShowUpiModal(false)} activeOpacity={0.7}>
                <View style={styles.closeBtnCirclePremium}>
                  <Ionicons name="close" size={24} color="#64748B" />
                </View>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.upiModalBodyPremium}>
              {loadingBank ? (
                <View style={{ paddingVertical: 100, alignItems: 'center' }}>
                  <ActivityIndicator size="large" color={COLORS.primaryBlue} />
                  <Text style={{ marginTop: 12, color: COLORS.textSecondary }}>{t("Loading details") || "Loading details..."}</Text>
                </View>
              ) : (
                <>
                  <View style={styles.inputGroupPremium}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={styles.inputLabelPremium}>{t("Upi id label") || "Your Personal UPI ID"}</Text>
                      {upiError && <Text style={{ fontSize: 11, color: COLORS.dangerRed, fontWeight: '700' }}>{upiError}</Text>}
                    </View>
                    <View style={[
                      styles.inputContainerPremium,
                      upiId && styles.inputContainerActive,
                      !!upiError && { borderColor: COLORS.dangerRed }
                    ]}>
                      <MaterialCommunityIcons
                        name="shield-check-outline"
                        size={22}
                        color={upiError ? COLORS.dangerRed : (upiId ? "#8B5CF6" : "#94A3B8")}
                        style={styles.inputIconLeft}
                      />
                      <TextInput
                        style={styles.textInputPremium}
                        placeholder="91888XXXXX@upi"
                        placeholderTextColor="#94A3B8"
                        value={upiId}
                        onChangeText={handleUpiChange}
                        autoCapitalize="none"
                        keyboardType="default"
                      />
                      {upiId && !upiError && <Ionicons name="checkmark-circle" size={20} color="#10B981" />}
                    </View>
                  </View>

                  <View style={styles.inputGroupPremium}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={styles.inputLabelPremium}>{t("Phone number") || "Phone Number"}</Text>
                      {phoneError && <Text style={{ fontSize: 11, color: COLORS.dangerRed, fontWeight: '700' }}>Invalid Phone</Text>}
                    </View>
                    <View style={[
                      styles.inputContainerPremium,
                      phoneNumber && styles.inputContainerActive,
                      !!phoneError && { borderColor: COLORS.dangerRed }
                    ]}>
                      <MaterialCommunityIcons
                        name="phone-outline"
                        size={22}
                        color={phoneError ? COLORS.dangerRed : (phoneNumber ? "#8B5CF6" : "#94A3B8")}
                        style={styles.inputIconLeft}
                      />
                      <TextInput
                        style={styles.textInputPremium}
                        placeholder="Enter 10 digit number"
                        placeholderTextColor="#94A3B8"
                        value={phoneNumber}
                        onChangeText={handlePhoneChange}
                        keyboardType="numeric"
                      />
                      {phoneNumber.length === 10 && !phoneError && <Ionicons name="checkmark-circle" size={20} color="#10B981" />}
                    </View>
                  </View>

                  <View style={styles.qrGroupPremium}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <Text style={styles.inputLabelPremium}>{t("Payment qr scanner") || "Payment QR Scanner"}</Text>
                      {qrError && <Text style={{ fontSize: 11, color: COLORS.dangerRed, fontWeight: '700' }}>Upload Screenshot</Text>}
                    </View>
                    <TouchableOpacity
                      style={[
                        styles.premiumQrBox,
                        (newQrCode || qrCode) && styles.premiumQrBoxActive,
                        !!qrError && { borderColor: COLORS.dangerRed }
                      ]}
                      onPress={() => {
                        pickQrCode();
                        setQrError("");
                      }}
                      activeOpacity={0.8}
                    >
                      {(newQrCode || qrCode) ? (
                        <View style={styles.premiumQrPreview}>
                          <Image
                            source={{ uri: newQrCode ? newQrCode.uri : qrCode }}
                            style={styles.qrImageLarge}
                          />
                          <View style={styles.qrOverlayPremium}>
                            <LinearGradient
                              colors={['rgba(139, 92, 246, 0.9)', 'rgba(109, 40, 217, 0.9)']}
                              style={styles.qrChangeBadge}
                            >
                              <Ionicons name="camera-reverse" size={20} color="#FFF" />
                              <Text style={styles.qrChangeText}>{t("Change") || "Change"}</Text>
                            </LinearGradient>
                          </View>
                        </View>
                      ) : (
                        <View style={styles.qrPlaceholderPremium}>
                          <View style={styles.qrIconWrapperPremium}>
                            <Ionicons name="scan-outline" size={40} color={qrError ? COLORS.dangerRed : "#8B5CF6"} />
                          </View>
                          <Text style={[styles.qrTitlePremium, qrError && { color: COLORS.dangerRed }]}>
                            {qrError ? "Upload Required" : (t("Upload scanner qr") || "Upload Scanner QR")}
                          </Text>
                          <Text style={styles.qrSubtitlePremium}>{t("Qr sub") || "Screenshot of your QR"}</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity
                    style={[styles.premiumSubmitBtn, (savingBank || !upiId || !!upiError || !phoneNumber || !!phoneError) && { opacity: 0.8 }]}
                    onPress={handleSaveBank}
                    disabled={!!(savingBank || !upiId || upiError || !phoneNumber || phoneError)}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={['#8B5CF6', '#6D28D9']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.premiumSubmitGradient}
                    >
                      {savingBank ? (
                        <ActivityIndicator size="small" color="#FFF" />
                      ) : (
                        <>
                          <Ionicons name="cloud-upload-outline" size={20} color="#FFF" />
                          <Text style={styles.premiumSubmitText}>{t("Save changes") || "Save Changes"}</Text>
                        </>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </>
              )}
              <View style={{ height: 40 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  setupContainer: {
    flexGrow: 1,
    backgroundColor: '#F8FAFC',
  },
  setupHeaderPremium: {
    paddingTop: 60,
    paddingBottom: 100,
    paddingHorizontal: 30,
    borderBottomLeftRadius: 50,
    borderBottomRightRadius: 50,
    position: 'relative',
  },
  setupSkipBtn: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  setupHeaderContent: {
    alignItems: 'center',
  },
  premiumIconContainer: {
    marginBottom: 24,
  },
  pulseContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  pulseCircle: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  iconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  setupMainTitle: {
    fontSize: 30,
    fontWeight: '900',
    color: '#FFF',
    marginBottom: 10,
    textAlign: 'center',
    letterSpacing: -0.8,
  },
  setupMainSubtitle: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 15,
    fontWeight: '500',
  },
  setupBodyCard: {
    backgroundColor: '#FFF',
    marginHorizontal: 20,
    marginTop: -50,
    borderRadius: 35,
    padding: 28,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 25 },
    shadowOpacity: 0.2,
    shadowRadius: 40,
    elevation: 20,
    marginBottom: 40,
  },
  modernStepContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 35,
    paddingHorizontal: 10,
  },
  modernStepItem: {
    alignItems: 'center',
    gap: 8,
  },
  modernStepCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },
  modernStepActive: {
    backgroundColor: '#8B5CF6',
    borderColor: '#DDD6FE',
  },
  modernStepText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  modernStepTextInactive: {
    color: '#94A3B8',
  },
  modernStepLine: {
    flex: 1,
    height: 3,
    backgroundColor: '#F1F5F9',
    marginHorizontal: 15,
    marginTop: -20,
    borderRadius: 2,
  },
  modernStepLineActive: {
    backgroundColor: '#C4B5FD',
  },
  inputGroupPremium: {
    marginBottom: 25,
  },
  inputLabelPremium: {
    fontSize: 14,
    fontWeight: '800',
    color: '#334155',
    marginBottom: 12,
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputContainerPremium: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    paddingHorizontal: 16,
    height: 64,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  inputContainerActive: {
    borderColor: '#8B5CF6',
    backgroundColor: '#F5F3FF',
  },
  inputIconLeft: {
    marginRight: 12,
  },
  textInputPremium: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    color: '#1E293B',
  },
  inputHintPremium: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 10,
    marginLeft: 6,
    fontWeight: '500',
  },
  qrGroupPremium: {
    marginBottom: 35,
  },
  premiumQrBox: {
    width: '100%',
    height: 240,
    backgroundColor: '#F8FAFC',
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  premiumQrBoxActive: {
    borderStyle: 'solid',
    borderColor: '#8B5CF6',
    backgroundColor: '#FFF',
  },
  premiumQrPreview: {
    width: '100%',
    height: '100%',
  },
  qrImageLarge: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  qrOverlayPremium: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.03)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrChangeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 25,
    gap: 8,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  qrChangeText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '800',
  },
  qrPlaceholderPremium: {
    alignItems: 'center',
    padding: 30,
  },
  qrIconWrapperPremium: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F5F3FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  qrTitlePremium: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 8,
  },
  qrSubtitlePremium: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  uploadBtnPremium: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 15,
    gap: 10,
    borderWidth: 1,
    borderColor: '#8B5CF6',
  },
  uploadBtnTextPremium: {
    color: '#8B5CF6',
    fontSize: 14,
    fontWeight: '700',
  },
  premiumSubmitBtn: {
    borderRadius: 22,
    overflow: 'hidden',
    height: 70,
    elevation: 10,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    marginBottom: 20,
  },
  premiumSubmitBtnDisabled: {
    opacity: 0.6,
    elevation: 0,
    shadowOpacity: 0,
  },
  premiumSubmitGradient: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  premiumSubmitText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  securityInfoPremium: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  securityTextPremium: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
  },
  setupPaymentBtn: {
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  setupPaymentGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  miniQrPreview: {
    width: 24,
    height: 24,
    borderRadius: 4,
    backgroundColor: '#FFF',
  },
  activeUpiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 4,
    alignSelf: 'flex-start',
    gap: 4,
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  activeUpiText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.successGreen,
  },
  setupPaymentText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  // Premium Modal Styles
  modalContentPremium: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    paddingTop: 12,
    maxHeight: '90%',
  },
  modalHandlePremium: {
    width: 40,
    height: 5,
    backgroundColor: '#E2E8F0',
    borderRadius: 10,
    alignSelf: 'center',
    marginBottom: 12,
  },
  modalHeaderPremium: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalTitlePremium: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1E293B',
    letterSpacing: -0.5,
  },
  modalSubtitlePremium: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
    marginTop: 2,
  },
  closeBtnCirclePremium: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  upiModalBodyPremium: {
    padding: 24,
  },
  qrSectionPremium: {
    marginBottom: 24,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingBottom: 100,
  },

  // Header
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    marginBottom: 16,
    shadowColor: '#5F259F',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 10,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerLeft: {
    flex: 1,
  },
  viewScreenshotBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F3FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  viewScreenshotText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.primaryBlue,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  onboardingContainer: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  onboardingScroll: {
    flexGrow: 1,
    padding: 30,
    justifyContent: 'center',
  },
  onboardingHeader: {
    alignItems: 'center',
    marginBottom: 40,
  },
  onboardingIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F5F3FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  onboardingTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#1E293B',
    marginBottom: 12,
    textAlign: 'center',
  },
  onboardingSubtitle: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 10,
  },
  onboardingCard: {
    backgroundColor: '#FFF',
    borderRadius: 30,
    padding: 24,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 30,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 5,
  },
  onboardingStep: {
    marginBottom: 24,
  },
  onboardingStepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    gap: 12,
  },
  // Setup Gate Styles (White Card UI)
  setupGateContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  setupGateContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  setupGateCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 8,
    position: 'relative',
  },
  setupGateClose: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
  },
  setupGateHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  setupGateIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F5F3FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  setupGatePulse: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
  },
  setupGateTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 4,
    textAlign: 'center',
  },
  setupGateSubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 5,
  },
  setupGateBody: {
    gap: 12,
  },
  setupGateInputGroup: {
    gap: 6,
  },
  setupGateLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  setupGateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
  },
  setupGateInputActive: {
    borderColor: '#8B5CF6',
    backgroundColor: '#F5F3FF',
  },
  setupGateTextInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  setupGateQrGroup: {
    gap: 6,
  },
  setupGateQrBox: {
    width: '100%',
    height: 140,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  setupGateQrBoxActive: {
    borderStyle: 'solid',
    borderColor: '#8B5CF6',
    backgroundColor: '#FFF',
  },
  setupGateQrPreview: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  setupGateQrImage: {
    width: '90%',
    height: '90%',
    resizeMode: 'contain',
  },
  setupGateQrBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: '#8B5CF6',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 3,
  },
  setupGateQrBadgeText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '700',
  },
  setupGateQrPlaceholder: {
    alignItems: 'center',
    gap: 6,
  },
  setupGateQrText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8B5CF6',
  },
  setupGateBtn: {
    borderRadius: 12,
    overflow: 'hidden',
    height: 48,
    marginTop: 6,
  },
  setupGateBtnDisabled: {
    opacity: 0.6,
  },
  setupGateBtnGradient: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  setupGateBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
  setupGateFooter: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 5,
    marginTop: 6,
  },
  setupGateFooterText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
  },
  onboardingStepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  onboardingStepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#8B5CF6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  onboardingStepNumberText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '800',
  },
  onboardingStepLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: '#334155',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  onboardingInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 60,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  onboardingInputBoxActive: {
    borderColor: '#8B5CF6',
    backgroundColor: '#F5F3FF',
  },
  onboardingTextInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
  },
  onboardingQrBox: {
    width: '100%',
    height: 180,
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  onboardingQrBoxActive: {
    borderStyle: 'solid',
    borderColor: '#8B5CF6',
    backgroundColor: '#F5F3FF',
  },
  onboardingQrPreview: {
    width: '100%',
    height: '100%',
  },
  onboardingQrImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  onboardingQrOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.02)',
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    padding: 12,
  },
  onboardingChangeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#8B5CF6',
    gap: 6,
  },
  onboardingChangeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  onboardingQrPlaceholder: {
    alignItems: 'center',
    gap: 10,
  },
  onboardingQrIconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  onboardingQrPlaceholderText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#8B5CF6',
  },
  onboardingSubmitBtn: {
    borderRadius: 20,
    overflow: 'hidden',
    height: 64,
    elevation: 8,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  onboardingSubmitDisabled: {
    opacity: 0.5,
    elevation: 0,
  },
  onboardingSubmitGradient: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  onboardingSubmitText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  onboardingFooter: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 30,
    gap: 6,
  },
  onboardingFooterText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  headerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
  },
  monthArrow: {
    padding: 6,
  },
  monthText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginHorizontal: 12,
  },

  // Summary Cards
  summaryCards: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 20,
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  summaryCardActive: {
    borderColor: COLORS.primaryBlue,
    backgroundColor: '#F5F3FF',
  },
  summaryCardGreen: {
    borderTopWidth: 3,
    borderTopColor: COLORS.successGreen,
  },
  summaryCardOrange: {
    borderTopWidth: 3,
    borderTopColor: COLORS.warningOrange,
  },
  summaryCardBlue: {
    borderTopWidth: 3,
    borderTopColor: COLORS.primaryBlue,
  },
  summaryIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  summarySubtext: {
    fontSize: 11,
    color: COLORS.textLight,
    fontWeight: '500',
  },

  // Tab Navigation
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#FFF',
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: '#8B5CF6',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  tabTextActive: {
    color: '#FFF',
  },

  // List Header
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  listActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sortText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginRight: 8,
  },
  filterBtn: {
    padding: 6,
  },

  // Tenant List
  tenantList: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  tenantCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16, // Consistent gap
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  tenantLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  tenantAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  tenantInitial: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.successGreen,
  },
  tenantDetails: {
    flex: 1,
  },
  tenantName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  tenantRoom: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '500',
    marginBottom: 4,
  },
  tenantRent: {
    fontSize: 12,
    color: COLORS.textLight,
    marginBottom: 6,
  },
  tenantDueInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tenantDueText: {
    fontSize: 11,
    color: COLORS.textLight,
    marginLeft: 4,
  },
  tenantRight: {
    alignItems: 'flex-end',
  },
  tenantAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    marginBottom: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 4,
  },
  requestBtn: {
    backgroundColor: COLORS.primaryBlue,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    minWidth: 140,
    alignItems: 'center',
  },
  requestBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFF',
  },

  // Payment Method Badge
  paymentMethodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 8,
  },
  paymentMethodUPI: {
    backgroundColor: '#F0FDF4',
  },
  paymentMethodCash: {
    backgroundColor: '#FFF7ED',
  },
  paymentMethodBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    marginLeft: 4,
  },
  paymentMethodTextUPI: {
    color: COLORS.successGreen,
  },
  paymentMethodTextCash: {
    color: COLORS.warningOrange,
  },

  // Cash Payment Screen
  cashPaymentScreen: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  cashHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  cashHeaderBg: {
    width: 64,
    height: 64,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cashHeaderText: {
    flex: 1,
  },
  cashTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  cashSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  cashTenantList: {
    gap: 12,
  },
  cashTenantCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16, // Added gap between cards
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cashTenantLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  cashTenantDetails: {
    marginLeft: 14,
  },
  cashAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primaryBlue,
    marginTop: 4,
  },
  cashTenantRight: {
    alignItems: 'flex-end',
  },
  cashActionColumn: {
    alignItems: 'center',
    gap: 8,
  },
  markCashBtn: {
    backgroundColor: COLORS.successGreen,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    minWidth: 140,
    alignItems: 'center',
  },
  markCashBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '600',
  },
  fullPaidBtnSmall: {
    backgroundColor: COLORS.successGreen,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    minWidth: 140,
    alignItems: 'center',
  },
  fullPaidBtnTextSmall: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },
  cashPaidBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  cashPaidText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.successGreen,
    marginLeft: 6,
  },

  // Reminder Section
  reminderSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 16,
    padding: 20,
    backgroundColor: '#FFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  reminderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  reminderIconBg: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  reminderText: {
    flex: 1,
  },
  reminderTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  reminderSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  reminderBtn: {
    backgroundColor: COLORS.primaryBlue,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  reminderBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFF',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 12,
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
    maxHeight: '80%',
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  modalSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  pendingList: {
    maxHeight: 400,
  },
  pendingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  pendingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  pendingInfo: {
    marginLeft: 12,
  },
  pendingName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  pendingRoom: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  pendingMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  pendingDue: {
    fontSize: 11,
    color: COLORS.warningOrange,
    fontWeight: '500',
    marginLeft: 4,
  },
  pendingRight: {
    alignItems: 'flex-end',
  },
  pendingAmount: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  sendRemindBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
  },
  sendRemindText: {
    fontSize: 11,
    color: COLORS.primaryBlue,
    fontWeight: '600',
    marginLeft: 4,
  },
  sendAllRemindBtn: {
    backgroundColor: COLORS.primaryBlue,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  sendAllRemindText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },

  // Bottom Navigation
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 30 : 16,
    paddingHorizontal: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    position: 'absolute',
    bottom: 0,
    width: '100%',
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  navItemActive: {
    opacity: 1,
  },
  navText: {
    fontSize: 11,
    color: COLORS.textLight,
    marginTop: 4,
    fontWeight: '500',
  },
  navTextActive: {
    color: COLORS.primaryBlue,
    fontWeight: '600',
  },

  // Status Options
  statusOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  statusOptionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statusOptionBtnActive: {
    backgroundColor: COLORS.primaryBlue,
    borderColor: COLORS.primaryBlue,
  },
  statusOptionText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginLeft: 4,
  },
  statusOptionTextActive: {
    color: '#FFF',
  },

  // Center Modal
  centerModalContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  centerModalBody: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 32,
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
  },
  centerModalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  centerModalSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  cancelBtn: {
    paddingVertical: 12,
  },
  cancelText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },

  // Message Modal
  messageModalBody: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  quickMessageContainer: {
    marginBottom: 20,
  },
  quickMessageTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  quickMessageBtn: {
    backgroundColor: '#F8FAFC',
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
  },
  quickMessageText: {
    fontSize: 13,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  customMessageTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  customMessageInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
    color: COLORS.textPrimary,
    minHeight: 100,
    marginBottom: 16,
  },
  sendMessageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryBlue,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    justifyContent: 'center',
  },
  sendMessageText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 8,
  },
  premiumVerificationAlert: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  verificationGradient: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  alertContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  alertIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertTitle: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  alertText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 13,
    fontWeight: '600',
  },
  alertActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 4,
  },
  alertActionText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  // Premium Verification Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  verificationModalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, maxHeight: '90%' },
  rejectModalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, maxHeight: '70%' },
  rejectLabel: { fontSize: 14, fontWeight: '600', color: '#64748B', marginBottom: 8 },
  rejectInput: { backgroundColor: '#F8FAFC', borderRadius: 12, padding: 16, fontSize: 16, color: '#1E293B', borderWidth: 1, borderColor: '#E2E8F0', minHeight: 120, textAlignVertical: 'top' },
  rejectConfirmBtn: { backgroundColor: '#EF4444', paddingVertical: 16, borderRadius: 14, alignItems: 'center', marginTop: 20 },
  rejectConfirmText: { color: '#FFF', fontWeight: '700', fontSize: 16 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '700' },
  headerActions: { flexDirection: 'row', alignItems: 'center' },
  editBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' },
  dateSelector: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#F8FAFC', borderRadius: 16, padding: 16, marginBottom: 20 },
  dateArrow: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  dateDisplay: { flex: 1, alignItems: 'center' },
  dateText: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
  requestsList: { flex: 1 },
  proofCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 24,
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
  },
  proofHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  proofTenantInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  proofAvatar: { width: 50, height: 50, borderRadius: 16, backgroundColor: '#EEF2FF', justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  proofAvatarText: { fontSize: 20, fontWeight: '800', color: COLORS.primaryBlue },
  proofName: { fontSize: 17, fontWeight: '700', color: '#1E293B' },
  proofRoom: { fontSize: 13, color: '#64748B', fontWeight: '500', marginTop: 2 },
  proofAmount: { fontSize: 20, fontWeight: '900', color: COLORS.primaryBlue },
  proofLabel: { fontSize: 12, color: '#64748B', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 },
  screenshotPlaceholder: {
    width: '100%',
    height: 300,
    backgroundColor: '#F1F5F9',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    marginVertical: 10,
  },
  screenshotImage: { width: '100%', height: '100%', resizeMode: 'contain' },
  zoomBadge: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  zoomText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '600',
  },
  proofFooter: { marginTop: 16 },
  proofTimestamp: { fontSize: 12, color: COLORS.textSecondary, marginBottom: 12 },
  proofActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rejectSmallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.dangerRed,
    paddingHorizontal: 8,
    paddingVertical: 10,
    borderRadius: 8,
    flex: 0.8,
    justifyContent: 'center',
    marginRight: 6
  },
  rejectSmallText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 4
  },
  verifySmallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.successGreen,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    flex: 1,
    justifyContent: 'center'
  },
  verifySmallText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 4
  },
  partialBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.warningOrange,
    paddingHorizontal: 8,
    paddingVertical: 10,
    borderRadius: 8,
    flex: 1,
    justifyContent: 'center',
    marginRight: 6
  },
  partialBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 4
  },
  tenantActionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  paidBtnSmall: {
    backgroundColor: COLORS.successGreen,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 8,
  },
  paidBtnTextSmall: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
  },
  partialPaymentSection: { backgroundColor: '#FFF7ED', borderRadius: 12, padding: 16, marginTop: 12, borderWidth: 1, borderColor: '#FDBA74' },
  partialHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  partialTitle: { fontSize: 14, fontWeight: '700', color: '#C2410C', marginLeft: 8 },
  partialRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  partialLabel: { fontSize: 12, color: '#64748B' },
  partialValue: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary },
  remainingValue: { color: '#DC2626' },
  partialDate: { fontSize: 13, fontWeight: '600', color: COLORS.primaryBlue },
  noteSection: { backgroundColor: '#FFFFFF', borderRadius: 8, padding: 10, marginTop: 8 },
  noteLabel: { fontSize: 11, color: '#64748B', marginBottom: 4 },
  noteText: { fontSize: 12, color: COLORS.textPrimary, fontStyle: 'italic' },
  editInput: { backgroundColor: '#F8FAFC', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, fontSize: 14, fontWeight: '600', color: COLORS.textPrimary, minWidth: 100, textAlign: 'right' },
  editNoteInput: { backgroundColor: '#F8FAFC', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 12, color: COLORS.textPrimary, minHeight: 60, textAlignVertical: 'top' },
  setReminderBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.primaryBlue, paddingVertical: 12, borderRadius: 10, justifyContent: 'center', marginTop: 12 },
  setReminderText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600', marginLeft: 8 },
  partialModalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, maxHeight: '85%' },
  tenantSummary: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: 16, padding: 16, marginBottom: 20 },
  tenantAvatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: COLORS.primaryBlue, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  tenantAvatarText: { fontSize: 20, fontWeight: '700', color: '#FFFFFF' },
  tenantInfo: { flex: 1 },
  tenantName: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
  tenantRoom: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  totalAmount: { fontSize: 18, fontWeight: '800', color: COLORS.primaryBlue },
  noProofsContainer: { alignItems: 'center', paddingVertical: 60 },
  noProofsText: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary, marginTop: 16 },
  noProofsSubtext: { fontSize: 14, color: COLORS.textSecondary, marginTop: 8 },
  infoBox: { flexDirection: 'row', backgroundColor: '#EFF6FF', padding: 12, borderRadius: 10, marginTop: 15 },
  infoText: { fontSize: 12, color: COLORS.primaryBlue, marginLeft: 8, flex: 1 },
  verifyConfirmBtn: { backgroundColor: COLORS.successGreen, paddingVertical: 16, borderRadius: 14, alignItems: 'center', marginTop: 20 },
  verifyConfirmText: { color: '#FFF', fontWeight: '700', fontSize: 16 },
  rejectBtn: { paddingVertical: 15, alignItems: 'center' },
  rejectText: { color: COLORS.dangerRed, fontWeight: '600' },
  fullImageModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullImageCloseBtn: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 8,
    borderRadius: 24,
  },
  modernPaymentSection: {
    marginTop: 16,
  },
  editAmountCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    alignItems: 'center',
  },
  editAmountLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  editAmountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  currencySymbol: {
    fontSize: 32,
    fontWeight: '700',
    color: '#334155',
    marginRight: 6,
  },
  editAmountValue: {
    fontSize: 40,
    fontWeight: '800',
    color: '#1E293B',
  },
  editAmountInput: {
    fontSize: 40,
    fontWeight: '800',
    color: COLORS.primaryBlue,
    minWidth: 120,
    textAlign: 'center',
    padding: 0,
    borderBottomWidth: 3,
    borderBottomColor: COLORS.primaryBlue,
  },
  modernEditBtn: {
    marginLeft: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  remainingInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  remainingInfoCard: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  remainingInfoLabel: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 6,
    fontWeight: '600',
  },
  remainingInfoValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#334155',
  },
  remainingInfoValueDanger: {
    fontSize: 16,
    fontWeight: '700',
    color: '#DC2626',
  },
  fullImagePreview: {
    width: width,
    height: height,
    resizeMode: 'contain',
  },
  cashPaymentNoticeContainer: {
    backgroundColor: '#F0FDF4',
    borderRadius: 20,
    padding: 24,
    marginVertical: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#bbf7d0',
    borderStyle: 'dashed',
  },
  cashNoticeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  cashNoticeTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#065F46',
  },
  cashNoticeSubtitle: {
    fontSize: 14,
    color: '#047857',
    textAlign: 'center',
    marginBottom: 16,
  },
  cashNoteContainer: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    width: '100%',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  cashNoteLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  cashNoteText: {
    fontSize: 15,
    color: '#1E293B',
    fontStyle: 'italic',
  },
  notifMessageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    marginTop: 4,
    gap: 8,
  },
  notifMessage: {
    fontSize: 14,
    color: '#312E81',
    fontWeight: '500',
    flex: 1,
  },
  unifiedCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  unifiedCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  tenantAvatarUnified: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  tenantInitialUnified: {
    fontSize: 18,
    fontWeight: '700',
    color: '#8B5CF6',
  },
  unifiedCardTitleBox: {
    justifyContent: 'center',
  },
  unifiedTenantName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 2,
  },
  unifiedTenantRoom: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748B',
  },
  statusBadgeUnified: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusTextUnified: {
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 4,
  },
  unifiedCardBody: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 12,
    marginBottom: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  infoBoxUnified: {
    flex: 1,
    alignItems: 'center',
  },
  infoLabelUnified: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  infoValueUnified: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
  },
  unifiedActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  actionBtnUnifiedMark: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  actionBtnUnifiedFull: {
    flex: 1,
    backgroundColor: '#22C55E',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  actionBtnUnifiedMsg: {
    width: 40,
    height: 40,
    backgroundColor: '#EEF2FF',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionBtnTextUnified: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  actionBtnTextUnifiedLight: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFF',
  },
  unifiedActionRowSingle: {
    alignItems: 'flex-start',
  },
  viewScreenshotBtnUnified: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  viewScreenshotTextUnified: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8B5CF6',
    marginLeft: 6,
  }
});

export default OwnerPaymentScreen;
