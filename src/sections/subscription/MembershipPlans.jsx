import React, { useCallback, useEffect, useMemo, useState } from 'react';
import membershipPlansService from '../../services/membershipPlansService';
import { CreateMembershipPlanModal } from '../../components/modals/CreateMembershipPlanModal';
import { ConfirmDeleteModal } from '../../components/modals/ConfirmDeleteModal';
import { SuccessDeleteModal } from '../../components/modals/SuccessDeleteModal';

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
  const [isLoading, setIsLoading] = useState(false);
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

  const handleTextareaChange = (field, value, event) => {
    updateDraftField(field, value);
    if (event && event.target) {
      setTimeout(() => autoResizeTextarea(event.target), 0);
    }
  };

  const handleEdit = (planId) => {
    const planToEdit = plans.find((plan) => plan.id === planId);
    if (!planToEdit) return;

    setEditingPlanId(planId);
    setEditDraft({
      ...planToEdit,
      perks: planToEdit.perks.length > 0 ? [...planToEdit.perks] : ['']
    });
    setActionError('');
  };

  const handleCancelEdit = () => {
    setEditingPlanId(null);
    setEditDraft(null);
    setActionError('');
  };

  const handleSaveChanges = async () => {
    if (!editingPlanId || !editDraft || isSaving) return;

    const payload = {
      title: editDraft.title,
      description: editDraft.descriptionText,
      eligibility_criteria: editDraft.eligibilityText,
      perks: sanitizePerksForSave(editDraft.perks),
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
      const response = await membershipPlansService.createMembershipPlan({
        ...planData,
        perks: sanitizePerksForSave(planData.perks)
      });

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
        await membershipPlansService.createMembershipPlan({
          ...plan,
          perks: sanitizePerksForSave(plan.perks)
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
        JSON.stringify(plan.perks) !== JSON.stringify(editDraft.perks)
      );

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
                className="plan-section-text-input"
                value={displayPlan.descriptionText}
                onChange={(event) => handleTextareaChange('descriptionText', event.target.value, event)}
                onInput={(event) => autoResizeTextarea(event.target)}
                style={{ minHeight: 'fit-content' }}
              />
            ) : (
              <p className="plan-section-text">{displayPlan.descriptionText}</p>
            )}
          </div>

          <div className="plan-section">
            <h4 className="plan-section-title">{displayPlan.eligibilityTitle}</h4>
            {isEditing ? (
              <textarea
                className="plan-section-text-input"
                value={displayPlan.eligibilityText}
                onChange={(event) => handleTextareaChange('eligibilityText', event.target.value, event)}
                onInput={(event) => autoResizeTextarea(event.target)}
                style={{ minHeight: 'fit-content' }}
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
                    <i className="bi bi-check-lg check-icon" style={{ visibility: 'hidden' }}></i>
                    No perks defined yet
                  </li>
                )}
              </ul>
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
          className="app-form__error-banner"
          role="alert"
          aria-live="assertive"
          style={{ marginBottom: '16px' }}
        >
          <strong>Error:</strong> {actionError}
        </div>
      )}

      {isLoading ? (
        <div style={{ padding: '20px 0', color: '#6b7280', fontSize: '14px' }}>
          Loading membership plans...
        </div>
      ) : plansWithDraft.length === 0 ? (
        <div className="membership-plans-empty-state">
          <div className="empty-state-content">
            <div className="empty-state-icon" aria-hidden="true">
              <i className="bi bi-layers"></i>
            </div>
            <h3>No membership plans yet</h3>
            <p>
              {isSeedingDefaults
                ? 'Creating default membership plans...'
                : 'Create membership plans to define the available tiers, eligibility criteria, and benefits for your members.'}
            </p>
            {isAdmin && !isSeedingDefaults && (
              <button
                type="button"
                className="membership-plans__add-btn"
                onClick={handleAddPlan}
                disabled={isLoading}
              >
                <i className="bi bi-plus-lg" aria-hidden="true"></i>
                <span className="membership-plans__add-btn-label">Create first plan</span>
              </button>
            )}
          </div>
        </div>
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

