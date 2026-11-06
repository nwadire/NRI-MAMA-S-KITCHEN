(function () {
  const consentKey = "nriKitchenCookieConsent";
  const consent = readConsent();

  function readConsent() {
    try {
      return JSON.parse(localStorage.getItem(consentKey) || "null");
    } catch (error) {
      console.error("Could not read cookie preferences.", error);
      return null;
    }
  }

  const banner = document.createElement("section");
  banner.className = "cookie-banner";
  banner.setAttribute("aria-label", "Cookie and storage preferences");
  banner.hidden = Boolean(consent);
  banner.innerHTML = `
    <div class="cookie-banner-copy">
      <strong>Your privacy matters</strong>
      <p>We use essential browser storage for order drafts and your preference. No analytics or advertising cookies are currently used. <a href="cookie-policy.html">Cookie Policy</a></p>
    </div>
    <div class="cookie-banner-actions">
      <button type="button" class="cookie-button cookie-settings-button">Cookie Settings</button>
      <button type="button" class="cookie-button cookie-reject-button">Reject Non-Essential</button>
      <button type="button" class="cookie-button cookie-accept-button">Accept All</button>
    </div>`;
  document.body.append(banner);

  const dialog = document.createElement("dialog");
  dialog.className = "cookie-settings-dialog";
  dialog.setAttribute("aria-labelledby", "cookieSettingsTitle");
  dialog.innerHTML = `
    <form method="dialog" class="cookie-settings-content">
      <h2 id="cookieSettingsTitle">Cookie Settings</h2>
      <p>This site currently uses no analytics or advertising cookies. Essential browser storage supports saved order drafts, local demo orders and your consent choice.</p>
      <p class="cookie-dialog-status" role="status" aria-live="polite"></p>
      <div class="cookie-category">
        <span><strong>Essential storage</strong><small>Required for the website's order forms and consent preference.</small></span>
        <span class="cookie-always-on">Always on</span>
      </div>
      <p class="cookie-settings-note">No non-essential cookie categories are active. You can change your choice at any time using Cookie Settings in the footer.</p>
      <div class="cookie-settings-actions">
        <button type="button" class="cookie-button cookie-reject-button">Reject Non-Essential</button>
        <button type="submit" class="cookie-button cookie-accept-button">Save Preferences</button>
      </div>
      <button type="button" class="cookie-dialog-close" aria-label="Close settings">&times;</button>
    </form>`;
  document.body.append(dialog);

  const status = document.createElement("p");
  status.className = "cookie-status";
  status.setAttribute("role", "status");
  status.setAttribute("aria-live", "polite");
  banner.append(status);
  const dialogStatus = dialog.querySelector(".cookie-dialog-status");

  function saveConsent(allowOptional) {
    try {
      localStorage.setItem(consentKey, JSON.stringify({
        essential: true,
        optional: Boolean(allowOptional),
        savedAt: new Date().toISOString()
      }));
      banner.hidden = true;
      if (dialog.open) dialog.close();
    } catch (error) {
      console.error("Could not save cookie preferences.", error);
      const message = "Your preference could not be saved in this browser. Check your browser storage settings and try again.";
      status.textContent = message;
      dialogStatus.textContent = message;
      banner.hidden = false;
    }
  }

  function openSettings(event) {
    if (event) event.preventDefault();
    if (!dialog.open) dialog.showModal();
  }

  banner.querySelector(".cookie-settings-button").addEventListener("click", openSettings);
  [...banner.querySelectorAll(".cookie-reject-button"), ...dialog.querySelectorAll(".cookie-reject-button")].forEach(button => {
    button.addEventListener("click", () => saveConsent(false));
  });
  banner.querySelector(".cookie-accept-button").addEventListener("click", () => saveConsent(true));
  dialog.querySelector(".cookie-dialog-close").addEventListener("click", () => dialog.close());
  dialog.querySelector("form").addEventListener("submit", event => {
    event.preventDefault();
    saveConsent(false);
  });
  document.addEventListener("click", event => {
    const settingsLink = event.target.closest('a[href$="#cookie-settings"]');
    if (settingsLink) openSettings(event);
  });
})();
