import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useMemo, useState, useEffect, useCallback, useRef } from "react";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import BASE_URL, { fetchWithAuth } from '../../config/Api';
import { useLanguage } from "../../utils/LanguageContext";
import { useMaintenance } from "../../context/MaintenanceContext";
import { useNetwork } from "../../hooks/useNetwork";
import OfflineView from "../../components/OfflineView";
import {
  Alert,
  Image,
  LayoutAnimation,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  UIManager,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Replace this with: import COLORS from './colors';
const COLORS = {
  PRIMARY: "#5F259F",
  PRIMARY_LIGHT: "#7A3FC4",
  PRIMARY_DARK: "#4A1D7A",
  WHITE: "#FFFFFF",
  BACKGROUND: "#F5F5F5",
  CARD: "#EEEEEE",
  TEXT_PRIMARY: "#212121",
  TEXT_SECONDARY: "#757575",
  TEXT_LIGHT: "#9E9E9E",
  SUCCESS: "#16A34A",
  ERROR: "#DC2626",
  WARNING: "#F59E0B",
  INFO: "#2563EB",
  BORDER: "#E0E0E0",
  DIVIDER: "#D6D6D6",
  GOLD: "#D4AF37",
  BLUE_LIGHT: "#E3F2FD",
};


export default function IssuesScreen() {
  const { isConnected } = useNetwork();
  const { maintenanceMode } = useMaintenance();
  const isReadOnly = maintenanceMode === "READ_ONLY";
  const checkReadOnly = () => {
    if (isReadOnly) {
      console.log(
        "Maintenance Mode",
        "This action is temporarily unavailable during scheduled maintenance. You can continue to browse other parts of the application."
      );
      return true;
    }
    return false;
  };
  const { t } = useLanguage();
  const navigation = useNavigation();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [image, setImage] = useState(null);
  const [editingId, setEditingId] = useState(null);

  const [issues, setIssues] = useState([]);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [statusFilter, setStatusFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [phone, setPhone] = useState("");
  const [tenantId, setTenantId] = useState("");

  useEffect(() => {
    const getTenantData = async () => {
      const storedPhone = await AsyncStorage.getItem("tenantPhone");
      const storedId = await AsyncStorage.getItem("tenantId");
      if (storedPhone) setPhone(storedPhone);
      if (storedId) setTenantId(storedId);
    };
    getTenantData();
  }, []);


  const handleUpdate = async () => {
    if (checkReadOnly()) return;
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", description);
      formData.append("severity", priority);

      if (image && !image.startsWith('http')) {
        formData.append("image", {
          uri: image,
          name: "issue_update.jpg",
          type: "image/jpeg",
        });
      }

      const response = await fetchWithAuth(
        `${BASE_URL}/api/update-issue/${editingId}/`,
        {
          method: "PATCH",
          body: formData,
        }
      );

      const result = await response.json();

      if (response.ok) {
        console.log(t("success") || "Success", t("issue_updated") || "Issue updated");
        setEditingId(null);
        fetchIssues();
      } else {
        console.log(t("error") || "Error", result.error || t("failed_update_issue") || "Failed to update issue");
      }
    } catch (err) {
      console.log(err);
      console.log(t("error") || "Error", err.message);
    } finally {
      setLoading(false);
    }
  };
  const fetchIssues = async (isBackground = false) => {
    try {
      const storedPhone = await AsyncStorage.getItem("tenantPhone");
      if (!storedPhone) return;

      // Only show loading spinner if it's NOT a background refresh
      if (!isBackground) setLoading(true);

      const response = await fetchWithAuth(
        `${BASE_URL}/api/tenant-issues/${encodeURIComponent(storedPhone)}/`
      );
      const data = await response.json();
      setIssues(Array.isArray(data) ? data : []);
    } catch (error) {
      console.log("Fetch Issues Error:", error);
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  const isFirstLoad = useRef(true);

  useFocusEffect(
    useCallback(() => {
      if (isFirstLoad.current) {
        fetchIssues(false); // Show loading spinner only on very first load
        isFirstLoad.current = false;
      } else {
        fetchIssues(true); // Silent background refresh on focus
      }

      // Automatic background refresh every 30 seconds
      const interval = setInterval(() => {
        fetchIssues(true);
      }, 30000);

      return () => clearInterval(interval);
    }, [isConnected])
  );

  // Aligned with your specific STATUS colors
  const priorities = [
    { label: "Low", color: COLORS.INFO, bg: COLORS.BLUE_LIGHT },
    { label: "Medium", color: COLORS.WARNING, bg: `${COLORS.WARNING}15` },
    { label: "High", color: COLORS.ERROR, bg: `${COLORS.ERROR}15` },
  ];

  const stats = useMemo(
    () => ({
      total: issues.length,
      high: issues.filter((i) => i.severity === "High").length,
      resolved: issues.filter((i) => i.status === "Completed").length,
    }),
    [issues],
  );

  const filteredIssues = useMemo(() => {
    let result = [...issues];

    // Sort: Pending issues first, then Completed
    result.sort((a, b) => {
      if (a.status === 'Completed' && b.status !== 'Completed') return 1;
      if (a.status !== 'Completed' && b.status === 'Completed') return -1;
      return new Date(b.created_at) - new Date(a.created_at);
    });

    // Apply Status Filter
    if (statusFilter !== "All") {
      result = result.filter((i) => i.status === statusFilter);
    }

    // Apply Priority Filter
    if (priorityFilter !== "All") {
      result = result.filter((i) => i.severity === priorityFilter);
    }

    return result;
  }, [issues, statusFilter, priorityFilter]);

  const toggleForm = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsFormVisible(!isFormVisible);
    if (isFormVisible && editingId) {
      setEditingId(null);
      setTitle("");
      setDescription("");
      setImage(null);
      setPriority("Medium");
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.2,
    });
    if (!result.canceled) setImage(result.assets[0].uri);
  };

  const submitIssue = async () => {
    if (loading) return; // Prevent double-tap race conditions
    if (checkReadOnly()) return;
    if (!title || !description) {
      console.log(t("error") || "Error", t("please_fill_fields") || "Please fill in all fields");
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();

      formData.append("tenant_id", tenantId);
      formData.append("email", phone);
      formData.append("title", title);
      formData.append("description", description);
      formData.append("severity", priority);

      // ✅ ADD IMAGE
      if (image) {
        formData.append("image", {
          uri: image,
          name: "issue.jpg",
          type: "image/jpeg",
        });
      }

      const response = await fetchWithAuth(`${BASE_URL}/api/create-issue/`, {
        method: "POST",
        body: formData, // ✅ only this
      }
      );

      if (response.status === 201) {
        console.log(t("success") || "Success", t("issue_submitted_success") || "Issue submitted successfully");
        setTitle("");
        setDescription("");
        setPriority("Medium");
        setImage(null); // ✅ reset image
        setIsFormVisible(false);
        fetchIssues();
      } else {
        const err = await response.json();
        console.log(t("error") || "Error", err.error || t("failed_submit_issue") || "Failed to submit issue");
      }
    } catch (error) {
      console.log("Submit Issue Error:", error);
      console.log(t("error") || "Error", t("network_error") || "Network error");
    } finally {
      setLoading(false);
    }
  };

  const formatLabel = (str) => {
    if (!str) return '';
    return str
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const deleteIssue = async (id) => {
    if (checkReadOnly()) return;
    Alert.alert(t("confirm_deletion") || "Confirm Deletion", t("remove_issue_confirm") || "Remove this issue permanently?", [
      { text: t("cancel") || "Cancel", style: "cancel" },
      {
        text: t("delete") || "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            const response = await fetchWithAuth(`${BASE_URL}/api/delete-issue/${id}/`, {
              method: "DELETE",
            });

            if (response.status === 200) {
              LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

              // remove from UI AFTER backend success
              setIssues(issues.filter((i) => i.id !== id));

              console.log(t("success") || "Success", t("issue_deleted_success") || "Issue deleted successfully");
            } else {
              console.log(t("error") || "Error", t("failed_delete_issue") || "Failed to delete issue");
            }
          } catch (error) {
            console.log("Delete Error:", error);
            console.log(t("error") || "Error", t("network_error") || "Network error");
          }
        },
      },
    ]);
  };

  const startEdit = (item) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setEditingId(item.id);
    setTitle(item.title);
    setDescription(item.description);
    setPriority(item.severity || "Medium");
    setImage(item.image);
    // Don't set setIsFormVisible(true) here, as it controls the top form
  };

  const cancelEdit = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setEditingId(null);
    setTitle("");
    setDescription("");
    setPriority("Medium");
    setImage(null);
  };

  if (isConnected === false && issues.length === 0) {
    return <OfflineView />;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerLeftContainer}>
          <View>
            <Text style={styles.headerTitle}>{t('Issues') || 'Issues'}</Text>
          </View>
        </View>

        <View style={styles.headerRightActions}>
          <TouchableOpacity style={styles.addButton} onPress={toggleForm}>
            <Ionicons
              name={isFormVisible ? "close" : "add"}
              size={18}
              color={COLORS.WHITE}
            />
            <Text style={styles.addButtonText}>
              {isFormVisible ? t('skip') : t('Report Issue')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* DASHBOARD STATS */}
        <View style={styles.statsContainer}>
          <TouchableOpacity
            onPress={() => setStatusFilter("All")}
            style={[
              styles.statCard,
              statusFilter === "All" && { borderColor: COLORS.PRIMARY, borderWidth: 2 }
            ]}
          >
            <Text style={[styles.statNumber, statusFilter === "All" && { color: COLORS.PRIMARY }]}>{stats.total}</Text>
            <Text style={styles.statLabel}>{t('all')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setStatusFilter("Pending")}
            style={[
              styles.statCard,
              { borderLeftColor: COLORS.ERROR, borderLeftWidth: 3 },
              statusFilter === "Pending" && { borderColor: COLORS.ERROR, borderWidth: 2 }
            ]}
          >
            <Text style={[styles.statNumber, statusFilter === "Pending" && { color: COLORS.ERROR }]}>{stats.total - stats.resolved}</Text>
            <Text style={styles.statLabel}>{t('pending')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setStatusFilter("Completed")}
            style={[
              styles.statCard,
              { borderLeftColor: COLORS.SUCCESS, borderLeftWidth: 3 },
              statusFilter === "Completed" && { borderColor: COLORS.SUCCESS, borderWidth: 2 }
            ]}
          >
            <Text style={[styles.statNumber, statusFilter === "Completed" && { color: COLORS.SUCCESS }]}>{stats.resolved}</Text>
            <Text style={styles.statLabel}>{t('completed')}</Text>
          </TouchableOpacity>
        </View>

        {/* COLLAPSIBLE FORM CARD */}
        {isFormVisible && (
          <View style={styles.formCard}>
            <Text style={styles.formHeader}>
              {editingId ? t('update_status') : t('Report Issue')}
            </Text>

            <Text style={styles.inputLabel}>{t('type')}</Text>
            <TextInput
              placeholder={t('search_by_name')}
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholderTextColor={COLORS.TEXT_LIGHT}
            />

            <Text style={styles.inputLabel}>{t('description')}</Text>
            <TextInput
              placeholder={t('description')}
              style={[styles.input, { height: 90, textAlignVertical: "top" }]}
              multiline
              value={description}
              onChangeText={setDescription}
              placeholderTextColor={COLORS.TEXT_LIGHT}
            />

            <Text style={styles.inputLabel}>{t("severity_level") || "SEVERITY LEVEL"}</Text>
            <View style={styles.priorityGroup}>
              {priorities.map((p) => (
                <TouchableOpacity
                  key={p.label}
                  onPress={() => setPriority(p.label)}
                  style={[
                    styles.priorityChip,
                    priority === p.label && {
                      backgroundColor: p.color,
                      borderColor: p.color,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.priorityText,
                      priority === p.label && { color: COLORS.WHITE },
                    ]}
                  >
                    {t(p.label?.toLowerCase()) || p.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.formFooter}>
              <TouchableOpacity style={styles.attachBtn} onPress={pickImage}>
                <Feather
                  name={image ? "check" : "paperclip"}
                  size={18}
                  color={COLORS.PRIMARY}
                />
                <Text style={styles.attachText}>
                  {image ? (t("attached") || "Attached") : (t("attach_file") || "Attach File")}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.submitBtn}
                onPress={editingId ? handleUpdate : submitIssue}
              >
                <Text style={styles.submitBtnText}>
                  {editingId ? (t("save_changes") || "Save Changes") : (t("submit_issue") || "Submit Issue")}
                </Text>
                <Ionicons
                  name="send"
                  size={14}
                  color={COLORS.WHITE}
                  style={{ marginLeft: 6 }}
                />
              </TouchableOpacity>
            </View>

            {image && (
              <Image source={{ uri: image }} style={styles.previewImage} />
            )}
          </View>
        )}

        {/* LIST FILTERS */}
        <View style={styles.listHeaderRow}>
          <Text style={styles.listTitle}>{t("priority_filter") || "Priority Filter"}</Text>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setIsFilterModalVisible(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="filter-outline" size={16} color={COLORS.PRIMARY} />
            <Text style={styles.filterButtonText}>
              {priorityFilter === "All"
                ? (t("filter") || "Filter")
                : (t(priorityFilter.toLowerCase()) || priorityFilter)}
            </Text>
            <Ionicons name="chevron-down" size={14} color={COLORS.PRIMARY} />
          </TouchableOpacity>
        </View>

        {/* PRIORITY FILTER MODAL */}
        <Modal
          visible={isFilterModalVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setIsFilterModalVisible(false)}
        >
          <TouchableWithoutFeedback onPress={() => setIsFilterModalVisible(false)}>
            <View style={styles.modalOverlay}>
              <TouchableWithoutFeedback>
                <View style={styles.modalContent}>
                  <Text style={styles.modalTitle}>{t("select_priority") || "Select Priority"}</Text>
                  {["All", "High", "Medium", "Low"].map((f) => (
                    <TouchableOpacity
                      key={f}
                      style={[
                        styles.modalOption,
                        priorityFilter === f && styles.modalOptionSelected,
                      ]}
                      onPress={() => {
                        LayoutAnimation.configureNext(
                          LayoutAnimation.Presets.easeInEaseOut
                        );
                        setPriorityFilter(f);
                        setIsFilterModalVisible(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.modalOptionText,
                          priorityFilter === f && styles.modalOptionTextSelected,
                        ]}
                      >
                        {t(f.toLowerCase()) || f}
                      </Text>
                      {priorityFilter === f && (
                        <Ionicons name="checkmark" size={18} color={COLORS.PRIMARY} />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>

        {/* ISSUES FEED */}
        {filteredIssues.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons
              name="clipboard-check-outline"
              size={54}
              color={COLORS.TEXT_LIGHT}
            />
            <Text style={styles.emptyTitle}>{t("no_issues_found") || "No issues found"}</Text>
            <Text style={styles.emptySub}>{t("you_are_all_caught_up") || "You're all caught up for now."}</Text>
          </View>
        ) : (
          filteredIssues.map((item) => {
            const isCompleted = item.status === "Completed";
            const pData =
              priorities.find((p) => p.label === item.severity) || priorities[1];

            const statusColor = isCompleted ? COLORS.SUCCESS : pData.color;
            const isEditing = editingId === item.id;

            return (
              <View
                key={item.id}
                style={[
                  styles.issueCard,
                  isCompleted && { borderLeftColor: COLORS.SUCCESS, borderLeftWidth: 4 }
                ]}
              >

                {/* STATUS & DATE */}
                <View style={styles.issueTopRow}>
                  <View
                    style={[
                      styles.statusIndicator,
                      { backgroundColor: statusColor },
                    ]}
                  />
                  <Text style={styles.issueDate}>
                    {new Date(item.created_at).toLocaleDateString()}
                  </Text>
                </View>

                {isEditing ? (
                  /* INLINE EDIT FORM */
                  <View style={styles.inlineForm}>
                    <Text style={styles.inlineFormHeader}>{t("edit_issue") || "Edit Issue"}</Text>

                    <Text style={styles.inlineInputLabel}>{t("title") || "Title"}</Text>
                    <TextInput
                      style={styles.inlineInput}
                      value={title}
                      onChangeText={setTitle}
                      placeholder={t("issue_title_placeholder") || "Issue title"}
                    />

                    <Text style={styles.inlineInputLabel}>{t("description") || "Description"}</Text>
                    <TextInput
                      style={[styles.inlineInput, { height: 80, textAlignVertical: "top" }]}
                      multiline
                      value={description}
                      onChangeText={setDescription}
                      placeholder={t("issue_desc_placeholder") || "Issue description"}
                    />

                    <Text style={styles.inlineInputLabel}>{t("severity") || "Severity"}</Text>
                    <View style={styles.inlinePriorityGroup}>
                      {priorities.map((p) => (
                        <TouchableOpacity
                          key={p.label}
                          onPress={() => setPriority(p.label)}
                          style={[
                            styles.inlinePriorityChip,
                            priority === p.label && {
                              backgroundColor: p.color,
                              borderColor: p.color,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.inlinePriorityText,
                              priority === p.label && { color: COLORS.WHITE },
                            ]}
                          >
                            {t(p.label?.toLowerCase()) || p.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    <Text style={styles.inlineInputLabel}>{t("image") || "Image"}</Text>
                    <View style={styles.inlineImageRow}>
                      <TouchableOpacity style={styles.inlineAttachBtn} onPress={pickImage}>
                        <Feather name="camera" size={16} color={COLORS.PRIMARY} />
                        <Text style={styles.inlineAttachText}>{image ? (t("change_photo") || "Change Photo") : (t("add_photo") || "Add Photo")}</Text>
                      </TouchableOpacity>
                      {image && (
                        <View style={styles.inlinePreviewContainer}>
                          <Image
                            source={{ uri: image.startsWith('http') ? image : (image.startsWith('/') ? `${BASE_URL}${image}` : image) }}
                            style={styles.inlinePreviewImage}
                          />
                          <TouchableOpacity style={styles.inlineRemoveImage} onPress={() => setImage(null)}>
                            <Ionicons name="close-circle" size={20} color={COLORS.ERROR} />
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>

                    <View style={styles.inlineFormFooter}>
                      <TouchableOpacity style={styles.inlineCancelBtn} onPress={cancelEdit}>
                        <Text style={styles.inlineCancelBtnText}>{t("cancel") || "Cancel"}</Text>
                      </TouchableOpacity>

                      <TouchableOpacity style={styles.inlineSaveBtn} onPress={handleUpdate}>
                        <Text style={styles.inlineSaveBtnText}>{t("save") || "Save"}</Text>
                        <Ionicons name="checkmark" size={16} color={COLORS.WHITE} style={{ marginLeft: 4 }} />
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <>
                    {/* ISSUE DETAILS */}
                    <Text style={styles.issueTitle}>{item.title}</Text>
                    <Text style={styles.issueDesc}>{item.description}</Text>

                    {item.image && (
                      <Image
                        source={{ uri: item.image.startsWith('http') ? item.image : `${BASE_URL}${item.image}` }}
                        style={styles.issueImage}
                      />
                    )}

                    {/* STATUS BADGE */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10, marginBottom: 6 }}>
                      <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                      <Text style={{ fontSize: 13, fontWeight: '700', color: statusColor }}>
                        {formatLabel(item.status)}
                      </Text>
                    </View>

                    {/* OWNER RESPONSE */}
                    {item.owner_comment && (
                      <View style={styles.ownerResponseBox}>
                        <Text style={styles.ownerResponseTitle}>{t("owner_response") || "Owner Response"}:</Text>
                        <Text style={styles.ownerResponseText}>{item.owner_comment}</Text>
                      </View>
                    )}

                    {/* FOOTER */}
                    <View style={styles.issueFooter}>
                      <View
                        style={[
                          styles.severityBadge,
                          { backgroundColor: pData.bg },
                        ]}
                      >
                        <Text style={[styles.severityText, { color: pData.color }]}>
                          {t(item.severity?.toLowerCase() || "medium")} {t("severity_suffix") || "Severity"}
                        </Text>
                      </View>

                      <View style={styles.actionButtons}>
                        <TouchableOpacity
                          onPress={() => startEdit(item)}
                          style={styles.iconBtn}
                        >
                          <Feather
                            name="edit-2"
                            size={16}
                            color={COLORS.TEXT_SECONDARY}
                          />
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={() => deleteIssue(item.id)}
                          style={styles.iconBtn}
                        >
                          <Feather name="trash-2" size={16} color={COLORS.ERROR} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </>
                )}
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.BACKGROUND },
  scrollContent: { padding: 16, paddingBottom: 100 },

  // Header
  header: {
    backgroundColor: COLORS.WHITE,
    paddingHorizontal: 20,
    paddingVertical: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
  },
  headerLeftContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  headerRightActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  refreshBtn: {
    padding: 8,
    backgroundColor: COLORS.BLUE_LIGHT,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.TEXT_SECONDARY,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: COLORS.TEXT_PRIMARY,
    marginTop: 2,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.PRIMARY,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  addButtonText: {
    color: COLORS.WHITE,
    fontWeight: "700",
    fontSize: 14,
    marginLeft: 4,
  },

  // Dashboard Stats
  statsContainer: { flexDirection: "row", gap: 12, marginBottom: 24 },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.WHITE,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    elevation: 2,
  },
  statNumber: { fontSize: 24, fontWeight: "800", color: COLORS.TEXT_PRIMARY },
  statLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: COLORS.TEXT_SECONDARY,
    marginTop: 4,
    textTransform: "uppercase",
  },

  // Collapsible Form
  formCard: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    marginBottom: 24,
    elevation: 4,
  },
  formHeader: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.TEXT_SECONDARY,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: COLORS.BACKGROUND,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 16,
  },

  priorityGroup: { flexDirection: "row", gap: 10, marginBottom: 24 },
  priorityChip: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    alignItems: "center",
    backgroundColor: COLORS.BACKGROUND,
  },
  priorityText: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.TEXT_SECONDARY,
  },

  formFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  attachBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.CARD,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
  },
  attachText: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.PRIMARY,
    marginLeft: 6,
  },
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.PRIMARY_DARK,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  submitBtnText: { color: COLORS.WHITE, fontSize: 14, fontWeight: "700" },
  previewImage: { width: "100%", height: 140, borderRadius: 10, marginTop: 16 },

  // Filters & List Header
  listHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.TEXT_PRIMARY,
    marginRight: 12,
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3E8FF",
    borderWidth: 1,
    borderColor: "#E9D5FF",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  filterButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.PRIMARY,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalContent: {
    width: "100%",
    backgroundColor: COLORS.WHITE,
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 16,
  },
  modalOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 4,
  },
  modalOptionSelected: {
    backgroundColor: "#F3E8FF",
  },
  modalOptionText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.TEXT_SECONDARY,
  },
  modalOptionTextSelected: {
    color: COLORS.PRIMARY,
    fontWeight: "700",
  },

  // Empty State
  emptyState: {
    alignItems: "center",
    paddingVertical: 50,
    backgroundColor: COLORS.WHITE,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    borderStyle: "dashed",
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.TEXT_PRIMARY,
    marginTop: 12,
  },
  emptySub: { fontSize: 13, color: COLORS.TEXT_LIGHT, marginTop: 4 },

  // Issue Card
  issueCard: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    marginBottom: 16,
    elevation: 1,
  },
  issueTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  statusIndicator: { width: 8, height: 8, borderRadius: 4 },
  issueDate: { fontSize: 12, color: COLORS.TEXT_LIGHT, fontWeight: "600" },

  issueTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 8,
  },
  issueDesc: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    lineHeight: 20,
    marginBottom: 12,
  },
  issueImage: {
    width: "100%",
    height: 180,
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: COLORS.BACKGROUND,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  ownerResponseBox: {
    marginTop: 12,
    padding: 14,
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  ownerResponseTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 4,
  },
  ownerResponseText: {
    fontSize: 14,
    color: "#475569",
    lineHeight: 20,
  },
  issueFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: COLORS.DIVIDER,
    paddingTop: 16,
  },

  severityBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  severityText: { fontSize: 11, fontWeight: "800", textTransform: "uppercase" },

  actionButtons: { flexDirection: "row", gap: 16 },
  iconBtn: { padding: 4 },

  // Inline Form Styles
  inlineForm: {
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginTop: 8,
  },
  inlineFormHeader: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 12,
  },
  inlineInputLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.TEXT_SECONDARY,
    marginBottom: 4,
    textTransform: "uppercase",
  },
  inlineInput: {
    backgroundColor: COLORS.WHITE,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 12,
  },
  inlinePriorityGroup: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  inlinePriorityChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    alignItems: "center",
    backgroundColor: COLORS.WHITE,
  },
  inlinePriorityText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.TEXT_SECONDARY,
  },
  inlineFormFooter: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
  },
  inlineCancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: COLORS.DIVIDER,
  },
  inlineCancelBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.TEXT_SECONDARY,
  },
  inlineSaveBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: COLORS.PRIMARY,
  },
  inlineSaveBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.WHITE,
  },
  inlineImageRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 12,
  },
  inlineAttachBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.WHITE,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },
  inlineAttachText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.PRIMARY,
    marginLeft: 6,
  },
  inlinePreviewContainer: {
    position: "relative",
  },
  inlinePreviewImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },
  inlineRemoveImage: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: COLORS.WHITE,
    borderRadius: 10,
  },
});