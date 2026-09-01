import { useState } from 'react';
import './UserForm.css';

const UserForm = () => {
  const [consent, setConsent] = useState(false);
  const [userType, setUserType] = useState('');
  const [name, setName] = useState('');
  const [number, setNumber] = useState('');
  const [propertyName, setPropertyName] = useState('');
  const [description, setDescription] = useState('');

  const [errors, setErrors] = useState({});
  const [submittedData, setSubmittedData] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const handleClear = () => {
    setConsent(false);
    setUserType('');
    setName('');
    setNumber('');
    setPropertyName('');
    setDescription('');
    setErrors({});
    setSubmittedData(null);
    setSubmitError('');
  };

  const validateForm = () => {
    const newErrors = {};
    if (!userType) {
      newErrors.userType = 'Please select a user type';
    }
    
    const trimmedName = name.trim();
    if (!trimmedName) {
      newErrors.name = 'Name is required';
    } else if (trimmedName.length < 2) {
      newErrors.name = 'Name must be at least 2 characters long';
    } else if (!/^[A-Za-z\s]+$/.test(trimmedName)) {
      newErrors.name = 'Name can only contain alphabetic letters and spaces';
    }

    const trimmedNumber = number.trim();
    if (!trimmedNumber) {
      newErrors.number = 'Phone Number is required';
    } else if (!/^[6-9]\d{9}$/.test(trimmedNumber)) {
      newErrors.number = 'Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9';
    }

    if (userType === 'owner') {
      const trimmedProp = propertyName.trim();
      if (!trimmedProp) {
        newErrors.propertyName = 'Property Name is required';
      } else if (trimmedProp.length < 3) {
        newErrors.propertyName = 'Property Name must be at least 3 characters long';
      }
    }

    if (!consent) {
      newErrors.consent = 'You must agree to the personal information collection consent to delete your account';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (validateForm()) {
      setIsSubmitting(true);
      setSubmitError('');
      const payload = { userType, name, number, propertyName, description };

      try {
        const response = await fetch('http://192.168.88.17:8000/api/account-deletion-request/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload)
        });

        if (response.ok) {
          setSubmittedData(payload);
        } else {
          setSubmitError('Failed to send request. Please try again.');
        }
      } catch (err) {
        setSubmitError('Network error. Please make sure the server is running.');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  if (submittedData) {
    return (
      <div className="ms-form-container">
        <div className="ms-card" style={{ textAlign: 'center', padding: '40px 24px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#f0e6ff', marginBottom: '24px' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#6c22f5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <h2 className="ms-title" style={{ fontSize: '24px', marginBottom: '12px' }}>Request Submitted Successfully</h2>
          <p className="ms-description" style={{ fontSize: '15px', color: '#4b5563', lineHeight: '1.6', margin: '0 auto 24px', maxWidth: '420px' }}>
            We will verify your identity and delete your account within 7 business days.
          </p>
          <div style={{ margin: '24px 0', borderTop: '1px solid #f3f4f6' }}></div>
          <button className="ms-clear-btn" onClick={handleClear} style={{ fontWeight: '600' }}>Submit another response</button>
        </div>
      </div>
    );
  }

  return (
    <div className="ms-form-container">
      <div className="ms-card">
        <h1 className="ms-title" style={{ fontSize: '24px', marginBottom: '16px' }}>Rennto Account Deletion Request Form</h1>
        
        <div style={{
          backgroundColor: '#f9fafb',
          borderLeft: '4px solid #6c22f5',
          padding: '16px 20px',
          borderRadius: '4px 8px 8px 4px',
          marginBottom: '24px',
          lineHeight: '1.6'
        }}>
          <p style={{ fontSize: '14px', color: '#1f2937', fontWeight: '500', margin: '0 0 10px' }}>
            This form is used to request permanent deletion of your Rennto account.
          </p>
          <ul style={{ fontSize: '13px', color: '#4b5563', margin: '0 0 12px 18px', padding: 0 }}>
            <li style={{ marginBottom: '6px' }}>Please complete the form using the same details used while registering in the Rennto application.</li>
            <li style={{ marginBottom: '6px' }}>Your request will be verified by our team before deletion.</li>
            <li style={{ marginBottom: '0', color: '#dc2626', fontWeight: '500' }}>⚠️ Once your account is deleted, it cannot be recovered.</li>
          </ul>
          <p style={{ fontSize: '12px', color: '#6b7280', margin: '0' }}>
            For questions, contact us at: <a href="mailto:support@rennto.in" style={{ color: '#6c22f5', textDecoration: 'none', fontWeight: '600' }}>support@rennto.in</a>
          </p>
        </div>

        <div className="ms-required-note" style={{ margin: '0 0 24px' }}><span style={{ color: '#c62828' }}>*</span> Required</div>

        <div className="ms-question">
          <div className="ms-question-title required">1. Are you a Tenant or Owner?</div>
          {errors.userType && <div className="ms-error-text" style={{ marginBottom: '8px', marginTop: '-8px' }}>{errors.userType}</div>}
          <select
            className="ms-select"
            value={userType}
            onChange={(e) => {
              setUserType(e.target.value);
              setPropertyName('');
            }}
          >
            <option value="">Select your answer</option>
            <option value="tenant">Tenant</option>
            <option value="owner">Owner</option>
          </select>
        </div>

        {userType && (
          <>
            <div className="ms-question">
              <div className="ms-question-title required">2. Name</div>
              {errors.name && <div className="ms-error-text" style={{ marginBottom: '8px', marginTop: '-8px' }}>{errors.name}</div>}
              <input
                type="text"
                className="ms-input"
                placeholder="Enter your answer"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="ms-question">
              <div className="ms-question-title required">3. Phone Number</div>
              {errors.number && <div className="ms-error-text" style={{ marginBottom: '8px', marginTop: '-8px' }}>{errors.number}</div>}
              <input
                type="number"
                className="ms-input"
                placeholder="Enter your answer"
                value={number}
                onChange={(e) => setNumber(e.target.value)}
              />
            </div>

            {userType === 'owner' && (
              <div className="ms-question">
                <div className="ms-question-title required">4. Property Name</div>
                <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '-8px', marginBottom: '8px' }}>
                  Please enter the details exactly as per registered property.
                </div>
                {errors.propertyName && <div className="ms-error-text" style={{ marginBottom: '8px', marginTop: '-8px' }}>{errors.propertyName}</div>}
                <input
                  type="text"
                  className="ms-input"
                  placeholder="Enter registered property name"
                  value={propertyName}
                  onChange={(e) => setPropertyName(e.target.value)}
                />
              </div>
            )}

            <div className="ms-question">
              <div className="ms-question-title">
                {userType === 'owner' ? '5. Description (Optional)' : '4. Description (Optional)'}
              </div>
              <textarea
                className="ms-input"
                placeholder="Enter your answer"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                style={{ resize: 'vertical', fontFamily: 'inherit', padding: '12px' }}
              />
            </div>

            <div className="ms-question" style={{ marginTop: '32px' }}>
              <div className="ms-radio-group">
                <label className="ms-radio-label" style={{ alignItems: 'flex-start' }}>
                  <input
                    type="checkbox"
                    className="ms-radio-input"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                    style={{ marginTop: '2px', borderRadius: '4px', accentColor: '#6c22f5' }}
                  />
                  <span style={{ fontSize: '13px', color: '#374151', lineHeight: '1.5' }}>
                    I agree to the collection and usage of my personal information for account deletion. <span style={{ color: '#c62828' }}>*</span>
                  </span>
                </label>
              </div>
              {errors.consent && <div className="ms-error-text" style={{ marginTop: '8px' }}>{errors.consent}</div>}
            </div>

            {submitError && <div className="ms-error-text" style={{ marginTop: '12px', textAlign: 'center', fontSize: '14px' }}>{submitError}</div>}
            <div className="ms-buttons">
              <button className="ms-btn ms-btn-primary" onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? 'Submitting...' : 'Submit Request'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default UserForm;
