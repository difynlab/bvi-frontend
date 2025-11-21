import React from 'react';
import PhoneInput, { isValidPhoneNumber } from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import { useSettingsForm } from '../../hooks/useSettingsForm';
import { usePasswordVisibility } from '../../hooks/usePasswordVisibility';
import { useAuth } from '../../context/useAuth';
import ImageUpload from '../../components/ImageUpload';
import CustomDropdown from '../../components/CustomDropdown';
import '../../styles/sections/Settings.scss';

export default function Settings() {
  const { user } = useAuth();
  
  const {
    form,
    onChange,
    profilePreview,
    selectedFile,
    onSelectFile,
    onImageError,
    currentPassword,
    setCurrentPassword,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    canSave,
    save,
    errorMessage,
    isSaving,
    successMessage
  } = useSettingsForm();

  const cur = usePasswordVisibility(false);
  const nw = usePasswordVisibility(false);
  const cf = usePasswordVisibility(false);

  return (
    <div className="settings-container">
      <div className="settings-header-title">
        <h1>Profile</h1>
        <p>Manage your account and adjust settings to optimize your workflow</p>
      </div>

      <form className="settings-grid" onSubmit={(e) => {
        e.preventDefault();
        if (canSave) save();
      }}>
        <section className="settings-card settings-general-details">
          <h2 className="settings-card-title">General Details</h2>

          {/* Row: Left (fields) + Right (profile picture) */}
          <div className="settings-general-row">
            <div className="settings-general-col">
              <div className="settings-field">
            <div className="settings-contact-row">
              <div className="settings-contact-field">
                <label className="settings-label">First Name<span className="settings-req">*</span></label>
                <input
                  className="settings-input"
                  type="text"
                  value={form.firstName}
                  onChange={(e) => onChange('firstName', e.target.value)}
                  placeholder="First Name"
                />
              </div>
              <div className="settings-contact-field">
                <label className="settings-label">Last Name<span className="settings-req">*</span></label>
                <input
                  className="settings-input"
                  type="text"
                  value={form.lastName}
                  onChange={(e) => onChange('lastName', e.target.value)}
                  placeholder="Last Name"
                />
              </div>
            </div>
              </div>

              <div className="settings-field">
                <div className="settings-contact-row">
                  <div className="settings-contact-field">
                    <label className="settings-label">Email Address<span className="settings-req">*</span></label>
                    <input
                      className="settings-input settings-input--disabled"
                      type="email"
                      value={form.email}
                      onChange={(e) => onChange('email', e.target.value)}
                      placeholder="Email"
                      disabled
                      autoComplete="username"
                    />
                  </div>
                  <div className="settings-contact-field settings-contact-field--phone-group">
                    <label className="settings-label">Contact Number<span className="settings-req">*</span></label>
                    <div className="settings-phone-group">
                      <PhoneInput
                        international
                        defaultCountry="VG"
                        value={form.phoneE164}
                        onChange={(val) => onChange('phoneE164', val || '')}
                        className="settings-phone-input"
                        placeholder="Enter phone number"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="settings-image-col">
              <ImageUpload
                onFileSelect={onSelectFile}
                selectedFile={selectedFile}
                preview={profilePreview}
                accept="image/*"
                errorMessage={errorMessage}
                onError={onImageError}
              />
            </div>
          </div>

          <div className="settings-field image-inputs-row">
            {/* TODO BACKEND: upload to backend and store remote URL; hydrate on load */}
            <section className="settings-card settings-preferences">
              <div className="settings-field">
                <div className="settings-preferences-row">
                  <div className="settings-field-group">
                    <label className="settings-label">Date Format</label>
                    <div className="settings-select-wrapper">
                      <CustomDropdown
                        name="dateFormat"
                        value={form.dateFormat}
                        onChange={(e) => onChange('dateFormat', e.target.value)}
                        options={[
                          { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
                          { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
                          { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' }
                        ]}
                        placeholder="Select date format"
                      />
                    </div>
                  </div>
                  <div className="settings-field-group">
                    <label className="settings-label">Time Zone</label>
                    <div className="settings-select-wrapper">
                      <CustomDropdown
                        name="timeZone"
                        value={form.timeZone}
                        onChange={(e) => onChange('timeZone', e.target.value)}
                        options={[
                          { value: 'EST', label: 'EST' },
                          { value: 'PST', label: 'PST' },
                          { value: 'UTC', label: 'UTC' }
                        ]}
                        placeholder="Select time zone"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="settings-field">
                <div className="settings-preferences-row">
                  <div className="settings-field-group">
                    <label className="settings-label">Country</label>
                    <input
                      className="settings-input"
                      type="text"
                      value={form.country}
                      onChange={(e) => onChange('country', e.target.value)}
                      placeholder="Virgin Islands, British"
                      autoComplete="country-name"
                    />
                  </div>
                  <div className="settings-field-group">
                    <label className="settings-label">Language</label>
                    <div className="settings-select-wrapper">
                      <CustomDropdown
                        name="language"
                        value={form.language}
                        onChange={(e) => onChange('language', e.target.value)}
                        options={[
                          { value: 'English (Default)', label: 'English (Default)' },
                          { value: 'Español', label: 'Español' },
                          { value: 'Português', label: 'Português' }
                        ]}
                        placeholder="Select language"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </section>



        <section className="settings-card settings-change-password">
          <h2 className="settings-card-title">Change Password</h2>

          <div className="settings-field">
            <div className="settings-password-row">
              <div className="settings-password-field">
                <label className="settings-label">Current Password<span className="settings-req">*</span></label>
                <div className="settings-password-input-group">
                  <input
                    className="settings-input settings-input--password"
                    type={cur.inputType}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                  />
                  <button
                    className="settings-password-toggle"
                    type="button"
                    aria-pressed={cur.visible}
                    onClick={cur.toggle}
                  >
                    <i className={cur.visible ? "bi bi-eye-slash-fill" : "bi bi-eye-fill"} aria-hidden="true"></i>
                    <span className="visually-hidden">{cur.visible ? "Hide password" : "Show password"}</span>
                  </button>
                </div>
              </div>
              <div className="settings-password-field">
                <label className="settings-label">New Password<span className="settings-req">*</span></label>
                <div className="settings-password-input-group">
                  <input
                    className="settings-input settings-input--password"
                    type={nw.inputType}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="new-password"
                  />
                  <button
                    className="settings-password-toggle"
                    type="button"
                    aria-pressed={nw.visible}
                    onClick={nw.toggle}
                  >
                    <i className={nw.visible ? "bi bi-eye-slash-fill" : "bi bi-eye-fill"} aria-hidden="true"></i>
                    <span className="visually-hidden">{nw.visible ? "Hide password" : "Show password"}</span>
                  </button>
                </div>
              </div>
              <div className="settings-password-field">
                <label className="settings-label">Confirm Password<span className="settings-req">*</span></label>
                <div className="settings-password-input-group">
                  <input
                    className="settings-input settings-input--password"
                    type={cf.inputType}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="new-password"
                  />
                  <button
                    className="settings-password-toggle"
                    type="button"
                    aria-pressed={cf.visible}
                    onClick={cf.toggle}
                  >
                    <i className={cf.visible ? "bi bi-eye-slash-fill" : "bi bi-eye-fill"} aria-hidden="true"></i>
                    <span className="visually-hidden">{cf.visible ? "Hide password" : "Show password"}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
          {/* TODO BACKEND: verify current password against backend and update via API */}
        </section>

        <div className="settings-actions">
          {errorMessage && (
            <div
              className="app-form__error-banner"
              role="alert"
              aria-live="assertive"
              tabIndex={-1}
            >
              <strong>Error:</strong> {errorMessage}
            </div>
          )}
          <button 
            type="submit" 
            className="settings-save-btn" 
            disabled={!canSave || isSaving}
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
          {successMessage && (
            <div
              className="app-form__success-banner"
              role="alert"
              aria-live="assertive"
              tabIndex={-1}
            >
              <strong>Success:</strong> {successMessage}
            </div>
          )}
          
        </div>
      </form>
    </div>
  );
}