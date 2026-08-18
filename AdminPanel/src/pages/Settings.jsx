import React, { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import BASE_URL, { fetchWithAuth } from "../config/Api";
import { 
    FaUser, 
    FaBell, 
    FaLock, 
    FaPalette, 
    FaServer, 
    FaDatabase,
    FaGlobe,
    FaShieldAlt
} from "react-icons/fa";


function Settings() {
    const [activeSection, setActiveSection] = useState("profile");
    const [isEditing, setIsEditing] = useState(false);
    const [systemSettings, setSystemSettings] = useState({
        maintenance_mode: "NORMAL",
        maintenance_message: "",
        estimated_completion: "",
        allow_admin_override: true,
        demo_mode_enabled: false,
        demo_mobile_numbers: [],
    });

    const sections = [
        { id: "profile", label: "Admin Profile", icon: <FaUser /> },
        { id: "notifications", label: "Notifications", icon: <FaBell /> },
        { id: "security", label: "Security & Access", icon: <FaShieldAlt /> },
        { id: "appearance", label: "Appearance", icon: <FaPalette /> },
        { id: "system", label: "System Config", icon: <FaServer /> },
    ];


const loadSystemSettings = async () => {
    try {
        const response = await fetchWithAuth(`${BASE_URL}/api/admin/system-settings/`);
        const data = await response.json();

        if (data.success) {
            setSystemSettings({
                maintenance_mode: data.maintenance_mode,
                maintenance_message: data.maintenance_message || "",
                estimated_completion: data.estimated_completion || "",
                allow_admin_override: data.allow_admin_override,
                demo_mode_enabled: data.demo_mode_enabled,
                demo_mobile_numbers: data.demo_mobile_numbers || [],
            });
        }
    } catch (error) {
        console.log(error);
    }
};

   const saveSystemSettings = async () => {
    try {
        const payload = { ...systemSettings };
        payload.demo_mobile_numbers = (
    Array.isArray(payload.demo_mobile_numbers)
        ? payload.demo_mobile_numbers
        : []
)
    .map(item => item.trim())
    .filter(item => item);
        if (payload.estimated_completion === "") {
            payload.estimated_completion = null;
        }

        const response = await fetchWithAuth(`${BASE_URL}/api/admin/system-settings/`, {
            method: 'PUT',
            body: JSON.stringify(payload)
        });
        const data = await response.json();
        
        if (response.ok) {
            alert(data.message || "Settings saved successfully.");
        } else {
            alert(data.error || data.message || JSON.stringify(data));
        }
    } catch (error) {
        console.log(error);
        alert("Unable to save settings.");
    }
};
useEffect(() => {
    if (activeSection === "system") {
        loadSystemSettings();
    }
}, [activeSection]);
    const renderSectionContent = () => {
        switch (activeSection) {
            case "profile":
                return (
                    <div style={{ animation: "fadeIn 0.3s ease-out" }}>
                        <h3 style={{ color: "#111827", marginBottom: "20px" }}>Profile Settings</h3>
                        <div style={{ display: "flex", gap: "24px", alignItems: "center", marginBottom: "32px" }}>
                            <div style={{ 
                                width: "80px", 
                                height: "80px", 
                                borderRadius: "50%", 
                                background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "white",
                                fontSize: "32px"
                            }}>
                                <FaUser />
                            </div>
                            <div>
                                <button style={{ 
                                    padding: "8px 16px", 
                                    borderRadius: "8px", 
                                    border: "1px solid #e5e7eb",
                                    background: "white",
                                    cursor: "pointer",
                                    fontWeight: "600",
                                    marginRight: "12px"
                                }}>Change Photo</button>
                                <button style={{ 
                                    padding: "8px 16px", 
                                    borderRadius: "8px", 
                                    border: "1px solid #fee2e2",
                                    background: "transparent",
                                    color: "#ef4444",
                                    cursor: "pointer",
                                    fontWeight: "600"
                                }}>Remove</button>
                            </div>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                            <div className="form-group">
                                <label style={labelStyle}>Full Name</label>
                                <input type="text" defaultValue="Admin User" style={inputStyle} />
                            </div>
                            <div className="form-group">
                                <label style={labelStyle}>Email Address</label>
                                <input type="email" defaultValue="admin@stayefy.com" style={inputStyle} />
                            </div>
                            <div className="form-group">
                                <label style={labelStyle}>Phone Number</label>
                                <input type="text" defaultValue="+91 9876543210" style={inputStyle} />
                            </div>
                            <div className="form-group">
                                <label style={labelStyle}>Role</label>
                                <input type="text" defaultValue="Super Admin" style={{...inputStyle, background: "#f9fafb"}} readOnly />
                            </div>
                        </div>
                    </div>
                );
            case "security":
                return (
                    <div style={{ animation: "fadeIn 0.3s ease-out" }}>
                        <h3 style={{ color: "#111827", marginBottom: "20px" }}>Security Settings</h3>
                        <div style={{ marginBottom: "24px", padding: "16px", border: "1px solid #e5e7eb", borderRadius: "12px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <div>
                                    <h4 style={{ margin: 0, color: "#111827" }}>Two-Factor Authentication</h4>
                                    <p style={{ margin: "4px 0 0 0", fontSize: "14px", color: "#6b7280" }}>Add an extra layer of security to your account.</p>
                                </div>
                                <div style={toggleStyle(true)}>
                                    <div style={toggleCircleStyle(true)}></div>
                                </div>
                            </div>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                            <div className="form-group">
                                <label style={labelStyle}>Current Password</label>
                                <input type="password" placeholder="••••••••" style={inputStyle} />
                            </div>
                            <div className="form-group">
                                <label style={labelStyle}>New Password</label>
                                <input type="password" placeholder="••••••••" style={inputStyle} />
                            </div>
                        </div>
                    </div>
                );
        case "system":
    return (
        <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 25 }}>
                <h3 style={{ margin: 0 }}>
                    System Configuration
                </h3>
                {!isEditing && (
                    <button 
                        onClick={() => setIsEditing(true)}
                        style={{
                            padding: "6px 16px",
                            borderRadius: "6px",
                            border: "1px solid #7c3aed",
                            background: "white",
                            color: "#7c3aed",
                            cursor: "pointer",
                            fontWeight: "600"
                        }}
                    >
                        Edit
                    </button>
                )}
            </div>

            <div style={{ marginBottom: 25 }}>
                <label style={labelStyle}>
                    Maintenance Mode
                </label>
                {isEditing ? (
                    <div style={{ marginTop: 10 }}>
                        <label>
                            <input
                                type="radio"
                                value="NORMAL"
                                checked={systemSettings.maintenance_mode === "NORMAL"}
                                onChange={(e) =>
                                    setSystemSettings({ ...systemSettings, maintenance_mode: e.target.value })
                                }
                            />
                            {" "}Normal
                        </label>
                        <br /><br />
                        <label>
                            <input
                                type="radio"
                                value="READ_ONLY"
                                checked={systemSettings.maintenance_mode === "READ_ONLY"}
                                onChange={(e) =>
                                    setSystemSettings({ ...systemSettings, maintenance_mode: e.target.value })
                                }
                            />
                            {" "}Read Only
                        </label>
                        <br /><br />
                        <label>
                            <input
                                type="radio"
                                value="FULL_MAINTENANCE"
                                checked={systemSettings.maintenance_mode === "FULL_MAINTENANCE"}
                                onChange={(e) =>
                                    setSystemSettings({ ...systemSettings, maintenance_mode: e.target.value })
                                }
                            />
                            {" "}Full Maintenance
                        </label>
                    </div>
                ) : (
                    <div style={{ padding: "10px", background: "#f9fafb", borderRadius: "8px", border: "1px solid #e5e7eb", marginTop: "8px" }}>
                        {systemSettings.maintenance_mode === "NORMAL" && "Normal"}
                        {systemSettings.maintenance_mode === "READ_ONLY" && "Read Only"}
                        {systemSettings.maintenance_mode === "FULL_MAINTENANCE" && "Full Maintenance"}
                    </div>
                )}
            </div>

            <div style={{ marginBottom: 25 }}>
                <label style={labelStyle}>
                    Maintenance Message
                </label>
                {isEditing ? (
                    <textarea
                        rows={5}
                        style={{ ...inputStyle, resize: "none" }}
                        value={systemSettings.maintenance_message}
                        onChange={(e) =>
                            setSystemSettings({ ...systemSettings, maintenance_message: e.target.value })
                        }
                    />
                ) : (
                    <div style={{ padding: "10px", background: "#f9fafb", borderRadius: "8px", border: "1px solid #e5e7eb", marginTop: "8px", minHeight: "60px" }}>
                        {systemSettings.maintenance_message || "None"}
                    </div>
                )}
            </div>

            <div style={{ marginBottom: 25 }}>
                <label style={labelStyle}>
                    Estimated Completion
                </label>
                {isEditing ? (
                    <input
                        type="datetime-local"
                        style={inputStyle}
                        value={systemSettings.estimated_completion ? (() => {
                            let val = systemSettings.estimated_completion;
                            if (val.includes("T")) {
                                val = val.split(".")[0];
                                if (val.endsWith("Z")) val = val.slice(0, -1);
                                if (val.includes("+")) val = val.split("+")[0];
                                const parts = val.split(":");
                                if (parts.length > 2) {
                                    val = parts[0] + ":" + parts[1];
                                }
                            }
                            return val;
                        })() : ""}
                        onChange={(e) =>
                            setSystemSettings({ ...systemSettings, estimated_completion: e.target.value })
                        }
                    />
                ) : (
                    <div style={{ padding: "10px", background: "#f9fafb", borderRadius: "8px", border: "1px solid #e5e7eb", marginTop: "8px" }}>
                        {systemSettings.estimated_completion ? (() => {
                            let naiveString = systemSettings.estimated_completion;
                            if (naiveString.endsWith("Z")) {
                                naiveString = naiveString.slice(0, -1);
                            } else if (naiveString.includes("+")) {
                                naiveString = naiveString.split("+")[0];
                            }
                            return new Date(naiveString).toLocaleString(undefined, { timeZoneName: 'short' });
                        })() : "Not set"}
                    </div>
                )}
            </div>

            <div>
                <label style={isEditing ? {} : labelStyle}>
                    {isEditing ? (
                        <>
                            <input
                                type="checkbox"
                                checked={systemSettings.allow_admin_override}
                                onChange={(e) =>
                                    setSystemSettings({ ...systemSettings, allow_admin_override: e.target.checked })
                                }
                            />
                            {" "}Allow Admin Operations During Maintenance
                        </>
                    ) : (
                        <>
                            Allow Admin Operations During Maintenance
                            <div style={{ padding: "10px", background: "#f9fafb", borderRadius: "8px", border: "1px solid #e5e7eb", marginTop: "8px", fontWeight: "normal" }}>
                                {systemSettings.allow_admin_override ? "Yes" : "No"}
                            </div>
                        </>
                    )}
                </label>
            </div>




            <hr style={{ margin: "30px 0" }} />

<h3>Demo OTP Settings</h3>

<div style={{ marginBottom: 20 }}>
    <label>
        <input
            type="checkbox"
            checked={systemSettings.demo_mode_enabled}
            onChange={(e) =>
                setSystemSettings({
                    ...systemSettings,
                    demo_mode_enabled: e.target.checked
                })
            }
        />
        {" "}Enable Demo OTP
    </label>
</div>

<div style={{ marginBottom: 20 }}>
    <label style={labelStyle}>
        Demo Mobile Numbers
    </label>

<textarea
    rows={8}
    style={{ ...inputStyle, resize: "vertical" }}
    placeholder={"9876543210\n9876543211\n9876543212"}
    value={
        Array.isArray(systemSettings.demo_mobile_numbers)
            ? systemSettings.demo_mobile_numbers.join("\n")
            : systemSettings.demo_mobile_numbers || ""
    }
    onChange={(e) =>
        setSystemSettings({
            ...systemSettings,
            demo_mobile_numbers: e.target.value.split("\n")
        })
    }
/>
</div>

        </div>
    );
            default:
                return (
                    <div style={{ padding: "40px", textAlign: "center", color: "#6b7280" }}>
                        <div
    style={{
        fontSize: "48px",
        marginBottom: "16px",
        opacity: 0.5,
    }}
>⚙️</div>
                        <p>This section ({activeSection}) is under development.</p>
                    </div>
                );
        }
    };

    return (
        <div className="dashboard">
            <Sidebar />
            <div className="main" style={{ padding: 0 }}>
                <Header />
                
                <div style={{ padding: "30px" }}>
                    <div style={{ marginBottom: "24px" }}>
                        <h1 style={{ color: "#1e1b4b", fontSize: "28px", fontWeight: "700", marginBottom: "4px" }}>Settings</h1>
                        <p style={{ color: "#6b7280", margin: 0 }}>Manage your preferences and system configuration</p>
                    </div>

                    <div style={{ display: "flex", gap: "30px", background: "white", borderRadius: "16px", border: "1px solid #e5e7eb", minHeight: "500px", overflow: "hidden" }}>
                        {/* Settings Sidebar */}
                        <div style={{ width: "240px", borderRight: "1px solid #e5e7eb", background: "#f9fafb", padding: "20px 0" }}>
                            {sections.map(section => (
                                <div 
                                    key={section.id}
                                    onClick={() => setActiveSection(section.id)}
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "12px",
                                        padding: "12px 24px",
                                        cursor: "pointer",
                                        color: activeSection === section.id ? "#7c3aed" : "#64748b",
                                        background: activeSection === section.id ? "#f3e8ff" : "transparent",
                                        borderRight: activeSection === section.id ? "3px solid #7c3aed" : "none",
                                        fontWeight: activeSection === section.id ? "600" : "400",
                                        transition: "all 0.2s"
                                    }}
                                >
                                    <span style={{ fontSize: "18px" }}>{section.icon}</span>
                                    <span>{section.label}</span>
                                </div>
                            ))}
                        </div>

                        {/* Settings Content */}
                        <div style={{ flex: 1, padding: "32px" }}>
                            
                            {renderSectionContent()}
                            
                            {isEditing && (
                                <div style={{ marginTop: "40px", paddingTop: "24px", borderTop: "1px solid #e5e7eb", display: "flex", justifyContent: "flex-end", gap: "12px" }}>
                                    <button 
                                        onClick={() => {
                                            setIsEditing(false);
                                            loadSystemSettings(); // Reset to saved values
                                        }}
                                        style={{ 
                                            padding: "10px 20px", 
                                            borderRadius: "8px", 
                                            border: "1px solid #e5e7eb",
                                            background: "white",
                                            cursor: "pointer",
                                            fontWeight: "600"
                                        }}
                                    >Cancel</button>
                                    <button
                                        onClick={() => {
                                            saveSystemSettings();
                                            setIsEditing(false);
                                        }}
                                        style={{
                                            padding: "10px 24px",
                                            borderRadius: "8px",
                                            border: "none",
                                            background: "#7c3aed",
                                            color: "white",
                                            cursor: "pointer",
                                            fontWeight: "600"
                                        }}
                                    >
                                        Save Settings
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            
            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .form-group {
                    margin-bottom: 20px;
                }
            `}</style>
        </div>
    );
}

const labelStyle = {
    display: "block",
    fontSize: "14px",
    fontWeight: "600",
    color: "#374151",
    marginBottom: "8px"
};

const inputStyle = {
    width: "100%",
    padding: "10px 14px",
    borderRadius: "8px",
    border: "1px solid #d1d5db",
    fontSize: "15px",
    outline: "none",
    transition: "border-color 0.2s",
    boxSizing: "border-box"
};

const toggleStyle = (active) => ({
    width: "48px",
    height: "24px",
    borderRadius: "12px",
    background: active ? "#7c3aed" : "#d1d5db",
    position: "relative",
    cursor: "pointer",
    transition: "background 0.3s"
});

const toggleCircleStyle = (active) => ({
    width: "18px",
    height: "18px",
    borderRadius: "50%",
    background: "white",
    position: "absolute",
    top: "3px",
    left: active ? "27px" : "3px",
    transition: "left 0.3s",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
});

export default Settings;

