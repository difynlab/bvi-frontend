import React from 'react';
import '../../styles/components/ExpertFirmCard.scss';

const ExpertFirmCard = ({ firm, onViewMore, isAdmin = false }) => {
  // Truncate description to 120 characters
  const truncateDescription = (text) => {
    if (!text) return null;
    if (text.length <= 120) return text;
    return text.substring(0, 120).trim() + '...';
  };

  // Get specialization color (default to a neutral color if not found)
  const getSpecializationColor = (specialization) => {
    // Color mapping based on specializations-list.json
    const colorMap = {
      'Accountancy': '#000000',
      'Arbitration': '#464676',
      'Audit': '#000000',
      'Audit and Advisory': '#000000',
      'Authorised Fund and SIBA Rep': '#D35098',
      'Banking': '#489836',
      'Brokers': '#489836',
      'Broker': '#489836',
      'Business/Management Consultants': '#e62b1e',
      'Captive Insurance': '#FBB900',
      'Compliance and Risk': '#AD0703',
      'Corporate Advisory and Valuation': '#E62B1E',
      'Corporate Services': '#E62B1E',
      'Director Services': '#00338E',
      'Family Office': '#F07D00',
      'Financial Planning Services': '#E62B1E',
      'FinTech': '#000000',
      'Forensic Accounting': '#000000',
      'Fund Administration': '#d35098',
      'Fund Managers': '#D35098',
      'Hedge Fund Structuring': '#D35098',
      'ICT': '#000000',
      'Independent Financial Advisors': '#00338E',
      'Industry Body Assocation': '#00338e',
      'Insolvency': '#BFB4AB',
      'Insolvency and Restructuring': '#BFB4AB',
      'Insurance': '#fbb900',
      'Investment Banking': '#489836',
      'Investment Business Representatives': '#D35098',
      'Investment Consultants': '#D35098',
      'Investment Managers': '#d35098',
      'Law': '#464676',
      'Marine Services': '#94D3E2',
      'Marine/Aviation Services': '#94d3e2',
      'Others': '#6b7280',
      'Private Client Wealth Management': '#F07D00',
      'Professional Directorships': '#00338E',
      'Real Estate': '#F07D00',
      'Recovery and Reorganisation': '#BFB4AB',
      'Taxation Practitioners': '#489836',
      'Trust & Company Administration': '#F07D00',
      'Vessel Registrations': '#94d3e2',
      'Yacht Management': '#94d3e2'
    };
    return colorMap[specialization] || '#6b7280';
  };

  const description = truncateDescription(firm.description);
  const hasImage = firm.image !== null && firm.image !== undefined;
  // Handle both relative paths and full URLs
  const imagePath = firm.image 
    ? (firm.image.startsWith('http://') || firm.image.startsWith('https://') || firm.image.startsWith('/'))
      ? firm.image
      : `/${firm.image}`
    : null;
  const specializationColor = getSpecializationColor(firm.specialization);

  // Format website URL
  const formatWebsite = (website) => {
    if (!website) return null;
    if (website.startsWith('http://') || website.startsWith('https://')) {
      return website;
    }
    return `https://${website}`;
  };

  const websiteUrl = formatWebsite(firm.website);

  return (
    <div className="expert-firm-card">
      {/* Header with image */}
      <div className="expert-firm-card__header">
        {hasImage ? (
          <img 
            src={imagePath} 
            alt={firm.name}
            className="expert-firm-card__image"
            onError={(e) => {
              // Fallback to white div if image fails to load
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'block';
            }}
          />
        ) : null}
        <div 
          className="expert-firm-card__image-placeholder"
          style={{ display: hasImage ? 'none' : 'block' }}
        />
      </div>

      {/* Body with information */}
      <div className="expert-firm-card__body">
        {/* Specialization badge and Website */}
        <div className="expert-firm-card__top-row">
          <span 
            className="expert-firm-card__specialization"
            style={{ 
              backgroundColor: `${specializationColor}20`, 
              color: specializationColor,
              borderColor: specializationColor
            }}
          >
            {firm.specialization}
          </span>
          <div className="expert-firm-card__website">
            {websiteUrl ? (
              <a 
                href={websiteUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="expert-firm-card__website-link"
              >
                <i className="bi bi-globe" aria-hidden="true"></i>
                <span>Website</span>
              </a>
            ) : (
              <span className="expert-firm-card__website-disabled">
                <i className="bi bi-globe" aria-hidden="true"></i>
                <span>Website</span>
              </span>
            )}
          </div>
        </div>

        {/* Firm name */}
        <h3 className="expert-firm-card__name">{firm.name}</h3>

        {/* Description */}
        <div className="expert-firm-card__description">
          {description ? (
            <p>{description}</p>
          ) : (
            <p className="expert-firm-card__description-empty">No description available</p>
          )}
        </div>

        {/* Contact information */}
        <div className="expert-firm-card__contact">
          {/* Phone */}
          <div className="expert-firm-card__contact-item">
            <i className="bi bi-telephone-fill" aria-hidden="true"></i>
            <span>
              {firm.phone || 'No available phone number'}
            </span>
          </div>

          {/* Email */}
          <div className="expert-firm-card__contact-item">
            <i className="bi bi-envelope-fill" aria-hidden="true"></i>
            <span>
              {firm.email || 'No available mail'}
            </span>
          </div>
        </div>

        {/* View More Details button */}
        <button 
          type="button"
          className={`expert-firm-card__button ${isAdmin ? 'expert-firm-card__button--admin' : ''}`}
          onClick={() => onViewMore && onViewMore(firm)}
        >
          {isAdmin ? (
            <>
              <i className="bi bi-pencil-square" aria-hidden="true"></i>
              <span>Edit details</span>
            </>
          ) : (
            <span>View More Details</span>
          )}
        </button>
      </div>
    </div>
  );
};

export default ExpertFirmCard;

