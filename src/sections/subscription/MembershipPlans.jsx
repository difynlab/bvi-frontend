import React, { useCallback, useEffect, useMemo, useState } from 'react';
import membershipPlansService from '../../services/membershipPlansService';
import { CreateMembershipPlanModal } from '../../components/modals/CreateMembershipPlanModal';
import { ConfirmDeleteModal } from '../../components/modals/ConfirmDeleteModal';
import { SuccessDeleteModal } from '../../components/modals/SuccessDeleteModal';
import EmptyPage from '../../components/EmptyPage';
import MembershipPlansSkeleton from '../../components/subscription/MembershipPlansSkeleton';
import CustomDropdown from '../../components/CustomDropdown';

const DEFAULT_SERVER_PLANS = [
  {
    title: 'Standard (Basic)',
    description: 'Ideal for newcomers. Get access to essential features and stay informed.',
    eligibility_criteria: 'Open to all registered users. No minimum activity required.',
    perks: [
      'Access to basic features',
      'Monthly newsletter',
      'Community forum access'
    ],
    pricing: { 6: 100, 12: 180, 18: 250 },
    status: 1
  },
  {
    title: 'Silver (Intermediate)',
    description: 'For regular users who want more benefits and advanced features.',
    eligibility_criteria: 'Must have 3+ months active usage OR completed profile verification.',
    perks: [
      'All Basic perks',
      'Priority customer support',
      'Exclusive webinars & events'
    ],
    pricing: { 6: 200, 12: 360, 18: 500 },
    status: 1
  },
  {
    title: 'Gold (Premium)',
    description: 'Best for power users or professionals needing full access and VIP treatment.',
    eligibility_criteria: 'Minimum 6+ months activity OR invite-only based on usage rating.',
    perks: [
      'All Silver perks',
      '1-on-1 consultation sessions',
      'Early access to new features',
      'Premium support hotline'
    ],
    pricing: { 6: 300, 12: 540, 18: 750 },
    status: 1
  }
];

const determinePlanTheme = (title = '') => {
  const normalized = title.toLowerCase();

  if (normalized.includes('basic') || normalized.includes('standard')) {
    return 'basic';
  }

  if (normalized.includes('silver')) {
    return 'silver';
  }

  if (normalized.includes('gold')) {
    return 'gold';
  }

  return 'custom';
};

const ensurePerksArray = (perks) => {
  if (Array.isArray(perks)) {
    return perks;
  }

  if (typeof perks === 'string') {
    try {
      const parsed = JSON.parse(perks);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    } catch (_) {
      // Ignore JSON parse errors – fallback to splitting by newline
    }

    return perks
      .split('\n')
      .map((perk) => perk.trim())
      .filter(Boolean);
  }

  return [];
};

const normalizePlan = (plan) => {
  if (!plan) return null;

  const perks = ensurePerksArray(plan.perks);
  
  let pricing = { 6: 0, 12: 0, 18: 0 };
  let pricingArray = [];
  
  if (plan.pricing) {
    if (Array.isArray(plan.pricing)) {
      const isArrayOfObjects = plan.pricing.length > 0 && typeof plan.pricing[0] === 'object' && plan.pricing[0] !== null && 'duration' in plan.pricing[0];
      
      if (isArrayOfObjects) {
        pricingArray = plan.pricing.map(item => ({
          duration: item.duration || '',
          price: typeof item.price === 'number' ? item.price : parseFloat(item.price) || 0
        }));
        
        const durationMap = {};
        pricingArray.forEach(item => {
          const durationStr = item.duration.toLowerCase();
          if (durationStr.includes('6') || durationStr === '6 months' || durationStr === '6 month') {
            durationMap[6] = item.price;
          } else if (durationStr.includes('12') || durationStr === '12 months' || durationStr === '12 month') {
            durationMap[12] = item.price;
          } else if (durationStr.includes('18') || durationStr === '18 months' || durationStr === '18 month') {
            durationMap[18] = item.price;
          }
        });
        
        pricing = {
          6: durationMap[6] ?? (pricingArray[0]?.price || 0),
          12: durationMap[12] ?? (pricingArray[1]?.price || pricingArray[0]?.price || 0),
          18: durationMap[18] ?? (pricingArray[2]?.price || pricingArray[0]?.price || 0)
        };
      } else {
        const arr = plan.pricing.map(p => typeof p === 'number' ? p : parseFloat(p) || 0).filter(p => !isNaN(p));
        pricing = {
          6: arr[0] || 0,
          12: arr[1] || arr[0] || 0,
          18: arr[2] || arr[0] || 0
        };
        pricingArray = arr.map((price, index) => ({
          duration: ['6 months', '12 months', '18 months'][index] || `${index + 1} months`,
          price
        }));
      }
    } else if (typeof plan.pricing === 'object' && !Array.isArray(plan.pricing)) {
      pricing = {
        6: typeof plan.pricing[6] === 'number' ? plan.pricing[6] : parseFloat(plan.pricing[6]) || 0,
        12: typeof plan.pricing[12] === 'number' ? plan.pricing[12] : parseFloat(plan.pricing[12]) || 0,
        18: typeof plan.pricing[18] === 'number' ? plan.pricing[18] : parseFloat(plan.pricing[18]) || 0
      };
      pricingArray = [
        { duration: '6 months', price: pricing[6] },
        { duration: '12 months', price: pricing[12] },
        { duration: '18 months', price: pricing[18] }
      ];
    } else if (typeof plan.pricing === 'string') {
      try {
        const parsed = JSON.parse(plan.pricing);
        if (Array.isArray(parsed)) {
          const isArrayOfObjects = parsed.length > 0 && typeof parsed[0] === 'object' && parsed[0] !== null && 'duration' in parsed[0];
          
          if (isArrayOfObjects) {
            pricingArray = parsed.map(item => ({
              duration: item.duration || '',
              price: typeof item.price === 'number' ? item.price : parseFloat(item.price) || 0
            }));
            
            const durationMap = {};
            pricingArray.forEach(item => {
              const durationStr = item.duration.toLowerCase();
              if (durationStr.includes('6') || durationStr === '6 months' || durationStr === '6 month') {
                durationMap[6] = item.price;
              } else if (durationStr.includes('12') || durationStr === '12 months' || durationStr === '12 month') {
                durationMap[12] = item.price;
              } else if (durationStr.includes('18') || durationStr === '18 months' || durationStr === '18 month') {
                durationMap[18] = item.price;
              }
            });
            
            pricing = {
              6: durationMap[6] ?? (pricingArray[0]?.price || 0),
              12: durationMap[12] ?? (pricingArray[1]?.price || pricingArray[0]?.price || 0),
              18: durationMap[18] ?? (pricingArray[2]?.price || pricingArray[0]?.price || 0)
            };
          } else {
            const arr = parsed.map(p => typeof p === 'number' ? p : parseFloat(p) || 0).filter(p => !isNaN(p));
            pricing = {
              6: arr[0] || 0,
              12: arr[1] || arr[0] || 0,
              18: arr[2] || arr[0] || 0
            };
            pricingArray = arr.map((price, index) => ({
              duration: ['6 months', '12 months', '18 months'][index] || `${index + 1} months`,
              price
            }));
          }
        } else if (typeof parsed === 'object' && !Array.isArray(parsed)) {
          pricing = {
            6: typeof parsed[6] === 'number' ? parsed[6] : parseFloat(parsed[6]) || 0,
            12: typeof parsed[12] === 'number' ? parsed[12] : parseFloat(parsed[12]) || 0,
            18: typeof parsed[18] === 'number' ? parsed[18] : parseFloat(parsed[18]) || 0
          };
          pricingArray = [
            { duration: '6 months', price: pricing[6] },
            { duration: '12 months', price: pricing[12] },
            { duration: '18 months', price: pricing[18] }
          ];
        }
      } catch (_) {
        pricing = { 6: 0, 12: 0, 18: 0 };
        pricingArray = [
          { duration: '6 months', price: 0 },
          { duration: '12 months', price: 0 },
          { duration: '18 months', price: 0 }
        ];
      }
    }
  }
  
  if (pricingArray.length === 0) {
    pricingArray = [
      { duration: '6 months', price: pricing[6] },
      { duration: '12 months', price: pricing[12] },
      { duration: '18 months', price: pricing[18] }
    ];
  }

  return {
    id: plan.id,
    title: plan.title || 'Untitled Plan',
    status: plan.status ?? 1,
    descriptionTitle: 'Description',
    descriptionText: plan.description || '',
    eligibilityTitle: 'Eligibility Criteria',
    eligibilityText: plan.eligibility_criteria || '',
    perksTitle: 'Perks',
    perks,
    theme: determinePlanTheme(plan.title || ''),
    pricing,
    pricingArray,
    created_at: plan.created_at,
    updated_at: plan.updated_at
  };
};

const extractPlansArray = (payload) => {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (payload.data) return extractPlansArray(payload.data);
  return [];
};

const extractPlanFromResponse = (payload) => {
  if (!payload) return null;
  if (Array.isArray(payload)) return null;
  if (payload.data && !Array.isArray(payload.data)) {
    return extractPlanFromResponse(payload.data);
  }
  if (payload.plan) return payload.plan;
  if (payload.id) return payload;
  return null;
};

const sanitizePerksForSave = (perks) =>
  ensurePerksArray(perks).map((perk) => perk.trim()).filter(Boolean);

const getPlanOrder = (plan) => {
  if (!plan) return 99;

  const title = (plan.title || '').toLowerCase();
  const theme = (plan.theme || '').toLowerCase();

  if (title.includes('standard') || title.includes('basic') || theme === 'basic') {
    return 0;
  }

  if (title.includes('silver') || theme === 'silver') {
    return 1;
  }

  if (title.includes('gold') || theme === 'gold') {
    return 2;
  }

  return 50;
};

const sortPlans = (planA, planB) => {
  const orderA = getPlanOrder(planA);
  const orderB = getPlanOrder(planB);

  if (orderA === orderB) {
    return (planA.title || '').localeCompare(planB.title || '');
  }

  return orderA - orderB;
};

const MembershipPlans = ({ isAdmin = false }) => {
  const [plans, setPlans] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionError, setActionError] = useState('');
  const [editingPlanId, setEditingPlanId] = useState(null);
  const [editDraft, setEditDraft] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingPlanId, setDeletingPlanId] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [planPendingDelete, setPlanPendingDelete] = useState(null);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [isSuccessDeleteOpen, setIsSuccessDeleteOpen] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [isSeedingDefaults, setIsSeedingDefaults] = useState(false);
  const [hasAttemptedDefaultSeed, setHasAttemptedDefaultSeed] = useState(false);
  const [hasFetchedPlans, setHasFetchedPlans] = useState(false);
  const [selectedDurations, setSelectedDurations] = useState({});
  const [editingDurationIndex, setEditingDurationIndex] = useState({});
  const [planDurations, setPlanDurations] = useState({});

  const autoResizeTextarea = (textarea) => {
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.minHeight = `${textarea.scrollHeight}px`;
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  };

  const fetchPlans = useCallback(async () => {
    setIsLoading(true);
    setActionError('');

    try {
      const response = await membershipPlansService.getMembershipPlans();
      const plansArray = extractPlansArray(response);
      const normalized = plansArray
        .map(normalizePlan)
        .filter(Boolean);

      setPlans(normalized.sort(sortPlans));
    } catch (error) {
      console.error('Error fetching membership plans:', error);
      setPlans([]);
      setActionError(error.message || 'Failed to load membership plans.');
    } finally {
      setIsLoading(false);
      setHasFetchedPlans(true);
    }
  }, []);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  useEffect(() => {
    if (plans.length > 0) {
      const newDurations = {};
      plans.forEach((plan) => {
        if (plan.id && !selectedDurations[plan.id]) {
          newDurations[plan.id] = 6;
        }
      });
      if (Object.keys(newDurations).length > 0) {
        setSelectedDurations((prev) => ({ ...prev, ...newDurations }));
      }
    }
  }, [plans]);

  useEffect(() => {
    if (editingPlanId) {
      setTimeout(() => {
        const textareas = document.querySelectorAll('.plan-section-text-input');
        textareas.forEach(autoResizeTextarea);
      }, 100);
    }
  }, [editingPlanId, editDraft]);

  const updateDraftField = (field, value) => {
    setEditDraft((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        [field]: value
      };
    });
  };

  const updateDraftPerk = (index, value) => {
    setEditDraft((prev) => {
      if (!prev) return prev;
      const updatedPerks = [...(prev.perks || [])];
      updatedPerks[index] = value;
      return {
        ...prev,
        perks: updatedPerks
      };
    });
  };

  const addDraftPerk = () => {
    setEditDraft((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        perks: [...(prev.perks || []), '']
      };
    });
  };

  const deleteDraftPerk = (index) => {
    setEditDraft((prev) => {
      if (!prev) return prev;
      const updatedPerks = (prev.perks || []).filter((_, perkIndex) => perkIndex !== index);
      return {
        ...prev,
        perks: updatedPerks.length > 0 ? updatedPerks : ['']
      };
    });
  };

  const handlePricingChange = (duration, value) => {
    setEditDraft((prev) => {
      if (!prev) return prev;
      const pricing = { ...(prev.pricing || { 6: 0, 12: 0, 18: 0 }) };
      if (value === '' || value === null || value === undefined) {
        pricing[duration] = '';
      } else {
        const numValue = parseFloat(value);
        pricing[duration] = isNaN(numValue) ? '' : numValue;
      }
      return {
        ...prev,
        pricing
      };
    });
  };

  const handlePricingBlur = (duration) => {
    setEditDraft((prev) => {
      if (!prev) return prev;
      const pricing = { ...(prev.pricing || { 6: 0, 12: 0, 18: 0 }) };
      if (pricing[duration] === '' || pricing[duration] === null || pricing[duration] === undefined) {
        pricing[duration] = 0;
      }
      return {
        ...prev,
        pricing
      };
    });
  };

  const handleDurationSelect = (planId, duration) => {
    setSelectedDurations((prev) => ({
      ...prev,
      [planId]: duration
    }));
  };

  const handleDurationEdit = (planId, index) => {
    setEditingDurationIndex((prev) => ({
      ...prev,
      [planId]: index
    }));
  };

  const handleDurationChange = (planId, index, value) => {
    if (value === '' || value === null || value === undefined) {
      setPlanDurations((prev) => {
        const currentDurations = prev[planId] || [6, 12, 18];
        const newDurations = [...currentDurations];
        newDurations[index] = '';
        return {
          ...prev,
          [planId]: newDurations
        };
      });
      return;
    }
    
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && numValue > 0) {
      const currentDurations = planDurations[planId] || [6, 12, 18];
      const oldDuration = currentDurations[index];
      const newDuration = numValue;

      setPlanDurations((prev) => {
        const currentDurations = prev[planId] || [6, 12, 18];
        const newDurations = [...currentDurations];
        newDurations[index] = numValue;
        return {
          ...prev,
          [planId]: newDurations
        };
      });

      setEditDraft((prev) => {
        if (!prev) return prev;
        const pricing = { ...(prev.pricing || {}) };
        if (oldDuration && pricing[oldDuration] !== undefined) {
          pricing[newDuration] = pricing[oldDuration];
          delete pricing[oldDuration];
        }
        return {
          ...prev,
          pricing
        };
      });

      if (selectedDurations[planId] === oldDuration) {
        setSelectedDurations((prev) => ({
          ...prev,
          [planId]: newDuration
        }));
      }
    }
  };

  const handleDurationBlur = (planId) => {
    setPlanDurations((prev) => {
      const currentDurations = prev[planId] || [6, 12, 18];
      const editingIdx = editingDurationIndex[planId];
      if (editingIdx !== null && editingIdx !== undefined) {
        const newDurations = currentDurations.map((d, idx) => {
          if (idx === editingIdx && (d === '' || d === null || d === undefined || d < 1)) {
            return 6;
          }
          return d;
        });
        return {
          ...prev,
          [planId]: newDurations
        };
      }
      return prev;
    });
    setEditingDurationIndex((prev) => ({
      ...prev,
      [planId]: null
    }));
  };



  const handleTextareaChange = (field, value, event) => {
    updateDraftField(field, value);
    if (event && event.target) {
      setTimeout(() => autoResizeTextarea(event.target), 0);
    }
  };

  const handleEdit = (planId) => {
    const planToEdit = plans.find((plan) => plan.id === planId);
    if (!planToEdit) return;

    let durations = [6, 12, 18];
    if (planToEdit.pricingArray && Array.isArray(planToEdit.pricingArray) && planToEdit.pricingArray.length > 0) {
      durations = planToEdit.pricingArray.map(item => {
        const durationStr = item.duration || '';
        const match = durationStr.match(/(\d+)/);
        return match ? parseInt(match[1], 10) : 6;
      });
      if (durations.length < 3) {
        durations = [...durations, ...Array(3 - durations.length).fill(6)];
      }
      durations = durations.slice(0, 3);
    }

    setEditingPlanId(planId);
    setPlanDurations((prev) => ({
      ...prev,
      [planId]: durations
    }));
    setEditingDurationIndex((prev) => ({
      ...prev,
      [planId]: null
    }));
    setEditDraft({
      ...planToEdit,
      perks: planToEdit.perks.length > 0 ? [...planToEdit.perks] : [''],
      pricing: typeof planToEdit.pricing === 'object' && !Array.isArray(planToEdit.pricing)
        ? { ...planToEdit.pricing }
        : { 6: 0, 12: 0, 18: 0 }
    });
    if (!selectedDurations[planId]) {
      setSelectedDurations((prev) => ({
        ...prev,
        [planId]: durations[0] || 6
      }));
    }
    setActionError('');
  };

  const handleCancelEdit = () => {
    const planId = editingPlanId;
    setEditingPlanId(null);
    setEditDraft(null);
    setActionError('');
    if (planId) {
      setEditingDurationIndex((prev) => {
        const newState = { ...prev };
        delete newState[planId];
        return newState;
      });
      setPlanDurations((prev) => {
        const newState = { ...prev };
        delete newState[planId];
        return newState;
      });
    }
  };

  const handleSaveChanges = async () => {
    if (!editingPlanId || !editDraft || isSaving) return;

    const pricingObj = typeof editDraft.pricing === 'object' && !Array.isArray(editDraft.pricing)
      ? editDraft.pricing
      : { 6: 0, 12: 0, 18: 0 };

    const currentDurations = planDurations[editingPlanId] || [6, 12, 18];
    const durationsArray = currentDurations.map(d => `${d} months`);
    const prices = currentDurations.map(d => {
      const price = pricingObj[d];
      return typeof price === 'number' && price >= 0 ? price : 0;
    });

    const payload = {
      title: editDraft.title,
      description: editDraft.descriptionText,
      eligibility_criteria: editDraft.eligibilityText,
      perks: sanitizePerksForSave(editDraft.perks),
      durations: durationsArray,
      prices,
      status: editDraft.status ?? 1
    };

    setIsSaving(true);
    setActionError('');

    try {
      const response = await membershipPlansService.updateMembershipPlan(editingPlanId, payload);
      const updatedPlan = normalizePlan(extractPlanFromResponse(response));

      if (!updatedPlan) {
        throw new Error('Failed to update membership plan.');
      }

      setPlans((prev) => prev
        .map((plan) => (plan.id === editingPlanId ? updatedPlan : plan))
        .sort(sortPlans)
      );
      setEditingPlanId(null);
      setEditDraft(null);
      setEditingDurationIndex((prev) => {
        const newState = { ...prev };
        delete newState[editingPlanId];
        return newState;
      });
      setPlanDurations((prev) => {
        const newState = { ...prev };
        delete newState[editingPlanId];
        return newState;
      });
    } catch (error) {
      console.error('Error updating membership plan:', error);
      setActionError(error.message || 'Failed to update membership plan.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddPlan = () => {
    setIsCreateModalOpen(true);
    setActionError('');
  };

  const handleCloseCreateModal = () => {
    setIsCreateModalOpen(false);
  };

  const handleCreatePlan = async (planData) => {
    try {
      const pricingObj = typeof planData.pricing === 'object' && !Array.isArray(planData.pricing)
        ? planData.pricing
        : { 6: 0, 12: 0, 18: 0 };

      const durations = ['6 months', '12 months', '18 months'];
      const prices = [
        typeof pricingObj[6] === 'number' && pricingObj[6] >= 0 ? pricingObj[6] : 0,
        typeof pricingObj[12] === 'number' && pricingObj[12] >= 0 ? pricingObj[12] : 0,
        typeof pricingObj[18] === 'number' && pricingObj[18] >= 0 ? pricingObj[18] : 0
      ];

      const payload = {
        title: planData.title,
        description: planData.description,
        eligibility_criteria: planData.eligibility_criteria,
        perks: sanitizePerksForSave(planData.perks),
        durations,
        prices,
        status: planData.status ?? 1
      };

      const response = await membershipPlansService.createMembershipPlan(payload);

      const createdPlan = normalizePlan(extractPlanFromResponse(response));

      if (!createdPlan) {
        throw new Error('Failed to create membership plan.');
      }

      setPlans((prev) => [...prev, createdPlan].sort(sortPlans));
      setIsCreateModalOpen(false);
    } catch (error) {
      console.error('Error creating membership plan:', error);
      throw error instanceof Error
        ? error
        : new Error('Failed to create membership plan.');
    }
  };

  const handleRequestDeletePlan = (plan) => {
    if (!isAdmin || !plan) return;

    setPlanPendingDelete(plan);
    setIsConfirmDeleteOpen(true);
    setDeleteError('');
    setActionError('');
  };

  const handleCloseDeleteModal = () => {
    if (deletingPlanId) return;
    setIsConfirmDeleteOpen(false);
    setPlanPendingDelete(null);
    setDeleteError('');
  };

  const handleConfirmDeletePlan = async () => {
    if (!planPendingDelete || !planPendingDelete.id) return;

    const planId = planPendingDelete.id;
    setDeletingPlanId(planId);
    setDeleteError('');
    setActionError('');

    try {
      await membershipPlansService.deleteMembershipPlan(planId);
      setPlans((prev) => prev.filter((plan) => plan.id !== planId));

      if (editingPlanId === planId) {
        setEditingPlanId(null);
        setEditDraft(null);
      }

      setPlanPendingDelete(null);
      setIsConfirmDeleteOpen(false);
      setIsSuccessDeleteOpen(true);
    } catch (error) {
      console.error('Error deleting membership plan:', error);
      const message = error.message || 'Failed to delete membership plan.';
      setDeleteError(message);
      setActionError(message);
    } finally {
      setDeletingPlanId(null);
    }
  };

  const handleCloseSuccessDelete = () => {
    setIsSuccessDeleteOpen(false);
  };

  const seedDefaultPlans = useCallback(async () => {
    setIsSeedingDefaults(true);
    setActionError('');

    try {
      for (const plan of DEFAULT_SERVER_PLANS) {
        const pricingObj = typeof plan.pricing === 'object' && !Array.isArray(plan.pricing)
          ? plan.pricing
          : { 6: 0, 12: 0, 18: 0 };

        const durations = ['6 months', '12 months', '18 months'];
        const prices = [
          typeof pricingObj[6] === 'number' && pricingObj[6] >= 0 ? pricingObj[6] : 0,
          typeof pricingObj[12] === 'number' && pricingObj[12] >= 0 ? pricingObj[12] : 0,
          typeof pricingObj[18] === 'number' && pricingObj[18] >= 0 ? pricingObj[18] : 0
        ];

        await membershipPlansService.createMembershipPlan({
          title: plan.title,
          description: plan.description,
          eligibility_criteria: plan.eligibility_criteria,
          perks: sanitizePerksForSave(plan.perks),
          durations,
          prices,
          status: plan.status ?? 1
        });
      }

      await fetchPlans();
    } catch (error) {
      console.error('Error seeding default membership plans:', error);
      setActionError(error.message || 'Failed to create default membership plans.');
    } finally {
      setIsSeedingDefaults(false);
    }
  }, [fetchPlans]);

  useEffect(() => {
    if (
      isAdmin &&
      hasFetchedPlans &&
      plans.length === 0 &&
      !isSeedingDefaults &&
      !hasAttemptedDefaultSeed
    ) {
      setHasAttemptedDefaultSeed(true);
      seedDefaultPlans();
    }
  }, [
    isAdmin,
    hasFetchedPlans,
    plans,
    isSeedingDefaults,
    hasAttemptedDefaultSeed,
    seedDefaultPlans
  ]);

  const plansWithDraft = useMemo(() => plans, [plans]);

  const renderPlan = (plan, index) => {
    if (!plan) return null;

    const planId = plan.id;
    const isEditing = isAdmin && editingPlanId === planId;
    const displayPlan = isEditing && editDraft ? editDraft : plan;

    const hasChanges =
      isEditing &&
      editDraft &&
      (
        plan.title !== editDraft.title ||
        plan.descriptionText !== editDraft.descriptionText ||
        plan.eligibilityText !== editDraft.eligibilityText ||
        JSON.stringify(plan.perks) !== JSON.stringify(editDraft.perks) ||
        JSON.stringify(plan.pricing || { 6: 0, 12: 0, 18: 0 }) !== JSON.stringify(editDraft.pricing || { 6: 0, 12: 0, 18: 0 })
      );

    const displayPricing = typeof displayPlan.pricing === 'object' && !Array.isArray(displayPlan.pricing)
      ? displayPlan.pricing
      : { 6: 0, 12: 0, 18: 0 };
    const selectedDuration = selectedDurations[planId] || 6;
    
    let currentPrice = 0;
    if (displayPlan.pricingArray && Array.isArray(displayPlan.pricingArray) && displayPlan.pricingArray.length > 0) {
      const selectedItem = displayPlan.pricingArray.find(item => {
        const durationStr = (item.duration || '').toLowerCase();
        const match = durationStr.match(/(\d+)/);
        const durationNum = match ? parseInt(match[1], 10) : null;
        return durationNum === selectedDuration;
      });
      if (selectedItem && typeof selectedItem.price === 'number') {
        currentPrice = selectedItem.price;
      } else {
        currentPrice = displayPricing[selectedDuration] || 0;
      }
    } else {
      currentPrice = displayPricing[selectedDuration] || 0;
    }

    const perksToRender = Array.isArray(displayPlan.perks) ? displayPlan.perks : [];
    const key = planId ?? `plan-${index}`;

    return (
      <div className="plan-card" key={key}>
        <div className={`plan-header ${displayPlan.theme || 'custom'}`}>
          {isEditing ? (
            <input
              type="text"
              className="plan-title-input"
              value={displayPlan.title}
              onChange={(event) => updateDraftField('title', event.target.value)}
            />
          ) : (
            <h3 className="plan-title">{displayPlan.title}</h3>
          )}
          {isAdmin && !isEditing && (
            <button
              type="button"
              className="plan-edit-btn"
              onClick={() => planId && handleEdit(planId)}
              aria-label="Edit plan"
              disabled={!planId || isSaving || deletingPlanId === planId}
            >
              <i className="bi bi-pencil-square"></i> Edit
            </button>
          )}
        </div>
        <div className="plan-content">
          <div className="plan-section">
            <h4 className="plan-section-title">{displayPlan.descriptionTitle}</h4>
            {isEditing ? (
              <textarea
                className="plan-section-text-input plan-section-text-input-auto"
                value={displayPlan.descriptionText}
                onChange={(event) => handleTextareaChange('descriptionText', event.target.value, event)}
                onInput={(event) => autoResizeTextarea(event.target)}
              />
            ) : (
              <p className="plan-section-text">{displayPlan.descriptionText}</p>
            )}
          </div>

          <div className="plan-section">
            <h4 className="plan-section-title">{displayPlan.eligibilityTitle}</h4>
            {isEditing ? (
              <textarea
                className="plan-section-text-input plan-section-text-input-auto"
                value={displayPlan.eligibilityText}
                onChange={(event) => handleTextareaChange('eligibilityText', event.target.value, event)}
                onInput={(event) => autoResizeTextarea(event.target)}
              />
            ) : (
              <p className="plan-section-text">{displayPlan.eligibilityText}</p>
            )}
          </div>

          <div className="plan-section">
            <h4 className="plan-section-title">{displayPlan.perksTitle}</h4>
            {isEditing ? (
              <>
                <ul className="plan-perks plan-perks-editable">
                  {(displayPlan.perks || []).map((perk, perkIndex) => (
                    <li key={`${key}-perk-${perkIndex}`} className="plan-perk-editable-item">
                      <input
                        type="text"
                        className="plan-perk-input"
                        value={perk}
                        onChange={(event) => updateDraftPerk(perkIndex, event.target.value)}
                      />
                      <button
                        type="button"
                        className="plan-perk-delete-btn"
                        onClick={() => deleteDraftPerk(perkIndex)}
                        aria-label="Delete perk"
                      >
                        <i className="bi bi-trash"></i>
                      </button>
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  className="plan-add-perk-btn"
                  onClick={addDraftPerk}
                >
                  Add new perk
                </button>
              </>
            ) : (
              <ul className="plan-perks">
                {perksToRender.length > 0 ? (
                  perksToRender.map((perk, perkIndex) => (
                    <li key={`${key}-perk-display-${perkIndex}`}>
                      <i className="bi bi-check-lg check-icon"></i>
                      {perk}
                    </li>
                  ))
                ) : (
                    <li>
                      <i className="bi bi-check-lg check-icon check-icon-hidden"></i>
                      No perks defined yet
                    </li>
                )}
              </ul>
            )}
          </div>

          <div className="plan-section plan-section-pricing">
            {isEditing ? (
              <>
                <label className="plan-section-title">Pricing</label>
                <div className="plan-durations-container">
                  {(planDurations[planId] || [6, 12, 18]).map((duration, index) => {
                    const isSelected = selectedDurations[planId] === duration;
                    const isEditingDuration = editingDurationIndex[planId] === index;
                    return (
                      <div key={`duration-${planId}-${index}`} className="plan-duration-wrapper">
                        {isEditingDuration ? (
                          <div className="plan-duration-edit-container">
                            <input
                              type="number"
                              className="plan-duration-input"
                              value={duration === '' ? '' : duration}
                              onChange={(e) => handleDurationChange(planId, index, e.target.value)}
                              onBlur={() => handleDurationBlur(planId)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  handleDurationBlur(planId);
                                }
                              }}
                              min="1"
                              autoFocus
                            />
                            <span className="plan-duration-m-label">M</span>
                          </div>
                        ) : (
                          <button
                            type="button"
                            className={`plan-duration-button ${isSelected ? 'selected' : ''}`}
                            onClick={() => handleDurationSelect(planId, duration)}
                          >
                            {duration}M
                            <button
                              type="button"
                              className="plan-duration-edit-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDurationEdit(planId, index);
                              }}
                              aria-label="Edit duration"
                            >
                              <i className="bi bi-pencil-square"></i>
                            </button>
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
                <div className="plan-pricing-input-wrapper">
                  <i className="bi bi-currency-dollar plan-pricing-currency"></i>
                  <input
                    type="number"
                    className="plan-pricing-input"
                    value={(() => {
                      const selectedDur = selectedDurations[planId];
                      const price = editDraft?.pricing?.[selectedDur];
                      return price === '' || price === null || price === undefined ? '' : (price || 0);
                    })()}
                    onChange={(e) => {
                      const selectedDur = selectedDurations[planId];
                      handlePricingChange(selectedDur, e.target.value);
                    }}
                    onBlur={() => {
                      const selectedDur = selectedDurations[planId];
                      handlePricingBlur(selectedDur);
                    }}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    onWheel={(e) => e.target.blur()}
                  />
                </div>
              </>
            ) : (
              <>
                <div className="plan-durations-container">
                  {(displayPlan.pricingArray && displayPlan.pricingArray.length > 0
                    ? displayPlan.pricingArray.map(item => {
                        const match = (item.duration || '').match(/(\d+)/);
                        return match ? parseInt(match[1], 10) : 6;
                      })
                    : [6, 12, 18]
                  ).slice(0, 3).map((duration, index) => {
                    const isSelected = selectedDurations[planId] === duration;
                    return (
                      <button
                        key={`display-duration-${planId}-${index}`}
                        type="button"
                        className={`plan-duration-button ${isSelected ? 'selected' : ''}`}
                        onClick={() => handleDurationSelect(planId, duration)}
                      >
                        {duration}M
                      </button>
                    );
                  })}
                </div>
                <div className={`plan-pricing-display plan-pricing-display--${displayPlan.theme || 'custom'}`}>
                  ${currentPrice.toFixed(2)}
                </div>
              </>
            )}
          </div>

          {isEditing && (
            <div className="plan-save-actions">
              <button
                type="button"
                className="plan-cancel-btn"
                onClick={handleCancelEdit}
                disabled={isSaving}
              >
                Cancel
              </button>
              <button
                type="button"
                className="plan-save-btn"
                onClick={handleSaveChanges}
                disabled={!hasChanges || isSaving}
              >
                {isSaving ? 'Saving...' : 'Submit'}
              </button>
            </div>
          )}
        </div>
        {isAdmin && (
          <div className="plan-card-footer">
            <button
              type="button"
              className="plan-remove-btn"
              onClick={() => handleRequestDeletePlan(plan)}
              disabled={!planId || deletingPlanId === planId || isSaving}
            >
              <i className="bi bi-trash"></i>
              Remove Plan
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="membership-plans">
      {isAdmin && (
        <div className="membership-plans-header">
          <button
            type="button"
            className="membership-plans__add-btn membership-plans__add-btn--fab"
            onClick={handleAddPlan}
            disabled={isLoading}
            aria-label="Add plan"
          >
            <i className="bi bi-plus-lg" aria-hidden="true"></i>
            <span className="membership-plans__add-btn-label">Add Plan</span>
          </button>
        </div>
      )}

      {actionError && (
        <div
          className="app-form__error-banner membership-plans-error-banner"
          role="alert"
          aria-live="assertive"
        >
          <strong>Error:</strong> {actionError}
        </div>
      )}

      {isLoading ? (
        <MembershipPlansSkeleton />
      ) : plansWithDraft.length === 0 ? (
        <EmptyPage
          isAdmin={isAdmin}
          title="No membership plans yet"
          description={
            isSeedingDefaults
              ? 'Creating default membership plans...'
              : 'Create membership plans to define the available tiers, eligibility criteria, and benefits for your members.'
          }
        />
      ) : (
        <div className="plans-container">
          {plansWithDraft.map((plan, index) => renderPlan(plan, index))}
        </div>
      )}

      {isAdmin && (
        <CreateMembershipPlanModal
          isOpen={isCreateModalOpen}
          onClose={handleCloseCreateModal}
          onSave={handleCreatePlan}
        />
      )}

      {isAdmin && (
        <>
          <ConfirmDeleteModal
            isOpen={isConfirmDeleteOpen}
            onClose={handleCloseDeleteModal}
            onConfirm={handleConfirmDeletePlan}
            message={planPendingDelete ? `Are you sure you want to delete the plan "${planPendingDelete.title}"? This action cannot be undone.` : ''}
            isDeleting={Boolean(deletingPlanId)}
            errorMessage={deleteError}
          />

          <SuccessDeleteModal
            isOpen={isSuccessDeleteOpen}
            onClose={handleCloseSuccessDelete}
          />
        </>
      )}
    </div>
  );
};

export default MembershipPlans;

