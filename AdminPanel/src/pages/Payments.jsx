import React, { useState } from "react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import { FaDownload } from "react-icons/fa";

function Payments() {
    const [payments] = useState([
        {
            id: 1,
            tenant: "Sarah Connor",
            property: "Sunrise Apartments",
            amount: "$1,200",
            date: "Jan 5, 2025",
            status: "Paid"
        },
        {
            id: 2,
            tenant: "Mike Torres",
            property: "Ocean View Villa",
            amount: "$2,500",
            date: "Jan 3, 2025",
            status: "Paid"
        },
        {
            id: 3,
            tenant: "Anna Bell",
            property: "Metro Loft",
            amount: "$1,800",
            date: "—",
            status: "Unpaid"
        },
        {
            id: 4,
            tenant: "Tom Hardy",
            property: "Green Residency",
            amount: "$950",
            date: "Jan 1, 2025",
            status: "Paid"
        }
    ]);

    return (
        <div className="dashboard">
            <Sidebar />

            <div className="main" style={{ padding: 0 }}>
                <Header />

                <div className="page-content">
                    <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
                        <div>
                            <h2 style={{ color: '#4c1d95', margin: 0 }}>Payments</h2>
                            <p style={{ color: '#c084fc', marginTop: '5px' }}>Track rent payments</p>
                        </div>
                        <button className="btn-primary" style={{ backgroundColor: '#7c3aed', padding: '10px 20px', borderRadius: '8px', border: 'none', color: 'white', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <FaDownload /> Export
                        </button>
                    </div>

                    <div className="tableBox" style={{ marginTop: 0 }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr className="tableHeader">
                                    <th style={{ textAlign: 'left', color: '#c084fc', padding: '15px' }}>Tenant</th>
                                    <th style={{ textAlign: 'left', color: '#c084fc', padding: '15px' }}>Property</th>
                                    <th style={{ textAlign: 'left', color: '#c084fc', padding: '15px' }}>Amount</th>
                                    <th style={{ textAlign: 'left', color: '#c084fc', padding: '15px' }}>Date</th>
                                    <th style={{ textAlign: 'left', color: '#c084fc', padding: '15px' }}>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {payments.map((payment) => (
                                    <tr key={payment.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                        <td style={{ padding: '15px', color: '#6d28d9', fontWeight: '600' }}>{payment.tenant}</td>
                                        <td style={{ padding: '15px', color: '#6b7280' }}>{payment.property}</td>
                                        <td style={{ padding: '15px', color: '#6d28d9', fontWeight: '600' }}>{payment.amount}</td>
                                        <td style={{ padding: '15px', color: '#6b7280' }}>{payment.date}</td>
                                        <td style={{ padding: '15px' }}>
                                            <span className={`status ${payment.status.toLowerCase()}`}>
                                                {payment.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Payments;
