document.addEventListener("DOMContentLoaded", () => {
  const COOKIE_NAME = "cookie_consent";

  const banner = document.getElementById("cookie-consent-banner");
  const acceptBtn = document.getElementById("cookie-consent-accept");
  const declineBtn = document.getElementById("cookie-consent-decline");
  const iframeTemplate = document.getElementById("blocked-iframe-template");
  const lazyIframes = document.querySelectorAll("iframe.lazy-iframe");

  // --- Helper Functies ---

  const getCookie = (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(";").shift();
    return null;
  };

  const setConsentCookie = (consent) => {
    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + 1);
    document.cookie = `${COOKIE_NAME}=${consent}; path=/; expires=${expiryDate.toUTCString()}; SameSite=Lax`;
  };

  const activateIframe = (iframe) => {
    // Vervang placeholder door iframe
    const placeholder = iframe.previousElementSibling;
    if (placeholder && placeholder.classList.contains("iframe-blocked")) {
      placeholder.remove();
    }
    iframe.src = iframe.dataset.src;
    iframe.style.display = "block";
  };

  const activateAllIframes = () => {
    lazyIframes.forEach(activateIframe);
  };

  // --- Hoofdlogica ---

  const handleAccept = () => {
    setConsentCookie("accepted");
    banner.classList.remove("show");
    activateAllIframes();
  };

  const handleDecline = () => {
    setConsentCookie("declined");
    banner.classList.remove("show");
  };

  const initializePlaceholders = () => {
    lazyIframes.forEach((iframe) => {
      iframe.style.display = "none";

      // Kloon de template en voeg toe aan de DOM
      const placeholderNode = iframeTemplate.content.cloneNode(true);
      const enableBtn = placeholderNode.querySelector(".btn-enable");

      // Voeg een click event toe aan de knop in de placeholder
      enableBtn.addEventListener("click", () => {
        handleAccept(); // Gebruik dezelfde acceptatie-logica
      });

      iframe.parentNode.insertBefore(placeholderNode, iframe);
    });
  };

  const checkConsent = () => {
    if (!banner || !iframeTemplate) return; // Stop als essentiële elementen missen

    const consent = getCookie(COOKIE_NAME);

    if (consent === "accepted") {
      activateAllIframes();
    } else if (consent === "declined") {
      initializePlaceholders();
    } else {
      banner.classList.add("show");
      initializePlaceholders();
    }
  };

  // --- Event Listeners ---
  if (acceptBtn && declineBtn) {
    acceptBtn.addEventListener("click", handleAccept);
    declineBtn.addEventListener("click", handleDecline);
  }

  // Start de logica
  checkConsent();
});
