import React, { useState } from "react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";

function Complaints() {
    const [complaints] = useState([
        {
            id: 1,
            tenant: "Sarah Connor",
            property: "Sunrise Apartments",
            status: "Open",
            description: "The heating system in unit 4B hasn't been working for the past 3 days. Temperature drops significantly at night.",
        },
        {
            id: 2,
            tenant: "Mike Torres",
            property: "Ocean View Villa",
            status: "In Progress",
            description: "Water leak under the kitchen sink causing damage to the cabinet. Maintenance was contacted but no response yet.",
        },
        {
            id: 3,
            tenant: "Anna Bell",
            property: "Metro Loft",
            status: "Resolved",
            description: "Noisy neighbors in the apartment above playing loud music past midnight on weekdays.",
        },
        {
            id: 4,
            tenant: "Tom Hardy",
            property: "Green Residency",
            status: "Open",
            description: "Parking space assigned to my unit is being used by another vehicle repeatedly. Need enforcement.",
        }
    ]);

    return (
        <div className="dashboard">
            <Sidebar />

            <div className="main" style={{ padding: 0 }}>
                <Header />

                <div className="page-content">
                    <div className="page-header" style={{ marginBottom: '25px' }}>
                        <h2 style={{ color: '#4c1d95', margin: 0 }}>Complaints</h2>
                        <p style={{ color: '#c084fc', marginTop: '5px' }}>Manage tenant issues</p>
                    </div>

                    <div className="complaints-list" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {complaints.map((complaint) => (
                            <div 
                                key={complaint.id} 
                                className="complaint-card" 
                                style={{ 
                                    background: 'white', 
                                    padding: '20px', 
                                    borderRadius: '12px', 
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'flex-start',
                                    border: '1px solid #f3f4f6'
                                }}
                            >
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                                        <h3 style={{ margin: 0, color: '#6d28d9', fontSize: '16px' }}>{complaint.tenant}</h3>
                                        <span style={{ color: '#9ca3af' }}>•</span>
                                        <span style={{ color: '#9ca3af', fontSize: '14px' }}>{complaint.property}</span>
                                        <span className={`status ${complaint.status.replace(/\s+/g, '-').toLowerCase()}`} style={{ marginLeft: '10px' }}>
                                            {complaint.status}
                                        </span>
                                    </div>
                                    <p style={{ margin: 0, color: '#6b7280', fontSize: '14px', lineHeight: '1.5', maxWidth: '80%' }}>
                                        {complaint.description}
                                    </p>
                                </div>
                                <button 
                                    className={complaint.status === 'Resolved' ? 'btn-resolved' : 'btn-resolve'}
                                    style={{
                                        padding: '8px 20px',
                                        borderRadius: '8px',
                                        border: 'none',
                                        fontWeight: '600',
                                        cursor: complaint.status === 'Resolved' ? 'default' : 'pointer',
                                        backgroundColor: complaint.status === 'Resolved' ? '#f3f4f6' : '#7c3aed',
                                        color: complaint.status === 'Resolved' ? '#9ca3af' : 'white',
                                        fontSize: '14px'
                                    }}
                                >
                                    {complaint.status === 'Resolved' ? 'Resolved' : 'Resolve'}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Complaints;
