import React from 'react';

export default function EmptyPage({
  isAdmin = false,
  title = '',
  description = null,
  className = '',
  adminImgSrc = '/empty-state-admin.png',
  userImgSrc = '/empty-state-user.png',
}) {
  const rootClass = ['empty-state', className].filter(Boolean).join(' ');
  const imgSrc = isAdmin ? adminImgSrc : userImgSrc;
  // IMPORTANT: keep class "empty-state-user" on the user image to match existing per-section SCSS sizing
  const imgClass = isAdmin ? '' : 'empty-state-user';

  return (
    <div className={rootClass}>
      <img src={imgSrc} alt="" className={imgClass} />
      {title ? <h2>{title}</h2> : null}
      {description ? <p>{description}</p> : null}
    </div>
  );
}
