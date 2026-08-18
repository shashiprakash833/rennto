import React, { useEffect, useMemo, useState } from "react";
import { FaEye } from "react-icons/fa";
import BASE_URL, { fetchWithAuth } from "../config/Api";

function ActivityTable() {
  const [owners, setOwners] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [rowsToShow, setRowsToShow] = useState("3");

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
      const result = await response.json();

      if (response.ok && result?.data) {
        const formattedData = result.data.map((item, index) => ({
          id: item.id || index + 1,
          name: item.owner_name || "No Name",
          phone: item.phone || "N/A",
          phone: item.phone || "N/A",
          property: item.property_type || "N/A",
          status: item.status || "pending",
          date_time: formatDateTime(item.date),
        }));

        setOwners(formattedData);
      } else {
        setOwners([]);
        setError(result?.error || "Failed to fetch owner data");
      }
    } catch (err) {
      console.error("Fetch owners error:", err);
      setOwners([]);
      setError(err.message === "Failed to fetch" ? "Server not reachable" : err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOwners();
  }, []);

  const visibleOwners = useMemo(() => {
    if (rowsToShow === "all") {
      return owners;
    }
    return owners.slice(0, Number(rowsToShow));
  }, [owners, rowsToShow]);

  return (
    <div className="tableBox">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "16px",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <h2 className="recentactivity" style={{ margin: 0 }}>
          Recent Activity
        </h2>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            background: "#f8fafc",
            border: "1px solid #e2e8f0",
            borderRadius: "10px",
            padding: "8px 12px",
          }}
        >
          <FaEye style={{ color: "#4f46e5" }} />
          <label htmlFor="showRows" style={{ fontWeight: "500" }}>

          </label>
          <select
            id="showRows"
            value={rowsToShow}
            onChange={(e) => setRowsToShow(e.target.value)}
            style={{
              border: "1px solid #cbd5e1",
              borderRadius: "6px",
              padding: "6px 10px",
              outline: "none",
              cursor: "pointer",
            }}
          >
            <option value="3">3</option>
            <option value="5">5</option>
            <option value="10">10</option>
            <option value="15">15</option>
            <option value="all">All</option>
          </select>
        </div>
      </div>

      {loading && <p>Loading activity...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {!loading && !error && (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead className="tableHeader">
            <tr>
              <th>Owner</th>
              <th>Property</th>
              <th>phone</th>
              <th>Date & Time</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            {visibleOwners.length > 0 ? (
              visibleOwners.map((item) => (
                <tr key={item.id}>
                  <td>{item.name}</td>
                  <td style={{ textTransform: "capitalize" }}>{item.property}</td>
                  <td>{item.phone}</td>
                  <td>{item.date_time}</td>
                  <td>
                    <span className={`status ${item.status.toLowerCase()}`}>
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" style={{ textAlign: "center", padding: "20px" }}>
                  No recent activity found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}

      {!loading && !error && owners.length > 0 && (
        <p style={{ marginTop: "12px", color: "#64748b", fontSize: "14px" }}>
          Showing {visibleOwners.length} of {owners.length} rows
        </p>
      )}
    </div>
  );
}

export default ActivityTable;
