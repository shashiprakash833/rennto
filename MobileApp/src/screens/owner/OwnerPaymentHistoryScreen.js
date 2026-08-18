import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Image, Modal, Alert, Platform, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import { useLanguage } from '../../utils/LanguageContext';
import COLORS from '../../theme/colors';
import BASE_URL, { fetchWithAuth } from '../../config/Api';
import { useNetwork } from '../../hooks/useNetwork';
import OfflineView from '../../components/OfflineView';

export default function OwnerPaymentHistoryScreen({ route, navigation }) {
    const { t } = useLanguage();
    const { isConnected } = useNetwork();
    const { phone } = route.params || {};
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState(null);

    useEffect(() => {
        fetchPaymentHistory();
    }, [isConnected]);

    const fetchPaymentHistory = async () => {
        try {
            setLoading(true);

            let ownerPhone = phone;
            if (!ownerPhone) {
                ownerPhone = await AsyncStorage.getItem('ownerPhone');
            }
            if (!ownerPhone) {
                console.warn('No owner phone found for payment history.');
                setLoading(false);
                return;
            }

            let phoneToUse = ownerPhone.trim();
            const rawAccounts = await AsyncStorage.getItem('loggedInOwnerAccounts');
            if (rawAccounts) {
                const accounts = JSON.parse(rawAccounts);
                const account = accounts.find(a => String(a.id) === String(ownerPhone) || String(a.phone) === String(ownerPhone));
                if (account && account.phone) {
                    phoneToUse = account.phone;
                }
            }

            const response = await fetchWithAuth(`${BASE_URL}/api/owner-payments/${encodeURIComponent(phoneToUse)}/`);
            const data = await response.json();

            const paymentsArray = Array.isArray(data) ? data : (data.data || []);

            if (paymentsArray.length >= 0) {
                // Filter out synthetic 'not yet paid' records (txn_ref starts with PEND- without screenshot usually)
                // We want to show all real payment attempts (Success, Paid, Pending Verification, Cash, etc)
                const historyPayments = paymentsArray.filter(p => {
                    if (p.txn_ref && String(p.txn_ref).startsWith('PEND-') && !p.payment_screenshot) {
                        return false;
                    }
                    return true;
                });

                setPayments(historyPayments);
            }
        } catch (error) {
            console.error('Fetch payment history error:', error);
        } finally {
            setLoading(false);
        }
    };

    const downloadReport = async () => {
        if (payments.length === 0) {
            console.log("No Data", "There is no payment history to download for this month.");
            return;
        }

        try {
            const monthNames = [
                "January", "February", "March", "April", "May", "June",
                "July", "August", "September", "October", "November", "December"
            ];
            const currentMonthName = monthNames[new Date().getMonth()];
            
            // Generate PDF content using HTML
            let htmlContent = `
                <html>
                <head>
                    <style>
                        body { font-family: 'Helvetica', 'Arial', sans-serif; padding: 20px; }
                        h1 { text-align: center; color: #333; }
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                        th { background-color: #f2f2f2; color: #333; }
                        tr:nth-child(even) { background-color: #f9f9f9; }
                        .status-success { color: green; font-weight: bold; }
                        .status-pending { color: orange; font-weight: bold; }
                        .total { font-weight: bold; font-size: 1.2em; text-align: right; margin-top: 20px; }
                    </style>
                </head>
                <body>
                    <h1>Payment Report</h1>
                    <table>
                        <tr>
                            <th>Tenant Name</th>
                            <th>Property Name</th>
                            <th>Amount</th>
                            <th>Payment Type</th>
                            <th>Date</th>
                            <th>Status</th>
                        </tr>
            `;

            let totalAmount = 0;

            payments.forEach(item => {
                const isCash = item.txn_ref && String(item.txn_ref).startsWith('CASH-');
                const paymentType = isCash ? 'Cash' : 'UPI';
                const formattedDate = new Date(item.created_at).toLocaleDateString();
                const tenantName = (item.tenant_name || 'Tenant').replace(/</g, "&lt;").replace(/>/g, "&gt;");
                const propertyName = (item.property_name || 'N/A').replace(/</g, "&lt;").replace(/>/g, "&gt;");
                const statusStr = (item.status || 'Pending').toUpperCase();
                const statusClass = (statusStr === 'SUCCESS' || statusStr === 'PAID' || statusStr === 'VERIFIED') ? 'status-success' : 'status-pending';

                if (statusStr === 'SUCCESS' || statusStr === 'PAID' || statusStr === 'VERIFIED') {
                    totalAmount += Number(item.amount) || 0;
                }

                htmlContent += `
                    <tr>
                        <td>${tenantName}</td>
                        <td>${propertyName}</td>
                        <td>₹${item.amount}</td>
                        <td>${paymentType}</td>
                        <td>${formattedDate}</td>
                        <td class="${statusClass}">${statusStr}</td>
                    </tr>
                `;
            });

            htmlContent += `
                    </table>
                    <div class="total">Total Collected: ₹${totalAmount}</div>
                </body>
                </html>
            `;

            const { uri } = await Print.printToFileAsync({ html: htmlContent });

            const isAvailable = await Sharing.isAvailableAsync();
            if (isAvailable) {
                await Sharing.shareAsync(uri, {
                    mimeType: 'application/pdf',
                    dialogTitle: `Save Payment Report`,
                    UTI: 'com.adobe.pdf'
                });
            } else {
                console.log("Sharing Not Available", "Sharing is not available on this device.");
            }
        } catch (error) {
            console.error("Error generating report:", error);
            console.log("Error", "Failed to generate and download payment report.");
        }
    };

    const renderPaymentItem = ({ item }) => {
        const isCash = item.txn_ref && String(item.txn_ref).startsWith('CASH-');
        const paymentType = isCash ? 'Cash Payment' : 'UPI Payment';
        const isSuccess = item.status && (item.status.toLowerCase() === 'success' || item.status.toLowerCase() === 'paid' || item.status.toLowerCase() === 'verified');

        return (
            <View style={styles.paymentCard}>
                <View style={styles.cardHeader}>
                    <View>
                        <Text style={styles.tenantName}>{item.tenant_name || 'Tenant'}</Text>
                        <Text style={styles.propertyName}>{item.property_name}</Text>
                    </View>
                    <Text style={styles.amount}>₹{item.amount}</Text>
                </View>

                <View style={styles.paymentInfoRow}>
                    <View style={styles.typeBadge}>
                        <Ionicons name={isCash ? "cash-outline" : "qr-code-outline"} size={14} color="#6366F1" />
                        <Text style={styles.typeText}>{paymentType}</Text>
                    </View>
                    {item.payment_screenshot && (
                        <TouchableOpacity onPress={() => setSelectedImage(item.payment_screenshot)}>
                            <Image source={{ uri: item.payment_screenshot }} style={styles.thumbnail} />
                        </TouchableOpacity>
                    )}
                </View>

                <View style={styles.cardFooter}>
                    <View style={styles.dateRow}>
                        <Ionicons name="calendar-outline" size={14} color={COLORS.TEXT_LIGHT} />
                        <Text style={styles.dateText}>
                            {new Date(item.created_at).toLocaleDateString()}
                        </Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: isSuccess ? '#DCFCE7' : '#FEF9C3' }]}>
                        <Ionicons name={isSuccess ? "checkmark-circle" : "time"} size={14} color={isSuccess ? COLORS.SUCCESS : '#EAB308'} />
                        <Text style={[styles.statusText, { color: isSuccess ? '#15803D' : '#CA8A04' }]}>{item.status || 'Pending'}</Text>
                    </View>
                </View>
            </View>
        );
    };

    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];
    const currentMonthName = monthNames[new Date().getMonth()];
    const currentYear = new Date().getFullYear();

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color={COLORS.PRIMARY} />
            </View>
        );
    }

  if (isConnected === false && payments.length === 0) {
    return <OfflineView />;
  }

  return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#5F259F" translucent={false} />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.TEXT_PRIMARY} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t("payment_history") || "Payment History"}</Text>
                <TouchableOpacity onPress={downloadReport} style={styles.downloadBtn}>
                    <Ionicons name="download-outline" size={22} color={COLORS.PRIMARY || "#6366F1"} />

                </TouchableOpacity>
            </View>

            {/* Premium information banner showing active calendar month */}
            <View style={styles.monthBanner}>
                <Ionicons name="information-circle-outline" size={18} color="#4F46E5" />
                <Text style={styles.monthBannerText}>
                    {t("showing_all_payment_history") || "Showing all payment history"}
                </Text>
            </View>

            <FlatList
                data={payments}
                renderItem={renderPaymentItem}
                keyExtractor={(item, index) => index.toString()}
                contentContainerStyle={styles.listContainer}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="receipt-outline" size={64} color="#ccc" />
                        <Text style={styles.emptyText}>{t("no_payment_history_found_for_this_month") || "No payment history found for this month"}</Text>
                    </View>
                }
                refreshing={loading}
                onRefresh={fetchPaymentHistory}
            />

            <Modal visible={!!selectedImage} transparent={true} onRequestClose={() => setSelectedImage(null)} animationType="fade">
                <View style={styles.modalOverlay}>
                    <TouchableOpacity style={styles.closeModalBtn} onPress={() => setSelectedImage(null)}>
                        <Ionicons name="close" size={32} color="#FFF" />
                    </TouchableOpacity>
                    {selectedImage && (
                        <Image source={{ uri: selectedImage }} style={styles.fullImage} resizeMode="contain" />
                    )}
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 50,
        paddingBottom: 20,
        backgroundColor: COLORS.WHITE,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: COLORS.TEXT_PRIMARY,
    },
    backBtn: {
        padding: 4,
    },
    downloadBtn: {
        padding: 6,
        borderRadius: 8,
        backgroundColor: '#F5F3FF', // Very light violet background
    },
    monthBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EEF2FF', // Light indigo tint
        paddingVertical: 12,
        paddingHorizontal: 16,
        marginHorizontal: 16,
        marginTop: 16,
        borderRadius: 12,
        gap: 8,
        borderWidth: 1,
        borderColor: '#E0E7FF',
    },
    monthBannerText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#312E81', // Deep indigo text color
    },
    listContainer: {
        padding: 16,
        paddingTop: 8,
    },
    paymentCard: {
        backgroundColor: COLORS.WHITE,
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    tenantName: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.TEXT_PRIMARY,
    },
    propertyName: {
        fontSize: 12,
        color: COLORS.TEXT_SECONDARY,
        marginTop: 2,
    },
    amount: {
        fontSize: 18,
        fontWeight: '800',
        color: COLORS.SUCCESS,
    },
    paymentInfoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 12,
        marginBottom: 12,
    },
    typeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EEF2FF',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        gap: 4,
    },
    typeText: {
        fontSize: 12,
        color: '#4F46E5',
        fontWeight: '600',
    },
    thumbnail: {
        width: 44,
        height: 44,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#f3f4f6',
    },
    dateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    dateText: {
        fontSize: 12,
        color: COLORS.TEXT_LIGHT,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '700',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 80,
    },
    emptyText: {
        marginTop: 16,
        fontSize: 16,
        color: COLORS.TEXT_LIGHT,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.85)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    closeModalBtn: {
        position: 'absolute',
        top: 50,
        right: 20,
        zIndex: 10,
        padding: 8,
    },
    fullImage: {
        width: '90%',
        height: '80%',
    },
});


