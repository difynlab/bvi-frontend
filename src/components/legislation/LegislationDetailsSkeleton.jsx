import React from 'react';
import '../../styles/sections/Legislation.scss';

const metaRows = [
  { labelWidth: '70px', valueWidth: '260px' },  // Title
  { labelWidth: '82px', valueWidth: '240px' },  // Category
  { labelWidth: '130px', valueWidth: '120px' }, // Legislation Type
  { labelWidth: '96px', valueWidth: '110px' },  // Jurisdiction
  { labelWidth: '60px', valueWidth: '95px' },   // Status
  { labelWidth: '110px', valueWidth: '130px' }, // Date Enacted
  { labelWidth: '120px', valueWidth: '130px' }, // Effective Date
  { labelWidth: '110px', valueWidth: '130px' }, // Last Amended
  { labelWidth: '150px', valueWidth: '210px' }  // Reference Number
];

const summaryLines = ['100%', '95%', '68%'];
const keyProvisionLines = ['98%', '96%', '93%', '88%'];
const amendmentItems = [
  { dateWidth: '130px', textWidth: '68%' },
  { dateWidth: '130px', textWidth: '72%' },
  { dateWidth: '130px', textWidth: '65%' }
];
const responsibleLines = ['100%', '85%', '60%'];

const LegislationDetailsSkeleton = () => {
  return (
    <div className="legislation-container legislation-skeleton">
      <div className="legislation-skeleton__meta">
        {metaRows.map((row, index) => (
          <React.Fragment key={`meta-${index}`}>
            <span
              className="legislation-skeleton__meta-label legislation-skeleton__shimmer"
              style={{ width: row.labelWidth }}
            />
            <span
              className="legislation-skeleton__meta-value legislation-skeleton__shimmer"
              style={{ width: row.valueWidth }}
            />
          </React.Fragment>
        ))}
      </div>

      <div className="legislation-divider"></div>

      <section className="legislation-skeleton__section">
        <span className="legislation-skeleton__section-heading legislation-skeleton__shimmer" />
        <div className="legislation-skeleton__paragraph">
          {summaryLines.map((width, index) => (
            <span
              className="legislation-skeleton__line legislation-skeleton__shimmer"
              key={`summary-line-${index}`}
              style={{ width }}
            />
          ))}
        </div>
      </section>

      <div className="legislation-divider"></div>

      <section className="legislation-skeleton__section">
        <span className="legislation-skeleton__section-heading legislation-skeleton__shimmer" />
        <div className="legislation-skeleton__list">
          {keyProvisionLines.map((width, index) => (
            <div className="legislation-skeleton__list-item" key={`key-provision-${index}`}>
              <span className="legislation-skeleton__bullet legislation-skeleton__shimmer" />
              <span
                className="legislation-skeleton__line legislation-skeleton__shimmer"
                style={{ width }}
              />
            </div>
          ))}
        </div>
      </section>

      <div className="legislation-divider"></div>

      <section className="legislation-skeleton__section">
        <span className="legislation-skeleton__section-heading legislation-skeleton__shimmer" />
        <div className="legislation-skeleton__list legislation-skeleton__list--amendments">
          {amendmentItems.map((item, index) => (
            <div className="legislation-skeleton__amendment-row" key={`amendment-${index}`}>
              <span
                className="legislation-skeleton__amendment-date legislation-skeleton__shimmer"
                style={{ width: item.dateWidth }}
              />
              <span
                className="legislation-skeleton__amendment-text legislation-skeleton__shimmer"
                style={{ width: item.textWidth }}
              />
            </div>
          ))}
        </div>
      </section>

      <div className="legislation-divider"></div>

      <section className="legislation-skeleton__section">
        <span className="legislation-skeleton__section-heading legislation-skeleton__shimmer" />
        <div className="legislation-skeleton__paragraph">
          {responsibleLines.map((width, index) => (
            <span
              className="legislation-skeleton__line legislation-skeleton__shimmer"
              key={`responsible-line-${index}`}
              style={{ width }}
            />
          ))}
        </div>
      </section>
    </div>
  );
};

export default LegislationDetailsSkeleton;

