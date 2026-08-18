import React, { useEffect, useState, useRef } from "react";
import { useLocation } from "react-router-dom";
import { FaEye, FaCheck, FaUserSlash, FaCommentDots } from "react-icons/fa";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import OwnerDetailsModal from "../components/OwnerDetailsModal";
import { useNotifications } from "../context/NotificationContext";
import BASE_URL, { fetchWithAuth } from "../config/Api";

function Owners() {
  const [owners, setOwners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("All");
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [suspendingOwner, setSuspendingOwner] = useState(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [approvingOwner, setApprovingOwner] = useState(null);
  const [selectedReason, setSelectedReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [showReasonViewModal, setShowReasonViewModal] = useState(false);
  const [reasonData, setReasonData] = useState({ phone: "", reason: "" });
  const [highlightEmail, setHighlightEmail] = useState(null);
  const highlightRef = useRef(null);


  const predefinedReasons = [
    "Some required documents are missing. Complete your submission.",
    "Your account is temporarily suspended until verification is completed.",
    "Account suspended due to incomplete submission. Complete verification to continue using your account.",
    "Please upload valid ownership proof to proceed.",
  ];

  const location = useLocation();

  const { refreshTrigger } = useNotifications();

  useEffect(() => {
    fetchOwners();
  }, [refreshTrigger]);

  useEffect(() => {
    if (location.state) {
      // if (location.state.filter) setFilter(location.state.filter);
      if (location.state?.filter) {
        setFilter(location.state.filter);
      } else if (location.state?.tab) {
        setFilter(location.state.tab);
      }
      if (location.state.highlightEmail) {
        setHighlightEmail(location.state.highlightEmail);
        // Clear highlight after 3 seconds
        setTimeout(() => setHighlightEmail(null), 3000);
      }
    }
  }, [location.state]);

  // Auto-scroll to highlighted row once owners are loaded
  useEffect(() => {
    if (highlightEmail && highlightRef.current) {
      highlightRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [highlightEmail, owners]);

  const formatDateTime = (dateString) => {
    if (!dateString) return "N/A";

    const date = new Date(dateString);

    if (isNaN(date.getTime())) return "N/A";

    const datePart = date.toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const timePart = date.toLocaleTimeString("en-IN", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

    return `${datePart} - ${timePart}`;
  };

  const fetchOwners = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetchWithAuth(`${BASE_URL}/api/owner-admin/`);
      if (!response.ok) {
        // If response is not JSON (e.g., HTML error page), read as text for debugging
        const errorText = await response.text();
        console.error('Fetch owners non-JSON error response:', errorText);
        setError('Failed to fetch owner data');
        setOwners([]);
        setLoading(false);
        return;
      }
      const result = await response.json();

      if (result?.data) {
        const formattedData = result.data.map((item, index) => ({
          id: item.id || index + 1,
          name: item.owner_name || "No Name",
          phone: item.phone || "N/A",
          property: item.property_type || "N/A",
          status: item.status || "pending",
          reason: item.reason || item.suspension_reason || "",
          date_time: formatDateTime(item.date || item.created_at),
        }));

        setOwners(formattedData);
      } else {
        const errorMsg = result?.error || "Failed to fetch owner data";
        console.error('Fetch owners error:', errorMsg);
        setError(errorMsg);
        setOwners([]);
      }
    } catch (err) {
      console.error("Fetch owners error:", err);
      setOwners([]);
      setError(err.message === "Failed to fetch" ? "Server not reachable" : err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateOwnerStatus = async (ownerId, newStatus, reason = "") => {
    try {
      const response = await fetchWithAuth(
        `${BASE_URL}/api/owner-status/${ownerId}/`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: newStatus,
            suspension_reason: reason,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        alert(result?.error || "Failed to update status");
        return false;
      }

      setOwners((prev) =>
        prev.map((owner) =>
          owner.id === ownerId
            ? { ...owner, status: newStatus, reason: reason || owner.reason }
            : owner
        )
      );

      return true;
    } catch (err) {
      console.error("Status update error:", err);
      alert(err.message === "Failed to fetch" ? "Server not reachable" : "Error: " + err.message);
      return false;
    }
  };

  const saveSuspendReason = async (phone, reason) => {
    try {
      const response = await fetchWithAuth(`${BASE_URL}/api/suspension_reason/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone,
          reason,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        alert(result?.error || "Failed to save suspension reason");
        return false;
      }

      return true;
    } catch (err) {
      console.error("Save reason error:", err);
      alert(err.message === "Failed to fetch" ? "Server not reachable" : "Error: " + err.message);
      return false;
    }
  };

  const fetchSuspensionReason = async (phone) => {
    try {
      const response = await fetchWithAuth(
        `${BASE_URL}/api/get_suspension_reason/${encodeURIComponent(phone)}/`
      );

      const result = await response.json();

      if (!response.ok) {
        alert(result?.error || "Failed to fetch reason");
        return;
      }

      setReasonData({ phone: result.phone, reason: result.reason });
      setShowReasonViewModal(true);
    } catch (err) {
      console.error("Fetch reason error:", err);
      alert(err.message === "Failed to fetch" ? "Server not reachable" : "Error: " + err.message);
    }
  };

  const closeModal = () => {
    setSelectedEmail(null);
  };

  const handleApproveClick = (owner) => {
    setApprovingOwner(owner);
    setShowApproveModal(true);
  };

  const handleApproveConfirm = async () => {
    if (!approvingOwner) return;

    const ownerId = approvingOwner.id;
    setShowApproveModal(false);
    setApprovingOwner(null);

    const ok = await updateOwnerStatus(ownerId, "active");
    if (ok) {
      setSuccessMessage("Owner successfully approved!");
      setShowSuccessPopup(true);
      setTimeout(() => setShowSuccessPopup(false), 3000);
    }
  };

  const handleSuspendClick = (owner) => {
    setSuspendingOwner(owner);
    setShowSuspendModal(true);

    if (owner.reason && predefinedReasons.includes(owner.reason)) {
      setSelectedReason(owner.reason);
      setCustomReason("");
    } else if (owner.reason) {
      setSelectedReason("Other");
      setCustomReason(owner.reason);
    } else {
      setSelectedReason("");
      setCustomReason("");
    }
  };

  const handleSuspendSubmit = async () => {
    if (!suspendingOwner) {
      alert("No owner selected");
      return;
    }

    if (!selectedReason || (selectedReason === "Other" && !customReason.trim())) {
      console.log("Please select or enter a reason for suspension");
      return;
    }

    const finalReason =
      selectedReason === "Other" ? customReason.trim() : selectedReason;

    const ownerId = suspendingOwner.id;
    const ownerPhone = suspendingOwner.phone; // Still need phone for saveSuspendReason if it relies on phone

    setShowSuspendModal(false);
    setSelectedReason("");
    setCustomReason("");
    setSuspendingOwner(null);

    const reasonSaved = await saveSuspendReason(ownerId, finalReason);
    if (!reasonSaved) return;

    const statusUpdated = await updateOwnerStatus(ownerId, "suspend", finalReason);
    if (!statusUpdated) return;

    setSuccessMessage("Owner successfully suspended!");
    setShowSuccessPopup(true);
    setTimeout(() => {
      setShowSuccessPopup(false);
    }, 3000);
  };


  const filteredOwners = owners.filter((owner) => {
    if (filter === "All") return true;
    return owner.status.toLowerCase() === filter.toLowerCase();
  });

  return (
    <div className="dashboard">
      <Sidebar />

      <div className="main" style={{ padding: 0 }}>
        <Header />

        <div className="tenants-container" style={{ padding: "30px" }}>
          <div className="tenants-header">
            <div>
              <h2 style={{ color: "#4c1d95", marginBottom: "6px" }}>Owners</h2>
              <p style={{ color: "#6b7280", marginBottom: "20px" }}>
                Manage owners and properties
              </p>
            </div>

            <div style={filterContainer}>
              <button
                style={filter === "All" ? activeFilterBtn : filterBtn}
                onClick={() => setFilter("All")}
              >
                All
              </button>
              <button
                style={filter === "active" ? activeFilterBtn : filterBtn}
                onClick={() => setFilter("active")}
              >
                Active
              </button>
              <button
                style={filter === "pending" ? activeFilterBtn : filterBtn}
                onClick={() => setFilter("pending")}
              >
                Pending
              </button>
              <button
                style={filter === "suspend" ? activeFilterBtn : filterBtn}
                onClick={() => setFilter("suspend")}
              >
                Suspended
              </button>
            </div>
          </div>

          {loading ? (
            <p>Loading owners...</p>
          ) : error ? (
            <p style={{ color: "red" }}>{error}</p>
          ) : (
            <table className="owners-table" style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Owner</th>
                  <th style={thStyle}>Phone</th>
                  <th style={thStyle}>Property</th>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}>Date & Time</th>
                  <th style={{ ...thStyle, textAlign: "right" }}>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredOwners.length > 0 ? (
                  filteredOwners.map((owner) => {
                    const isHighlighted =
                      highlightEmail &&
                      owner.phone.toLowerCase() === highlightEmail.toLowerCase();
                    return (
                      <tr
                        key={owner.id}
                        ref={isHighlighted ? highlightRef : null}
                        style={
                          isHighlighted
                            ? {
                              background: "linear-gradient(90deg, #f5f3ff, #ede9fe)",
                              boxShadow: "0 0 0 2px #7c3aed inset",
                              animation: "searchHighlight 0.6s ease",
                              transition: "background 1s ease, box-shadow 1s ease",
                            }
                            : {}
                        }
                      >
                        <td style={tdStyle}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "10px",
                            }}
                          >
                            <div style={avatarStyle}>
                              {owner.name
                                ?.split(" ")
                                .map((n) => n[0])
                                .join("")
                                .toUpperCase()}
                            </div>
                            <span style={{ fontWeight: isHighlighted ? "700" : "400" }}>
                              {owner.name}
                            </span>
                          </div>
                        </td>

                        <td style={tdStyle}>{owner.phone}</td>
                        <td style={tdStyle}>{owner.property}</td>

                        <td style={tdStyle}>
                          <span style={getStatusBadgeStyle(owner.status)}>
                            {owner.status}
                          </span>
                        </td>

                        <td style={tdStyle}>{owner.date_time}</td>

                        <td style={{ ...tdStyle, textAlign: "right" }}>
                          <div
                            style={{
                              display: "flex",
                              gap: "8px",
                              justifyContent: "flex-end",
                              flexWrap: "wrap",
                            }}
                          >
                            {owner.status.toLowerCase() !== "active" && (
                              <button
                                style={approveBtn}
                                title="Approve"
                                onClick={() => handleApproveClick(owner)}
                              >
                                <FaCheck size={16} />
                              </button>

                            )}

                            {owner.status.toLowerCase() !== "suspend" && (
                              <button
                                style={suspendBtn}
                                title="Suspend"
                                onClick={() => handleSuspendClick(owner)}
                              >
                                <FaUserSlash size={16} />
                              </button>
                            )}

                            {owner.status.toLowerCase() === "suspend" && (
                              <button
                                style={reasonBtn}
                                title="View Suspension Reason"
                                onClick={() => fetchSuspensionReason(owner.id)}
                              >
                                <FaCommentDots size={16} />
                              </button>
                            )}

                            <button
                              style={viewBtn}
                              onClick={() => setSelectedEmail(owner.id)}
                              title="View Details"
                            >
                              <FaEye size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="7" style={{ textAlign: "center", padding: "20px" }}>
                      No owners found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        <OwnerDetailsModal ownerId={selectedEmail} onClose={closeModal} />

        {showSuspendModal && (
          <div style={modalOverlayStyle}>
            <div style={suspendModalContentStyle}>
              <div style={suspendModalHeaderStyle}>
                <h3 style={{ margin: 0, color: "#111827" }}>Suspend Owner</h3>
                <button
                  onClick={() => setShowSuspendModal(false)}
                  style={closeBtnStyle}
                >
                  ×
                </button>
              </div>

              <div style={suspendModalBodyStyle}>
                <p
                  style={{
                    marginBottom: "16px",
                    color: "#374151",
                    fontWeight: "600",
                  }}
                >
                  Select a reason for suspension:
                </p>

                {[...predefinedReasons, "Other"].map((reason, idx) => (
                  <label key={idx} style={reasonLabelStyle}>
                    <input
                      type="radio"
                      name="suspensionReason"
                      value={reason}
                      checked={selectedReason === reason}
                      onChange={(e) => setSelectedReason(e.target.value)}
                      style={{ marginRight: "10px" }}
                    />
                    {reason}
                  </label>
                ))}

                {selectedReason === "Other" && (
                  <textarea
                    placeholder="Write your reason here..."
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    style={customReasonTextAreaStyle}
                  />
                )}
              </div>

              <div style={suspendModalFooterStyle}>
                <button
                  onClick={() => setShowSuspendModal(false)}
                  style={cancelBtnStyle}
                >
                  Cancel
                </button>
                <button onClick={handleSuspendSubmit} style={submitSuspendBtnStyle}>
                  Submit
                </button>
              </div>
            </div>
          </div>
        )}

        {showApproveModal && (
          <div style={modalOverlayStyle}>
            <div style={suspendModalContentStyle}>
              <div style={suspendModalHeaderStyle}>
                <h3 style={{ margin: 0, color: "#111827" }}>Approve Owner</h3>
                <button
                  onClick={() => setShowApproveModal(false)}
                  style={closeBtnStyle}
                >
                  ×
                </button>
              </div>

              <div style={suspendModalBodyStyle}>
                <p
                  style={{
                    marginBottom: "16px",
                    color: "#374151",
                    fontWeight: "600",
                    textAlign: "center"
                  }}
                >
                  Are you sure you want to approve this owner?
                </p>
                <div style={{ textAlign: "center", color: "#6b7280" }}>
                  <p style={{ margin: 0 }}>Name: {approvingOwner?.name}</p>
                  <p style={{ margin: "4px 0 0 0" }}>phone: {approvingOwner?.phone}</p>
                </div>
              </div>

              <div style={suspendModalFooterStyle}>
                <button
                  onClick={() => setShowApproveModal(false)}
                  style={cancelBtnStyle}
                >
                  Cancel
                </button>
                <button
                  onClick={handleApproveConfirm}
                  style={{ ...submitSuspendBtnStyle, background: "#16a34a" }}
                >
                  Confirm Approval
                </button>
              </div>
            </div>
          </div>
        )}

        {showReasonViewModal && (
          <div style={modalOverlayStyle}>
            <div style={suspendModalContentStyle}>
              <div style={suspendModalHeaderStyle}>
                <h3 style={{ margin: 0, color: "#111827" }}>Suspension Reason</h3>
                <button
                  onClick={() => setShowReasonViewModal(false)}
                  style={closeBtnStyle}
                >
                  ×
                </button>
              </div>

              <div style={suspendModalBodyStyle}>
                <div style={{ marginBottom: "16px" }}>
                  <p
                    style={{
                      fontWeight: "600",
                      fontSize: "14px",
                      color: "#6b7280",
                      margin: "0 0 4px 0",
                    }}
                  >
                    Owner phone:
                  </p>
                  <p style={{ fontSize: "16px", color: "#111827", margin: 0 }}>
                    {reasonData.phone}
                  </p>
                </div>
                <div>
                  <p
                    style={{
                      fontWeight: "600",
                      fontSize: "14px",
                      color: "#6b7280",
                      margin: "0 0 4px 0",
                    }}
                  >
                    Reason:
                  </p>
                  <p
                    style={{
                      fontSize: "16px",
                      color: "#111827",
                      margin: 0,
                      lineHeight: "1.5",
                    }}
                  >
                    {reasonData.reason}
                  </p>
                </div>
              </div>

              <div style={suspendModalFooterStyle}>
                <button
                  onClick={() => setShowReasonViewModal(false)}
                  style={cancelBtnStyle}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {showSuccessPopup && (
          <div style={successPopupStyle}>
            <div style={{ marginRight: "10px", fontSize: "20px" }}>✅</div>
            <div>{successMessage}</div>
          </div>
        )}

      </div>
    </div>
  );
}

const modalOverlayStyle = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.5)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 1100,
};

const suspendModalContentStyle = {
  background: "white",
  width: "90%",
  maxWidth: "500px",
  borderRadius: "16px",
  boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
  overflow: "hidden",
};

const suspendModalHeaderStyle = {
  padding: "16px 20px",
  borderBottom: "1px solid #e5e7eb",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

const suspendModalBodyStyle = {
  padding: "20px",
};

const suspendModalFooterStyle = {
  padding: "16px 20px",
  borderTop: "1px solid #e5e7eb",
  display: "flex",
  justifyContent: "flex-end",
  gap: "12px",
};

const reasonLabelStyle = {
  display: "flex",
  alignItems: "flex-start",
  marginBottom: "12px",
  cursor: "pointer",
  color: "#4b5563",
  fontSize: "14px",
  lineHeight: "1.4",
};

const customReasonTextAreaStyle = {
  width: "100%",
  marginTop: "10px",
  padding: "10px",
  borderRadius: "8px",
  border: "1px solid #d1d5db",
  fontSize: "14px",
  minHeight: "80px",
  outline: "none",
};

const closeBtnStyle = {
  background: "none",
  border: "none",
  fontSize: "24px",
  cursor: "pointer",
  color: "#9ca3af",
};

const cancelBtnStyle = {
  padding: "8px 16px",
  borderRadius: "8px",
  border: "1px solid #e5e7eb",
  background: "white",
  color: "#374151",
  fontWeight: "600",
  cursor: "pointer",
};

const submitSuspendBtnStyle = {
  padding: "8px 16px",
  borderRadius: "8px",
  border: "none",
  background: "#dc2626",
  color: "white",
  fontWeight: "600",
  cursor: "pointer",
};

const successPopupStyle = {
  position: "fixed",
  bottom: "30px",
  right: "30px",
  background: "#16a34a",
  color: "white",
  padding: "16px 24px",
  borderRadius: "12px",
  boxShadow: "0 4px 15px rgba(0,0,0,0.15)",
  display: "flex",
  alignItems: "center",
  zIndex: 1200,
  animation: "slideInRight 0.3s ease-out",
};

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
  background: "#ffffff",
  borderRadius: "14px",
  overflow: "hidden",
  boxShadow: "0 6px 20px rgba(0,0,0,0.06)",
};

const thStyle = {
  textAlign: "left",
  padding: "14px",
  background: "#f3f4f6",
  color: "#111827",
  fontWeight: "700",
  borderBottom: "1px solid #e5e7eb",
};

const tdStyle = {
  padding: "14px",
  borderBottom: "1px solid #f1f5f9",
  color: "#374151",
  verticalAlign: "middle",
};

const avatarStyle = {
  width: "38px",
  height: "38px",
  borderRadius: "50%",
  background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
  color: "#fff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: "700",
  fontSize: "14px",
};

const approveBtn = {
  background: "#DCFCE7",
  color: "#15803D",
  border: "none",
  width: "32px",
  height: "32px",
  borderRadius: "50%",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  transition: "all 0.2s",
};

const suspendBtn = {
  background: "#FEE2E2",
  color: "#B91C1C",
  border: "none",
  width: "32px",
  height: "32px",
  borderRadius: "50%",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  transition: "all 0.2s",
};

const viewBtn = {
  background: "#F3E8FF",
  color: "#7E22CE",
  border: "none",
  width: "32px",
  height: "32px",
  borderRadius: "50%",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  transition: "all 0.2s",
};

const reasonBtn = {
  background: "#FEF3C7",
  color: "#B45309",
  border: "none",
  width: "32px",
  height: "32px",
  borderRadius: "50%",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  transition: "all 0.2s",
};

const filterContainer = {
  display: "flex",
  gap: "10px",
  marginBottom: "20px",
  flexWrap: "wrap",
};

const filterBtn = {
  padding: "8px 16px",
  borderRadius: "8px",
  border: "1px solid #e5e7eb",
  background: "#fff",
  color: "#374151",
  cursor: "pointer",
  fontWeight: "600",
  transition: "all 0.2s",
};

const activeFilterBtn = {
  ...filterBtn,
  background: "#4c1d95",
  color: "#fff",
  border: "1px solid #4c1d95",
};


const getStatusBadgeStyle = (status) => {
  const s = (status || "").toLowerCase();

  if (s === "active") {
    return {
      background: "#dcfce7",
      color: "#166534",
      padding: "6px 12px",
      borderRadius: "999px",
      fontSize: "12px",
      fontWeight: "700",
      textTransform: "capitalize",
    };
  }

  if (s === "pending") {
    return {
      background: "#fef3c7",
      color: "#92400e",
      padding: "6px 12px",
      borderRadius: "999px",
      fontSize: "12px",
      fontWeight: "700",
      textTransform: "capitalize",
    };
  }

  return {
    background: "#fee2e2",
    color: "#991b1b",
    padding: "6px 12px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "700",
    textTransform: "capitalize",
  };
};

export default Owners;
