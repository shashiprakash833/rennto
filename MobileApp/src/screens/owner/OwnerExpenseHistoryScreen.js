import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, StatusBar, Alert } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from "@react-native-async-storage/async-storage";
import COLORS from '../../theme/colors';
import BASE_URL, { fetchWithAuth } from '../../config/Api';
import { useLanguage } from '../../utils/LanguageContext';

export default function OwnerExpenseHistoryScreen({ navigation }) {
    const { t } = useLanguage();
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterDate, setFilterDate] = useState(null);
    const [showDatePicker, setShowDatePicker] = useState(false);

    const getValidDate = (dateStr) => {
        if (!dateStr) return new Date();
        const d = new Date(dateStr);
        return isNaN(d.getTime()) ? new Date() : d;
    };

    useEffect(() => {
        fetchExpenses();
    }, []);

    const fetchExpenses = async () => {
        try {
            const ownerId = await AsyncStorage.getItem("selectedAccountId");
            if (!ownerId) return;
            const response = await fetchWithAuth(`${BASE_URL}/api/owner-expenses/${encodeURIComponent(ownerId)}/`);
            const data = await response.json();
            if (response.ok) {
                setExpenses(Array.isArray(data) ? data : (data.data || []));
            }
        } catch (e) {
            console.log("Fetch expenses error:", e);
        } finally {
            setLoading(false);
        }
    };

    const handleEditExpense = (expense) => {
        navigation.navigate('AddExpense', {
            expense,
            onRefresh: fetchExpenses
        });
    };

    const handleDeleteExpense = (expenseId) => {
        Alert.alert(
            t("delete_confirm_title") || "Delete Expense",
            t("delete_confirm_message") || "Are you sure you want to delete this expense?",
            [
                { text: t("cancel") || "Cancel", style: "cancel" },
                {
                    text: t("delete") || "Delete",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            setLoading(true);
                            const response = await fetchWithAuth(`${BASE_URL}/api/delete-expense/${expenseId}/`, {
                                method: 'DELETE'
                            });
                            if (response.ok) {
                                fetchExpenses();
                            } else {
                                const data = await response.json();
                                Alert.alert("Error", data.error || "Failed to delete expense");
                            }
                        } catch (e) {
                            console.log("Delete expense error:", e);
                            Alert.alert("Error", "Server connection failed");
                        } finally {
                            setLoading(false);
                        }
                    }
                }
            ]
        );
    };

    const renderExpenseItem = ({ item }) => (
        <View style={styles.expenseCard}>
            <View style={styles.expenseLeft}>
                <View style={styles.iconBox}>
                    <Ionicons name="wallet-outline" size={18} color="#7C3AED" />
                </View>
                <View style={{ flex: 1, marginRight: 8 }}>
                    <Text style={styles.category}>{t(item.category) || item.category}</Text>
                    {item.description ? (
                        <Text style={styles.description} numberOfLines={2}>{item.description}</Text>
                    ) : null}
                </View>
            </View>
            <View style={styles.expenseRightContainer}>
                <Text style={styles.amount}>- ₹{Number(item.amount).toLocaleString()}</Text>
                <View style={styles.actionButtons}>
                    <TouchableOpacity onPress={() => handleEditExpense(item)} style={styles.actionBtn}>
                        <Ionicons name="create-outline" size={16} color="#4F46E5" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDeleteExpense(item.id)} style={styles.actionBtn}>
                        <Ionicons name="trash-outline" size={16} color="#EF4444" />
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );

    const filteredExpenses = filterDate
        ? expenses.filter(item => item.date === filterDate)
        : expenses;

    const totalExpenses = filteredExpenses.reduce((sum, item) => sum + Number(item.amount), 0);

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#7A3FC4" />
                <Text style={{ marginTop: 12, color: '#64748B' }}>{t("loading") || "Loading..."}</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#5F259F" translucent={false} />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#1E293B" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t("expense_history") || "Expense History"}</Text>
                <View style={{ width: 24 }} />
            </View>

            <View style={styles.summaryCard}>
                <View>
                    <Text style={styles.summaryLabel}>
                        {filterDate ? `Total on ${filterDate}` : "Total Expenses"}
                    </Text>
                    <Text style={styles.summaryAmount}>
                        ₹{totalExpenses.toLocaleString()}
                    </Text>
                </View>
                <TouchableOpacity onPress={() => setShowDatePicker(true)} activeOpacity={0.7}>
                    <Ionicons name="calendar-outline" size={28} color="#FFFFFF" />
                </TouchableOpacity>
            </View>

            <FlatList
                data={filteredExpenses}
                renderItem={renderExpenseItem}
                keyExtractor={(item, index) => index.toString()}
                contentContainerStyle={styles.listContainer}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="receipt-outline" size={64} color="#CBD5E1" />
                        <Text style={styles.emptyText}>{t("no_expense_history") || "No expense history found"}</Text>
                    </View>
                }
            />

            {showDatePicker && (
                <DateTimePicker
                    value={getValidDate(filterDate)}
                    mode="date"
                    display="default"
                    onChange={(event, dateValue) => {
                        setShowDatePicker(false);
                        if (dateValue) {
                            const formattedDate = dateValue.toISOString().split('T')[0];
                            setFilterDate(formattedDate);
                        }
                    }}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 48,
        paddingBottom: 12,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#1E293B',
    },
    backBtn: {
        padding: 8,
    },
    listContainer: {
        padding: 16,
        paddingBottom: 40,
    },
    expenseCard: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        backgroundColor: '#FFFFFF',
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    expenseLeft: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
        flex: 1,
    },
    iconBox: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: '#F5F3FF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    category: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1E293B',
    },
    date: {
        fontSize: 13,
        color: '#64748B',
        marginTop: 2,
    },
    expenseRightContainer: {
        alignItems: 'flex-end',
        justifyContent: 'center',
        marginLeft: 8,
    },
    expenseRight: {
        alignItems: 'flex-end',
    },
    amount: {
        fontSize: 16,
        fontWeight: '800',
        color: '#EF4444',
    },
    description: {
        fontSize: 12,
        color: '#94A3B8',
        marginTop: 4,
    },
    actionButtons: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginTop: 6,
    },
    actionBtn: {
        padding: 4,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 100,
    },
    emptyText: {
        marginTop: 16,
        fontSize: 16,
        color: '#94A3B8',
        fontWeight: '600',
    },
    filterSection: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 4,
        gap: 10,
    },
    filterBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        gap: 8,
        flex: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    filterBtnText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#475569',
    },
    clearBtn: {
        padding: 8,
    },
    summaryCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#7C3AED',
        marginHorizontal: 16,
        marginVertical: 8,
        padding: 16,
        borderRadius: 16,
        shadowColor: '#7C3AED',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 4,
    },
    summaryLabel: {
        fontSize: 13,
        color: '#F3E8FF',
        fontWeight: '600',
    },
    summaryAmount: {
        fontSize: 24,
        fontWeight: '800',
        color: '#FFFFFF',
        marginTop: 4,
    },
});


