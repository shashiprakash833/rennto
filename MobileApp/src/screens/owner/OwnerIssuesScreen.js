import COLORS from "@/src/theme/colors";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import BASE_URL, { fetchWithAuth } from '../../config/Api';
import { useLanguage } from "../../utils/LanguageContext";
import { useMaintenance } from "../../context/MaintenanceContext";
import { useNetwork } from "../../hooks/useNetwork";
import OfflineView from "../../components/OfflineView";

import {
  Animated,
  Dimensions,
  FlatList,
  Image,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  GestureHandlerRootView,
  PanGestureHandler,
  PinchGestureHandler,
  State,
} from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";

/* ---------- STATUS COLORS ---------- */

const STATUS_COLORS = {
  Pending: COLORS.WARNING,
  "In Progress": COLORS.INFO,
  Completed: COLORS.SUCCESS,
};

/* ---------- DYNAMIC ALLOCATION HELPERS ---------- */

const getRoomLabel = (propertyType) => {
  if (!propertyType) return "Room";
  const pt = String(propertyType).toLowerCase();
  if (pt === "apartment") return "Flat";
  if (pt === "commercial") return "Section";
  return "Room";
};

const formatValue = (val) => {
  if (val === undefined || val === null || val === "" || val === "N/A" || val === "None") {
    return "-";
  }
  return String(val);
};

/* ---------- SAMPLE DATA ---------- */

const initialIssues = [];

export default function OwnerIssues() {
  const { isConnected } = useNetwork();
  const { maintenanceMode } = useMaintenance();
  const isReadOnly = maintenanceMode === "READ_ONLY";
  const { t } = useLanguage();
  const navigation = useNavigation();
  const [search, setSearch] = useState("");
  const [issues, setIssues] = useState([]);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [localStatus, setLocalStatus] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [ownerComment, setOwnerComment] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [viewerVisible, setViewerVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchOwnerIssues = async (searchQuery = "", showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const ownerPhone = await AsyncStorage.getItem("ownerPhone");
      const url = `${BASE_URL}/api/owner-issues/${encodeURIComponent(ownerPhone)}/`;
      const response = await fetchWithAuth(url);
      const data = await response.json();
      setIssues(Array.isArray(data) ? data : []);
    } catch (error) {
      console.log("Owner Fetch Error:", error);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchOwnerIssues("", true);
    const interval = setInterval(() => {
      fetchOwnerIssues("", false);
    }, 5000);

    return () => clearInterval(interval);
  }, [isConnected]);

  const handleSearch = (text) => {
    setSearch(text);
    // Instant local filtering without backend fetch
  };

  /* ---------- ZOOM & PAN LOGIC ---------- */
  const baseScale = useRef(new Animated.Value(1)).current;
  const pinchScale = useRef(new Animated.Value(1)).current;
  const scale = Animated.multiply(baseScale, pinchScale);
  const lastScale = useRef(1);

  const pinchRef = useRef(null);
  const panRef = useRef(null);

  const currentScale = useRef(1);
  useEffect(() => {
    const id = scale.addListener(({ value }) => {
      currentScale.current = value;
    });
    return () => scale.removeListener(id);
  }, [scale]);

  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const lastOffset = useRef({ x: 0, y: 0 });

  const onPinchEvent = Animated.event(
    [{ nativeEvent: { scale: pinchScale } }],
    { useNativeDriver: true },
  );

  const onPinchStateChange = (event) => {
    if (event.nativeEvent.oldState === State.ACTIVE) {
      let nextScale = lastScale.current * event.nativeEvent.scale;
      if (nextScale < 1) nextScale = 1;
      if (nextScale > 3) nextScale = 3;

      lastScale.current = nextScale;
      baseScale.setValue(nextScale);
      pinchScale.setValue(1);

      const { width, height } = Dimensions.get("window");
      const maxTranslateX = (width * (nextScale - 1)) / 2;
      const maxTranslateY = (height * 0.8 * (nextScale - 1)) / 2;

      let currentX = lastOffset.current.x;
      let currentY = lastOffset.current.y;

      if (nextScale === 1) {
        currentX = 0;
        currentY = 0;
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
          bounciness: 0,
        }).start();
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          bounciness: 0,
        }).start();
      } else {
        currentX = Math.min(Math.max(currentX, -maxTranslateX), maxTranslateX);
        currentY = Math.min(Math.max(currentY, -maxTranslateY), maxTranslateY);
        translateX.setOffset(currentX);
        translateY.setOffset(currentY);
        translateX.setValue(0);
        translateY.setValue(0);
      }

      lastOffset.current = { x: currentX, y: currentY };
    }
  };

  const onPanEvent = (event) => {
    const { translationX, translationY } = event.nativeEvent;
    const { width, height } = Dimensions.get("window");
    const s = currentScale.current;
    const maxTranslateX = (width * (s - 1)) / 2;
    const maxTranslateY = (height * 0.8 * (s - 1)) / 2;

    let nextX = lastOffset.current.x + translationX;
    let nextY = lastOffset.current.y + translationY;

    if (nextX > maxTranslateX) nextX = maxTranslateX;
    if (nextX < -maxTranslateX) nextX = -maxTranslateX;
    if (nextY > maxTranslateY) nextY = maxTranslateY;
    if (nextY < -maxTranslateY) nextY = -maxTranslateY;

    translateX.setValue(nextX - lastOffset.current.x);
    translateY.setValue(nextY - lastOffset.current.y);
  };

  const onPanStateChange = (event) => {
    if (event.nativeEvent.state === State.END) {
      const { translationX, translationY } = event.nativeEvent;
      const { width, height } = Dimensions.get("window");

      const s = currentScale.current;
      const maxTranslateX = (width * (s - 1)) / 2;
      const maxTranslateY = (height * 0.8 * (s - 1)) / 2;

      let nextX = lastOffset.current.x + translationX;
      let nextY = lastOffset.current.y + translationY;

      nextX = Math.min(Math.max(nextX, -maxTranslateX), maxTranslateX);
      nextY = Math.min(Math.max(nextY, -maxTranslateY), maxTranslateY);

      lastOffset.current.x = nextX;
      lastOffset.current.y = nextY;

      translateX.setOffset(nextX);
      translateY.setOffset(nextY);
      translateX.setValue(0);
      translateY.setValue(0);
    }
  };

  const closeViewer = () => {
    setViewerVisible(false);
    lastScale.current = 1;
    baseScale.setValue(1);
    pinchScale.setValue(1);
    translateX.setOffset(0);
    translateY.setOffset(0);
    translateX.setValue(0);
    translateY.setValue(0);
    lastOffset.current = { x: 0, y: 0 };
  };

  const openDetails = (item) => {
    setSelectedIssue(item);
    setLocalStatus(item.status);
    setOwnerComment(item.owner_comment || "");
    setModalVisible(true);
  };

  const updateStatus = async (status) => {
    if (!selectedIssue) return;

    if (status === "Completed") {
      try {
        const response = await fetchWithAuth(
          `${BASE_URL}/api/update-issue-status/${selectedIssue.id}/`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status }),
          }
        );

        if (response.ok) {
          setIssues((prev) =>
            prev.map((item) =>
              item.id === selectedIssue.id ? { ...item, status } : item,
            ),
          );
          setSelectedIssue({ ...selectedIssue, status });
          setLocalStatus(status);

          // Notify tenant immediately (fire and forget)
          fetchWithAuth(`${BASE_URL}/api/send-tenant-notification/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              tenantPhone: selectedIssue.tenant_phone,
              title: 'Issue Completed',
              message: `Hi ${selectedIssue.tenant_name}, your issue "${selectedIssue.title}" has been resolved.`,
              type: 'ISSUE_UPDATE'
            })
          }).catch(e => console.log("Notif error:", e));

          console.log("Issue marked as Completed and tenant notified.");
          setModalVisible(false);
        }
      } catch (error) {
        console.log("Update Status Error:", error);
      }
    } else {
      setLocalStatus(status);
    }
  };

  const handleUpdate = async () => {
    if (isReadOnly) {
      console.log("This action is temporarily unavailable during scheduled maintenance. You can continue to browse other parts of the application.");
      return;
    }
    if (!selectedIssue) return;

    if ((localStatus === "Pending" || localStatus === "In Progress") && !ownerComment.trim()) {
      console.log("A description/comment is mandatory for Pending or Processing status.");
      return;
    }

    try {
      if (localStatus !== selectedIssue.status) {
        await fetchWithAuth(
          `${BASE_URL}/api/update-issue-status/${selectedIssue.id}/`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: localStatus }),
          }
        );
      }

      const response = await fetchWithAuth(
        `${BASE_URL}/api/update-issue-comment/${selectedIssue.id}/`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ owner_comment: ownerComment }),
        }
      );

      if (response.ok) {
        setIssues((prev) =>
          prev.map((item) =>
            item.id === selectedIssue.id
              ? { ...item, status: localStatus, owner_comment: ownerComment }
              : item
          )
        );
        console.log("Issue updated successfully.");
        setModalVisible(false);
      } else {
        console.log("❌ ERROR RESPONSE");
      }
    } catch (error) {
      console.log("❌ FETCH ERROR:", error);
    }
  };

  /* ---------- FILTER & SORT LOGIC ---------- */

  const filteredIssues = issues
    .filter((item) => {
      const searchLower = search.toLowerCase();
      const matchesSearch =
        (item.title || "").toLowerCase().includes(searchLower) ||
        (item.tenant_name || "").toLowerCase().includes(searchLower) ||
        String(item.floor_no || "").toLowerCase().includes(searchLower) ||
        String(item.room_no || "").toLowerCase().includes(searchLower) ||
        (item.tenant_phone || "").toLowerCase().includes(searchLower) ||
        (item.description || "").toLowerCase().includes(searchLower);

      const matchesStatus =
        activeFilter === "All" || item.status === activeFilter;

      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      // Completed issues go to the bottom
      if (a.status === "Completed" && b.status !== "Completed") return 1;
      if (a.status !== "Completed" && b.status === "Completed") return -1;
      // Maintain chronological order for others
      return b.id - a.id;
    });

  if (isConnected === false && issues.length === 0) {
    return <OfflineView />;
  }
  return (
    <View style={{ flex: 1, backgroundColor: "#5F259F" }}>
      <SafeAreaView style={{ flex: 1, backgroundColor: "#F5F5F7" }}
        edges={['left', 'right', 'bottom']}>


        <StatusBar barStyle="light-content"
          backgroundColor="transparent"
          translucent={true} />
        <LinearGradient
          colors={['#5F259F', '#7C3AED', '#8B5CF6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <View style={styles.headerLeftContainer}>
            <View>
              <Text style={styles.headerTitle}>{t("issues")}</Text>
              <Text style={styles.headerSubtitle}>{t("manage_requests")}</Text>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.summaryRow}>
          {["All", "Pending", "In Progress", "Completed"].map((status) => {
            const isActive = activeFilter === status;
            const color =
              status === "All" ? COLORS.PRIMARY : STATUS_COLORS[status];
            const count =
              status === "All"
                ? issues.length
                : issues.filter((i) => i.status === status).length;

            const label = status === "All" ? (t('all') || "All") :
              status === "Pending" ? (t('pending_count') || "Pending") :
                status === "In Progress" ? (t('progress') || "Progress") :
                  (t('completed') || "Completed");

            return (
              <TouchableOpacity
                key={status}
                style={{ flex: 1 }}
                onPress={() => setActiveFilter(status)}
              >
                <SummaryCard
                  label={label}
                  count={count}
                  color={color}
                  isActive={isActive}
                />
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.sectionHeader}>{t('history') || 'History'}</Text>

        <TextInput
          placeholder={t('search by name')}
          placeholderTextColor={COLORS.TEXT_LIGHT}
          style={styles.search}
          value={search}
          onChangeText={handleSearch}
        />

        {filteredIssues.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="search-outline" size={48} color={COLORS.TEXT_LIGHT} />
            <Text style={styles.emptyText}>{t('No Issues Found') || 'No Issues Found'}</Text>
          </View>
        ) : (
          <FlatList
            data={filteredIssues}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
            renderItem={({ item }) => (
              <TouchableOpacity onPress={() => openDetails(item)}>
                <View style={styles.card}>
                  <View style={styles.cardHeaderRow}>
                    <Text style={styles.title}>{item.title}</Text>
                    {item.image && (
                      <Ionicons name="image" size={18} color={COLORS.PRIMARY} />
                    )}
                  </View>
                  <Text style={styles.sub}>
                    {item.tenant_name}
                    {(!item.floor_no || item.floor_no === "N/A" || item.floor_no === "None") ? (
                      " • No active room allocation"
                    ) : (
                      <>
                        {item.property_name && item.property_name !== "N/A" && item.property_name !== "None" && ` • ${item.property_name}`}
                        {` • Floor: ${item.floor_no}`}
                        {` • ${getRoomLabel(item.property_type)}: ${item.room_no}`}
                        {item.property_type === 'hostel' && item.bed_no && item.bed_no !== "N/A" && item.bed_no !== "None" && ` • Bed: ${item.bed_no}`}
                      </>
                    )}
                  </Text>

                  <View style={styles.rowBetween}>
                    <StatusBadge status={item.status} />
                    <Text style={styles.date}>
                      {new Date(item.date).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            )}
          />
        )}

        <Modal visible={modalVisible} animationType="slide">
          {selectedIssue && (
            <View style={{ flex: 1, backgroundColor: COLORS.BACKGROUND }}>
              <View style={styles.modalHeaderClose}>
                <Text style={styles.modalTitleHeader}>{t('issue details') || 'Issue Details'}</Text>
                <TouchableOpacity
                  onPress={() => setModalVisible(false)}
                  style={styles.closeModalBtn}
                >
                  <Ionicons name="close-circle" size={32} color={COLORS.TEXT_SECONDARY} />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.modal}>
                <Text style={styles.modalTitle}>{selectedIssue.title}</Text>

                <View style={styles.detailCard}>
                  <Detail label={t('tenant')} value={selectedIssue.tenant_name} />
                  {selectedIssue.property_name && selectedIssue.property_name !== "N/A" && selectedIssue.property_name !== "None" && (
                    <Detail label="Property Name" value={selectedIssue.property_name} />
                  )}
                  {(!selectedIssue.floor_no || selectedIssue.floor_no === "N/A" || selectedIssue.floor_no === "None") ? (
                    <Detail label="Allocation Status" value="No Active Room Allocation" />
                  ) : (
                    <>
                      <Detail label="Floor Number" value={String(selectedIssue.floor_no)} />
                      <Detail label={`${getRoomLabel(selectedIssue.property_type)} Number`} value={String(selectedIssue.room_no)} />
                      {selectedIssue.property_type === 'hostel' && selectedIssue.bed_no && selectedIssue.bed_no !== "N/A" && selectedIssue.bed_no !== "None" && (
                        <Detail label="Bed Number" value={String(selectedIssue.bed_no)} />
                      )}
                    </>
                  )}
                  <Detail label={t('phone_number')} value={selectedIssue.tenant_phone} />
                  <Detail label={t('date') || 'Date'} value={new Date(selectedIssue.date).toLocaleString()} />
                  <Detail label="Severity" value={selectedIssue.severity} />
                  <Detail label={t('status')} value={selectedIssue.status} />
                </View>

                <View style={styles.descCard}>
                  <Text style={styles.descTitle}>{t('Description')}</Text>
                  <Text style={styles.descText}>{selectedIssue.description}</Text>
                </View>

                {selectedIssue.image && (
                  <View style={styles.detailCard}>
                    <Text style={styles.updateTitle}>Attachment</Text>
                    <TouchableOpacity
                      onPress={() => {
                        setSelectedImage(selectedIssue.image.startsWith('http') ? selectedIssue.image : `${BASE_URL}${selectedIssue.image}`);
                        setViewerVisible(true);
                      }}
                      style={{ position: 'relative' }}
                    >
                      <Image
                        source={{ uri: selectedIssue.image.startsWith('http') ? selectedIssue.image : `${BASE_URL}${selectedIssue.image}` }}
                        style={{ width: '100%', height: 200, borderRadius: 12 }}
                        resizeMode="cover"
                      />
                      <View style={{ position: 'absolute', right: 10, bottom: 10, backgroundColor: 'rgba(0,0,0,0.5)', padding: 4, borderRadius: 10 }}>
                        <Ionicons name="expand" size={20} color="#FFF" />
                      </View>
                    </TouchableOpacity>
                  </View>
                )}

                <View style={styles.detailCard}>
                  <Text style={styles.updateTitle}>{t('Update Status')}</Text>
                  <View style={styles.statusRow}>
                    {["Pending", "In Progress", "Completed"].map((status) => {
                      const isSelected = localStatus === status;
                      const color = STATUS_COLORS[status];

                      const label = status === "Pending" ? t('pending count') :
                        status === "In Progress" ? t('in progress') :
                          t('completed');

                      return (
                        <TouchableOpacity
                          key={status}
                          onPress={() => updateStatus(status)}
                          style={[
                            styles.statusBtn,
                            {
                              borderColor: color,
                              backgroundColor: isSelected ? color : COLORS.WHITE,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.statusText,
                              { color: isSelected ? COLORS.WHITE : color },
                            ]}
                          >
                            {label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                <View style={styles.detailCard}>
                  <Text style={styles.updateTitle}>Owner Comment</Text>

                  <TextInput
                    placeholder="Write a comment for tenant..."
                    placeholderTextColor={COLORS.TEXT_LIGHT}
                    multiline
                    value={ownerComment}
                    onChangeText={setOwnerComment}
                    style={styles.commentInput}
                  />
                </View>

                <View style={{ flexDirection: 'row', gap: 10, marginBottom: 40 }}>
                  <TouchableOpacity style={[styles.closeBtn, { flex: 1, backgroundColor: '#666' }]} onPress={() => setModalVisible(false)}>
                    <Text style={styles.updateBtnText}>Close</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.closeBtn, { flex: 1 }, isReadOnly && { opacity: 0.5 }]}
                    onPress={handleUpdate}
                    disabled={isReadOnly}
                  >
                    <Text style={styles.updateBtnText}>
                      {isReadOnly ? "Unavailable" : "Save Updates"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          )}
        </Modal>
        {/* FULL IMAGE VIEWER MODAL */}
        <Modal visible={viewerVisible} transparent animationType="fade">
          <GestureHandlerRootView style={{ flex: 1 }}>
            <View style={styles.viewerBackground}>
              <TouchableOpacity
                style={styles.viewerClose}
                onPress={closeViewer}
                activeOpacity={0.7}
              >
                <Text style={styles.viewerCloseText}>✕ Close</Text>
              </TouchableOpacity>
              {selectedImage && (
                <PanGestureHandler
                  ref={panRef}
                  simultaneousHandlers={pinchRef}
                  onGestureEvent={onPanEvent}
                  onHandlerStateChange={onPanStateChange}
                >
                  <Animated.View
                    style={{
                      width: "100%",
                      height: "80%",
                      overflow: "hidden",
                      backgroundColor: "#000",
                      borderRadius: 8,
                    }}
                  >
                    <PinchGestureHandler
                      ref={pinchRef}
                      simultaneousHandlers={panRef}
                      onGestureEvent={onPinchEvent}
                      onHandlerStateChange={onPinchStateChange}
                    >
                      <Animated.View
                        collapsable={false}
                        style={{
                          width: "100%",
                          height: "100%",
                          justifyContent: "center",
                          alignItems: "center",
                        }}
                      >
                        <Animated.Image
                          source={{ uri: selectedImage }}
                          style={[
                            styles.fullImage,
                            {
                              transform: [
                                { scale: scale },
                                { translateX: translateX },
                                { translateY: translateY },
                              ],
                            },
                          ]}
                          resizeMode="contain"
                        />
                      </Animated.View>
                    </PinchGestureHandler>
                  </Animated.View>
                </PanGestureHandler>
              )}
            </View>
          </GestureHandlerRootView>
        </Modal>
      </SafeAreaView>
    </View>
  );
}

/* ---------- COMPONENTS ---------- */

const StatusBadge = ({ status }) => {
  const color = STATUS_COLORS[status];
  return (
    <View
      style={[
        styles.statusBadge,
        {
          backgroundColor: `${color}20`,
          borderColor: color,
        },
      ]}
    >
      <Text style={[styles.badgeText, { color }]}>{status}</Text>
    </View>
  );
};

const Detail = ({ label, value }) => (
  <View style={styles.detailRow}>
    <Text style={styles.label}>{label}</Text>
    <Text style={styles.value}>{value}</Text>
  </View>
);

const SummaryCard = ({ label, count, color, isActive }) => (
  <View
    style={[
      styles.summaryCard,
      {
        borderColor: color,
        borderWidth: isActive ? 2 : 1.5,
        backgroundColor: isActive ? color : `${color}22`,
      },
    ]}
  >
    <Text
      style={[
        styles.summaryCount,
        { color: isActive ? "#FFF" : color },
      ]}
    >
      {count}
    </Text>
    <Text
      style={[
        styles.summaryLabel,
        { color: isActive ? "#FFF" : color },
      ]}
      numberOfLines={1}
      adjustsFontSizeToFit
    >
      {label}
    </Text>
  </View>
);

/* ---------- STYLES ---------- */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },

  header: {
    paddingHorizontal: 20,
    height: 145,
    paddingTop: 45,
    paddingBottom: 30,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    marginBottom: 18,
    shadowColor: "#6D28D9",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 8,
  },


  headerLeftContainer: {
    flexDirection: "row",
    alignItems: "center",
  },

  headerTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 0.3,
  },

  headerSubtitle: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.8)",
    fontWeight: "600",
    marginTop: 3,
  },

  backButton: {
    marginRight: 12,
    padding: 4,
  },

  refreshBtn: {
    padding: 8,
    backgroundColor: COLORS.BLUE_LIGHT,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },

  pageTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: COLORS.TEXT_PRIMARY,
  },

  sectionHeader: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 10,
    marginTop: 4,
    color: COLORS.TEXT_PRIMARY,
    paddingHorizontal: 16,
  },

  search: {
    backgroundColor: COLORS.WHITE,
    padding: 14,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    marginHorizontal: 16,
  },

  card: {
    backgroundColor: COLORS.WHITE,
    padding: 20,
    borderRadius: 20,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    minHeight: 110,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },

  title: {
    fontSize: 17,
    fontWeight: "700",
    color: COLORS.TEXT_PRIMARY,
    flex: 1,
    marginRight: 8,
  },

  sub: {
    fontSize: 13,
    color: COLORS.TEXT_SECONDARY,
    marginTop: 6,
    marginBottom: 10,
    lineHeight: 19,
  },

  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },

  date: {
    fontSize: 12,
    color: COLORS.TEXT_LIGHT,
    fontWeight: "500",
  },

  statusBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },

  badgeText: {
    fontSize: 12,
    fontWeight: "600",
  },

  modal: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
    padding: 20,
  },

  modalTitle: {
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 18,
    color: COLORS.TEXT_PRIMARY,
  },

  modalHeaderClose: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: COLORS.WHITE,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
  },

  modalTitleHeader: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.TEXT_PRIMARY,
  },

  closeModalBtn: {
    padding: 2,
  },

  detailCard: {
    backgroundColor: COLORS.WHITE,
    padding: 22,
    borderRadius: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },

  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 14,
  },

  label: {
    fontSize: 13,
    color: COLORS.TEXT_SECONDARY,
    fontWeight: "500",
  },

  value: {
    fontSize: 14,
    color: COLORS.TEXT_PRIMARY,
    fontWeight: "600",
  },

  divider: {
    height: 1,
    backgroundColor: COLORS.DIVIDER,
    marginVertical: 10,
  },

  descCard: {
    backgroundColor: COLORS.WHITE,
    padding: 20,
    borderRadius: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },

  descTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 8,
    color: COLORS.TEXT_PRIMARY,
  },

  descText: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    lineHeight: 22,
  },

  updateTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 14,
    color: COLORS.TEXT_PRIMARY,
  },

  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  statusBtn: {
    flex: 1,
    borderWidth: 1.5,
    paddingVertical: 12,
    borderRadius: 16,
    alignItems: "center",
    marginHorizontal: 4,
  },

  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },

  commentInput: {
    backgroundColor: COLORS.CARD,
    borderRadius: 16,
    padding: 14,
    minHeight: 90,
    textAlignVertical: "top",
    fontSize: 12,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },

  closeBtn: {
    backgroundColor: COLORS.PRIMARY,
    padding: 16,
    borderRadius: 18,
    alignItems: "center",
    marginTop: 10,
    marginBottom: 90,
  },

  updateBtnText: {
    color: COLORS.WHITE,
    fontWeight: "700",
    fontSize: 16,
  },

  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 47,
    paddingHorizontal: 12,
    gap: 8,
  },

  summaryCard: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 4,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 72,
  },

  summaryCount: {
    fontSize: 26,
    fontWeight: "800",
    marginBottom: 4,
  },

  summaryLabel: {
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },

  /* IMAGE GALLERY STYLES */
  imageGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 8,
  },
  thumbnail: {
    width: 80,
    height: 80,
    borderRadius: 12,
    marginRight: 10,
    marginBottom: 10,
  },
  viewerBackground: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  fullImage: {
    width: "100%",
    height: "80%",
  },
  viewerClose: {
    position: "absolute",
    top: 30,
    right: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  viewerCloseText: {
    color: COLORS.WHITE,
    fontWeight: "700",
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.TEXT_LIGHT,
    marginTop: 12,
    fontWeight: '600',
  },
});