import React from 'react';

const Card = ({ title, children, className = '' }) => {
  return (
    <section className={`card ${className}`}>
      {title && <h2 className="card-title">{title}</h2>}
      <div className="card-content">
        {children}
      </div>
    </section>
  );
};

export default Card;
