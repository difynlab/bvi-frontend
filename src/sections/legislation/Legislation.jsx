import React, { useEffect, useMemo, useState } from 'react';
import { useLegislationState } from '../../hooks/useLegislationState';
import { useAuth } from '../../context/useAuth';
import { can } from '../../auth/acl';
import LegislationEditModal from '../../components/modals/LegislationEditModal';
import LegislationDetailsSkeleton from '../../components/legislation/LegislationDetailsSkeleton';
import { pdf } from '@react-pdf/renderer';
import LegislationPDFDocument from '../../components/pdf/LegislationPDFDocument';
import legislationService from '../../services/legislationService';
import '../../styles/sections/Legislation.scss';

const generateTempId = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

const normalizeKeyProvisions = (items) => {
  const source = Array.isArray(items) ? items : [];
  const base = source.length > 0 ? source : [''];

  return base.map((item) => ({
    id: generateTempId('key-prov'),
    value: typeof item === 'string' ? item : item?.value || item?.text || ''
  }));
};

const normalizeAmendments = (items) => {
  const source = Array.isArray(items) ? items : [];
  const base = source.length > 0 ? source : [{ date: '', text: '' }];

  return base.map((item) => ({
    id: generateTempId('amendment'),
    date: typeof item === 'object' && item !== null ? (item.date || '') : '',
    text: typeof item === 'object' && item !== null ? (item.text || '') : (typeof item === 'string' ? item : '')
  }));
};

const buildDetailsState = (source = {}) => ({
  title: source?.title || '',
  category: source?.category || '',
  type: source?.type || '',
  jurisdiction: source?.jurisdiction || '',
  status: source?.status || '',
  dateEnacted: source?.dateEnacted || '',
  effectiveDate: source?.effectiveDate || '',
  lastAmended: source?.lastAmended || '',
  referenceNumber:
    source?.referenceNumber !== undefined && source?.referenceNumber !== null
      ? String(source.referenceNumber)
      : '',
  summary: source?.summary || '',
  keyProvisions: normalizeKeyProvisions(source?.keyProvisions),
  amendments: normalizeAmendments(source?.amendments),
  responsibleBody: source?.responsibleBody || ''
});

const sanitizeDetailsForComparison = (details) => ({
  title: (details.title || '').trim(),
  category: (details.category || '').trim(),
  type: (details.type || '').trim(),
  jurisdiction: (details.jurisdiction || '').trim(),
  status: (details.status || '').trim(),
  dateEnacted: (details.dateEnacted || '').trim(),
  effectiveDate: (details.effectiveDate || '').trim(),
  lastAmended: (details.lastAmended || '').trim(),
  referenceNumber: (details.referenceNumber || '').trim(),
  summary: details.summary || '',
  keyProvisions: details.keyProvisions
    .map((item) => (item.value || '').trim())
    .filter((value) => value !== ''),
  amendments: details.amendments
    .map((item) => ({
      date: (item.date || '').trim(),
      text: (item.text || '').trim()
    }))
    .filter((item) => item.date || item.text),
  responsibleBody: details.responsibleBody || ''
});

const rebuildStateFromSanitized = (sanitized) => ({
  title: sanitized.title,
  category: sanitized.category,
  type: sanitized.type,
  jurisdiction: sanitized.jurisdiction,
  status: sanitized.status,
  dateEnacted: sanitized.dateEnacted,
  effectiveDate: sanitized.effectiveDate,
  lastAmended: sanitized.lastAmended,
  referenceNumber: sanitized.referenceNumber,
  summary: sanitized.summary,
  keyProvisions: (sanitized.keyProvisions.length > 0
    ? sanitized.keyProvisions
    : ['']
  ).map((value) => ({
    id: generateTempId('key-prov'),
    value
  })),
  amendments: (sanitized.amendments.length > 0
    ? sanitized.amendments
    : [{ date: '', text: '' }]
  ).map((item) => ({
    id: generateTempId('amendment'),
    date: item.date,
    text: item.text
  })),
  responsibleBody: sanitized.responsibleBody
});

const META_FIELDS = [
  { key: 'title', label: 'Title', inputType: 'text' },
  { key: 'category', label: 'Category', inputType: 'text' },
  { key: 'type', label: 'Legislation Type', inputType: 'text' },
  { key: 'jurisdiction', label: 'Jurisdiction', inputType: 'text' },
  { key: 'status', label: 'Status', inputType: 'text' },
  { key: 'dateEnacted', label: 'Date Enacted', inputType: 'text' },
  { key: 'effectiveDate', label: 'Effective Date', inputType: 'text' },
  { key: 'lastAmended', label: 'Last Amended', inputType: 'text' },
  { key: 'referenceNumber', label: 'Reference Number', inputType: 'number' }
];

const parseDetailsDescription = (raw) => {
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;

  let attempts = 0;
  let value = trimmed;

  while (attempts < 3) {
    try {
      const parsed = JSON.parse(value);
      if (parsed && typeof parsed === 'object') {
        return parsed;
      }
      if (typeof parsed === 'string') {
        value = parsed;
        attempts += 1;
        continue;
      }
      return null;
    } catch (_error) {
      break;
    }
  }

  return null;
};

const sanitizeRawDetails = (raw) =>
  sanitizeDetailsForComparison(
    buildDetailsState(
      raw && typeof raw === 'object'
        ? raw
        : {}
    )
  );

const Legislation = () => {
  const { legislation } = useLegislationState(); // Solo usamos legislation del localStorage (info general)
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Estado local para attachments que vienen del backend (NO localStorage)
  const [attachments, setAttachments] = useState([]);
  const [isLoadingAttachments, setIsLoadingAttachments] = useState(true);
  const [isLegislationLoading, setIsLegislationLoading] = useState(true);
  // Estado para datos completos de la legislación (para el modal)
  const [legislationData, setLegislationData] = useState(null);
  const [serverDetailsSanitized, setServerDetailsSanitized] = useState(null);
  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [isSavingDetails, setIsSavingDetails] = useState(false);
  const [detailsError, setDetailsError] = useState(null);

  const defaultSanitizedDetails = useMemo(() => {
    if (!legislation) {
      return sanitizeRawDetails({});
    }

    const parsedFromDescription = parseDetailsDescription(legislation.description);
    if (parsedFromDescription) {
      return sanitizeRawDetails(parsedFromDescription);
    }

    return sanitizeRawDetails(legislation);
  }, [legislation]);

  const effectiveSanitizedDetails = useMemo(
    () => serverDetailsSanitized ?? defaultSanitizedDetails,
    [serverDetailsSanitized, defaultSanitizedDetails]
  );

  const initialDetailsState = useMemo(
    () => rebuildStateFromSanitized(effectiveSanitizedDetails),
    [effectiveSanitizedDetails]
  );

  const [editableDetails, setEditableDetails] = useState(initialDetailsState);
  const [initialDetailsSnapshot, setInitialDetailsSnapshot] = useState(
    () => effectiveSanitizedDetails
  );

  useEffect(() => {
    if (!isEditingDetails) {
      setEditableDetails(initialDetailsState);
      setInitialDetailsSnapshot(effectiveSanitizedDetails);
      setDetailsError(null);
    }
  }, [initialDetailsState, effectiveSanitizedDetails, isEditingDetails]);

  const currentDetailsForDisplay = useMemo(
    () => sanitizeDetailsForComparison(editableDetails),
    [editableDetails]
  );

  const isDetailsDirty = useMemo(() => {
    if (!isEditingDetails) return false;
    const currentSnapshot = sanitizeDetailsForComparison(editableDetails);
    return JSON.stringify(currentSnapshot) !== JSON.stringify(initialDetailsSnapshot);
  }, [editableDetails, initialDetailsSnapshot, isEditingDetails]);

  const handleStartEditingDetails = () => {
    const sanitized = sanitizeDetailsForComparison(editableDetails);
    setEditableDetails(rebuildStateFromSanitized(sanitized));
    setInitialDetailsSnapshot(sanitized);
    setDetailsError(null);
    setIsEditingDetails(true);
  };

  const handleCancelEditingDetails = () => {
    setEditableDetails(rebuildStateFromSanitized(initialDetailsSnapshot));
    setIsEditingDetails(false);
    setDetailsError(null);
  };

  const handleMetaFieldChange = (fieldKey, value) => {
    setEditableDetails((prev) => ({
      ...prev,
      [fieldKey]: fieldKey === 'referenceNumber' ? value : value
    }));
  };

  const handleSummaryChange = (value) => {
    setEditableDetails((prev) => ({
      ...prev,
      summary: value
    }));
  };

  const handleResponsibleBodyChange = (value) => {
    setEditableDetails((prev) => ({
      ...prev,
      responsibleBody: value
    }));
  };

  const handleKeyProvisionChange = (rowId, value) => {
    setEditableDetails((prev) => ({
      ...prev,
      keyProvisions: prev.keyProvisions.map((item) =>
        item.id === rowId ? { ...item, value } : item
      )
    }));
  };

  const handleAddKeyProvision = () => {
    setEditableDetails((prev) => ({
      ...prev,
      keyProvisions: [
        ...prev.keyProvisions,
        { id: generateTempId('key-prov'), value: '' }
      ]
    }));
  };

  const handleRemoveKeyProvision = (rowId) => {
    setEditableDetails((prev) => {
      const filtered = prev.keyProvisions.filter((item) => item.id !== rowId);
      return {
        ...prev,
        keyProvisions:
          filtered.length > 0 ? filtered : [{ id: generateTempId('key-prov'), value: '' }]
      };
    });
  };

  const handleAmendmentChange = (rowId, field, value) => {
    setEditableDetails((prev) => ({
      ...prev,
      amendments: prev.amendments.map((item) =>
        item.id === rowId ? { ...item, [field]: value } : item
      )
    }));
  };

  const handleAddAmendment = () => {
    setEditableDetails((prev) => ({
      ...prev,
      amendments: [
        ...prev.amendments,
        { id: generateTempId('amendment'), date: '', text: '' }
      ]
    }));
  };

  const handleRemoveAmendment = (rowId) => {
    setEditableDetails((prev) => {
      const filtered = prev.amendments.filter((item) => item.id !== rowId);
      return {
        ...prev,
        amendments:
          filtered.length > 0
            ? filtered
            : [{ id: generateTempId('amendment'), date: '', text: '' }]
      };
    });
  };

  const handleSaveDetails = async () => {
    if (!isDetailsDirty || isSavingDetails) return;
    const sanitized = sanitizeDetailsForComparison(editableDetails);
    setIsSavingDetails(true);
    setDetailsError(null);

    try {
      console.log('[Legislation] Saving details payload:', sanitized);
      const response = await legislationService.updateLegislation({
        description: JSON.stringify(sanitized)
      });
      console.log('[Legislation] Update response:', response);

      setServerDetailsSanitized(sanitized);
      setInitialDetailsSnapshot(sanitized);
      setEditableDetails(rebuildStateFromSanitized(sanitized));
      setIsEditingDetails(false);
    } catch (error) {
      console.error('Error updating legislation details:', error);
      setDetailsError(error.message || 'Failed to save legislation details. Please try again.');
    } finally {
      setIsSavingDetails(false);
    }
  };

  const detailsButtonLabel = isEditingDetails
    ? (isSavingDetails ? 'Saving...' : 'Save Changes')
    : 'Edit Details';
  const detailsButtonDisabled = isEditingDetails
    ? (!isDetailsDirty || isSavingDetails)
    : isSavingDetails;
  const handleDetailsButtonClick = isEditingDetails
    ? handleSaveDetails
    : handleStartEditingDetails;

  const normalizeLinksFromApi = (apiLinks, fallbackLink) => {
    const normalized = [];

    if (Array.isArray(apiLinks)) {
      apiLinks.forEach((item) => {
        if (!item) return;

        if (typeof item === 'object') {
          const title = (item.title || '').trim();
          const url = (item.url || item.href || '').trim();
          if (title || url) {
            normalized.push({ title, url });
          }
        } else if (typeof item === 'string') {
          let parsed = null;
          if (item.trim().startsWith('{')) {
            try {
              parsed = JSON.parse(item);
            } catch (e) {
              parsed = null;
            }
          }

          if (parsed && typeof parsed === 'object') {
            const title = (parsed.title || '').trim();
            const url = (parsed.url || '').trim();
            if (title || url) {
              normalized.push({ title, url });
            }
            return;
          }

          const url = item.trim();
          if (url) {
            normalized.push({ title: '', url });
          }
        }
      });
    }

    if (fallbackLink && typeof fallbackLink === 'string') {
      const trimmed = fallbackLink.trim();
      if (trimmed && !normalized.some(link => link.url === trimmed)) {
        normalized.push({ title: '', url: trimmed });
      }
    }

    return normalized;
  };

  const getFirstLinkUrl = (linksArray) => {
    if (!Array.isArray(linksArray) || linksArray.length === 0) return '';
    const first = linksArray[0];
    if (!first) return '';
    if (typeof first === 'string') return first;
    if (typeof first === 'object') return first.url || first.href || '';
    return '';
  };

  const deriveTitleFromFileName = (name = '') => {
    if (!name) return '';
    const decoded = decodeURIComponent(name);
    const withoutExt = decoded.replace(/\.pdf$/i, '');
    return withoutExt
      .replace(/[-_]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/\b\w/g, char => char.toUpperCase());
  };

  const buildDownloadFileName = (title = 'legislation-document') => {
    const trimmed = (title || '').trim() || 'legislation-document';
    return `${trimmed
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')}.pdf`;
  };

  // Cargar attachments desde el index del backend
  useEffect(() => {
    const loadLegislationFromApi = async () => {
      setIsLoadingAttachments(true);
      setIsLegislationLoading(true);
      try {
        const res = await legislationService.getLegislation();
        const apiData = res?.data || res;
        console.log('[Legislation] GET response raw description:', apiData?.description);
        const normalizedLinks = normalizeLinksFromApi(apiData?.links, apiData?.link);
        const firstLinkUrl = getFirstLinkUrl(normalizedLinks);
        const parsedDetails = parseDetailsDescription(apiData?.description);
        const descriptionForLegacy = parsedDetails ? '' : (apiData?.description || '').trim();

        setServerDetailsSanitized(parsedDetails ? sanitizeRawDetails(parsedDetails) : null);

        // Construir lista de attachments desde files[] y/o description
        const built = [];

        // Si el backend trae archivos, mapear a attachments con títulos generados
        const files = Array.isArray(apiData?.files) ? apiData.files : [];
        files.forEach((fileItem, idx) => {
          // El backend puede retornar fileItem como objeto { title, file } o como string (URL)
          let fileUrl, fileName, title;

          if (typeof fileItem === 'object' && fileItem !== null) {
            fileUrl = fileItem.file || fileItem.fileUrl || '';
            fileName = fileUrl.split('/').pop() || `document-${idx + 1}.pdf`;
            title = fileItem.title || deriveTitleFromFileName(fileName) || `Support Document ${idx + 1}`;
          } else if (typeof fileItem === 'string') {
            fileUrl = fileItem;
            fileName = fileUrl.split('/').pop() || `document-${idx + 1}.pdf`;
            title = deriveTitleFromFileName(fileName) || `Support Document ${idx + 1}`;
          } else {
            return; // Skip invalid items
          }

          built.push({
            id: `api-attachment-${idx + 1}`,
            title: title,
            displayTitle: title,
            downloadName: buildDownloadFileName(title || 'legislation-document'),
            descriptionHTML: descriptionForLegacy,
            fileUrl: fileUrl,
            fileName: fileName,
            linkUrl: firstLinkUrl,
            createdAt: apiData?.updated_at || apiData?.created_at || new Date().toISOString()
          });
        });

        // Si no hay archivos pero hay description, crear un attachment virtual
        if (built.length === 0 && descriptionForLegacy) {
          built.push({
            id: `api-attachment-1`,
            title: 'Support Document 1',
            displayTitle: 'Support Document 1',
            downloadName: buildDownloadFileName('support-document'),
            descriptionHTML: descriptionForLegacy,
            fileUrl: '',
            fileName: undefined,
            linkUrl: firstLinkUrl,
            createdAt: apiData?.updated_at || apiData?.created_at || new Date().toISOString()
          });
        }

        setAttachments(built);

        // Guardar datos completos para el modal
        setLegislationData({
          files: files,
          links: normalizedLinks
        });
      } catch (error) {
        console.error('Failed to load legislation from API:', error);
        setAttachments([]); // En caso de error, lista vacía
        setLegislationData(null);
      } finally {
        setIsLoadingAttachments(false);
        setIsLegislationLoading(false);
      }
    };

    loadLegislationFromApi();
  }, []);

  const handleEditClick = () => {
    if (can(user, 'legislation:update')) {
      setIsModalOpen(true);
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
  };

  const handleSaveAttachment = async () => {
    // Recargar desde el backend después de guardar para tener los datos actualizados
    // El backend ya guardó, así que refrescamos para obtener la respuesta del servidor
    try {
      setIsLegislationLoading(true);
      const res = await legislationService.getLegislation();
      const apiData = res?.data || res;
      console.log('[Legislation] Refresh GET response raw description:', apiData?.description);
      const normalizedLinks = normalizeLinksFromApi(apiData?.links, apiData?.link);
      const firstLinkUrl = getFirstLinkUrl(normalizedLinks);

      const built = [];
      const files = Array.isArray(apiData?.files) ? apiData.files : [];
      const parsedDetails = parseDetailsDescription(apiData?.description);
      const descriptionForLegacy = parsedDetails ? '' : (apiData?.description || '').trim();

      files.forEach((fileItem, idx) => {
        // El backend puede retornar fileItem como objeto { title, file } o como string (URL)
        let fileUrl, fileName, title;

        if (typeof fileItem === 'object' && fileItem !== null) {
          fileUrl = fileItem.file || fileItem.fileUrl || '';
          fileName = fileUrl.split('/').pop() || `document-${idx + 1}.pdf`;
          title = fileItem.title || deriveTitleFromFileName(fileName) || `Support Document ${idx + 1}`;
        } else if (typeof fileItem === 'string') {
          fileUrl = fileItem;
          fileName = fileItem.split('/').pop() || `document-${idx + 1}.pdf`;
          title = deriveTitleFromFileName(fileName) || `Support Document ${idx + 1}`;
        } else {
          return; // Skip invalid items
        }

        built.push({
          id: `api-attachment-${idx + 1}`,
          title: title,
          displayTitle: title,
          downloadName: buildDownloadFileName(title || 'legislation-document'),
          descriptionHTML: descriptionForLegacy,
          fileUrl: fileUrl,
          fileName: fileName,
          linkUrl: firstLinkUrl,
          createdAt: apiData?.updated_at || apiData?.created_at || new Date().toISOString()
        });
      });

      if (built.length === 0 && descriptionForLegacy) {
        built.push({
          id: `api-attachment-1`,
          title: 'Support Document 1',
          displayTitle: 'Support Document 1',
          downloadName: buildDownloadFileName('support-document'),
          descriptionHTML: descriptionForLegacy,
          fileUrl: '',
          fileName: undefined,
          linkUrl: firstLinkUrl,
          createdAt: apiData?.updated_at || apiData?.created_at || new Date().toISOString()
        });
      }

      setServerDetailsSanitized(parsedDetails ? sanitizeRawDetails(parsedDetails) : null);

      setAttachments(built);

      // Actualizar datos completos para el modal
      setLegislationData({
        files: files,
        links: normalizedLinks
      });
    } catch (error) {
      console.error('Failed to reload attachments after save:', error);
    } finally {
      setIsLegislationLoading(false);
    }
  };

  const handleDownloadAttachment = async (attachment) => {
    try {
      // Si hay fileUrl del backend (URL completa del servidor)
      if (attachment.fileUrl && !attachment.fileUrl.startsWith('blob:')) {
        // Es una URL del backend, descargarla directamente
        const link = document.createElement('a');
        link.href = attachment.fileUrl;
        const downloadName = attachment.downloadName || buildDownloadFileName(attachment.displayTitle || attachment.fileName || 'legislation-document');
        link.download = downloadName;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return;
      }

      // Si hay fileUrl y es blob (archivo subido localmente antes de guardar)
      if (attachment.fileUrl && attachment.fileUrl.startsWith('blob:')) {
        const link = document.createElement('a');
        link.href = attachment.fileUrl;
        const downloadName = attachment.downloadName || buildDownloadFileName(attachment.displayTitle || attachment.fileName || 'legislation-document');
        link.download = downloadName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return;
      }

      // Si NO hay fileUrl pero sí descriptionHTML, generar PDF desde HTML
      if (attachment.descriptionHTML && !attachment.fileUrl) {
        const pdfBlob = await pdf(
          <LegislationPDFDocument
            description={attachment.descriptionHTML}
            link={attachment.linkUrl}
          />
        ).toBlob();

        // Crear enlace de descarga
        const url = URL.createObjectURL(pdfBlob);
        const link = document.createElement('a');
        link.href = url;
        const downloadName = attachment.downloadName || buildDownloadFileName(attachment.displayTitle || 'legislation-document');
        link.download = downloadName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        return;
      }

      // Si solo hay linkUrl, abrir en nueva pestaña
      if (attachment.linkUrl) {
        window.open(attachment.linkUrl, '_blank');
        return;
      }

      console.warn('No downloadable content found for attachment:', attachment);
    } catch (error) {
      console.error('Error downloading attachment:', error);
    }
  };

  return (
    <div className="legislation-container">
      {/* Header */}
      <div className="legislation-header">
        <div className="legislation-header-title">
          <h1>Legislation Details</h1>
          <p>Manage your account and adjust settings to optimize your workflow.</p>
        </div>
        {can(user, 'legislation:update') && (
          <div className="legislation-header-actions">
            {isEditingDetails && (
              <button
                type="button"
                className="legislation-cancel-edit-btn"
                onClick={handleCancelEditingDetails}
                aria-label="Cancel editing details"
              >
                <i className="bi bi-x-lg" aria-hidden="true"></i>
              </button>
            )}

            <button
              type="button"
              className="legislation-edit-details-btn"
              onClick={handleDetailsButtonClick}
              aria-label={detailsButtonLabel}
              disabled={detailsButtonDisabled}
            >
              <i className="bi bi-pencil-square" aria-hidden="true"></i>
              {detailsButtonLabel}
            </button>
            <button
              className="legislation-edit-btn legislation-edit-btn--desktop"
              onClick={handleEditClick}
              aria-label="Upload legislation"
            >
              Upload Legislation
            </button>
          </div>
        )}
      </div>

      {detailsError && (
        <div className="legislation-details-error" role="alert">
          {detailsError}
        </div>
      )}

      {isLegislationLoading ? (
        <LegislationDetailsSkeleton />
      ) : (
        <>
        {/* Meta Information */}
        <dl className="legislation-meta">
          {META_FIELDS.map((field) => (
            <React.Fragment key={field.key}>
              <dt>{field.label}:</dt>
              <dd>
                {isEditingDetails ? (
                  <input
                    type={field.inputType}
                    className="legislation-input"
                    value={editableDetails[field.key] ?? ''}
                    onChange={(event) =>
                      handleMetaFieldChange(field.key, event.target.value)
                    }
                  />
                ) : (
                  currentDetailsForDisplay[field.key] || '—'
                )}
              </dd>
            </React.Fragment>
          ))}
        </dl>

        <div className="legislation-divider"></div>

        {/* Summary */}
        <div>
          <h3>Summary:</h3>
          {isEditingDetails ? (
            <textarea
              className="legislation-textarea"
              value={editableDetails.summary}
              onChange={(event) => handleSummaryChange(event.target.value)}
              rows={4}
              placeholder="Enter summary..."
            />
          ) : (
            <p>{currentDetailsForDisplay.summary || 'No summary available.'}</p>
          )}
        </div>

        <div className="legislation-divider"></div>

        {/* Key Provisions */}
        <div>
          <h3>Key Provisions:</h3>
          {isEditingDetails ? (
            <div className="legislation-edit-list">
              {editableDetails.keyProvisions.map((item, index) => (
                <div className="legislation-edit-list__row" key={item.id}>
                  <input
                    type="text"
                    className="legislation-input"
                    value={item.value}
                    onChange={(event) => handleKeyProvisionChange(item.id, event.target.value)}
                    placeholder={`Key provision ${index + 1}`}
                  />
                  <button
                    type="button"
                    className="legislation-remove-btn"
                    onClick={() => handleRemoveKeyProvision(item.id)}
                    aria-label={`Remove key provision ${index + 1}`}
                  >
                    <i className="bi bi-trash"></i>
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="legislation-add-btn"
                onClick={handleAddKeyProvision}
              >
                <i className="bi bi-plus-lg" aria-hidden="true"></i>
                Add new key
              </button>
            </div>
          ) : currentDetailsForDisplay.keyProvisions.length > 0 ? (
            <ul className="legislation-list">
              {currentDetailsForDisplay.keyProvisions.map((provision, index) => (
                <li key={`key-provision-${index}`}>{provision}</li>
              ))}
            </ul>
          ) : (
            <p>No key provisions available.</p>
          )}
        </div>

        <div className="legislation-divider"></div>

        {/* Amendments */}
        <div>
          <h3>Amendments:</h3>
          {isEditingDetails ? (
            <div className="legislation-edit-list">
              {editableDetails.amendments.map((item, index) => (
                <div className="legislation-edit-list__row legislation-edit-list__row--amendment" key={item.id}>
                  <input
                    type="text"
                    className="legislation-input legislation-input--date"
                    value={item.date}
                    onChange={(event) => handleAmendmentChange(item.id, 'date', event.target.value)}
                    placeholder="Date (e.g. 2023-01-01)"
                  />
                  <input
                    type="text"
                    className="legislation-input legislation-input--text"
                    value={item.text}
                    onChange={(event) => handleAmendmentChange(item.id, 'text', event.target.value)}
                    placeholder="Amendment details"
                  />
                  <button
                    type="button"
                    className="legislation-remove-btn"
                    onClick={() => handleRemoveAmendment(item.id)}
                    aria-label={`Remove amendment ${index + 1}`}
                  >
                    <i className="bi bi-trash"></i>
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="legislation-add-btn"
                onClick={handleAddAmendment}
              >
                <i className="bi bi-plus-lg" aria-hidden="true"></i>
                Add new amendment
              </button>
            </div>
          ) : currentDetailsForDisplay.amendments.length > 0 ? (
            <ul className="legislation-list">
              {currentDetailsForDisplay.amendments.map((amendment, index) => (
                <li key={`amendment-${index}`}>
                  <strong>{amendment.date ? `${amendment.date}: ` : ''}</strong>
                  {amendment.text}
                </li>
              ))}
            </ul>
          ) : (
            <p>No amendments recorded.</p>
          )}
        </div>

        <div className="legislation-divider"></div>

        {/* Responsible Body */}
        <div>
          <h3>Responsible Body:</h3>
          {isEditingDetails ? (
            <textarea
              className="legislation-textarea"
              value={editableDetails.responsibleBody}
              onChange={(event) => handleResponsibleBodyChange(event.target.value)}
              rows={4}
              placeholder="Describe the responsible body..."
            />
          ) : (
            <p>{currentDetailsForDisplay.responsibleBody || 'No responsible body information available.'}</p>
          )}
        </div>

        <div className="legislation-divider"></div>

        {/* Links Section */}
        <div className="legislation-links-section">
          <h3>Links</h3>
          {legislationData && Array.isArray(legislationData.links) && legislationData.links.length > 0 ? (
            <ul className="legislation-links-list">
              {legislationData.links.map((link, index) => {
                const title = (link.title || '').trim();
                const url = (link.url || '').trim();

                if (!url) return null;

                return (
                  <li key={`legislation-link-${index}`}>
                    <a href={url} target="_blank" rel="noopener noreferrer">
                      {title || url}
                    </a>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p>No links available.</p>
          )}
        </div>

        {/* Attachments */}
        <div className="legislation-attachments">
          <h3>Attachments:</h3>
          {isLoadingAttachments ? (
            <p>Loading attachments...</p>
          ) : attachments.length === 0 ? (
            <p>No attachments available</p>
          ) : (
            attachments.map((attachment) => (
              <div key={attachment.id} className="attachment-item">
                <div className="meta">
                  <span className="source-label">Lorem Ipsum</span>
                  <span className="attachment-title">{attachment.displayTitle || attachment.title}</span>
                </div>
                <div className="actions">
                  <button
                    className="download-btn"
                    onClick={() => handleDownloadAttachment(attachment)}
                    aria-label={`Download ${attachment.title}`}
                  >
                    Download PDF
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
        </>
      )}

      <LegislationEditModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSave={handleSaveAttachment}
        initialData={legislationData}
      />

      {/* Mobile FAB */}
      {can(user, 'legislation:update') && (
        <button
          className="legislation-edit-btn legislation-edit-btn--mobile"
          onClick={handleEditClick}
          aria-label="Upload legislation"
        >
          <span className="btn-text">Upload Legislation</span>
        </button>
      )}
    </div>
  );
};

export { Legislation };
