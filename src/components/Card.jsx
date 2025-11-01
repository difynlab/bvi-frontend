import React from 'react';

const Card = ({ title, children, className = '', headerActions }) => {
  return (
    <section className={`card ${className}`}>
      {(title || headerActions) && (
        <div className="card-header">
          {title && <h2 className="card-title">{title}</h2>}
          {headerActions && <div className="card-header-actions">{headerActions}</div>}
        </div>
      )}
      <div className="card-content">
        {children}
      </div>
    </section>
  );
};

export default Card;
