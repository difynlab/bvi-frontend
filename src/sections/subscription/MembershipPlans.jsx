import React, { useState, useRef, useEffect } from 'react';

// LocalStorage key for membership plans
const STORAGE_KEY = 'bvi.subscription.membershipPlans';

// Default plans data
const defaultPlans = {
  basic: {
    title: 'Standard (Basic)',
    descriptionTitle: 'Description',
    descriptionText: 'Ideal for newcomers. Get access to essential features and stay informed.',
    eligibilityTitle: 'Eligibility Criteria',
    eligibilityText: 'Open to all registered users. No minimum activity required.',
    perksTitle: 'Perks',
    perks: [
      'Access to basic features',
      'Monthly newsletter',
      'Community forum access'
    ]
  },
  silver: {
    title: 'Silver (Intermediate)',
    descriptionTitle: 'Description',
    descriptionText: 'For regular users who want more benefits and advanced features.',
    eligibilityTitle: 'Eligibility Criteria',
    eligibilityText: 'Must have 3+ months active usage OR completed profile verification.',
    perksTitle: 'Perks',
    perks: [
      'All Basic perks',
      'Priority customer support',
      'Exclusive webinars & events'
    ]
  },
  gold: {
    title: 'Gold (Premium)',
    descriptionTitle: 'Description',
    descriptionText: 'Best for power users or professionals needing full access and VIP treatment.',
    eligibilityTitle: 'Eligibility Criteria',
    eligibilityText: 'Minimum 6+ months activity OR invite-only based on usage rating.',
    perksTitle: 'Perks',
    perks: [
      'All Silver perks',
      '1-on-1 consultation sessions',
      'Early access to new features',
      'Premium support hotline'
    ]
  }
};

// Function to load plans from localStorage or return defaults
const loadPlansFromStorage = () => {
  try {
    const savedPlans = localStorage.getItem(STORAGE_KEY);
    if (savedPlans) {
      const parsed = JSON.parse(savedPlans);
      // Merge saved plans with defaults to ensure all keys exist
      return {
        basic: { ...defaultPlans.basic, ...(parsed.basic || {}) },
        silver: { ...defaultPlans.silver, ...(parsed.silver || {}) },
        gold: { ...defaultPlans.gold, ...(parsed.gold || {}) }
      };
    }
  } catch (error) {
    console.error('Error loading membership plans from localStorage:', error);
  }

  return defaultPlans;
};

// Function to save plans to localStorage
const savePlansToStorage = (plansToSave) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(plansToSave));
    return true;
  } catch (error) {
    console.error('Error saving membership plans to localStorage:', error);
    return false;
  }
};

const MembershipPlans = ({ isAdmin = false }) => {
  const [plans, setPlans] = useState(() => loadPlansFromStorage());
  const [editingPlan, setEditingPlan] = useState(null); // 'basic' | 'silver' | 'gold' | null
  const [originalPlans, setOriginalPlans] = useState(() => loadPlansFromStorage());

  // Function to auto-resize textarea based on content
  const autoResizeTextarea = (textarea) => {
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.minHeight = `${textarea.scrollHeight}px`;
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  };

  // Handler for textarea changes that auto-resizes
  const handleTextareaChange = (planKey, field, value, event) => {
    updatePlanField(planKey, field, value);
    // Auto-resize after state update
    setTimeout(() => {
      if (event && event.target) {
        autoResizeTextarea(event.target);
      }
    }, 0);
  };

  const handleEdit = (planKey) => {
    setEditingPlan(planKey);
    // Save original state when starting to edit
    setOriginalPlans(JSON.parse(JSON.stringify(plans)));
  };

  const handleSave = (planKey) => {
    // Save to localStorage
    savePlansToStorage(plans);
    // TODO BACKEND: Save changes to backend
    setOriginalPlans(JSON.parse(JSON.stringify(plans)));
    setEditingPlan(null);
  };

  const handleCancel = (planKey) => {
    // Restore original state
    setPlans(JSON.parse(JSON.stringify(originalPlans)));
    setEditingPlan(null);
  };

  const hasUnsavedChanges = (planKey) => {
    return JSON.stringify(plans[planKey]) !== JSON.stringify(originalPlans[planKey]);
  };

  const updatePlanField = (planKey, field, value) => {
    setPlans(prev => ({
      ...prev,
      [planKey]: {
        ...prev[planKey],
        [field]: value
      }
    }));
  };

  const updatePerk = (planKey, index, value) => {
    setPlans(prev => ({
      ...prev,
      [planKey]: {
        ...prev[planKey],
        perks: prev[planKey].perks.map((perk, i) => i === index ? value : perk)
      }
    }));
  };

  const addPerk = (planKey) => {
    setPlans(prev => ({
      ...prev,
      [planKey]: {
        ...prev[planKey],
        perks: [...prev[planKey].perks, 'New perk']
      }
    }));
  };

  const deletePerk = (planKey, index) => {
    setPlans(prev => ({
      ...prev,
      [planKey]: {
        ...prev[planKey],
        perks: prev[planKey].perks.filter((_, i) => i !== index)
      }
    }));
  };

  // Reload plans from localStorage when component mounts or when switching tabs
  useEffect(() => {
    const loadedPlans = loadPlansFromStorage();
    setPlans(loadedPlans);
    setOriginalPlans(JSON.parse(JSON.stringify(loadedPlans)));
  }, []);

  // Auto-resize textareas when editing starts
  useEffect(() => {
    if (editingPlan) {
      setTimeout(() => {
        const textareas = document.querySelectorAll(`.plan-section-text-input`);
        textareas.forEach(textarea => {
          autoResizeTextarea(textarea);
        });
      }, 100);
    }
  }, [editingPlan]);

  const renderPlan = (planKey, planType) => {
    const plan = plans[planKey];
    const isEditing = isAdmin && editingPlan === planKey;
    const hasChanges = isAdmin && hasUnsavedChanges(planKey);

    return (
      <div className="plan-card" key={planKey}>
        <div className={`plan-header ${planType}`}>
          {isEditing ? (
            <input
              type="text"
              className="plan-title-input"
              value={plan.title}
              onChange={(e) => updatePlanField(planKey, 'title', e.target.value)}
            />
          ) : (
            <h3 className="plan-title">{plan.title}</h3>
          )}
          {isAdmin && !isEditing && (
            <button
              type="button"
              className="plan-edit-btn"
              onClick={() => handleEdit(planKey)}
              aria-label="Edit plan"
            >
              <i className="bi bi-pencil-square"></i> Edit
            </button>
          )}
          {isAdmin && isEditing && (
            <button
              type="button"
              className="plan-close-edit-btn"
              onClick={() => handleCancel(planKey)}
              disabled={hasChanges}
              aria-label="Close edit"
              title={hasChanges ? "You have unsaved changes" : "Close edit"}
            >
              <i className="bi bi-x-lg"></i>
            </button>
          )}
        </div>
        <div className="plan-content">
          {/* Description Section */}
          <div className="plan-section">
            {isEditing ? (
              <>
                <input
                  type="text"
                  className="plan-section-title-input"
                  value={plan.descriptionTitle}
                  onChange={(e) => updatePlanField(planKey, 'descriptionTitle', e.target.value)}
                />
                <textarea
                  className="plan-section-text-input"
                  value={plan.descriptionText}
                  onChange={(e) => handleTextareaChange(planKey, 'descriptionText', e.target.value, e)}
                  onInput={(e) => autoResizeTextarea(e.target)}
                  style={{ minHeight: 'fit-content' }}
                />
              </>
            ) : (
              <>
                <h4 className="plan-section-title">{plan.descriptionTitle}</h4>
                <p className="plan-section-text">{plan.descriptionText}</p>
              </>
            )}
          </div>

          {/* Eligibility Criteria Section */}
          <div className="plan-section">
            {isEditing ? (
              <>
                <input
                  type="text"
                  className="plan-section-title-input"
                  value={plan.eligibilityTitle}
                  onChange={(e) => updatePlanField(planKey, 'eligibilityTitle', e.target.value)}
                />
                <textarea
                  className="plan-section-text-input"
                  value={plan.eligibilityText}
                  onChange={(e) => handleTextareaChange(planKey, 'eligibilityText', e.target.value, e)}
                  onInput={(e) => autoResizeTextarea(e.target)}
                  style={{ minHeight: 'fit-content' }}
                />
              </>
            ) : (
              <>
                <h4 className="plan-section-title">{plan.eligibilityTitle}</h4>
                <p className="plan-section-text">{plan.eligibilityText}</p>
              </>
            )}
          </div>

          {/* Perks Section */}
          <div className="plan-section">
            {isEditing ? (
              <>
                <input
                  type="text"
                  className="plan-section-title-input"
                  value={plan.perksTitle}
                  onChange={(e) => updatePlanField(planKey, 'perksTitle', e.target.value)}
                />
                <ul className="plan-perks plan-perks-editable">
                  {plan.perks.map((perk, index) => (
                    <li key={index} className="plan-perk-editable-item">
                      <input
                        type="text"
                        className="plan-perk-input"
                        value={perk}
                        onChange={(e) => updatePerk(planKey, index, e.target.value)}
                      />
                      <button
                        type="button"
                        className="plan-perk-delete-btn"
                        onClick={() => deletePerk(planKey, index)}
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
                  onClick={() => addPerk(planKey)}
                >
                  Add new perk
                </button>
              </>
            ) : (
              <>
                <h4 className="plan-section-title">{plan.perksTitle}</h4>
                <ul className="plan-perks">
                  {plan.perks.map((perk, index) => (
                    <li key={index}>
                      <i className="bi bi-check-lg check-icon"></i>{perk}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>

          {/* Save Changes Button */}
          {isEditing && hasChanges && (
            <div className="plan-save-actions">
              <button
                type="button"
                className="plan-save-btn"
                onClick={() => handleSave(planKey)}
              >
                Save Changes
              </button>
              <button
                type="button"
                className="plan-cancel-btn"
                onClick={() => handleCancel(planKey)}
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="membership-plans">
      <div className="plans-container">
        {renderPlan('basic', 'basic')}
        {renderPlan('silver', 'silver')}
        {renderPlan('gold', 'gold')}
      </div>
    </div>
  );
};

export default MembershipPlans;
