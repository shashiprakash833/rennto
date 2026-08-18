import React from "react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import ChartsSection from "../components/ChartsSection";
import { 
    FaDownload, 
    FaFilter, 
    FaFileCsv, 
    FaFilePdf,
    FaChartBar,
    FaArrowUp,
    FaArrowDown
} from "react-icons/fa";

function Reports() {
    const summaryStats = [
        { label: "Total Revenue", value: "₹45.2L", trend: "+12.5%", positive: true },
        { label: "Avg. Occupancy", value: "88%", trend: "+2.4%", positive: true },
        { label: "Ticket Resolution", value: "94%", trend: "-1.5%", positive: false },
        { label: "Growth Rate", value: "24%", trend: "+5.2%", positive: true },
    ];

    return (
        <div className="dashboard">
            <Sidebar />
            <div className="main" style={{ padding: 0 }}>
                <Header />
                
                <div style={{ padding: "30px" }}>
                    <div style={{ 
                        display: "flex", 
                        justifyContent: "space-between", 
                        alignItems: "center", 
                        marginBottom: "24px" 
                    }}>
                        <div>
                            <h1 style={{ color: "#1e1b4b", fontSize: "28px", fontWeight: "700", marginBottom: "4px" }}>Reports & Analytics</h1>
                            <p style={{ color: "#6b7280", margin: 0 }}>Comprehensive performance insights and data analysis</p>
                        </div>
                        <div style={{ display: "flex", gap: "12px" }}>
                            <button style={secondaryBtnStyle}>
                                <FaFilter /> Filters
                            </button>
                            <button style={primaryBtnStyle}>
                                <FaDownload /> Export Report
                            </button>
                        </div>
                    </div>

                    {/* Summary Cards */}
                    <div style={{ 
                        display: "grid", 
                        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", 
                        gap: "20px", 
                        marginBottom: "30px" 
                    }}>
                        {summaryStats.map((stat, idx) => (
                            <div key={idx} style={statCardStyle}>
                                <p style={{ margin: "0 0 8px 0", color: "#64748b", fontSize: "14px", fontWeight: "500" }}>{stat.label}</p>
                                <div style={{ display: "flex", alignItems: "baseline", gap: "10px" }}>
                                    <h2 style={{ margin: 0, color: "#1e1b4b", fontSize: "24px", fontWeight: "700" }}>{stat.value}</h2>
                                    <span style={{ 
                                        fontSize: "12px", 
                                        fontWeight: "600", 
                                        color: stat.positive ? "#10b981" : "#ef4444",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "4px"
                                    }}>
                                        {stat.positive ? <FaArrowUp /> : <FaArrowDown />}
                                        {stat.trend}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Main Charts Area */}
                    <div style={{ 
                        background: "white", 
                        padding: "24px", 
                        borderRadius: "16px", 
                        border: "1px solid #e5e7eb",
                        marginBottom: "30px"
                    }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                            <h3 style={{ margin: 0, color: "#1e1b4b", fontSize: "18px", fontWeight: "600" }}>Performance Overview</h3>
                            <div style={{ display: "flex", gap: "8px" }}>
                                <span style={tagStyle("Revenue", "#7c3aed")}></span>
                                <span style={tagStyle("Bookings", "#10b981")}></span>
                            </div>
                        </div>
                        <ChartsSection />
                    </div>

                    {/* Detailed Reports Table / Section */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "30px" }}>
                        {/* Recent Invoices / Transactions (Mock) */}
                        <div style={tableContainerStyle}>
                            <h4 style={tableTitleStyle}>Exportable Assets</h4>
                            {[
                                { name: "January Financial Summary", type: "PDF", size: "2.4 MB" },
                                { name: "Quarterly Occupancy Report", type: "CSV", size: "1.1 MB" },
                                { name: "Annual Maintenance Log", type: "PDF", size: "4.8 MB" }
                            ].map((item, idx) => (
                                <div key={idx} style={reportItemStyle}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                        <div style={iconBoxStyle(item.type === "PDF" ? "#ef4444" : "#10b981")}>
                                            {item.type === "PDF" ? <FaFilePdf /> : <FaFileCsv />}
                                        </div>
                                        <div>
                                            <p style={{ margin: 0, fontWeight: "600", color: "#1e1b4b", fontSize: "14px" }}>{item.name}</p>
                                            <p style={{ margin: 0, color: "#64748b", fontSize: "12px" }}>{item.size} • {item.type}</p>
                                        </div>
                                    </div>
                                    <button style={iconBtnStyle}><FaDownload /></button>
                                </div>
                            ))}
                        </div>

                        {/* Top Performing Properties (Mock) */}
                        <div style={tableContainerStyle}>
                            <h4 style={tableTitleStyle}>Top Performing Properties</h4>
                            {[
                                { name: "Sunrise Apartments", location: "NY", score: "98%" },
                                { name: "Ocean View Hostel", location: "CA", score: "94%" },
                                { name: "Tech Park Hub", location: "TX", score: "91%" }
                            ].map((item, idx) => (
                                <div key={idx} style={reportItemStyle}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                        <div style={scoreCircleStyle}>{item.score}</div>
                                        <div>
                                            <p style={{ margin: 0, fontWeight: "600", color: "#1e1b4b", fontSize: "14px" }}>{item.name}</p>
                                            <p style={{ margin: 0, color: "#64748b", fontSize: "12px" }}>{item.location}</p>
                                        </div>
                                    </div>
                                    <button style={{...iconBtnStyle, color: "#7c3aed"}}>View</button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
            
            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
}

const primaryBtnStyle = {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    background: "#7c3aed",
    color: "white",
    border: "none",
    padding: "10px 18px",
    borderRadius: "10px",
    fontWeight: "600",
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(124, 58, 237, 0.2)",
    transition: "all 0.2s"
};

const secondaryBtnStyle = {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    background: "white",
    color: "#4b5563",
    border: "1px solid #e5e7eb",
    padding: "10px 18px",
    borderRadius: "10px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s"
};

const statCardStyle = {
    background: "white",
    padding: "20px",
    borderRadius: "16px",
    border: "1px solid #e5e7eb",
    boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
    transition: "transform 0.2s ease, box-shadow 0.2s ease",
    cursor: "default"
};

const tableContainerStyle = {
    background: "white",
    padding: "24px",
    borderRadius: "16px",
    border: "1px solid #e5e7eb"
};

const tableTitleStyle = {
    margin: "0 0 20px 0",
    color: "#1e1b4b",
    fontSize: "16px",
    fontWeight: "700"
};

const reportItemStyle = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 0",
    borderBottom: "1px solid #f3f4f6"
};

const iconBoxStyle = (color) => ({
    width: "40px",
    height: "40px",
    borderRadius: "8px",
    background: `${color}15`,
    color: color,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "18px"
});

const iconBtnStyle = {
    background: "transparent",
    border: "none",
    color: "#64748b",
    cursor: "pointer",
    fontSize: "16px",
    padding: "8px",
    borderRadius: "8px",
    transition: "all 0.2s"
};

const tagStyle = (label, color) => ({
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "12px",
    fontWeight: "600",
    color: "#64748b",
    marginRight: "12px",
    "::before": {
        content: '""',
        width: "8px",
        height: "8px",
        borderRadius: "50%",
        background: color
    }
});

const scoreCircleStyle = {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    background: "#f3e8ff",
    color: "#7c3aed",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "12px",
    fontWeight: "700"
};

export default Reports;
