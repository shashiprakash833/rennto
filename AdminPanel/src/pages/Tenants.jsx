// import React, { useState } from "react";
// import Sidebar from "../components/Sidebar";
// import Header from "../components/Header";

// const tenants = [
//     {
//         id: 1,
//         name: "Sarah Connor",
//         phone: "+1 555-0201",
//         phone: "sarah@phone.com",
//         property: "Sunrise Apartments",
//         room: "A-101",
//         rent: "$1,200",
//         checkIn: "Dec 1, 2024",
//         status: "Active",
//         idProof: "Passport_SC.pdf",
//         rentalAgreement: "Lease_A101_Sarah.pdf",
//         photo: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
//         emergencyContact: "John Connor (Son) - +1 555-0999"
//     },
//     {
//         id: 2,
//         name: "Mike Torres",
//         phone: "+1 555-0202",
//         phone: "mike.t@phone.com",
//         property: "Ocean View Villa",
//         room: "B-205",
//         rent: "$2,500",
//         checkIn: "Nov 15, 2024",
//         status: "Active",
//         idProof: "ID_Card_Mike.jpg",
//         rentalAgreement: "Agreement_Villa_B205.pdf",
//         photo: "https://api.dicebear.com/7.x/avataaars/svg?seed=Mike",
//         emergencyContact: "Elena Torres (Wife) - +1 555-0888"
//     },
//     {
//         id: 3,
//         name: "Anna Bell",
//         phone: "+1 555-0203",
//         phone: "anna.b@phone.com",
//         property: "Metro Loft",
//         room: "C-304",
//         rent: "$1,800",
//         checkIn: "Jan 1, 2025",
//         status: "Pending",
//         idProof: "Driving_License_Anna.pdf",
//         rentalAgreement: "Lease_Metro_C304.pdf",
//         photo: "https://api.dicebear.com/7.x/avataaars/svg?seed=Anna",
//         emergencyContact: "David Bell (Brother) - +1 555-0777"
//     },
//     {
//         id: 4,
//         name: "Tom Hardy",
//         phone: "+1 555-0204",
//         phone: "tom.h@phone.com",
//         property: "Green Residency",
//         room: "D-412",
//         rent: "$950",
//         checkIn: "Oct 20, 2024",
//         status: "Inactive",
//         idProof: "ID_Tom_H.png",
//         rentalAgreement: "Lease_Green_D412.pdf",
//         photo: "https://api.dicebear.com/7.x/avataaars/svg?seed=Tom",
//         emergencyContact: "Sarah Hardy (Mother) - +1 555-0666"
//     }
// ];

// function Tenants({ onLogout }) {

//     const [selectedTenant, setSelectedTenant] = useState(null);
//     const [showVerification, setShowVerification] = useState(false);

//     const closeModal = () => {
//         setSelectedTenant(null);
//         setShowVerification(false);
//     };

//     return (
//         <div className="dashboard">
//             <Sidebar />

//             <div className="main" style={{ padding: 0 }}>
//                 <Header onLogout={onLogout} />

//                 <div className="tenants-container" style={{ padding: "30px" }}>

//                     <div className="tenants-header">
//                         <div>
//                             <h2 style={{ color: '#4c1d95' }}>Tenants</h2>
//                             <p style={{ color: '#c084fc', marginBottom: '20px' }}>Manage tenants and leases</p>
//                         </div>

//                         <button className="add-tenant">+ Add Tenant</button>
//                     </div>

//                     <table className="tenants-table">
//                         <thead>
//                             <tr>
//                                 <th>Tenant</th>
//                                 <th>Phone</th>
//                                 <th>Property</th>
//                                 <th>Rent</th>
//                                 <th>Check-in</th>
//                                 <th>Status</th>
//                                 <th>Actions</th>
//                             </tr>
//                         </thead>

//                         <tbody>
//                             {tenants.map((tenant) => (
//                                 <tr key={tenant.id}>
//                                     <td className="tenant-name">{tenant.name}</td>
//                                     <td className="tenant-text">{tenant.phone}</td>
//                                     <td className="tenant-text">{tenant.property}</td>
//                                     <td className="tenant-rent">{tenant.rent}</td>
//                                     <td className="tenant-text">{tenant.checkIn}</td>
//                                     <td>
//                                         <span className={`status ${tenant.status.toLowerCase()}`}>
//                                             {tenant.status}
//                                         </span>
//                                     </td>
//                                     <td>
//                                         <button className="view-btn" onClick={() => setSelectedTenant(tenant)}>View</button>
//                                     </td>
//                                 </tr>
//                             ))}
//                         </tbody>

//                     </table>

//                 </div>

//                 {selectedTenant && (
//                     <div className="modal-overlay" onClick={closeModal}>
//                         <div className="modal-content" style={{ maxWidth: showVerification ? "1000px" : "800px", minHeight: '600px' }} onClick={(e) => e.stopPropagation()}>
                            
//                             <div className="modal-header">
//                                 <h2>{showVerification ? "Tenant Verification" : "Tenant Profile"}</h2>
//                                 <button className="close-btn" onClick={closeModal}>&times;</button>
//                             </div>

//                             <div className="modal-body">
//                                 {!showVerification ? (
//                                     <>
//                                         <div 
//                                             className="owner-profile-card" 
//                                             style={{ cursor: 'default' }}
//                                         >
//                                             <div className="avatar-large" style={{ background: '#10b981' }}>
//                                                 {selectedTenant.name.split(' ').map(n => n[0]).join('')}
//                                             </div>
//                                             <div>
//                                                 <h3 style={{ margin: "0 0 5px 0", color: "#065f46" }}>{selectedTenant.name}</h3>
//                                                 <p style={{ margin: 0, color: "#6b7280", fontSize: "14px" }}>{selectedTenant.phone} • {selectedTenant.phone}</p>
//                                                 <span className={`status ${selectedTenant.status.toLowerCase()}`} style={{ display: 'inline-block', marginTop: '10px' }}>
//                                                     {selectedTenant.status}
//                                                 </span>
//                                             </div>
//                                         </div>

//                                         <div style={{ marginTop: "25px" }}>
//                                             <div style={{ borderBottom: "1px solid #eee", paddingBottom: "10px", marginBottom: "15px" }}>
//                                                 <h4 style={{ color: "#065f46", margin: 0 }}>
//                                                     Lease Information
//                                                 </h4>
//                                             </div>

//                                             <div className="properties-list">
//                                                 <div 
//                                                     className="property-card" 
//                                                     onClick={() => setShowVerification(true)} 
//                                                     style={{ cursor: 'pointer', position: 'relative' }}
//                                                     title="Click to view tenant documents"
//                                                 >
//                                                     <div style={{ fontWeight: '600', color: '#047857', marginBottom: '5px' }}>{selectedTenant.property}</div>
                                                    
//                                                     <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginTop: '10px' }}>
//                                                         <span><strong style={{color: '#4b5563'}}>Room / Unit:</strong> {selectedTenant.room}</span>
//                                                         <span><strong style={{color: '#4b5563'}}>Rent:</strong> <span className="tenant-rent">{selectedTenant.rent}</span></span>
//                                                     </div>
//                                                     <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginTop: '10px' }}>
//                                                         <span><strong style={{color: '#4b5563'}}>Move-in Date:</strong> {selectedTenant.checkIn}</span>
//                                                     </div>
//                                                     <div style={{ fontSize: '13px', marginTop: '15px', borderTop: '1px dashed #d1d5db', paddingTop: '10px' }}>
//                                                         <strong style={{color: '#4b5563', display: 'block', marginBottom: '4px'}}>Emergency Contact:</strong>
//                                                         <span style={{ color: '#ef4444' }}>{selectedTenant.emergencyContact}</span>
//                                                     </div>
//                                                     <div style={{ textAlign: 'right', marginTop: '10px', fontSize: '11px', color: '#10b981', fontWeight: 'bold' }}>
//                                                         View Verification Details →
//                                                     </div>
//                                                 </div>
//                                             </div>
//                                         </div>
//                                     </>
//                                 ) : (
//                                     <div className="verification-details">
//                                         <button 
//                                             onClick={() => setShowVerification(false)} 
//                                             style={{ background: 'none', border: 'none', color: '#10b981', fontWeight: 'bold', cursor: 'pointer', marginBottom: '15px', padding: 0 }}
//                                         >
//                                             ← Back to Summary
//                                         </button>
                                        
//                                         <div style={{ display: 'flex', gap: '25px', alignItems: 'flex-start' }}>
//                                             <div style={{ flex: 1 }}>
//                                                 <div style={{ marginBottom: '15px' }}>
//                                                     <label style={{ display: 'block', fontSize: '12px', color: '#9ca3af', fontWeight: 'bold', textTransform: 'uppercase' }}>Tenant Name</label>
//                                                     <p style={{ margin: '5px 0', fontSize: '16px', fontWeight: '600', color: '#1f2937' }}>{selectedTenant.name}</p>
//                                                 </div>

//                                                 <div style={{ marginBottom: '15px' }}>
//                                                     <label style={{ display: 'block', fontSize: '12px', color: '#9ca3af', fontWeight: 'bold', textTransform: 'uppercase' }}>phone Address</label>
//                                                     <p style={{ margin: '5px 0', fontSize: '15px', color: '#4b5563' }}>{selectedTenant.phone}</p>
//                                                 </div>

//                                                 <div style={{ marginBottom: '15px' }}>
//                                                     <label style={{ display: 'block', fontSize: '12px', color: '#9ca3af', fontWeight: 'bold', textTransform: 'uppercase' }}>Phone Number</label>
//                                                     <p style={{ margin: '5px 0', fontSize: '15px', color: '#4b5563' }}>{selectedTenant.phone}</p>
//                                                 </div>

//                                                 <div style={{ marginBottom: '15px' }}>
//                                                     <label style={{ display: 'block', fontSize: '12px', color: '#9ca3af', fontWeight: 'bold', textTransform: 'uppercase' }}>ID Proof</label>
//                                                     <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981', marginTop: '5px', cursor: 'pointer' }}>
//                                                         <span style={{ fontSize: '18px' }}>📄</span>
//                                                         <span style={{ textDecoration: 'underline', fontSize: '14px' }}>{selectedTenant.idProof}</span>
//                                                     </div>
//                                                 </div>

//                                                 <div style={{ marginBottom: '15px' }}>
//                                                     <label style={{ display: 'block', fontSize: '12px', color: '#9ca3af', fontWeight: 'bold', textTransform: 'uppercase' }}>Rental Agreement</label>
//                                                     <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981', marginTop: '5px', cursor: 'pointer' }}>
//                                                         <span style={{ fontSize: '18px' }}>📜</span>
//                                                         <span style={{ textDecoration: 'underline', fontSize: '14px' }}>{selectedTenant.rentalAgreement}</span>
//                                                     </div>
//                                                 </div>
//                                             </div>

//                                             <div style={{ width: '180px' }}>
//                                                 <label style={{ display: 'block', fontSize: '12px', color: '#9ca3af', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '10px' }}>Tenant Photo</label>
//                                                 <div style={{ width: '100%', aspectRatio: '1/1', background: '#f3f4f6', borderRadius: '12px', overflow: 'hidden', border: '2px solid #e5e7eb' }}>
//                                                     <img src={selectedTenant.photo} alt={selectedTenant.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
//                                                 </div>
//                                                 <div style={{ textAlign: 'center', marginTop: '10px' }}>
//                                                     <span className={`status ${selectedTenant.status.toLowerCase()}`} style={{ fontSize: '11px' }}>
//                                                         {selectedTenant.status} verified
//                                                     </span>
//                                                 </div>
//                                             </div>
//                                         </div>
//                                     </div>
//                                 )}
//                             </div>

//                             <div className="modal-footer">
//                                 <button className="modal-close-btn" onClick={closeModal}>Close</button>
//                                 <button className="modal-contact-btn" style={{ background: '#10b981', borderColor: '#10b981' }}>Message Tenant</button>
//                             </div>
//                         </div>
//                     </div>
//                 )}
//             </div>
//         </div>
//     );
// }

// export default Tenants;

