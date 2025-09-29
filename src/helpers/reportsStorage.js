// Reports storage helper functions for localStorage operations
const KEY = 'reports.storage.v1';
const defaults = { 
  categories: ['Annual Report', 'Other Reports'], 
  items: [
    { id: 1, title: 'Annual Report 2024', type: 'Annual Report', publishedAt: '2025-01-01', fileUrl: 'https://example.com/annual-2024.pdf' },
    { id: 2, title: 'Annual Report 2023', type: 'Annual Report', publishedAt: '2024-01-01', fileUrl: 'https://example.com/annual-2023.pdf' },
    { id: 3, title: 'Annual Report 2022', type: 'Annual Report', publishedAt: '2023-01-01', fileUrl: 'https://example.com/annual-2022.pdf' },
    { id: 4, title: 'Annual Report 2021', type: 'Annual Report', publishedAt: '2022-01-01', fileUrl: 'https://example.com/annual-2021.pdf' },
    { id: 5, title: 'Annual Report 2020', type: 'Annual Report', publishedAt: '2021-01-01', fileUrl: 'https://example.com/annual-2020.pdf' },
    { id: 6, title: 'Q4 2024 Quarterly Report', type: 'Other Reports', publishedAt: '2025-01-15', fileUrl: 'https://example.com/q4-2024.pdf' },
    { id: 7, title: 'Q3 2024 Quarterly Report', type: 'Other Reports', publishedAt: '2024-10-15', fileUrl: 'https://example.com/q3-2024.pdf' },
    { id: 8, title: 'December 2024 Monthly Report', type: 'Other Reports', publishedAt: '2025-01-01', fileUrl: 'https://example.com/dec-2024.pdf' },
    { id: 9, title: 'November 2024 Monthly Report', type: 'Other Reports', publishedAt: '2024-12-01', fileUrl: 'https://example.com/nov-2024.pdf' },
    { id: 10, title: 'Week 52 2024 Report', type: 'Other Reports', publishedAt: '2024-12-30', fileUrl: 'https://example.com/week52-2024.pdf' },
    { id: 11, title: 'Week 51 2024 Report', type: 'Other Reports', publishedAt: '2024-12-23', fileUrl: 'https://example.com/week51-2024.pdf' },
    { id: 12, title: 'Financial Summary Q4', type: 'Other Reports', publishedAt: '2025-01-10', fileUrl: 'https://example.com/financial-q4.pdf' }
  ]
};

export function readReports() {
  try {
    const o = JSON.parse(localStorage.getItem(KEY));
    return { ...defaults, ...(o || {}) };
  } catch {
    return defaults;
  }
}

export function writeReports(data) {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {}
}

export function addCategory(name) {
  const d = readReports();
  if (!d.categories.includes(name)) {
    d.categories = [...d.categories, name];
  }
  writeReports(d);
  return d;
}

export function deleteCategory(name) {
  const d = readReports();
  d.categories = d.categories.filter(c => c !== name);
  d.items = d.items.filter(it => it.type !== name);
  writeReports(d);
  return d;
}

export function upsertReport(item) {
  const d = readReports();
  const idx = d.items.findIndex(r => r.id === item.id);
  if (idx >= 0) {
    d.items[idx] = item;
  } else {
    d.items = [...d.items, item];
  }
  writeReports(d);
  return d;
}

export function deleteReport(id) {
  const d = readReports();
  d.items = d.items.filter(r => r.id !== id);
  writeReports(d);
  return d;
}
