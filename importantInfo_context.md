## Important Info Tab Overview

- **Where it appears**
  - `src/sections/membership/Membership.jsx`: pestaña para administradores junto con `Member List` y `Membership Plans`. Renderiza tres tarjetas y, al cerrar el modal, fuerza un refresh (`setCardDataRefresh`) para traer datos nuevamente.
  - `src/sections/subscription/Subscription.jsx`: paso inicial de la experiencia de suscripción; tanto admins como miembros ven las mismas tarjetas y pueden abrir el modal reutilizable.

```1077:1108:src/sections/membership/Membership.jsx
{adminActiveTab === 'Important Info' && (
  <section key={`important-info-${cardDataRefresh}`} className="membership-admin-panel membership-admin-panel--important">
    <div className="membership-admin-cards">
      <div className="membership-admin-card" onClick={() => setOpenInfo('eligibility')}>
        <div className="membership-admin-card__icon" aria-hidden="true"><i className="bi bi-people"></i></div>
        <h3 className="membership-admin-card__title">{getCardData('eligibility').title}</h3>
        <p className="membership-admin-card__text">
          {getCardData('eligibility').subtitle}
        </p>
        <a href="#" className="membership-admin-card__link">Edit Details</a>
      </div>
      {/* ...benefits & payment cards... */}
    </div>
  </section>
)}
```

```143:175:src/sections/subscription/Subscription.jsx
{activeTab === 'Important Info' && (
  <section key="important-info" className="subscription-panel subscription-panel--important">
    <div className="subscription-cards">
      <div className="subscription-card" onClick={() => handleOpen('eligibility')}>
        <div className="subscription-card__icon" aria-hidden="true"><i className="bi bi-people"></i></div>
        <h3 className="subscription-card__title">Membership Eligibility</h3>
        <p className="subscription-card__text">
          Eligibility to membership of BVI Finance shall be limited to the companies, firms, entities, bodies and associations
        </p>
        <a href="#" className="subscription-card__link">View Details</a>
      </div>
      {/* ...benefits & payment cards... */}
    </div>
  </section>
)}
```

## Datos que maneja

- Cada tarjeta se ata a una clave fija (`infoKey`): `eligibility`, `benefits`, `payment`.
- El modal `SubscriptionInfoModal` usa:
  - Un mapa de defaults (`title`, `subtitle`, `img`).
  - Overrides guardados en `localStorage` bajo `subscription-data-${infoKey}` (`{ title, subtitle, img }`).
  - Compatibilidad con formato antiguo mediante `subscription-image-${infoKey}` (solo imagen).
- El campo `img` se persiste como Data URL (Base64) cuando un admin sube una imagen.

```31:112:src/components/modals/SubscriptionInfoModal.jsx
const MAP = {
  eligibility: { title: 'Membership Eligibility', subtitle: '...', img: '/images/membership-elegibility.png' },
  benefits: { ... },
  payment: { ... }
};

const getSavedData = () => {
  const savedData = localStorage.getItem(`subscription-data-${infoKey}`);
  if (savedData) {
    return JSON.parse(savedData);
  }
  return getDefaultData();
};

const handleUploaded = (data) => {
  if (typeof data === 'string') {
    localStorage.setItem(`subscription-image-${infoKey}`, data);
  } else {
    const dataToSave = { title: newTitle, subtitle: newSubtitle, img: newImage };
    localStorage.setItem(`subscription-data-${infoKey}`, JSON.stringify(dataToSave));
    if (newImage) localStorage.setItem(`subscription-image-${infoKey}`, newImage);
  }
};
```

## Edición y flujo

- Solo admins (`user.role === 'admin'`) ven acciones de edición dentro del modal.
- `SubscriptionUploadModal` permite subir imagen (máx 5 MB), editar título/descripción y devuelve payload al modal principal.
- `SubscriptionInfoModal` guarda/discard cambios en `localStorage`. `Membership` refresca tarjetas tras cerrar el modal; `Subscription` muestra siempre el contenido por defecto en las tarjetas, pero el modal refleja lo persistido.

## Consideraciones para migrar a servicio/backend

- Reemplazar `localStorage` por endpoints del nuevo servicio:
  - Lectura en `getCardData` (`Membership.jsx`).
  - Lectura/escritura en `SubscriptionInfoModal` (`getSavedData`, `handleSave*`, `handleDiscard*`, `handleUploaded`).
- Definir API con claves (`eligibility`, `benefits`, `payment`) y payload `{ title, subtitle, img? }`.
- Mantener soporte para versiones sin imagen (`img` opcional).
- Tras guardar, invalidar caché/estado en frontend (hoy dependemos de `localStorage` y `cardDataRefresh`).

