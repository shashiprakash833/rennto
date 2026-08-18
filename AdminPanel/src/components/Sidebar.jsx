import React from "react";
import logo from "../assets/rent1.png";
import { Link, useLocation } from "react-router-dom";

import {
    FaTachometerAlt,
    FaUsers,
    FaUserFriends,
    FaHome,
    FaCalendarAlt,
    FaMoneyBill,
    FaExclamationCircle,
    FaChartBar,
    FaCog
} from "react-icons/fa";

function Sidebar() {

    const location = useLocation();

    return (
        <div className="sidebar">

            <div className="logoBox">
                <div className="logo-circle">
                    <img src={logo} alt="logo" className="logo" />
                </div>

                <h2 className="brand">
                    <span className="stay">RENNTO</span>
                    {/* <span className="efy">efy</span> */}
                </h2>
            </div>

            <ul className="menu">

                <li className={location.pathname === "/" ? "active" : ""}>
                    <Link to="/">
                        <FaTachometerAlt />
                        <span>Dashboard</span>
                    </Link>
                </li>

                <li className={location.pathname === "/owners" ? "active" : ""}>
                    <Link to="/owners">
                        <FaUsers />
                        <span>Owners</span>
                    </Link>
                </li>

                {/* <li className={location.pathname === "/tenants" ? "active" : ""}>
                    <Link to="/tenants">
                        <FaUserFriends />
                        <span>Tenants</span>
                    </Link>
                </li> */}

                <li className={location.pathname === "/properties" ? "active" : ""}>
                    <Link to="/properties">
                        <FaHome />
                        <span>Properties</span>
                    </Link>
                </li>

                <li className={location.pathname === "/bookings" ? "active" : ""}>
                    <Link to="/bookings">
                        <FaCalendarAlt />
                        <span>Bookings</span>
                    </Link>
                </li>

                <li className={location.pathname === "/payments" ? "active" : ""}>
                    <Link to="/payments">
                        <FaMoneyBill />
                        <span>Payments</span>
                    </Link>
                </li>

                <li className={location.pathname === "/complaints" ? "active" : ""}>
                    <Link to="/complaints">
                        <FaExclamationCircle />
                        <span>Complaints</span>
                    </Link>
                </li>

                <li className={location.pathname === "/reports" ? "active" : ""}>
                    <Link to="/reports">
                        <FaChartBar />
                        <span>Reports</span>
                    </Link>
                </li>

                <li className={location.pathname === "/settings" ? "active" : ""}>
                    <Link to="/settings">
                        <FaCog />
                        <span>Settings</span>
                    </Link>
                </li>

            </ul>

        </div>
    );
}

export default Sidebar;