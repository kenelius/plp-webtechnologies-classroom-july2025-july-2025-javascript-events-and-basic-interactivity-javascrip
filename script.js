// --- Helper utilities ---
// Simple helper for selecting elements
const $ = selector => document.querySelector(selector);
const $$ = selector => Array.from(document.querySelectorAll(selector));

// --- Tabs: event handling & switching ---
// Purpose: Provide accessible tabbed navigation and show/hide corresponding panels.
(function initTabs(){
  const tabButtons = $$('.tab-btn');
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      // deactivate all
      tabButtons.forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });
      const panels = $$('.tab-panel');
      panels.forEach(p => p.classList.remove('active'));

      // activate target
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');
      const targetId = btn.dataset.target;
      const panel = document.getElementById(targetId);
      if (panel) panel.classList.add('active');
    });
  });
})();

// --- Accordion: toggle each answer on header click ---
// Purpose: Create an interactive FAQ where clicking a question toggles its answer.
(function initAccordion(){
  const headers = $$('.accordion-header');
  headers.forEach(h => {
    h.addEventListener('click', () => {
      const item = h.parentElement;
      const panel = item.querySelector('.accordion-panel');
      const isOpen = panel.style.display === 'block';
      // close all panels (simple one-open behavior)
      $$('.accordion-panel').forEach(p => p.style.display = 'none');
      if (!isOpen) {
        panel.style.display = 'block';
      }
    });
  });
})();

// --- Live character counter + preview button ---
// Purpose: Show message length and allow immediate preview in a modal.
(function initMessagePreviewAndCounter(){
  const message = $('#message');
  const charCount = $('#charCount');
  const previewBtn = $('#previewBtn');
  const previewModal = $('#previewModal');
  const previewBody = $('#previewBody');
  const closePreview = $('#closePreview');

  // Update character count on input
  message.addEventListener('input', () => {
    const len = message.value.length;
    charCount.textContent = len;
    if (len > 500) {
      charCount.style.color = 'var(--danger)';
    } else {
      charCount.style.color = '';
    }
  });

  // Show preview modal
  previewBtn.addEventListener('click', () => {
    previewBody.textContent = message.value || '(No message entered)';
    previewModal.classList.remove('hidden');
  });

  // Close preview modal
  closePreview.addEventListener('click', () => {
    previewModal.classList.add('hidden');
  });

  // Close on overlay click (optional)
  previewModal.addEventListener('click', (e) => {
    if (e.target === previewModal) previewModal.classList.add('hidden');
  });
})();

// --- Form validation & submission handling ---
// Purpose: Implement custom (JS) validation rules and persist submissions to localStorage.
(function initForm(){
  const form = $('#contactForm');
  const nameInput = $('#name');
  const emailInput = $('#email');
  const phoneInput = $('#phone');
  const serviceSelect = $('#service');
  const messageInput = $('#message');
  const termsCheckbox = $('#terms');

  // error elements
  const nameError = $('#nameError');
  const emailError = $('#emailError');
  const phoneError = $('#phoneError');
  const serviceError = $('#serviceError');
  const messageError = $('#messageError');
  const termsError = $('#termsError');

  const SUB_KEY = 'plp_submissions_v1';

  // Basic validators
  function validateName(value){
    if (!value || value.trim().length < 3) return "Please enter your full name (at least 3 characters).";
    return "";
  }
  function validateEmail(value){
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!value) return "Email is required.";
    if (!re.test(value)) return "Please enter a valid email address.";
    return "";
  }
  function validatePhone(value){
    if (!value) return ""; // optional
    // normalize and check digits (require at least 7 digits)
    const digits = value.replace(/\D/g,'');
    if (digits.length < 7) return "Please enter a valid phone number with at least 7 digits.";
    return "";
  }
  function validateService(value){
    if (!value) return "Please select a service of interest.";
    return "";
  }
  function validateMessage(value){
    if (!value || value.trim().length < 20) return "Message must be at least 20 characters.";
    if (value.length > 500) return "Message must be 500 characters or fewer.";
    return "";
  }
  function validateTerms(checked){
    if (!checked) return "You must agree to be contacted.";
    return "";
  }

  // show / hide error helper
  function showError(el, msg){
    el.textContent = msg;
  }

  // gather form data
  function getFormData(){
    return {
      id: Date.now().toString(36),
      name: nameInput.value.trim(),
      email: emailInput.value.trim(),
      phone: phoneInput.value.trim(),
      service: serviceSelect.value,
      message: messageInput.value.trim(),
      agreed: termsCheckbox.checked,
      createdAt: new Date().toISOString()
    };
  }

  // save submission to localStorage
  function saveSubmission(obj){
    const list = JSON.parse(localStorage.getItem(SUB_KEY) || '[]');
    list.unshift(obj);
    localStorage.setItem(SUB_KEY, JSON.stringify(list));
    renderSubmissions();
  }

  // render submissions on page
  function renderSubmissions(){
    const ul = $('#submissionList');
    ul.innerHTML = '';
    const list = JSON.parse(localStorage.getItem(SUB_KEY) || '[]');
    if (list.length === 0){
      ul.innerHTML = '<li class="muted">No submissions yet.</li>';
      return;
    }
    list.forEach(item => {
      const li = document.createElement('li');
      li.className = 'submission-item';
      li.innerHTML = `
        <div>
          <div><strong>${escapeHtml(item.name)}</strong> — ${escapeHtml(item.service || '—')}</div>
          <div class="submission-meta">${new Date(item.createdAt).toLocaleString()} • ${escapeHtml(item.email)} ${item.phone ? '• ' + escapeHtml(item.phone) : ''}</div>
          <div style="margin-top:8px;">${escapeHtml(shorten(item.message, 160))}</div>
        </div>
        <div>
          <button class="small" data-id="${item.id}" aria-label="Delete submission">Delete</button>
        </div>
      `;
      ul.appendChild(li);
    });

    // attach delete handlers
    $$('.submission-item button').forEach(btn => btn.addEventListener('click', (e) => {
      const id = e.currentTarget.dataset.id;
      const filtered = JSON.parse(localStorage.getItem(SUB_KEY) || '[]').filter(s => s.id !== id);
      localStorage.setItem(SUB_KEY, JSON.stringify(filtered));
      renderSubmissions();
    }));
  }

  // escape html to avoid injection in demo
  function escapeHtml(str){
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function shorten(str, n){
    return str.length <= n ? escapeHtml(str) : escapeHtml(str.slice(0,n)) + '…';
  }

  // Live validation binding for better UX
  nameInput.addEventListener('input', () => showError(nameError, validateName(nameInput.value)));
  emailInput.addEventListener('input', () => showError(emailError, validateEmail(emailInput.value)));
  phoneInput.addEventListener('input', () => showError(phoneError, validatePhone(phoneInput.value)));
  serviceSelect.addEventListener('change', () => showError(serviceError, validateService(serviceSelect.value)));
  messageInput.addEventListener('input', () => showError(messageError, validateMessage(messageInput.value)));
  termsCheckbox.addEventListener('change', () => showError(termsError, validateTerms(termsCheckbox.checked)));

  // On submit, run validations, show errors, then save if ok
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const data = getFormData();
    const vName = validateName(data.name);
    const vEmail = validateEmail(data.email);
    const vPhone = validatePhone(data.phone);
    const vService = validateService(data.service);
    const vMessage = validateMessage(data.message);
    const vTerms = validateTerms(data.agreed);

    // show errors
    showError(nameError, vName);
    showError(emailError, vEmail);
    showError(phoneError, vPhone);
    showError(serviceError, vService);
    showError(messageError, vMessage);
    showError(termsError, vTerms);

    // if no errors, proceed
    if (!vName && !vEmail && !vPhone && !vService && !vMessage && !vTerms) {
      saveSubmission(data);
      showTemporarySuccess("Your request was saved locally — demo only.");
      form.reset();
      $('#charCount').textContent = '0';
    }
  });

  // Clear form button
  $('#clearBtn').addEventListener('click', () => {
    form.reset();
    $$('.error').forEach(el => el.textContent = '');
    $('#charCount').textContent = '0';
  });

  // small on-screen success message
  function showTemporarySuccess(msg){
    const el = document.createElement('div');
    el.textContent = msg;
    el.style.position = 'fixed';
    el.style.right = '20px';
    el.style.bottom = '20px';
    el.style.background = 'white';
    el.style.padding = '12px 16px';
    el.style.borderRadius = '10px';
    el.style.boxShadow = '0 6px 18px rgba(2,6,23,0.08)';
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 3500);
  }

  // initial render
  renderSubmissions();

})(); // end initForm
