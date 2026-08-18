import React, { useEffect, useState, useRef } from "react";
import { useLocation } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import OwnerDetailsModal from "../components/OwnerDetailsModal";
import BASE_URL, { fetchWithAuth } from "../config/Api";

function Properties() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [properties, setProperties] = useState([]);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [activeFilter, setActiveFilter] = useState("All");
  const [selectedImage, setSelectedImage] = useState(null);
  const [highlightEmail, setHighlightEmail] = useState(null);
  const highlightRef = useRef(null);
  const location = useLocation();

  useEffect(() => {
    fetchBuildings();
  }, []);

  // Read highlightEmail from search navigation
  useEffect(() => {
    if (location.state?.highlightEmail) {
      setHighlightEmail(location.state.highlightEmail);
      setTimeout(() => setHighlightEmail(null), 3000);
    }
  }, [location.state]);

  // Auto-scroll to highlighted card
  useEffect(() => {
    if (highlightEmail && highlightRef.current) {
      highlightRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [highlightEmail, properties]);

  const fetchBuildings = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetchWithAuth(
        `${BASE_URL}/api/get_all_property_basic_details/`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch properties");
      }

      const result = await response.json();

      const formattedProperties = (result.data || []).map((item, index) => ({
        id: index + 1,
        phone: item.phone,
        property_type: item.property_type,
        image: item.image,
        name: item.name,
        location: item.location,
        owner_name: item.owner_name,
      }));

      setProperties(formattedProperties);
    } catch (err) {
      setError(err.message === "Failed to fetch" ? "Server not reachable" : err.message);
      console.error("Fetch properties error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseDetails = () => {
    setSelectedEmail(null);
  };

  const filteredProperties = properties.filter(prop => {
    if (activeFilter === 'All') return true;
    if (activeFilter === 'Hostels') return prop.property_type?.toLowerCase() === 'hostel';
    if (activeFilter === 'Apartments') return prop.property_type?.toLowerCase() === 'apartment';
    if (activeFilter === 'Commercial') return prop.property_type?.toLowerCase() === 'commercial';
    return true;
  });

  return (
    <div className="dashboard">
      <Sidebar />

      <div className="main" style={{ padding: 0 }}>
        <Header />

        <div
          className="properties-page"
          style={{ padding: "30px", minHeight: "auto", background: "transparent" }}
        >
          <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h1 className="page-title" style={{ color: "#4c1d95", fontSize: "28px", fontWeight: "700", marginBottom: "4px" }}>Properties</h1>
              <p className="page-subtitle" style={{ color: "#6b7280", margin: 0 }}>Manage property listings</p>
            </div>
            <div className="filter-buttons" style={{ display: 'flex', gap: '10px' }}>
              {['All', 'Hostels', 'Apartments', 'Commercial'].map(filter => (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  style={{
                    padding: "10px 18px",
                    borderRadius: "10px",
                    border: "1px solid #e5e7eb",
                    backgroundColor: activeFilter === filter ? "#4c1d95" : "#fff",
                    color: activeFilter === filter ? "#fff" : "#374151",
                    cursor: "pointer",
                    fontWeight: "600",
                    transition: "all 0.2s",
                    boxShadow: activeFilter === filter ? "0 4px 12px rgba(76, 29, 149, 0.2)" : "none"
                  }}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          {loading && (
            <div style={{ padding: "20px", fontSize: "16px" }}>
              Loading properties...
            </div>
          )}

          {error && (
            <div style={{ padding: "20px", color: "red", fontSize: "16px" }}>
              {error}
            </div>
          )}

          {!loading && !error && filteredProperties.length === 0 && (
            <div style={{ padding: "20px", fontSize: "16px" }}>
              No properties found matching the filter.
            </div>
          )}

          {!loading && !error && filteredProperties.length > 0 && (
            <div className="properties-grid">
              {filteredProperties.map((property) => {
                const isHighlighted =
                  highlightEmail &&
                  property.phone?.toLowerCase() === highlightEmail.toLowerCase();
                return (
                  <div
                    key={property.id}
                    ref={isHighlighted ? highlightRef : null}
                    className="property-card"
                    onClick={() => setSelectedEmail(property.phone)}
                    style={{
                      overflow: "hidden",
                      cursor: "pointer",
                      ...(isHighlighted
                        ? {
                          outline: "2px solid #7c3aed",
                          boxShadow: "0 0 0 4px rgba(124,58,237,0.2), 0 8px 30px rgba(124,58,237,0.25)",
                          animation: "searchHighlight 0.6s ease",
                          transform: "translateY(-4px)",
                          transition: "transform 0.3s ease, box-shadow 0.3s ease",
                        }
                        : {}),
                    }}
                  >
                    <div
                      className="property-header"
                      style={{
                        height: "180px",
                        backgroundColor: "#f3f4f6",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {property.image ? (
                        <img
                          src={property.image}
                          alt={property.name}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            cursor: "pointer",
                            transition: "transform 0.3s"
                          }}
                          className="property-main-img"
                          onError={(e) => {
                            e.target.style.display = "none";
                          }}
                        />
                      ) : (
                        <span style={{ fontSize: "40px" }}>🏠</span>
                      )}
                    </div>

                    <div className="property-details">
                      <h3 className="property-name">{property.name}</h3>

                      <div className="property-info">
                        <div className="info-item">
                          <span className="info-icon">📍</span>
                          <span>{property.location}</span>
                        </div>

                        <div className="info-item">
                          <span className="info-icon">👤</span>
                          <span>{property.owner_name}</span>
                        </div>

                        <div className="info-item">
                          <span className="info-icon">🏢</span>
                          <span style={{ textTransform: "capitalize" }}>
                            {property.property_type}
                          </span>
                        </div>

                        <div className="info-item">
                          <span className="info-icon">✉️</span>
                          <span>{property.phone}</span>
                        </div>
                      </div>

                      <div className="property-footer" style={{ marginTop: "16px" }}>
                        <button
                          onClick={() => setSelectedEmail(property.phone)}
                          style={{
                            background: "#2563eb",
                            color: "#fff",
                            border: "none",
                            padding: "10px 16px",
                            borderRadius: "8px",
                            cursor: "pointer",
                            fontWeight: "600",
                          }}
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <OwnerDetailsModal
            phone={selectedEmail}
            onClose={handleCloseDetails}
          />

          {selectedImage && (
            <div
              style={{
                position: "fixed",
                inset: 0,
                backgroundColor: "rgba(0,0,0,0.85)",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                zIndex: 10000,
                padding: "40px",
                cursor: "pointer"
              }}
              onClick={() => setSelectedImage(null)}
            >
              <img
                src={selectedImage}
                alt="Selected"
                style={{
                  maxWidth: "90%",
                  maxHeight: "90%",
                  borderRadius: "12px",
                  boxShadow: "0 0 30px rgba(0,0,0,0.5)",
                  objectFit: "contain"
                }}
                onClick={(e) => e.stopPropagation()}
              />
              <button
                style={{
                  position: "absolute",
                  top: "20px",
                  right: "30px",
                  background: "none",
                  border: "none",
                  color: "white",
                  fontSize: "40px",
                  cursor: "pointer",
                  fontWeight: "bold"
                }}
                onClick={() => setSelectedImage(null)}
              >
                ×
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Properties;
