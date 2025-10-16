import React from 'react';

const MembershipPlans = () => {
  return (
    <div className="membership-plans">
      <div className="plans-container">
        {/* Plan 1: Standard (Basic) */}
        <div className="plan-card">
          <div className="plan-header basic">
            <h3 className="plan-title">Standard (Basic)</h3>
          </div>
          <div className="plan-content">
            <div className="plan-section">
              <h4 className="plan-section-title">Description</h4>
              <p className="plan-section-text">Ideal for newcomers. Get access to essential features and stay informed.</p>
            </div>
            <div className="plan-section">
              <h4 className="plan-section-title">Eligibility Criteria</h4>
              <p className="plan-section-text">Open to all registered users. No minimum activity required.</p>
            </div>
            <div className="plan-section">
              <h4 className="plan-section-title">Perks</h4>
              <ul className="plan-perks">
                <li><i className="bi bi-check-lg check-icon"></i>Access to basic features</li>
                <li><i className="bi bi-check-lg check-icon"></i>Monthly newsletter</li>
                <li><i className="bi bi-check-lg check-icon"></i>Community forum access</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Plan 2: Silver (Intermediate) */}
        <div className="plan-card">
          <div className="plan-header silver">
            <h3 className="plan-title">Silver (Intermediate)</h3>
          </div>
          <div className="plan-content">
            <div className="plan-section">
              <h4 className="plan-section-title">Description</h4>
              <p className="plan-section-text">For regular users who want more benefits and advanced features.</p>
            </div>
            <div className="plan-section">
              <h4 className="plan-section-title">Eligibility Criteria</h4>
              <p className="plan-section-text">Must have 3+ months active usage OR completed profile verification.</p>
            </div>
            <div className="plan-section">
              <h4 className="plan-section-title">Perks</h4>
              <ul className="plan-perks">
                <li><i className="bi bi-check-lg check-icon"></i>All Basic perks</li>
                <li><i className="bi bi-check-lg check-icon"></i>Priority customer support</li>
                <li><i className="bi bi-check-lg check-icon"></i>Exclusive webinars & events</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Plan 3: Gold (Premium) */}
        <div className="plan-card">
          <div className="plan-header gold">
            <h3 className="plan-title">Gold (Premium)</h3>
          </div>
          <div className="plan-content">
            <div className="plan-section">
              <h4 className="plan-section-title">Description</h4>
              <p className="plan-section-text">Best for power users or professionals needing full access and VIP treatment.</p>
            </div>
            <div className="plan-section">
              <h4 className="plan-section-title">Eligibility Criteria</h4>
              <p className="plan-section-text">Minimum 6+ months activity OR invite-only based on usage rating.</p>
            </div>
            <div className="plan-section">
              <h4 className="plan-section-title">Perks</h4>
              <ul className="plan-perks">
                <li><i className="bi bi-check-lg check-icon"></i>All Silver perks</li>
                <li><i className="bi bi-check-lg check-icon"></i>1-on-1 consultation sessions</li>
                <li><i className="bi bi-check-lg check-icon"></i>Early access to new features</li>
                <li><i className="bi bi-check-lg check-icon"></i>Premium support hotline</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MembershipPlans;
