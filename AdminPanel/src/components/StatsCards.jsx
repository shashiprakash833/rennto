import React, { useState, useEffect } from "react";
import { useNotifications } from "../context/NotificationContext";
import BASE_URL, { fetchWithAuth } from "../config/Api";
import {
    FaUsers,
    FaUserFriends,
    FaHome,
    FaUserClock,
    FaUserTimes,
    FaChartLine
} from "react-icons/fa";
// import "./StatsCards.css"; // Make sure to import the CSS

function StatsCards({ onCardClick }) {
    const { notifications } = useNotifications();
    const [statsData, setStatsData] = useState({
        total_owners: 0,
        total_properties: 0,
        pending_owners: 0,
        suspended_owners: 0,
        total_tenants: 0
    });
    const [error, setError] = useState("");

    useEffect(() => {
        fetchStats();
    }, [notifications]); // Refresh when notifications change (new registration/update)

    const fetchStats = async () => {
        try {
            const response = await fetchWithAuth(`${BASE_URL}/api/admin_home/`);
            const result = await response.json();

            if (response.ok && result?.data) {
                setStatsData({
                    total_owners: result.data.total_owners || 0,
                    total_properties: result.data.total_properties || 0,
                    pending_owners: result.data.pending_owners || 0,
                    suspended_owners: result.data.suspended_owners || 0,
                    total_tenants: result.data.total_tenants || 0
                });
            }
            else {
                setError(result?.error || "Failed to fetch owner data");
            }
        }
        catch (err) {
            console.error("Fetch stats error:", err);
            setError(err.message === "Failed to fetch" ? "Server not reachable" : err.message);
        }
    }
    const stats = [
        {
            title: "Total Owners",
            value: statsData.total_owners,
            icon: <FaUsers />,
            color: "#6c3bff",
            percent: "+12%"
        },
        {
            title: "Total Tenants",
            value: statsData.total_tenants,
            icon: <FaUserFriends />,
            color: "#3b82f6",
            percent: "+8%"
        },
        {
            title: "Total Properties",
            value: statsData.total_properties,
            icon: <FaHome />,
            color: "#f59e0b",
            percent: "+5%"
        },
        {
            title: "Pending Owners",
            value: statsData.pending_owners,
            icon: <FaUserClock />,
            color: "#10b981",
            percent: "-3%"
        },
        {
            title: "Suspended Owners",
            value: statsData.suspended_owners,
            icon: <FaUserTimes />,
            color: "#ef4444",
            percent: "-1%"
        },
        {
            title: "Monthly Revenue",
            value: "$84.5K",
            icon: <FaChartLine />,
            color: "#ec4899",
            percent: "+18%"
        }
    ];

    return (
        <div className="statsContainer">
            {stats.map((item, index) => (
                <div
                    className="statsCard"
                    key={index}
                    // onClick={() => onCardClick && onCardClick(item.title)}
                    //  onClick={() => {
                    //     if (onCardClick) {
                    //         if (item.title === "Total Owners") {
                    //             onCardClick("owners", "active");
                    //         } else {
                    //             onCardClick(item.title);
                    //         }
                    //     }
                    // }}

                    onClick={() => {
                        if (onCardClick) {
                            if (item.title === "Total Owners") {
                                onCardClick("owners", "active");
                            }
                            else if (item.title === "Pending Owners") {
                                onCardClick("owners", "pending");
                            }
                            else if (item.title === "Suspended Owners") {
                                onCardClick("owners", "suspend");
                            }
                            else {
                                onCardClick(item.title);
                            }
                        }
                    }}
                    style={{ cursor: onCardClick ? 'pointer' : 'default' }}
                >
                    <div className={`percentBadge ${item.percent.startsWith('+') ? 'positive' : 'negative'}`}>
                        {item.percent}
                    </div>
                    <div className="cardRow">
                        <div className="cardIcon" style={{ backgroundColor: item.color }}>
                            {item.icon}
                        </div>
                    </div>
                    <h3 className="cardValue">{item.value}</h3>
                    <p className="cardTitle">{item.title}</p>
                </div>
            ))}
        </div>
    );
}

export default StatsCards;