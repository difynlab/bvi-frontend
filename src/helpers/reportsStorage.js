// Reports storage helper functions for localStorage operations

export const REPORTS_KEYS = { 
  items: 'bvi.reports.items', 
  categories: 'bvi.reports.categories' 
};

const defaults = { 
  categories: ['Annual Report', 'Other Reports'], 
  items: [
    { id: 1, title: 'Annual Report 2024', typeId: 'Annual Report', typeName: 'Annual Report', publishedAt: '2025-01-01', fileUrl: 'https://example.com/annual-2024.pdf' },
    { id: 2, title: 'Annual Report 2023', typeId: 'Annual Report', typeName: 'Annual Report', publishedAt: '2024-01-01', fileUrl: 'https://example.com/annual-2023.pdf' },
    { id: 3, title: 'Annual Report 2022', typeId: 'Annual Report', typeName: 'Annual Report', publishedAt: '2023-01-01', fileUrl: 'https://example.com/annual-2022.pdf' },
    { id: 4, title: 'Annual Report 2021', typeId: 'Annual Report', typeName: 'Annual Report', publishedAt: '2022-01-01', fileUrl: 'https://example.com/annual-2021.pdf' },
    { id: 5, title: 'Annual Report 2020', typeId: 'Annual Report', typeName: 'Annual Report', publishedAt: '2021-01-01', fileUrl: 'https://example.com/annual-2020.pdf' },
    { id: 6, title: 'Q4 2024 Quarterly Report', typeId: 'Other Reports', typeName: 'Other Reports', publishedAt: '2025-01-15', fileUrl: 'https://example.com/q4-2024.pdf' },
    { id: 7, title: 'Q3 2024 Quarterly Report', typeId: 'Other Reports', typeName: 'Other Reports', publishedAt: '2024-10-15', fileUrl: 'https://example.com/q3-2024.pdf' },
    { id: 8, title: 'December 2024 Monthly Report', typeId: 'Other Reports', typeName: 'Other Reports', publishedAt: '2025-01-01', fileUrl: 'https://example.com/dec-2024.pdf' },
    { id: 9, title: 'November 2024 Monthly Report', typeId: 'Other Reports', typeName: 'Other Reports', publishedAt: '2024-12-01', fileUrl: 'https://example.com/nov-2024.pdf' },
    { id: 10, title: 'Week 52 2024 Report', typeId: 'Other Reports', typeName: 'Other Reports', publishedAt: '2024-12-30', fileUrl: 'https://example.com/week52-2024.pdf' },
    { id: 11, title: 'Week 51 2024 Report', typeId: 'Other Reports', typeName: 'Other Reports', publishedAt: '2024-12-23', fileUrl: 'https://example.com/week51-2024.pdf' },
    { id: 12, title: 'Financial Summary Q4', typeId: 'Other Reports', typeName: 'Other Reports', publishedAt: '2025-01-10', fileUrl: 'https://example.com/financial-q4.pdf' }
  ]
};

export function getReports() {
  try {
    const reports = localStorage.getItem(REPORTS_KEYS.items);
    return reports ? JSON.parse(reports) : defaults.items;
  } catch (error) {
    console.error('Error reading reports from localStorage:', error);
    return defaults.items;
  }
}

export function setReports(list) {
  try {
    localStorage.setItem(REPORTS_KEYS.items, JSON.stringify(list)); // TODO BACKEND
    return true;
  } catch (error) {
    console.error('Error writing reports to localStorage:', error);
    return false;
  }
}

export function getReportCategories() {
  try {
    const categories = localStorage.getItem(REPORTS_KEYS.categories);
    return categories ? JSON.parse(categories) : defaults.categories;
  } catch (error) {
    console.error('Error reading categories from localStorage:', error);
    return defaults.categories;
  }
}

export function setReportCategories(list) {
  try {
    localStorage.setItem(REPORTS_KEYS.categories, JSON.stringify(list)); // TODO BACKEND
    return true;
  } catch (error) {
    console.error('Error writing categories to localStorage:', error);
    return false;
  }
}

export function saveReportsAndCategories(reports, categories) {
  setReports(reports);
  setReportCategories(categories);
}

export function readReports() {
  try {
    const categories = getReportCategories();
    const items = getReports();
    return { categories, items };
  } catch (error) {
    console.error('Error reading reports from localStorage:', error);
    return defaults;
  }
}

export function writeReports(data) {
  try {
    saveReportsAndCategories(data.items || [], data.categories || []);
    return true;
  } catch (error) {
    console.error('Error writing reports to localStorage:', error);
    return false;
  }
}

export function addCategory(name) {
  const categories = getReportCategories();
  if (!categories.includes(name)) {
    const newCategories = [...categories, name];
    setReportCategories(newCategories);
    return { categories: newCategories, items: getReports() };
  }
  return { categories, items: getReports() };
}

export function deleteCategory(name) {
  const categories = getReportCategories();
  const items = getReports();
  
  const newCategories = categories.filter(c => c !== name);
  const newItems = items.filter(it => it.type !== name);
  
  saveReportsAndCategories(newItems, newCategories);
  return { categories: newCategories, items: newItems };
}

export function upsertReport(item) {
  const items = getReports();
  const idx = items.findIndex(r => r.id === item.id);
  
  let newItems;
  if (idx >= 0) {
    newItems = [...items];
    newItems[idx] = item;
  } else {
    newItems = [...items, item];
  }
  
  setReports(newItems);
  return { categories: getReportCategories(), items: newItems };
}

export function deleteReport(id) {
  const items = getReports();
  const newItems = items.filter(r => r.id !== id);
  
  setReports(newItems);
  return { categories: getReportCategories(), items: newItems };
}
