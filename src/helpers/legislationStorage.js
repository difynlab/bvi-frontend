// TODO BACKEND: Replace localStorage with API calls for persistence

export const LEG_KEYS = {
  details: 'bvi.legislation.details',
  attachments: 'bvi.legislation.attachments'
};

export function getLegislation() {
  try {
    const stored = localStorage.getItem(LEG_KEYS.details);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error('Error loading legislation details:', error);
    return null;
  }
}

export function setLegislation(obj) {
  try {
    localStorage.setItem(LEG_KEYS.details, JSON.stringify(obj));
    return true;
  } catch (error) {
    console.error('Error saving legislation details:', error);
    return false;
  }
}

export function seedIfEmpty() {
  const existing = getLegislation();
  if (existing) return;

  const seedData = {
    title: 'Lorem Ipsum Regulatory Act 2025',
    category: 'Compliance / Governance',
    type: 'Act',
    jurisdiction: 'National',
    status: 'In Force',
    dateEnacted: '2025-03-15',
    effectiveDate: '2025-07-01',
    lastAmended: '2025-06-20',
    referenceNumber: 'LIRA-2025-ACT-01',
    summary: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam commodo...',
    keyProvisions: [
      'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.',
      'Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
      'Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam.',
      'Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium.'
    ],
    amendments: [
      { date: '2025-06-20', text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.' },
      { date: '2025-04-05', text: 'Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit.' }
    ],
    responsibleBody: 'Lorem Ipsum Department of Legal Affairs'
  };

  setLegislation(seedData);
}

export function getAttachments() {
  try {
    const stored = localStorage.getItem(LEG_KEYS.attachments);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error loading attachments:', error);
    return [];
  }
}

export function setAttachments(list) {
  try {
    localStorage.setItem(LEG_KEYS.attachments, JSON.stringify(list));
    return true;
  } catch (error) {
    console.error('Error saving attachments:', error);
    return false;
  }
}

export function seedAttachmentsIfEmpty() {
  const existing = getAttachments();
  if (existing.length > 0) return;

  const seedAttachments = [
    {
      id: 'attachment-1',
      title: 'Support Document 1',
      descriptionHTML: '<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>',
      fileUrl: 'https://example.com/files/support-1.pdf',
      fileName: 'support-1.pdf',
      linkUrl: 'https://example.com/files/support-1.pdf',
      createdAt: '2025-01-15T10:30:00Z'
    },
    {
      id: 'attachment-2',
      title: 'Support Document 2',
      descriptionHTML: '<p>Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam, nisi ut aliquid ex ea commodi consequatur.</p>',
      fileUrl: 'https://example.com/files/support-2.pdf',
      fileName: 'support-2.pdf',
      linkUrl: 'https://example.com/files/support-2.pdf',
      createdAt: '2025-01-16T14:45:00Z'
    }
  ];

  setAttachments(seedAttachments);
}
