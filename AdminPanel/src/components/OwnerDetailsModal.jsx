import React, { useEffect, useState } from "react";
import BASE_URL, { fetchWithAuth } from "../config/Api";


function OwnerDetailsModal({ ownerId, onClose }) {
  const [ownerDetails, setOwnerDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);



  useEffect(() => {
    if (!ownerId) return;

    const fetchOwnerDetails = async () => {
      try {
        setLoading(true);
        setError("");
        setOwnerDetails(null);

        const response = await fetchWithAuth(
          `${BASE_URL}/api/owner_data/${ownerId}/`
        );
        const result = await response.json();

        if (!response.ok) {
          setError(result?.error || "Failed to fetch owner details");
          return;
        }

        setOwnerDetails(result);
      } catch (err) {
        console.error("Owner details fetch error:", err);
        setError(err.message === "Failed to fetch" ? "Server not reachable" : err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchOwnerDetails();
  }, [ownerId]);

  if (!ownerId) return null;

  const renderLayout = () => {
    const layout = ownerDetails?.step3?.building_layout;

    if (!layout || layout.length === 0) {
      return <p style={{ color: "#6b7280" }}>No building layout available.</p>;
    }

    const type = ownerDetails?.property_type;

    return layout.map((floor, index) => (
      <div key={index} style={floorCardStyle}>
        <h4 style={{ margin: "0 0 12px 0", color: "#1f2937" }}>
          Floor {floor.floorNo}
        </h4>

        {type === "hostel" &&
          floor.rooms?.map((room, i) => (
            <div key={i} style={itemRowStyle}>
              <span>Room No: {room.roomNo}</span>
              <span>{room.beds} Beds</span>
            </div>
          ))}

        {type === "apartment" &&
          floor.flats?.map((flat, i) => (
            <div key={i} style={itemRowStyle}>
              <span>Flat No: {flat.flatNo}</span>
              <span>{flat.bhk} BHK</span>
            </div>
          ))}

        {type === "commercial" && (
          <>
            {floor.area ? (
              <div style={itemRowStyle}>
                <span>Total Area</span>
                <span>{floor.area} sqft</span>
              </div>
            ) : (
              floor.sections?.map((section, i) => (
                <div key={i} style={itemRowStyle}>
                  <span>Section {section.sectionNo}</span>
                  <span>{section.area_sqft} sqft</span>
                </div>
              ))
            )}
          </>
        )}
      </div>
    ));
  };

  const propertyDetails = ownerDetails?.step2?.property_details || {};
  const galleryImages = propertyDetails?.gallery_images || [];

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 9999,
        padding: "20px",
      }}
    >
      <div
        className="modal-content"
        style={{
          maxWidth: "1100px",
          width: "95%",
          maxHeight: "90vh",
          borderRadius: "20px",
          overflow: "hidden",
          background: "#fff",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 20px 50px rgba(0,0,0,0.2)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="modal-header"
          style={{
            background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
            color: "white",
            padding: "22px 28px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexShrink: 0,
          }}
        >
          <div>
            <h2 style={{ margin: 0 }}>Owner Details</h2>
            <p style={{ margin: "6px 0 0 0", opacity: 0.9 }}>
              Complete owner profile, property, bank and building details
            </p>
          </div>

          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              color: "white",
              fontSize: "28px",
              cursor: "pointer",
            }}
          >
            ×
          </button>
        </div>

        <div
          className="modal-body"
          style={{
            padding: "24px",
            background: "#f8fafc",
            overflowY: "auto",
            flex: 1,
          }}
        >
          {loading ? (
            <p>Loading full owner details...</p>
          ) : error ? (
            <p style={{ color: "red" }}>{error}</p>
          ) : ownerDetails ? (
            <>
              <div style={topProfileCard}>
                <div style={avatarBig}>
                  {ownerDetails.step1?.name
                    ?.split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()}
                </div>

                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: 0, color: "#111827" }}>
                    {ownerDetails.step1?.name || "N/A"}
                  </h3>
                  <p style={{ margin: "8px 0", color: "#6b7280" }}>
                    {ownerDetails.step1?.phone || "N/A"}
                  </p>

                  <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                    <span style={badgeStyle(ownerDetails.step1?.status)}>
                      {ownerDetails.step1?.status || "N/A"}
                    </span>
                    <span style={typeBadge}>
                      {ownerDetails.property_type || "N/A"}
                    </span>
                  </div>
                </div>

                {/* {ownerDetails.step1?.owner_img_field && (
                  <div style={{ position: "relative" }}>
                    <img
                      src={ownerDetails.step1.owner_img_field}
                      alt="Owner"
                      style={{ ...ownerImageStyle, cursor: "pointer" }}
                      onClick={() => setSelectedImage(ownerDetails.step1.owner_img_field)}
                    />
                  </div>
                )} */}

              </div>

              <div style={gridStyle}>
                <div style={sectionCard}>
                  <h3 style={sectionTitle}>Step 1 - Owner Details</h3>
                  <InfoRow label="Owner ID" value={ownerDetails.step1?.id} />
                  <InfoRow label="Name" value={ownerDetails.step1?.name} />
                  <InfoRow label="Phone" value={ownerDetails.step1?.phone} />
                  <InfoRow label="Status" value={ownerDetails.step1?.status} />
                  <InfoRow
                    label={ownerDetails.step1?.id_proof_type === "Aadhaar Card" ? "Aadhaar Number" : (ownerDetails.step1?.id_proof_type === "PAN Card" ? "PAN Card" : "ID Proof Number")}
                    value={ownerDetails.step1?.id_proof_number}
                  />
                </div>

                <div style={sectionCard}>
                  <h3 style={sectionTitle}>Step 2 - Property Details</h3>
                  <InfoRow label="Stay Type" value={propertyDetails?.stayType} />
                  <InfoRow label="Location" value={propertyDetails?.location} />

                  {ownerDetails.property_type === "hostel" && (
                    <>
                      <InfoRow label="Hostel Name" value={propertyDetails?.property_name} />
                      <InfoRow label="Hostel Type" value={propertyDetails?.hostelType} />
                    </>
                  )}

                  {ownerDetails.property_type === "apartment" && (
                    <>
                      <InfoRow
                        label="Apartment Name"
                        value={propertyDetails?.property_name}
                      />
                      <InfoRow label="Tenant Type" value={propertyDetails?.tenantType} />
                    </>
                  )}

                  {ownerDetails.property_type === "commercial" && (
                    <>
                      <InfoRow
                        label="Commercial Name"
                        value={propertyDetails?.property_name}
                      />
                      <InfoRow label="Usage" value={propertyDetails?.usage} />
                    </>
                  )}

                  <div style={{ marginTop: "14px" }}>
                    <label style={smallLabel}>Facilities</label>
                    <div style={chipWrap}>
                      {propertyDetails?.facilities?.length > 0 ? (
                        propertyDetails.facilities.map((facility, i) => (
                          <span key={i} style={chipStyle}>
                            {facility}
                          </span>
                        ))
                      ) : (
                        <span style={{ color: "#6b7280" }}>No facilities</span>
                      )}
                    </div>
                  </div>

                  {/* {propertyDetails?.owner_ship_proof && (
                    <div style={{ marginTop: "16px" }}>
                      <label style={smallLabel}>Ownership Proof</label>
                      <div style={{ position: "relative", width: "100px", marginTop: "8px" }}>
                        <img
                          src={propertyDetails.owner_ship_proof}
                          alt="Ownership Proof"
                          style={{ ...galleryImage, cursor: "pointer" }}
                          onClick={() => setSelectedImage(propertyDetails.owner_ship_proof)}
                        />
                      </div>
                    </div>
                  )} */}

                </div>



                <div style={sectionCard}>
                  <h3 style={sectionTitle}>Gallery Images</h3>
                  {galleryImages.length > 0 ? (
                    <div style={galleryGrid}>
                      {galleryImages.map((img, index) => (
                        <div key={index} style={{ position: "relative" }}>
                          <img
                            src={img}
                            alt={`Gallery ${index + 1}`}
                            style={{ ...galleryImage, cursor: "pointer" }}
                            onClick={() => setSelectedImage(img)}
                          />

                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ color: "#6b7280" }}>No gallery images uploaded.</p>
                  )}
                </div>
              </div>

              <div style={{ ...sectionCard, marginTop: "20px" }}>
                <h3 style={sectionTitle}>Step 3 - Building Layout</h3>
                <div style={layoutGrid}>{renderLayout()}</div>
              </div>
            </>
          ) : (
            <p>No details found.</p>
          )}

          {selectedImage && (
            <div
              style={{
                position: "fixed",
                inset: 0,
                backgroundColor: "rgba(0,0,0,0.85)",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                zIndex: 10001,
                padding: "20px",
                cursor: "pointer"
              }}
              onClick={() => setSelectedImage(null)}
            >
              <img
                src={selectedImage}
                alt="Enlarged"
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
                  fontSize: "30px",
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

        <div
          className="modal-footer"
          style={{
            padding: "16px 24px",
            borderTop: "1px solid #e5e7eb",
            background: "#fff",
            flexShrink: 0,
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <button
            onClick={onClose}
            style={{
              background: "#111827",
              color: "#fff",
              border: "none",
              padding: "10px 16px",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: "600",
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div style={infoRowStyle}>
      <span style={infoLabelStyle}>{label}</span>
      <span style={infoValueStyle}>{value || "N/A"}</span>
    </div>
  );
}

const topProfileCard = {
  background: "#ffffff",
  borderRadius: "18px",
  padding: "20px",
  display: "flex",
  gap: "18px",
  alignItems: "center",
  marginBottom: "20px",
  boxShadow: "0 6px 20px rgba(0,0,0,0.06)",
};

const avatarBig = {
  width: "72px",
  height: "72px",
  borderRadius: "50%",
  background: "linear-gradient(135deg, #10b981, #059669)",
  color: "white",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: "700",
  fontSize: "24px",
};

const ownerImageStyle = {
  width: "90px",
  height: "90px",
  borderRadius: "14px",
  objectFit: "cover",
  border: "2px solid #e5e7eb",
  display: "block"
};



const gridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
  gap: "18px",
};

const sectionCard = {
  background: "#ffffff",
  borderRadius: "18px",
  padding: "20px",
  boxShadow: "0 6px 20px rgba(0,0,0,0.06)",
};

const sectionTitle = {
  margin: "0 0 16px 0",
  color: "#111827",
  fontSize: "18px",
  fontWeight: "700",
};

const infoRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  gap: "12px",
  padding: "10px 0",
  borderBottom: "1px solid #f1f5f9",
};

const infoLabelStyle = {
  color: "#6b7280",
  fontSize: "14px",
  fontWeight: "600",
};

const infoValueStyle = {
  color: "#111827",
  fontSize: "14px",
  textAlign: "right",
};

const smallLabel = {
  display: "block",
  fontSize: "12px",
  color: "#6b7280",
  fontWeight: "700",
  marginBottom: "8px",
  textTransform: "uppercase",
};

const chipWrap = {
  display: "flex",
  flexWrap: "wrap",
  gap: "8px",
};

const chipStyle = {
  background: "#ede9fe",
  color: "#5b21b6",
  padding: "6px 10px",
  borderRadius: "999px",
  fontSize: "12px",
  fontWeight: "600",
};

const linkStyle = {
  color: "#2563eb",
  textDecoration: "none",
  fontWeight: "600",
};

const galleryGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))",
  gap: "10px",
};

const galleryImage = {
  width: "100%",
  height: "100px",
  objectFit: "cover",
  borderRadius: "12px",
  border: "1px solid #e5e7eb",
};

const layoutGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
  gap: "16px",
};

const floorCardStyle = {
  border: "1px solid #e5e7eb",
  borderRadius: "16px",
  padding: "16px",
  background: "#f9fafb",
};

const itemRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  padding: "8px 0",
  borderBottom: "1px dashed #d1d5db",
  color: "#374151",
  fontSize: "14px",
};

const typeBadge = {
  background: "#dbeafe",
  color: "#1d4ed8",
  padding: "6px 12px",
  borderRadius: "999px",
  fontSize: "12px",
  fontWeight: "700",
  textTransform: "capitalize",
};

const badgeStyle = (status) => {
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

export default OwnerDetailsModal;
