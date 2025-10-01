import { useState, useEffect } from 'react';
import { getLegislation, setLegislation, seedIfEmpty, getAttachments, setAttachments, seedAttachmentsIfEmpty } from '../helpers/legislationStorage';

export function useLegislationState() {
  const [legislation, setLegislationState] = useState(null);
  const [attachments, setAttachmentsState] = useState([]);

  useEffect(() => {
    // Seed data if empty on first load
    seedIfEmpty();
    seedAttachmentsIfEmpty();
    
    // Load legislation data
    const data = getLegislation();
    setLegislationState(data);
    
    // Load attachments data
    const attachmentsData = getAttachments();
    setAttachmentsState(attachmentsData);
  }, []);

  const updateLegislation = (newData) => {
    if (setLegislation(newData)) {
      setLegislationState(newData);
      return true;
    }
    return false;
  };

  const updateAttachments = (newAttachments) => {
    if (setAttachments(newAttachments)) {
      setAttachmentsState(newAttachments);
      return true;
    }
    return false;
  };

  const addAttachment = (newAttachment) => {
    const updatedAttachments = [...attachments, newAttachment];
    return updateAttachments(updatedAttachments);
  };

  const removeAttachment = (attachmentId) => {
    const updatedAttachments = attachments.filter(att => att.id !== attachmentId);
    return updateAttachments(updatedAttachments);
  };

  return {
    legislation,
    setLegislation: updateLegislation,
    attachments,
    setAttachments: updateAttachments,
    addAttachment,
    removeAttachment,
    seedIfEmpty,
    seedAttachmentsIfEmpty
  };
}
