document.addEventListener('DOMContentLoaded', () => {

  /* ======================================================
     1. HEADER & HERO LOGIC
  ====================================================== */
  const header = document.getElementById('siteHeader');
  const hero = document.getElementById('hero');
  const logo = document.getElementById('headerLogo');

  if (logo?.dataset?.default) logo.src = logo.dataset.default;

  if ('IntersectionObserver' in window && hero && header) {
    const observer = new IntersectionObserver(
      ([entry]) => {
        header.classList.toggle('is-hero', entry.isIntersecting);
        header.classList.toggle('is-scrolled', !entry.isIntersecting);
      },
      { threshold: 0.15 }
    );
    observer.observe(hero);
  }

  /* ======================================================
     2. FADE UP ANIMATIONS
  ====================================================== */
  document.documentElement.classList.add('js');
  const fadeObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        fadeObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  document.querySelectorAll('.fade-up').forEach(el => fadeObserver.observe(el));

  /* ======================================================
     3. RESERVATION & LOCATION POPULATION
  ====================================================== */
  const form = document.getElementById('reserveForm');
  const locationSelect = document.getElementById('location');

  if (form && locationSelect) {
    // We fetch the locations directly here so index.html has the data
    fetch("http://127.0.0.1:8000/locations")
      .then(res => res.json())
      .then(data => {
        window.storeData = data; // Keep it globally if needed by other logic

        // Clear and Populate
        locationSelect.innerHTML = '<option value="">Select location</option>';
        data.forEach(store => {
          const option = document.createElement('option');
          option.value = store.id;
          // Format text: "Cimanuk — Cimanuk St No.42"
          option.textContent = `${store.name} — ${store.address.split(',')[0]}`;
          locationSelect.appendChild(option);
        });
      })
      .catch(err => console.error('Failed to load locations for reservation:', err));
  }

  /* ======================================================
     4. FORM VALIDATION & MODALS
  ====================================================== */
  const overlay = document.getElementById('modalOverlay');
  const confirmModal = document.getElementById('confirmModal');
  const successModal = document.getElementById('successModal');

  const cancelBtn = document.getElementById('cancelConfirm');
  const confirmBtn = document.getElementById('confirmReserve');
  const closeBtn = document.getElementById('closeSuccess');

  const isValidName = name => /^[A-Za-z\s]{3,}$/.test(name);

  if (form) {
    form.addEventListener('submit', e => {
      e.preventDefault();

      const date = document.getElementById('date').value;
      const pax = Number(document.getElementById('pax').value);
      const name = document.getElementById('name').value.trim();
      const location = locationSelect.value;

      if (!date || !location || !name || !pax) {
        alert('Please complete all fields.');
        return;
      }

      if (!isValidName(name)) {
        alert('Name must contain letters only (min 3 characters).');
        return;
      }

      if (pax < 1 || pax > 20) {
        alert('Pax must be between 1 and 20.');
        return;
      }

      // Show Confirmation
      overlay.hidden = false;
      confirmModal.hidden = false;
      successModal.hidden = true;
    });
  }

  /* Modal Button Listeners */
  cancelBtn?.addEventListener('click', () => {
    overlay.hidden = true;
  });

  /* Inside your confirmBtn listener in js/index.js */

confirmBtn?.addEventListener('click', () => {
  // 1. Collect the data from the form fields
  const date = document.getElementById('date').value;
  const pax = document.getElementById('pax').value;
  const name = document.getElementById('name').value.trim();
  const locationSelect = document.getElementById('location');
  const locationName = locationSelect.options[locationSelect.selectedIndex].text;

  // 2. Format the WhatsApp Message
  // Using \n for new lines
  const message = `Halo Wangi Seruni! ✨
Saya ingin melakukan reservasi:

*Nama:* ${name}
*Tanggal:* ${date}
*Lokasi:* ${locationName}
*Jumlah Orang:* ${pax} Pax

Mohon konfirmasinya. Terima kasih!`;

  // 3. Create the WhatsApp URL
  // Phone: 6287821517389 (International format without +)
  const phoneNumber = "6287821517389";
  const encodedMessage = encodeURIComponent(message);
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;

  // 4. UI Actions
  confirmModal.hidden = true;
  successModal.hidden = false;

  // 5. Open WhatsApp in a new tab
  window.open(whatsappUrl, '_blank');
});

  closeBtn?.addEventListener('click', () => {
    overlay.hidden = true;
    form.reset();
  });

  overlay?.addEventListener('click', e => {
    if (e.target === overlay) overlay.hidden = true;
  });
});