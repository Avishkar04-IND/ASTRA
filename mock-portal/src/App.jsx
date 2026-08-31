import { useState } from 'react';
import './index.css';

function App() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="gov-container">
      <header className="gov-header">
        <div className="gov-header-inner">
          <div className="gov-logo">
            <img src="https://upload.wikimedia.org/wikipedia/commons/f/fe/Seal_of_Maharashtra.svg" alt="Gov Logo" width="60" />
            <div>
              <h1>Government of Maharashtra</h1>
              <p>Department of Higher and Technical Education</p>
            </div>
          </div>
        </div>
      </header>

      <main className="gov-main">
        <div className="form-wrapper">
          <div className="form-header">
            <h2>Maharashtra State Scholarship Application</h2>
            <p className="form-subtitle">Academic Year 2026-2027</p>
          </div>

          {submitted ? (
            <div className="success-message">
              <h3>Application Submitted Successfully</h3>
              <p>Your scholarship application has been recorded. Your reference ID is: MH-{Math.floor(Math.random() * 100000)}</p>
              <button className="gov-btn" onClick={() => setSubmitted(false)}>Submit Another</button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="gov-form">
              <div className="form-group">
                <label htmlFor="applicant_name">Full Name (as per Aadhaar) <span className="req">*</span></label>
                <input type="text" id="applicant_name" name="applicant_name" required />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="aadhaar">Aadhaar Number <span className="req">*</span></label>
                  <input type="text" id="aadhaar" name="aadhaar" maxLength="12" required />
                </div>
                <div className="form-group">
                  <label htmlFor="pan">PAN Number</label>
                  <input type="text" id="pan" name="pan" maxLength="10" />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="dob">Date of Birth <span className="req">*</span></label>
                  <input type="date" id="dob" name="dob" required />
                </div>
                <div className="form-group">
                  <label htmlFor="mobile">Mobile Number <span className="req">*</span></label>
                  <input type="text" id="mobile" name="mobile" maxLength="10" required />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="email">Email Address <span className="req">*</span></label>
                <input type="email" id="email" name="email" required />
              </div>

              <div className="form-group">
                <label htmlFor="address">Permanent Address <span className="req">*</span></label>
                <textarea id="address" name="address" rows="3" required></textarea>
              </div>

              <div className="form-group">
                <label htmlFor="tenth_pct">10th Percentage <span className="req">*</span></label>
                {/* Intentionally strict maxlength="3" to trigger MahaSetu format mismatch detection */}
                <input type="text" id="tenth_pct" name="tenth_pct" maxLength="3" placeholder="e.g. 85" required />
                <small className="help-text">Enter percentage without decimals</small>
              </div>

              <div className="form-actions">
                <button type="submit" className="gov-btn gov-btn-primary">Submit Application</button>
                <button type="reset" className="gov-btn gov-btn-secondary">Reset</button>
              </div>
            </form>
          )}
        </div>
      </main>

      <footer className="gov-footer">
        <p>© 2026 Government of Maharashtra. All rights reserved.</p>
        <p className="footer-links">
          <a href="#">Privacy Policy</a> | <a href="#">Terms & Conditions</a> | <a href="#">Contact Us</a>
        </p>
      </footer>
    </div>
  );
}

export default App;
