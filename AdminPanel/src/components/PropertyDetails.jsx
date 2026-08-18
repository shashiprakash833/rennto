import React from 'react';

function PropertyDetails({ property, onClose }) {
  return (
    <div className="modal-overlay">
      <div className="modal-content property-details-modal">
        <div className="modal-header">
          <h2 className="modal-title">Property Details</h2>
          <button onClick={onClose} className="close-btn">×</button>
        </div>

        <div className="property-details-content">
          <div
            className="property-detail-header"
            style={{ backgroundColor: property.color }}
          >
            <div className="property-detail-icon">
              {property.icon}
            </div>
          </div>

          <div className="property-detail-info">
            <h3 className="property-detail-name">{property.name}</h3>

            <div className="detail-section">
              <h4>Location</h4>
              <p>{property.location}</p>
            </div>

            <div className="detail-section">
              <h4>Owner</h4>
              <p>{property.owner}</p>
            </div>

            <div className="detail-section">
              <h4>Status</h4>
              <span
                className="status-badge large"
                style={{
                  background: property.status === "Rented" ? "#fee2e2" : "#d1fae5",
                  color: property.status === "Rented" ? "#991b1b" : "#065f46"
                }}
              >
                {property.status}
              </span>
            </div>
          </div>
        </div>

        <div className="modal-actions">
          <button onClick={onClose} className="btn-secondary">
            Close
          </button>
          <button className="btn-primary">
            Edit Property
          </button>
        </div>
      </div>
    </div>
  );
}

export default PropertyDetails;
