// assets/js/core/santis-notify.js

const INVITE_HTML = `
<div class="santis-invite-backdrop" id="santisInvite" hidden>
  <div class="santis-invite" role="dialog" aria-modal="true" aria-labelledby="santisInviteTitle" aria-describedby="santisInviteText">
    <div class="santis-invite__seal">S</div>

    <p class="santis-invite__eyebrow">Sovereign Concierge</p>
    <h2 class="santis-invite__title" id="santisInviteTitle">Özel Konsiyerj Daveti</h2>
    <p class="santis-invite__text" id="santisInviteText">
      SANTIS özel konsiyerj kanalına bağlanmaya davetlisiniz. Randevu onayları, size özel ritüel hazırlıkları
      ve seçkin hatırlatmalar bu kanaldan zarifçe iletilecektir.
    </p>

    <div class="santis-invite__actions">
      <button type="button" class="santis-btn santis-btn--ghost" id="santisInviteDismiss">
        Şimdilik Sessizlik
      </button>
      <button type="button" class="santis-btn santis-btn--gold" id="santisInviteAccept">
        Daveti Kabul Et
      </button>
    </div>

    <p class="santis-invite__footnote">
      Bildirim tercihlerinizi dilediğiniz zaman değiştirebilirsiniz.
    </p>
  </div>
</div>
`;

const INVITE_CSS = `
.santis-invite-backdrop {
  position: fixed; inset: 0; z-index: 9998; display: grid; place-items: center; padding: 24px;
  background: radial-gradient(circle at 50% 20%, rgba(198, 169, 107, 0.10), transparent 30%), rgba(5, 5, 5, 0.82);
  backdrop-filter: blur(10px);
}
.santis-invite-backdrop[hidden] { display: none; }
.santis-invite {
  width: min(100%, 460px); padding: 28px 24px 22px; border-radius: 28px;
  background: linear-gradient(180deg, rgba(255,255,255,0.035), rgba(255,255,255,0.015)), #0b0b0c;
  border: 1px solid rgba(198, 169, 107, 0.18);
  box-shadow: 0 30px 80px rgba(0, 0, 0, 0.52), inset 0 1px 0 rgba(255,255,255,0.04);
  text-align: center; font-family: 'Outfit', sans-serif;
}
.santis-invite__seal {
  width: 68px; height: 68px; margin: 0 auto 18px; border-radius: 20px; display: grid; place-items: center;
  font-family: 'Cinzel', serif; font-size: 30px; font-weight: 600; color: #c6a96b;
  background: radial-gradient(circle at 50% 35%, rgba(198,169,107,0.10), transparent 60%), rgba(255,255,255,0.02);
  border: 1px solid rgba(198,169,107,0.16); box-shadow: inset 0 1px 0 rgba(255,255,255,0.04), 0 12px 30px rgba(0,0,0,0.35);
}
.santis-invite__eyebrow { margin: 0 0 8px; font-size: 11px; letter-spacing: 0.28em; text-transform: uppercase; color: #8f9095; }
.santis-invite__title { margin: 0 0 12px; color: #e7dfcf; font-size: 28px; line-height: 1.1; font-weight: 500; font-family: 'Cinzel', serif; }
.santis-invite__text { margin: 0 auto 22px; max-width: 34ch; color: #b6b7bb; font-size: 15px; line-height: 1.65; }
.santis-invite__actions { display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; }
.santis-btn {
  min-width: 160px; border-radius: 999px; padding: 13px 18px; font-size: 13px; letter-spacing: 0.08em;
  text-transform: uppercase; cursor: pointer; transition: transform 180ms ease, opacity 180ms ease, border-color 180ms ease;
}
.santis-btn:hover { transform: translateY(-1px); }
.santis-btn--ghost { color: #d1d2d5; background: transparent; border: 1px solid rgba(255,255,255,0.10); }
.santis-btn--gold { color: #0a0a0a; background: linear-gradient(180deg, #d5ba81 0%, #b8934f 100%); border: 1px solid rgba(198,169,107,0.25); box-shadow: 0 10px 26px rgba(198,169,107,0.16); }
.santis-invite__footnote { margin: 16px 0 0; color: #77797f; font-size: 12px; line-height: 1.5; }
`;

const PUBLIC_VAPID_KEY = "BCak78KIKiBg1-35qu2NQui4buKkdlZaH3kPRYzpQehksS5bqTtpgbJuy__uKBO2-mdg6C5DNZ0Qah9OoOOhGR0";

function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

export const initSovereignNotifications = async () => {
    // 1. Dinamik CSS ve HTML Enjeksiyonu
    const style = document.createElement('style');
    style.innerHTML = INVITE_CSS;
    document.head.appendChild(style);

    const div = document.createElement('div');
    div.innerHTML = INVITE_HTML;
    document.body.appendChild(div.firstElementChild);

    const invite = document.getElementById("santisInvite");
    const acceptBtn = document.getElementById("santisInviteAccept");
    const dismissBtn = document.getElementById("santisInviteDismiss");
    
    if (!invite || !acceptBtn || !dismissBtn) return;

    const STORAGE_KEY = "santis_notify_invite_state";

    function canAskForNotifications() {
      return "Notification" in window && Notification.permission === "default";
    }

    function shouldShowInvite() {
      const state = localStorage.getItem(STORAGE_KEY);
      return canAskForNotifications() && state !== "dismissed" && state !== "accepted";
    }

    function showInvite() {
      invite.hidden = false;
      document.body.classList.add("santis-modal-open");
    }

    function hideInvite() {
      invite.hidden = true;
      document.body.classList.remove("santis-modal-open");
    }

    async function requestNativePermission() {
      try {
        const permission = await Notification.requestPermission();
        if (permission === "granted") {
          localStorage.setItem(STORAGE_KEY, "accepted");
          
          // Phase 7.2: Subscribe to Push Manager
          const registration = await navigator.serviceWorker.ready;
          try {
              let subscription = await registration.pushManager.getSubscription();
              if (!subscription) {
                  subscription = await registration.pushManager.subscribe({
                      userVisibleOnly: true,
                      applicationServerKey: urlBase64ToUint8Array(PUBLIC_VAPID_KEY)
                  });
              }
              console.log("🔔 SANTIS | Fısıltılar Aktif");
              console.log("🗝️ ABONELİK PAKETİ: '" + JSON.stringify(subscription) + "'");
          } catch(e) {
              console.warn("🔕 [Notify] Tarayıcı Push sunucusuna bağlanamadı (FCM Engelli Olabilir):", e.message);
          }
        } else {
          localStorage.setItem(STORAGE_KEY, "dismissed");
          console.log("🔕 SANTIS | Sessizlik Modu");
        }
      } catch (error) {
        console.error("SANTIS notify permission error:", error);
      } finally {
        hideInvite();
      }
    }

    acceptBtn.addEventListener("click", requestNativePermission);

    dismissBtn.addEventListener("click", () => {
      localStorage.setItem(STORAGE_KEY, "dismissed");
      hideInvite();
      console.log("🔕 SANTIS | Davet nazikçe ertelendi");
    });

    // Önceden izin verilmişse, aboneliği sağlama al ve JSON'u fırlat
    if (Notification.permission === "granted") {
        navigator.serviceWorker.ready.then(async (registration) => {
            try {
                let subscription = await registration.pushManager.getSubscription();
                if (!subscription) {
                    subscription = await registration.pushManager.subscribe({
                        userVisibleOnly: true,
                        applicationServerKey: urlBase64ToUint8Array(PUBLIC_VAPID_KEY)
                    });
                }
                console.log("🔔 [Sovereign Whisper] İzin mevcut. \n🗝️ ABONELİK PAKETİ: '" + JSON.stringify(subscription) + "'");
            } catch (e) {
                console.warn("🔕 [Sovereign Whisper] Tarayıcı Push servisi aktif değil veya engelli:", e.message);
            }
        });
        return;
    }

    // Splash (1800ms) + Gözlem Süresi (600ms) = 2400ms Ceremonial Delay
    setTimeout(() => {
      if (shouldShowInvite()) {
        showInvite();
      }
    }, 2400); 
};
