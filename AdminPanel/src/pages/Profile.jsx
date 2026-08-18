import React, { useState } from "react";
import { FaUserCircle, FaEnvelope, FaUserShield, FaEdit } from "react-icons/fa";

function Profile({ onClose }) {
  const [isEditing, setIsEditing] = useState(false);

  const [user, setUser] = useState(() => {
    return JSON.parse(localStorage.getItem("user")) || {
      name: "Admin User",
      phone: "admin@example.com",
      role: "Super Admin"
    };
  });

  const handleChange = (e) => {
    setUser({ ...user, [e.target.name]: e.target.value });
  };

  const handleSave = () => {
    localStorage.setItem("user", JSON.stringify(user));
    setIsEditing(false);
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        background: "rgba(0,0,0,0.4)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 3000
      }}
    >
      {/* Modal Card */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff",
          borderRadius: "16px",
          padding: "30px",
          width: "420px",
          boxShadow: "0 20px 50px rgba(0,0,0,0.2)",
          position: "relative"
        }}
      >

        {/* Close Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          style={{
            position: "absolute",
            top: "12px",
            right: "15px",
            border: "none",
            background: "none",
            fontSize: "20px",
            cursor: "pointer"
          }}
        >
          ✖
        </button>

        {/* Top Section */}
        <div style={{
          display: "flex",
          gap: "15px",
          marginBottom: "20px",
          alignItems: "center"
        }}>
          <FaUserCircle size={70} color="#6366f1" />

          <div style={{ flex: 1 }}>
            {isEditing ? (
              <input
                name="name"
                value={user.name}
                onChange={handleChange}
                style={{
                  width: "100%",
                  padding: "6px",
                  borderRadius: "6px",
                  border: "1px solid #ddd"
                }}
              />
            ) : (
              <h3 style={{ margin: 0 }}>{user.name}</h3>
            )}

            <p style={{ margin: 0, color: "#6b7280" }}>{user.role}</p>
          </div>
        </div>

        <hr />

        {/* Info Section */}
        <div style={{ marginTop: "15px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <FaEnvelope color="#6366f1" />

            {isEditing ? (
              <input
                name="phone"
                value={user.phone}
                onChange={handleChange}
                style={{
                  width: "100%",
                  padding: "6px",
                  borderRadius: "6px",
                  border: "1px solid #ddd"
                }}
              />
            ) : (
              <span>{user.phone}</span>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "10px" }}>
            <FaUserShield color="#6366f1" />
            <span>{user.role}</span>
          </div>
        </div>

        {/* Buttons */}
        <div style={{ marginTop: "25px" }}>
          {isEditing ? (
            <button
              onClick={handleSave}
              style={{
                width: "100%",
                padding: "10px",
                background: "#10b981",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer"
              }}
            >
              Save Changes
            </button>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              style={{
                width: "100%",
                padding: "10px",
                background: "#6366f1",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: "8px"
              }}
            >
              <FaEdit /> Edit Profile
            </button>
          )}
        </div>

      </div>
    </div>
  );
}

export default Profile;
