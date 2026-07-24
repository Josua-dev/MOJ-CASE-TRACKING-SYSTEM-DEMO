import React from 'react';

export default function Logo({ variant = 'sidebar', className = '' }) {
  const isLarge = variant === 'login';

  return (
    <div className={`moj-logo moj-logo-${variant} ${className}`}>
      <img
        src={`${process.env.PUBLIC_URL}/images/namibia-coat-of-arms.svg`}
        alt="Republic of Namibia Coat of Arms"
        className="moj-logo-crest"
        style={{
          width: isLarge ? 56 : 32,
          height: isLarge ? 56 : 32,
          display: 'block',
        }}
      />
      {variant !== 'icon-only' && (
        <div className="moj-logo-text">
          <span className="moj-logo-ministry">Ministry of Justice</span>
          <span className="moj-logo-republic">Republic of Namibia</span>
        </div>
      )}
    </div>
  );
}
