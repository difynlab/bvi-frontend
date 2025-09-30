// TEMPORARY MOCKS for Membership page. 
// TODO BACKEND: remove this file and load from real API endpoints.

export function mockPaymentHistory() {
  return [
    { 
      id: 'pay-001', 
      dateISO: '2024-01-15', 
      amount: 99.00, 
      status: 'Paid', 
      receiptUrl: '/mock/r/pay-001.pdf' 
    },
    { 
      id: 'pay-002', 
      dateISO: '2024-01-10', 
      amount: 49.00, 
      status: 'Paid', 
      receiptUrl: '/mock/r/pay-002.pdf' 
    },
    { 
      id: 'pay-003', 
      dateISO: '2024-01-05', 
      amount: 25.00, 
      status: 'Pending', 
      receiptUrl: '/mock/r/pay-003.pdf' 
    },
    { 
      id: 'pay-004', 
      dateISO: '2023-12-20', 
      amount: 99.00, 
      status: 'Paid', 
      receiptUrl: '/mock/r/pay-004.pdf' 
    },
    { 
      id: 'pay-005', 
      dateISO: '2023-12-15', 
      amount: 75.00, 
      status: 'Paid', 
      receiptUrl: '/mock/r/pay-005.pdf' 
    },
    { 
      id: 'pay-006', 
      dateISO: '2023-12-10', 
      amount: 50.00, 
      status: 'Paid', 
      receiptUrl: '/mock/r/pay-006.pdf' 
    },
    { 
      id: 'pay-007', 
      dateISO: '2023-12-05', 
      amount: 30.00, 
      status: 'Paid', 
      receiptUrl: '/mock/r/pay-007.pdf' 
    }
  ];
}

export function mockMemberDetails() {
  return [
    { 
      id: '001', 
      name: 'John Doe', 
      membershipType: 'Premium', 
      receiptUrl: '/mock/m/mem-001.pdf' 
    },
    { 
      id: '002', 
      name: 'Jane Smith', 
      membershipType: 'Standard', 
      receiptUrl: '/mock/m/mem-002.pdf' 
    },
    { 
      id: '003', 
      name: 'Bob Johnson', 
      membershipType: 'Premium', 
      receiptUrl: '/mock/m/mem-003.pdf' 
    },
    { 
      id: '004', 
      name: 'Alice Brown', 
      membershipType: 'Basic', 
      receiptUrl: '/mock/m/mem-004.pdf' 
    },
    { 
      id: '005', 
      name: 'Charlie Wilson', 
      membershipType: 'Standard', 
      receiptUrl: '/mock/m/mem-005.pdf' 
    },
    { 
      id: '006', 
      name: 'Diana Davis', 
      membershipType: 'Premium', 
      receiptUrl: '/mock/m/mem-006.pdf' 
    },
    { 
      id: '007', 
      name: 'Eve Miller', 
      membershipType: 'Basic', 
      receiptUrl: '/mock/m/mem-007.pdf' 
    }
  ];
}
