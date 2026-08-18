import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert, ActivityIndicator } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import COLORS from '../../theme/colors';
import BASE_URL, { fetchWithAuth } from '@/src/config/Api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMaintenance } from '../../context/MaintenanceContext';
import { useLanguage } from '../../utils/LanguageContext';

export default function OwnerExpenseScreen({ navigation, route }) {
    const { t } = useLanguage();
    const { maintenanceMode } = useMaintenance();
    const isReadOnly = maintenanceMode === 'READ_ONLY';
    const expenseToEdit = route?.params?.expense;
    const isEditMode = !!expenseToEdit;

    const [loading, setLoading] = useState(false);
    const [category, setCategory] = useState(expenseToEdit?.category || '');
    const [amount, setAmount] = useState(expenseToEdit?.amount ? String(expenseToEdit.amount) : '');
    const [description, setDescription] = useState(expenseToEdit?.description || '');
    const [date, setDate] = useState(expenseToEdit?.date || new Date().toISOString().split('T')[0]);
    const [showDatePicker, setShowDatePicker] = useState(false);

    const getValidDate = (dateStr) => {
        const d = new Date(dateStr);
        return isNaN(d.getTime()) ? new Date() : d;
    };

    const handleSaveExpense = async () => {
        if (!category || !amount || !date) {
            Alert.alert('Error', 'Please fill all required fields');
            return;
        }

        try {
            setLoading(true);
            const ownerId = await AsyncStorage.getItem('selectedAccountId');
            
            const url = isEditMode 
                ? `${BASE_URL}/api/update-expense/${expenseToEdit.id}/` 
                : `${BASE_URL}/api/add-expense/`;
            
            const method = isEditMode ? 'PUT' : 'POST';
            
            const response = await fetchWithAuth(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    owner_id: ownerId,
                    category,
                    amount: parseFloat(amount),
                    date,
                    description
                }),
            });

            if (response.ok) {
                if (route.params?.onRefresh) {
                    route.params.onRefresh();
                }
                navigation.goBack();
            } else {
                const data = await response.json();
                Alert.alert('Error', data.error || (isEditMode ? 'Failed to update expense' : 'Failed to add expense'));
            }
        } catch (error) {
            console.error('Save expense error:', error);
            Alert.alert('Error', 'Server connection failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.TEXT_PRIMARY} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{isEditMode ? (t("edit_expense") || "Edit Expense") : (t("add_expense") || "Add Expense")}</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.formCard}>
                    <Text style={styles.label}>{t("category_label") || "Category *"}</Text>
                    <TextInput
                        style={styles.input}
                        placeholder={t("category_placeholder") || "e.g. Repairs, Electricity, Cleaning"}
                        placeholderTextColor="#9E9E9E"
                        value={category}
                        onChangeText={setCategory}
                    />

                    <Text style={styles.label}>{t("amount_label") || "Amount (₹) *"}</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="0.00"
                        placeholderTextColor="#9E9E9E"
                        keyboardType="numeric"
                        value={amount}
                        onChangeText={setAmount}
                    />

                    <Text style={styles.label}>{t("date_format_label") || "Date *"}</Text>
                    <TouchableOpacity onPress={() => setShowDatePicker(true)} activeOpacity={0.7}>
                        <View pointerEvents="none">
                            <TextInput
                                style={styles.input}
                                placeholder="YYYY-MM-DD"
                                placeholderTextColor="#9E9E9E"
                                value={date}
                                editable={false}
                            />
                        </View>
                    </TouchableOpacity>

                    {showDatePicker && (
                        <DateTimePicker
                            value={getValidDate(date)}
                            mode="date"
                            display="default"
                            onChange={(event, dateValue) => {
                                setShowDatePicker(false);
                                if (dateValue) {
                                    const formattedDate = dateValue.toISOString().split('T')[0];
                                    setDate(formattedDate);
                                }
                            }}
                        />
                    )}

                    <Text style={styles.label}>{t("description_optional_label") || "Description (Optional)"}</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        placeholder={t("description_placeholder") || "Details about the expense..."}
                        placeholderTextColor="#9E9E9E"
                        multiline
                        numberOfLines={4}
                        value={description}
                        onChangeText={setDescription}
                    />

                    <TouchableOpacity 
                      style={[styles.submitBtn, (loading || isReadOnly) && styles.submitBtnDisabled]} 
                      onPress={handleSaveExpense}
                      disabled={loading || isReadOnly}
                    >
                        {loading ? (
                            <ActivityIndicator color="#FFF" />
                        ) : (
                            <Text style={styles.submitBtnText}>
                                {isReadOnly ? (t("unavailable_maintenance") || "Unavailable During Maintenance") : (isEditMode ? (t("update_expense") || "Update Expense") : (t("save_expense") || "Save Expense"))}
                            </Text>
                        )}
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 50,
        paddingBottom: 15,
        paddingHorizontal: 20,
        backgroundColor: '#FFF',
    },
    backBtn: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.TEXT_PRIMARY,
    },
    content: {
        padding: 20,
    },
    formCard: {
        backgroundColor: '#FFF',
        borderRadius: 20,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#64748B',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#F1F5F9',
        borderRadius: 12,
        padding: 12,
        fontSize: 16,
        color: COLORS.TEXT_PRIMARY,
        marginBottom: 20,
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    submitBtn: {
        backgroundColor: COLORS.PRIMARY,
        paddingVertical: 16,
        borderRadius: 14,
        alignItems: 'center',
        marginTop: 10,
    },
    submitBtnDisabled: {
        opacity: 0.7,
    },
    submitBtnText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '700',
    },
});