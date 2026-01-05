document.addEventListener('DOMContentLoaded', () => {

  /* ================= FALLBACK DATA ================= */
  const dummyMenuData = {
    main: [
      { title: "Ayam Goreng Seruni", desc: "Signature fried chicken topped with savory crumbs.", price: 32000, image: "assets/ayam.jpg" },
      { title: "Sop Seruni", desc: "A comforting traditional soup.", price: 35000, image: "assets/sop.jpg" },
      { title: "Soto Seruni", desc: "Warm Indonesian chicken soup.", price: 30000, image: "assets/soto.jpg" }
    ],
    side: [
      { title: "Tempe Goreng", desc: "Crispy fried tempeh.", price: 12000, image: "assets/tempe.jpg" },
      { title: "Tahu Isi", desc: "Stuffed tofu with vegetables.", price: 15000, image: "assets/tahu.jpg" },
      { title: "Perkedel", desc: "Classic potato fritter.", price: 10000 }
    ],
    snack: [
      { title: "Pisang Goreng", desc: "Fried banana with crispy batter.", price: 14000 },
      { title: "Singkong Keju", desc: "Cassava with cheese topping.", price: 18000 },
      { title: "Kroket", desc: "Golden fried croquette.", price: 12000 }
    ],
    beverage: [
      { title: "Es Teh Manis", desc: "Sweet iced tea.", price: 8000 },
      { title: "Es Jeruk", desc: "Fresh iced orange juice.", price: 10000 },
      { title: "Wedang Jahe", desc: "Warm ginger drink.", price: 12000 }
    ]
  };

  /* ================= HEADER ================= */
  const header = document.getElementById('siteHeader');
  const logo = document.getElementById('headerLogo');

  if (logo?.dataset?.default) logo.src = logo.dataset.default;
  if (header) {
    header.classList.add('is-scrolled');
    header.classList.remove('is-hero');
  }

  /* ================= FADE-UP ANIMATION ================= */
  const fadeObserver = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          fadeObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );

  /* ================= RENDER FUNCTION ================= */
  // We put the logic here so it can be used for both Fetch and Fallback
  function renderMenu(menuData) {
    document.querySelectorAll('.menu-grid').forEach(grid => {
      const category = grid.dataset.category;
      const items = menuData[category];
      if (!items) return;

      grid.innerHTML = '';

      items.forEach(item => {
        // Handle both number (from API) and string (from dummy)
        let displayPrice = item.price;
        if (typeof item.price === 'number') {
          displayPrice = new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
          }).format(item.price);
        }

        grid.insertAdjacentHTML('beforeend', `
          <article class="menu-card fade-up">
            <div class="menu-image"
              style="background-image:${item.image ? `url('${item.image}')` : 'none'}">
            </div>
            <div class="menu-info">
              <h3 class="menu-title">${item.title}</h3>
              <p class="menu-desc">${item.desc}</p>
              <div class="menu-price">${displayPrice}</div>
            </div>
          </article>
        `);
      });

      grid.querySelectorAll('.fade-up').forEach(el => fadeObserver.observe(el));
    });

    setupCategoryHighlight();
  }

  /* ================= FETCH & RENDER MENU ================= */
  fetch("http://127.0.0.1:8000/menu")
    .then(res => {
      if (!res.ok) throw new Error("Network error");
      return res.json();
    })
    .then(menuData => {
      console.log("Loaded from Backend");
      renderMenu(menuData);
    })
    .catch(err => {
      console.warn("Backend unavailable. Loading dummy data instead.", err);
      renderMenu(dummyMenuData);
    });

  /* ================= CATEGORY CLICK + SCROLL ================= */
  const cats = document.querySelectorAll('.menu-cat');
  const content = document.querySelector('.menu-content');

  cats.forEach(cat => {
    cat.addEventListener('click', () => {
      const target = document.getElementById(cat.dataset.target);
      if (!target) return;

      const scrollTarget = window.innerWidth <= 768 ? window : content;
      const y = target.getBoundingClientRect().top +
        (scrollTarget === window ? window.scrollY : content.scrollTop) - 24;

      scrollTarget.scrollTo({ top: y, behavior: 'smooth' });
    });
  });

  /* ================= AUTO HIGHLIGHT ON SCROLL ================= */
  function setupCategoryHighlight() {
    const groups = document.querySelectorAll('.menu-group');

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const id = entry.target.id;
            cats.forEach(cat => {
              cat.classList.toggle('is-active', cat.dataset.target === id);
            });
          }
        });
      },
      {
        root: window.innerWidth <= 768 ? null : content,
        threshold: 0.45
      }
    );

    groups.forEach(group => observer.observe(group));
  }
});