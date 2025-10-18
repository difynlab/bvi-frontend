import React from 'react';
import { useSettingsForm } from '../../hooks/useSettingsForm';
import { usePasswordVisibility } from '../../hooks/usePasswordVisibility';
import ImageUpload from '../../components/ImageUpload';
import CustomDropdown from '../../components/CustomDropdown';
import '../../styles/sections/Settings.scss';

export default function Settings() {
  const {
    form,
    onChange,
    profilePreview,
    selectedFile,
    onSelectFile,
    currentPassword,
    setCurrentPassword,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    canSave,
    save
  } = useSettingsForm();

  const cur = usePasswordVisibility(false);
  const nw = usePasswordVisibility(false);
  const cf = usePasswordVisibility(false);

  return (
    <div className="settings-container">
      <div className="settings-header-title">
        <h1>Settings</h1>
        <p>Manage your account and adjust settings to optimize your workflow</p>
      </div>

      <form className="settings-grid" onSubmit={(e) => {
        e.preventDefault();
        if (canSave) save();
      }}>
        <section className="settings-card settings-general-details">
          <h2 className="settings-card-title">General Details</h2>

          <div className="settings-field">
            <label className="settings-label">User Name<span className="settings-req">*</span></label>
            <input
              className="settings-input"
              type="text"
              value={form.name}
              onChange={(e) => onChange('name', e.target.value)}
              placeholder="Name"
            />
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
                />
              </div>
              <div className="settings-contact-field settings-contact-field--phone-group">
                <label className="settings-label">Contact Number<span className="settings-req">*</span></label>
                <div className="settings-phone-group">
                  <input
                    className="settings-input settings-input--country-code"
                    type="number"
                    value={form.countryCode}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Prevent negative numbers
                      if (value === '' || (parseInt(value) >= 0 && !isNaN(parseInt(value)))) {
                        onChange('countryCode', value);
                      }
                    }}
                    placeholder="+54"
                    min="0"
                  />
                  <input
                    className="settings-input"
                    type="tel"
                    value={form.phoneNumber}
                    onChange={(e) => onChange('phoneNumber', e.target.value)}
                    placeholder="Phone"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="settings-field image-inputs-row">
            <ImageUpload
              onFileSelect={onSelectFile}
              selectedFile={selectedFile}
              preview={profilePreview}
              accept="image/*"
            />
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
                      placeholder="Argentina"
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
          <button type="submit" className="settings-save-btn" disabled={!canSave}>
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
}