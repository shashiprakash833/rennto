import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import StatsCards from "../components/StatsCards";
import ActivityTable from "../components/ActivityTable";
import ChartsSection from "../components/ChartsSection";
import Header from "../components/Header";
import BASE_URL, { fetchWithAuth } from "../config/Api";

function Dashboard() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState("overview");
    const [tenants, setTenants] = useState([]);
    const [properties, setProperties] = useState([]);
    const [loading, setLoading] = useState(false);

    const closeModal = () => setActiveTab("overview");

    const fetchModalData = async (type) => {
        setLoading(true);
        try {
            const endpoint = type === "Total Tenants" ? "admin_tenants" : "admin_properties";
            const response = await fetchWithAuth(`${BASE_URL}/api/${endpoint}/`);
            const result = await response.json();
            if (response.ok && result.data) {
                if (type === "Total Tenants") setTenants(result.data);
                else setProperties(result.data);
            }
        } catch (error) {
            console.error("Error fetching modal data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCardClick = (type, filter) => {
        if (type === "owners") {
            navigate("/owners", { state: { filter: filter } });
        }
        else if (type === "Total Properties") {
            navigate("/properties");
        }
        else if (type === "Total Tenants") {
            setActiveTab(type);
            fetchModalData(type);
        }

    };

    const renderModalContent = () => {
        if (loading) return <p style={{ padding: "20px" }}>Loading data...</p>;

        if (activeTab === "Total Tenants") {
            return (
                <div className="tableBox" style={{ marginTop: 0 }}>
                    <table>
                        <thead>
                            <tr className="tableHeader">
                                <th>Name</th>
                                <th>Phone</th>
                                <th>Property</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tenants.length > 0 ? tenants.map((t, idx) => (
                                <tr key={idx}>
                                    <td>{t.name}</td> 
<td>{t.phone}</td>
                                    <td>{t.property} </td>
                                    <td><span className="status Confirmed">{t.status}</span></td>
                                </tr>
                            )) : (
                                <tr><td colSpan="4">No tenants found</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )
        }

        if (activeTab === "Total Properties") {
            return (
                <div className="tableBox" style={{ marginTop: 0 }}>
                    <table>
                        <thead>
                            <tr className="tableHeader">
                                <th>Name</th>
                                <th>Location</th>
                                <th>Type</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {properties.length > 0 ? properties.map((p, idx) => (
                                <tr key={idx}>
                                    <td>{p.name}</td>
                                    <td>{p.location}</td>
                                    <td>{p.type}</td>
                                    <td><span className={`status ${p.status === 'Active' ? 'Confirmed' : 'Pending'}`}>{p.status}</span></td>
                                </tr>
                            )) : (
                                <tr><td colSpan="4">No properties found</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )
        }
        return null;
    };

    return (
        <div className="dashboard">

            <Sidebar />

            <div className="main" style={{ padding: 0 }}>

                {/* Top Header */}
                <Header />

                <div style={{ padding: '0 30px 30px 30px' }}>
                    {/* Welcome Text */}
                    <div style={{ marginTop: '20px' }}>
                        <h1 className="welcome" style={{ margin: 0 }}>
                            Welcome back, Admin 👋
                        </h1>
                        <p className="subtitle" style={{ marginTop: '5px' }}>
                            Here's what's happening with your properties today.
                        </p>
                    </div>

                    {/* Stats Cards - Horizontal Row */}

                    <StatsCards onCardClick={handleCardClick} />

                    {/* Dashboard Sections always visible */}
                    <div className="dashboard-sections">
                        <div className="charts-section">
                            <h2 className="section-title">Analytics Overview</h2>
                            <ChartsSection />
                        </div>

                        <div className="activities-section">
                            <h2 className="section-title">Recent Activities</h2>
                            <ActivityTable />
                        </div>
                    </div>

                    {activeTab !== "overview" && (
                        <div className="modal-overlay" onClick={closeModal}>
                            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px', width: '90%', minHeight: '500px' }}>

                                <div className="modal-header">
                                    <h2>{activeTab} Directory</h2>
                                    <button className="close-btn" onClick={closeModal}>&times;</button>
                                </div>

                                <div className="modal-body" style={{ padding: '0 20px 20px 20px' }}>
                                    {renderModalContent()}
                                </div>
                            </div>
                        </div>
                    )}

                </div>

            </div>

        </div>
    );
}

export default Dashboard;

