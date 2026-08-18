import React, { useState } from "react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";

function Bookings() {
    const [bookings] = useState([
        {
            id: 1,
            tenant: "Sarah Connor",
            property: "Sunrise Apartments",
            owner: "James Wilson",
            checkIn: "Dec 1, 2024",
            payment: "Paid",
            status: "Confirmed"
        },
        {
            id: 2,
            tenant: "Mike Torres",
            property: "Ocean View Villa",
            owner: "Emily Zhang",
            checkIn: "Nov 15, 2024",
            payment: "Pending",
            status: "Pending"
        },
        {
            id: 3,
            tenant: "Anna Bell",
            property: "Metro Loft",
            owner: "Robert Chen",
            checkIn: "Jan 1, 2025",
            payment: "Paid",
            status: "Confirmed"
        },
        {
            id: 4,
            tenant: "Jane Foster",
            property: "Skyline Tower",
            owner: "David Kim",
            checkIn: "Feb 1, 2025",
            payment: "Unpaid",
            status: "Pending"
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
                            <h2 style={{ color: '#4c1d95', margin: 0 }}>Bookings</h2>
                            <p style={{ color: '#c084fc', marginTop: '5px' }}>Manage reservations and bookings</p>
                        </div>
                        <button className="btn-primary" style={{ backgroundColor: '#7c3aed', padding: '10px 20px', borderRadius: '8px', border: 'none', color: 'white', fontWeight: '600', cursor: 'pointer' }}>
                            + New Booking
                        </button>
                    </div>

                    <div className="tableBox" style={{ marginTop: 0 }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr className="tableHeader">
                                    <th style={{ textAlign: 'left', color: '#c084fc', padding: '15px' }}>Tenant</th>
                                    <th style={{ textAlign: 'left', color: '#c084fc', padding: '15px' }}>Property</th>
                                    <th style={{ textAlign: 'left', color: '#c084fc', padding: '15px' }}>Owner</th>
                                    <th style={{ textAlign: 'left', color: '#c084fc', padding: '15px' }}>Check-in</th>
                                    <th style={{ textAlign: 'left', color: '#c084fc', padding: '15px' }}>Payment</th>
                                    <th style={{ textAlign: 'left', color: '#c084fc', padding: '15px' }}>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {bookings.map((booking) => (
                                    <tr key={booking.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                        <td style={{ padding: '15px', color: '#6d28d9', fontWeight: '600' }}>{booking.tenant}</td>
                                        <td style={{ padding: '15px', color: '#6b7280' }}>{booking.property}</td>
                                        <td style={{ padding: '15px', color: '#6b7280' }}>{booking.owner}</td>
                                        <td style={{ padding: '15px', color: '#6b7280' }}>{booking.checkIn}</td>
                                        <td style={{ padding: '15px' }}>
                                            <span className={`status ${booking.payment.toLowerCase()}`}>
                                                {booking.payment}
                                            </span>
                                        </td>
                                        <td style={{ padding: '15px' }}>
                                            <span className={`status ${booking.status.toLowerCase()}`}>
                                                {booking.status}
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

export default Bookings;
