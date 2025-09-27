import React from 'react';
import Card from '../../components/Card';
import '../../styles/sections/Membership.scss';

const Membership = () => {
  return (
    <div className="membership-page">
      <div className="membership-container">
        <div className="membership-header">
          <div className="membership-header-title">
            <h1>Membership</h1>
            <p>Manage membership details</p>
          </div>
        </div>

        <div className="membership">
          {/* Left Column */}
          <div className="membership-left">
        {/* My Profile Section */}
        <Card title="My Profile" className="profile-section">
          <div className="profile-info">
            <div className="profile-field">
              <label>Name:</label>
              <span>John Doe</span>
            </div>
            <div className="profile-field">
              <label>Email:</label>
              <span>john.doe@example.com</span>
            </div>
            <div className="profile-field">
              <label>Lorem:</label>
              <span>Lorem ipsum dolor sit amet</span>
            </div>
          </div>
          <div className="profile-actions">
            <a href="/settings" className="edit-link">Edit Profile</a>
          </div>
        </Card>

        {/* Payment History Section */}
        <Card title="Payment History" className="payment-section">
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th scope="col">Date</th>
                  <th scope="col">Amount</th>
                  <th scope="col">Status</th>
                  <th scope="col">Receipt</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>2024-01-15</td>
                  <td>$99.00</td>
                  <td>Completed</td>
                  <td><a href="#" className="receipt-link">View</a></td>
                </tr>
                <tr>
                  <td>2024-01-10</td>
                  <td>$49.00</td>
                  <td>Completed</td>
                  <td><a href="#" className="receipt-link">View</a></td>
                </tr>
                <tr>
                  <td>2024-01-05</td>
                  <td>$25.00</td>
                  <td className="status-pending">
                    <span className="pending-text">Processing</span>
                    <span className="spinner"></span>
                  </td>
                  <td><a href="#" className="receipt-link">View</a></td>
                </tr>
                <tr>
                  <td>2023-12-20</td>
                  <td>$99.00</td>
                  <td>Completed</td>
                  <td><a href="#" className="receipt-link">View</a></td>
                </tr>
                <tr>
                  <td>2023-12-15</td>
                  <td>$75.00</td>
                  <td>Completed</td>
                  <td><a href="#" className="receipt-link">View</a></td>
                </tr>
                <tr>
                  <td>2023-12-10</td>
                  <td>$50.00</td>
                  <td>Completed</td>
                  <td><a href="#" className="receipt-link">View</a></td>
                </tr>
                <tr>
                  <td>2023-12-05</td>
                  <td>$30.00</td>
                  <td>Completed</td>
                  <td><a href="#" className="receipt-link">View</a></td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>

        {/* Member Details Section */}
        <Card title="Member Details" className="member-details-section">
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th scope="col">Member ID</th>
                  <th scope="col">Name</th>
                  <th scope="col">Membership Type</th>
                  <th scope="col">Payment Receipt</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>MEM001</td>
                  <td>John Doe</td>
                  <td>Premium</td>
                  <td><a href="#" className="download-link">Download</a></td>
                </tr>
                <tr>
                  <td>MEM002</td>
                  <td>Jane Smith</td>
                  <td>Standard</td>
                  <td><a href="#" className="download-link">Download</a></td>
                </tr>
                <tr>
                  <td>MEM003</td>
                  <td>Bob Johnson</td>
                  <td>Premium</td>
                  <td><a href="#" className="download-link">Download</a></td>
                </tr>
                <tr>
                  <td>MEM004</td>
                  <td>Alice Brown</td>
                  <td>Basic</td>
                  <td><a href="#" className="download-link">Download</a></td>
                </tr>
                <tr>
                  <td>MEM005</td>
                  <td>Charlie Wilson</td>
                  <td>Standard</td>
                  <td><a href="#" className="download-link">Download</a></td>
                </tr>
                <tr>
                  <td>MEM006</td>
                  <td>Diana Davis</td>
                  <td>Premium</td>
                  <td><a href="#" className="download-link">Download</a></td>
                </tr>
                <tr>
                  <td>MEM007</td>
                  <td>Eve Miller</td>
                  <td>Basic</td>
                  <td><a href="#" className="download-link">Download</a></td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Right Column */}
      <div className="membership-right">
        {/* Membership Status Section */}
        <Card title="Membership Status" className="status-section">
          <div className="status-banner">
            <div className="status-header">
              <div className="status-badge active">ACTIVE</div>
            </div>
            <div className="status-info">
              <p className="valid-until">Valid until: August 15, 2025</p>
            </div>
            <div className="status-actions">
              <button type="button" className="btn btn-primary">Renew Membership</button>
              <button type="button" className="btn btn-secondary">Upgrade</button>
            </div>
            <div className="status-links">
              <a href="#" className="subscription-link">Edit Membership Subscription</a>
            </div>
          </div>
        </Card>

        {/* Membership Details Section */}
        <Card title="Membership Details" className="details-section">
          <ul className="benefits-list">
            <li className="benefit-item">
              <span className="check-icon">✓</span>
              <span className="benefit-text">Access to premium content and resources</span>
            </li>
            <li className="benefit-item">
              <span className="check-icon">✓</span>
              <span className="benefit-text">Priority customer support</span>
            </li>
            <li className="benefit-item">
              <span className="check-icon">✓</span>
              <span className="benefit-text">Exclusive member events and webinars</span>
            </li>
            <li className="benefit-item">
              <span className="check-icon">✓</span>
              <span className="benefit-text">Advanced analytics and reporting tools</span>
            </li>
            <li className="benefit-item">
              <span className="check-icon">✓</span>
              <span className="benefit-text">Unlimited downloads and exports</span>
            </li>
          </ul>
        </Card>

        {/* Upcoming Events Section */}
        <Card title="Upcoming Events" className="membership-events-section">
          <ul className="membership-events-list">
            <li className="membership-event-item">
              <span className="membership-event-dot blue"></span>
              <div className="membership-event-content">
                <div className="membership-event-title">Annual Conference 2024</div>
                <div className="membership-event-datetime">March 15, 2024 at 9:00 AM EST</div>
              </div>
            </li>
            <li className="membership-event-item">
              <span className="membership-event-dot red"></span>
              <div className="membership-event-content">
                <div className="membership-event-title">Member Networking Event</div>
                <div className="membership-event-datetime">March 22, 2024 at 6:00 PM EST</div>
              </div>
            </li>
            <li className="membership-event-item">
              <span className="membership-event-dot blue"></span>
              <div className="membership-event-content">
                <div className="membership-event-title">Workshop: Advanced Techniques</div>
                <div className="membership-event-datetime">March 28, 2024 at 2:00 PM EST</div>
              </div>
            </li>
            <li className="membership-event-item">
              <span className="membership-event-dot red"></span>
              <div className="membership-event-content">
                <div className="membership-event-title">Q1 Review Meeting</div>
                <div className="membership-event-datetime">April 5, 2024 at 10:00 AM EST</div>
              </div>
            </li>
            <li className="membership-event-item">
              <span className="membership-event-dot blue"></span>
              <div className="membership-event-content">
                <div className="membership-event-title">Training Session: New Features</div>
                <div className="membership-event-datetime">April 12, 2024 at 3:00 PM EST</div>
              </div>
            </li>
            <li className="membership-event-item">
              <span className="membership-event-dot red"></span>
              <div className="membership-event-content">
                <div className="membership-event-title">Community Meetup</div>
                <div className="membership-event-datetime">April 18, 2024 at 7:00 PM EST</div>
              </div>
            </li>
          </ul>
        </Card>
      </div>
    </div>
  </div>
</div>
  );
};

export default Membership;
