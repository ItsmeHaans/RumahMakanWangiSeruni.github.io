/**
 * Admin Menu Management Script
 * Final Corrected Version
 */
document.addEventListener('DOMContentLoaded', () => {

  const API = 'http://127.0.0.1:8000/menu';
  const UPLOAD_API = 'http://127.0.0.1:8000/menu/upload';

  /* ================= DOM ELEMENTS ================= */
  const menuModal = document.getElementById('menuModal');
  const cropModal = document.getElementById('cropModal');
  const menuForm = document.getElementById('menuForm');

  const inputId = document.getElementById('menuId');
  const inputName = document.getElementById('menuName');
  const inputDesc = document.getElementById('menuDesc');
  const inputPrice = document.getElementById('menuPrice');
  const inputImageUrl = document.getElementById('menuImageUrl');
  const inputImageFile = document.getElementById('menuImageFile');
  const preview = document.getElementById('imagePreview');

  const cropStage = cropModal.querySelector('.cropper-stage');
  const cropFrame = cropModal.querySelector('.crop-frame');
  const cropImg = document.getElementById('cropperImage');
  const zoomInput = document.getElementById('cropZoom');

  // Buttons
  const btnCropApply = document.getElementById('btnCropApply');
  const btnCropCancel = document.getElementById('btnCropCancel');
  const btnMenuCancel = document.getElementById('btnMenuCancel'); // Explicit Menu Cancel

  /* ================= STATE ================= */
  let scale = 1;
  let pos = { x: 0, y: 0 };
  let start = { x: 0, y: 0 };
  let dragging = false;
  let originalImage = new Image();
  let currentCategory = null;

  /* ================= HELPERS ================= */
  function updateTransform() {
    cropImg.style.transform =
      `translate(-50%, -50%) translate(${pos.x}px, ${pos.y}px) scale(${scale})`;
  }

  function resetCrop() {
    scale = 1;
    pos = { x: 0, y: 0 };
    zoomInput.value = 1;
    updateTransform();
  }

  function fitImageToFrame() {
    if (!cropFrame || !originalImage.naturalWidth) return;

    const fw = cropFrame.clientWidth;
    const fh = cropFrame.clientHeight;
    const iw = originalImage.naturalWidth;
    const ih = originalImage.naturalHeight;

    // Calculate the minimum scale to cover the frame
    const fitScale = Math.max(fw / iw, fh / ih) * 0.6;

    scale = fitScale;
    pos = { x: 0, y: 0 };

    // Update zoom slider limits to match image dimensions
    zoomInput.min = fitScale.toFixed(2);
    zoomInput.max = (fitScale * 3).toFixed(2);
    zoomInput.step = 0.01;
    zoomInput.value = fitScale.toFixed(2);

    updateTransform();
  }

  const closeAllModals = () => {
    menuModal.classList.remove('is-open');
    cropModal.classList.remove('is-open');
    inputImageFile.value = '';
    resetCrop();
  };

  /* ================= CROPPER EVENTS ================= */
  inputImageFile.addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = ev => {
      originalImage.onload = () => {
        cropImg.src = originalImage.src;
        cropModal.classList.add('is-open');
        // Delay slightly to ensure modal is rendered and dimensions are available
        requestAnimationFrame(() => fitImageToFrame());
      };
      originalImage.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  });

  zoomInput.addEventListener('input', () => {
    scale = parseFloat(zoomInput.value);
    updateTransform();
  });

  /* ================= DRAG LOGIC ================= */
  const getPoint = (e) => {
    if (e.touches) return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    return { x: e.clientX, y: e.clientY };
  };

  const dragStart = (e) => {
    dragging = true;
    const p = getPoint(e);
    start.x = p.x - pos.x;
    start.y = p.y - pos.y;
    if (e.type === 'mousedown') e.preventDefault();
  };

  const dragMove = (e) => {
    if (!dragging) return;
    const p = getPoint(e);
    pos.x = p.x - start.x;
    pos.y = p.y - start.y;
    updateTransform();
  };

  const dragEnd = () => dragging = false;

  cropStage.addEventListener('mousedown', dragStart);
  cropStage.addEventListener('touchstart', dragStart, { passive: false });
  window.addEventListener('mousemove', dragMove);
  window.addEventListener('touchmove', dragMove, { passive: false });
  window.addEventListener('mouseup', dragEnd);
  window.addEventListener('touchend', dragEnd);

  /* ================= BUTTON LISTENERS ================= */

  // Close Modals
  if (btnMenuCancel) btnMenuCancel.addEventListener('click', closeAllModals);
  if (btnCropCancel) btnCropCancel.addEventListener('click', closeAllModals);

  // Apply Crop
  btnCropApply.addEventListener('click', () => {
    const frameRect = cropFrame.getBoundingClientRect();
    const imgRect = cropImg.getBoundingClientRect();

    const scaleX = originalImage.naturalWidth / imgRect.width;
    const scaleY = originalImage.naturalHeight / imgRect.height;

    const sx = (frameRect.left - imgRect.left) * scaleX;
    const sy = (frameRect.top - imgRect.top) * scaleY;
    const sw = frameRect.width * scaleX;
    const sh = frameRect.height * scaleY;

    const canvas = document.createElement('canvas');
    canvas.width = 360;
    canvas.height = 365;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(originalImage, sx, sy, sw, sh, 0, 0, 360, 365);

    canvas.toBlob(async blob => {
      const fd = new FormData();
      fd.append('file', blob, 'menu_item.jpg');

      Swal.fire({ title: 'Uploading...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

      try {
        const res = await fetch(UPLOAD_API, { method: 'POST', body: fd });
        const data = await res.json();
        const fullUrl = 'http://127.0.0.1:8000/' + data.url;

        inputImageUrl.value = fullUrl;
        preview.innerHTML = `<img src="${fullUrl}" style="width:100px;border-radius:6px;">`;

        cropModal.classList.remove('is-open');
        Swal.fire({ icon: 'success', title: 'Image Processed', timer: 1000, showConfirmButton: false });
      } catch (err) {
        Swal.fire('Error', 'Upload failed', 'error');
      }
    }, 'image/jpeg');
  });

  /* ================= CORE CRUD LOGIC ================= */
  const loadMenu = async () => {
    try {
      const res = await fetch(API);
      const data = await res.json();

      document.querySelectorAll('.menu-grid').forEach(grid => {
        const cat = grid.dataset.category;
        const items = data[cat] || [];
        grid.innerHTML = '';

        items.forEach(item => {
          grid.insertAdjacentHTML('beforeend', `
            <article class="menu-card" data-id="${item.id}">
              <div class="menu-image" style="background-image:url('${item.image || ''}')"></div>
              <div class="menu-info">
                <h3 class="menu-title">${item.title}</h3>
                <p class="menu-desc">${item.desc || ''}</p>
                <div class="menu-price">Rp ${item.price.toLocaleString('id-ID')}</div>
                <div class="admin-actions">
                  <button class="btn btn-edit">Edit</button>
                  <button class="btn btn-delete">Delete</button>
                </div>
              </div>
            </article>
          `);
        });

        grid.insertAdjacentHTML('beforeend', `
          <article class="menu-card add-card">
            <div class="menu-image" data-category="${cat}" style="cursor:pointer; display:flex; align-items:center; justify-content:center; font-size:40px; color:#999; border: 2px dashed #ccc;">
              <span>+</span>
            </div>
          </article>`);
      });
    } catch (err) {
      console.error("Failed to load menu:", err);
    }
  };

  document.body.addEventListener('click', async (e) => {
    if (e.target.classList.contains('modal-backdrop')) closeAllModals();

    const addCard = e.target.closest('.add-card');
    if (addCard) {
      menuForm.reset();
      inputId.value = '';
      preview.innerHTML = '';
      currentCategory = addCard.querySelector('.menu-image').dataset.category;
      document.getElementById('modalTitle').textContent = `Add to ${currentCategory}`;
      menuModal.classList.add('is-open');
    }

    const editBtn = e.target.closest('.btn-edit');
    if (editBtn) {
      const card = editBtn.closest('.menu-card');
      const id = card.dataset.id;
      currentCategory = card.closest('.menu-grid').dataset.category;

      const res = await fetch(API);
      const data = await res.json();
      const item = data[currentCategory].find(i => i.id == id);

      if (item) {
        inputId.value = item.id;
        inputName.value = item.title;
        inputDesc.value = item.desc || '';
        inputPrice.value = item.price;
        inputImageUrl.value = item.image || '';
        preview.innerHTML = item.image ? `<img src="${item.image}" style="width:100px; border-radius:4px;">` : '';
        document.getElementById('modalTitle').textContent = 'Edit Menu Item';
        menuModal.classList.add('is-open');
      }
    }

    const delBtn = e.target.closest('.btn-delete');
    if (delBtn) {
      const id = delBtn.closest('.menu-card').dataset.id;
      const result = await Swal.fire({
        title: 'Are you sure?',
        text: "This item will be permanently removed.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33'
      });

      if (result.isConfirmed) {
        await fetch(`${API}/${id}`, { method: 'DELETE' });
        loadMenu();
        Swal.fire('Deleted!', 'The item has been removed.', 'success');
      }
    }
  });

  menuForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
      title: inputName.value,
      desc: inputDesc.value,
      price: parseInt(inputPrice.value) || 0,
      image_url: inputImageUrl.value,
      category: currentCategory
    };

    const isUpdate = inputId.value !== '';
    const url = isUpdate ? `${API}/${inputId.value}` : API;
    const method = isUpdate ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        closeAllModals();
        loadMenu();
        Swal.fire('Success', 'Menu item saved successfully!', 'success');
      } else {
        throw new Error("Failed to save");
      }
    } catch (err) {
      Swal.fire('Error', 'Could not save menu item.', 'error');
    }
  });

  loadMenu();
});