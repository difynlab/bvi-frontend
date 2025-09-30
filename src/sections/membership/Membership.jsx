import React from 'react';
import Card from '../../components/Card';
import '../../styles/sections/Membership.scss';
import { NavLink } from 'react-router-dom';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { useMembershipData } from '../../hooks/useMembershipData';

// TODO BACKEND: Replace localStorage/context source with a secure API call:
// fetch('/api/me', { credentials: 'include' }).then(res => res.json())...

const Membership = () => {
  const { name, email } = useCurrentUser();
  const { paymentHistory, memberDetails, upcomingEvents, loading } = useMembershipData();
  const safeName = name && name.trim() ? name : '—';
  const safeEmail = email && email.trim() ? email : '—';
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
          <div className="membership-left">
            <Card title="My Profile" className="profile-section">
              <div className="profile-info">
                <div className="profile-field">
                  <label>Name:</label>
                  <span>{safeName}</span>
                </div>
                <div className="profile-field">
                  <label>Email:</label>
                  <span>{safeEmail}</span>
                </div>
                <div className="profile-field">
                  <label>Lorem:</label>
                  <span>Lorem ipsum dolor sit amet</span>
                </div>
              </div>
              <div className="profile-actions">
                <NavLink to="/settings" className="edit-link">Edit Profile</NavLink>
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
                    {paymentHistory.map((payment) => (
                      <tr key={payment.id}>
                        <td>{payment.dateISO}</td>
                        <td>${payment.amount.toFixed(2)}</td>
                        <td className={payment.status === 'Pending' ? 'status-pending' : ''}>
                          {payment.status === 'Pending' ? (
                            <span className="pending-text">Pending</span>
                          ) : (
                            payment.status
                          )}
                        </td>
                        <td>
                          {payment.status === 'Pending' ? (
                            <span className="processing-status">
                              <i className="bi bi-arrow-repeat"></i>
                              <span>Processing</span>
                            </span>
                          ) : (
                            <a href={payment.receiptUrl} className="receipt-link">Download</a>
                          )}
                        </td>
                      </tr>
                    ))}
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
                    {memberDetails.map((member) => (
                      <tr key={member.id}>
                        <td>{member.id}</td>
                        <td>{member.name}</td>
                        <td>{member.membershipType}</td>
                        <td><a href={member.receiptUrl} className="download-link">Download</a></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>

          {/* Right Column */}
          <div className="membership-right">
            {/* Membership Status Section */}
            <Card className="status-section">
              <div className="status-banner">
                <div className="status-header">
                  <div className="plan-image">
                    <img src='gold-plan.png' alt="logo" />
                  </div>
                  <div className="status-header-info">
                    <div className="status-title-row">
                      <h2 className="card-title">Membership Status</h2>
                      <div className="status-badge active">ACTIVE</div>
                    </div>
                    <p className="valid-until">Valid until: August 15, 2025</p>
                  </div>
                </div>
                <div className="status-actions">
                  <button type="button" className="btn btn-renew">Renew Membership</button>
                  <button type="button" className="btn btn-upgrade">Upgrade</button>
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
                  <i className="bi bi-check-lg check-icon"></i>
                  <span className="benefit-text">Access to premium content and resources</span>
                </li>
                <li className="benefit-item">
                  <i className="bi bi-check-lg check-icon"></i>
                  <span className="benefit-text">Priority customer support</span>
                </li>
                <li className="benefit-item">
                  <i className="bi bi-check-lg check-icon"></i>
                  <span className="benefit-text">Exclusive member events and webinars</span>
                </li>
                <li className="benefit-item">
                  <i className="bi bi-check-lg check-icon"></i>
                  <span className="benefit-text">Advanced analytics and reporting tools</span>
                </li>
                <li className="benefit-item">
                  <i className="bi bi-check-lg check-icon"></i>
                  <span className="benefit-text">Unlimited downloads and exports</span>
                </li>
              </ul>
            </Card>

            {/* Upcoming Events Section */}
            <Card title="Upcoming Events" className="membership-events-section">
              <ul className="membership-events-list">
                {upcomingEvents.length > 0 ? (
                  upcomingEvents.map((event) => (
                    <li key={event.id} className="membership-event-item">
                      <span className="membership-event-dot blue"></span>
                      <div className="membership-event-content">
                        <div className="membership-event-title">{event.title}</div>
                        <div className="membership-event-datetime">
                          {new Date(event.date || event.dateISO || event.publishedAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            timeZoneName: 'short'
                          })}
                        </div>
                      </div>
                    </li>
                  ))
                ) : (
                  <li className="membership-event-item">
                    <div className="membership-event-content">
                      <div className="membership-event-title">No upcoming events</div>
                    </div>
                  </li>
                )}
              </ul>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Membership;
