import { Line, Bar } from "react-chartjs-2";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from "chart.js";

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

function ChartsSection() {

    const propertyChartData = {
        labels: ["Aug", "Sep", "Oct", "Nov", "Dec", "Jan"],
        datasets: [
            {
                label: "Property Registrations",
                data: [12, 19, 15, 25, 22, 30],
                borderColor: "#6366f1",
                backgroundColor: "rgba(99,102,241,0.1)",
                borderWidth: 2,
                tension: 0.4,
                fill: true
            }
        ]
    };

    const bookingChartData = {
        labels: ["Aug", "Sep", "Oct", "Nov", "Dec", "Jan"],
        datasets: [
            {
                label: "Bookings",
                data: [45, 52, 48, 58, 63, 71],
                backgroundColor: "#10b981",
                borderRadius: 4,
                barThickness: 30
            }
        ]
    };

    const revenueChartData = {
        labels: ["Aug", "Sep", "Oct", "Nov", "Dec", "Jan"],
        datasets: [
            {
                label: "Revenue Growth",
                data: [32000, 35000, 33000, 41000, 38000, 45000],
                borderColor: "#f97316",
                backgroundColor: "rgba(249,115,22,0.1)",
                borderWidth: 2,
                tension: 0.4,
                fill: true
            }
        ]
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false }
        },
        scales: {
            y: {
                beginAtZero: true,
                grid: {
                    color: "rgba(0,0,0,0.05)",
                    drawBorder: false
                },
                ticks: {
                    color: "#9ca3af",
                    font: { size: 11 },
                    padding: 8
                },
                border: { display: false }
            },
            x: {
                grid: { display: false },
                ticks: {
                    color: "#9ca3af",
                    font: { size: 11 },
                    padding: 8
                },
                border: { display: false }
            }
        }
    };

    const revenueOptions = {
        ...chartOptions,
        scales: {
            ...chartOptions.scales,
            y: {
                ...chartOptions.scales.y,
                ticks: {
                    color: "#9ca3af",
                    font: { size: 11 },
                    padding: 8,
                    callback: function (value) {
                        return "$" + value / 1000 + "K";
                    }
                }
            }
        }
    };

    const dropdownStyle = {
        padding: "4px 8px",
        borderRadius: "4px",
        border: "1px solid #e5e7eb",
        color: "#4b5563",
        fontSize: "12px",
        background: "white",
        outline: "none",
        cursor: "pointer",
        marginLeft: "8px"
    };

    return (
        <section
            style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                gap: "1.5rem",
                marginBottom: "2rem"
            }}
        >

            {/* Property Registrations */}
            <div style={{
                background: "white",
                padding: "1.5rem",
                borderRadius: "12px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                border: "1px solid #f3f4f6"
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: "1.5rem" }}>
                    <h3 style={{ color: "#5a32d6", fontSize: '16px', fontWeight: '600', lineHeight: "1.3", margin: 0 }}>
                        Property<br />Registrations
                    </h3>
                    <div style={{ display: "flex", alignItems: "center" }}>
                        <select style={dropdownStyle}>
                            <option>Last 3 months</option>
                            <option>Last 6 months</option>
                        </select>
                        <select style={dropdownStyle}>
                            <option>Weekly</option>
                            <option>Monthly</option>
                        </select>
                    </div>
                </div>

                <div style={{ height: "200px", background: "white" }}>
                    <Line data={propertyChartData} options={chartOptions} />
                </div>
            </div>

            {/* Booking Statistics */}
            <div style={{
                background: "white",
                padding: "1.5rem",
                borderRadius: "12px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                border: "1px solid #f3f4f6"
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: "1.5rem" }}>
                    <h3 style={{ color: "#5a32d6", fontSize: '16px', fontWeight: '600', margin: 0 }}>
                        Booking Statistics
                    </h3>
                    <div style={{ display: "flex", alignItems: "center" }}>
                        <select style={dropdownStyle}>
                            <option>Last 6 months</option>
                            <option>Last 3 months</option>
                        </select>
                        <select style={dropdownStyle}>
                            <option>Weekly</option>
                            <option>Monthly</option>
                        </select>
                    </div>
                </div>

                <div style={{ height: "200px", background: "white" }}>
                    <Bar data={bookingChartData} options={chartOptions} />
                </div>
            </div>

            {/* Revenue Growth */}
            <div style={{
                background: "white",
                padding: "1.5rem",
                borderRadius: "12px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                border: "1px solid #f3f4f6"
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: "1.5rem" }}>
                    <h3 style={{ color: "#5a32d6", fontSize: '16px', fontWeight: '600', margin: 0 }}>
                        Revenue Growth
                    </h3>
                    <div style={{ display: "flex", alignItems: "center" }}>
                        <select style={dropdownStyle}>
                            <option>Last 3 months</option>
                            <option>Last 6 months</option>
                        </select>
                        <select style={dropdownStyle}>
                            <option>Daily</option>
                            <option>Weekly</option>
                            <option>Monthly</option>
                        </select>
                    </div>
                </div>

                <div style={{ height: "200px", background: "white" }}>
                    <Line data={revenueChartData} options={revenueOptions} />
                </div>
            </div>

        </section>
    );
}

export default ChartsSection;
