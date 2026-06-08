/* ==========================================
   CRE8LABS — APPLICATION LOGIC
   ========================================== */

// ===================== GOOGLE SHEETS CONFIG =====================
// Replace with your deployed Google Apps Script URL (see setup guide)
const GOOGLE_SHEET_URL = 'https://script.google.com/macros/s/AKfycbyrypbXzgmVV66qnOwqTy66mMuDu4DLDtnNwakqgcv1q-t0K5vIJdsPlpbqZznOfTDa/exec';

// ===================== DEFAULT DATA =====================
const DEFAULT_DOMAINS = [
  { id: 'web', name: 'Web Dev', color: '#2a3ef5' },
  { id: 'video', name: 'Video', color: '#7a2ff7' }
];

const DEFAULT_SERVICES = [
  {
    id: 's1', icon: '🚀', title: 'Custom Web Development',
    desc: 'Full-stack applications built with modern frameworks. From React SPAs to complex enterprise platforms — we engineer for scale.',
    domain: 'web'
  },
  {
    id: 's2', icon: '🎬', title: 'Cinematic Video Editing',
    desc: 'Professional post-production that transforms raw footage into compelling visual stories with Hollywood-grade color grading.',
    domain: 'video'
  },
  {
    id: 's3', icon: '🎨', title: 'UI/UX Design',
    desc: 'Human-centered design systems that balance beauty with usability. Wireframes, prototypes, and pixel-perfect interfaces.',
    domain: 'web'
  },
  {
    id: 's4', icon: '📱', title: 'Motion Graphics',
    desc: 'Eye-catching animated content for social media, ads, and presentations. 2D & 3D motion that stops the scroll.',
    domain: 'video'
  },
  {
    id: 's5', icon: '⚡', title: 'Performance Optimization',
    desc: 'Speed audits, Core Web Vitals tuning, and infrastructure optimization to ensure your site loads in under 2 seconds.',
    domain: 'web'
  },
  {
    id: 's6', icon: '🎯', title: 'Brand Video Production',
    desc: 'End-to-end video production from concept to delivery. Testimonials, product launches, and corporate storytelling.',
    domain: 'video'
  }
];

const DEFAULT_PROJECTS = [
  {
    id: 'p1', icon: '🏦', title: 'FinVault Dashboard',
    desc: 'A real-time financial analytics dashboard with dark mode, interactive charts, and AI-powered insights for portfolio management.',
    domain: 'web', tags: ['React', 'TypeScript', 'D3.js', 'Node.js'],
    link: 'https://finvault-demo.vercel.app',
    thumbnail: 'https://picsum.photos/seed/finvault/600/400'
  },
  {
    id: 'p2', icon: '🎥', title: 'Horizon Brand Film',
    desc: 'A cinematic brand film for a tech startup featuring drone footage, dynamic transitions, and an original soundtrack.',
    domain: 'video', tags: ['Premiere Pro', 'After Effects', 'DaVinci Resolve'],
    link: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    thumbnail: 'https://picsum.photos/seed/horizon/600/400'
  },
  {
    id: 'p3', icon: '🛒', title: 'LuxeCart E-Commerce',
    desc: 'A premium e-commerce platform with 3D product previews, AI recommendations, and seamless checkout experience.',
    domain: 'web', tags: ['Next.js', 'Stripe', 'Three.js', 'PostgreSQL'],
    link: 'https://luxecart-demo.vercel.app',
    thumbnail: 'https://picsum.photos/seed/luxecart/600/400'
  },
  {
    id: 'p4', icon: '✨', title: 'Nova Launch Reel',
    desc: 'A high-energy product launch video with kinetic typography, particle effects, and synchronized audio design.',
    domain: 'video', tags: ['After Effects', 'Cinema 4D', 'Sound Design'],
    link: 'https://vimeo.com/123456789',
    thumbnail: 'https://picsum.photos/seed/launchreel/600/400'
  },
  {
    id: 'p5', icon: '🏥', title: 'MedConnect Platform',
    desc: 'A HIPAA-compliant telehealth platform with real-time video calls, appointment scheduling, and secure patient records.',
    domain: 'web', tags: ['Vue.js', 'WebRTC', 'AWS', 'HIPAA'],
    link: 'https://medconnect-demo.vercel.app',
    thumbnail: 'https://picsum.photos/seed/medconnect/600/400'
  },
  {
    id: 'p6', icon: '📸', title: 'Wanderlust Travel Series',
    desc: 'A 6-episode travel documentary series with color-graded aerials, ambient soundscapes, and narrative voiceover.',
    domain: 'video', tags: ['Premiere Pro', 'Color Grading', 'Aerial', 'Sound Mix'],
    link: 'https://www.youtube.com/watch?v=ScMzIvxBSi4',
    thumbnail: 'https://picsum.photos/seed/wanderlust/600/400'
  }
];

// ===================== STATE =====================
let isAdmin = false;
let domains = [];
let services = [];
let projects = [];
let currentFilter = 'all';
let modalMode = null;   // 'service' | 'project'
let editingId = null;

// ===================== STORAGE =====================
function loadData() {
  try {
    const sd = window.localStorage.getItem('nc_domains');
    const ss = window.localStorage.getItem('nc_services');
    const sp = window.localStorage.getItem('nc_projects');
    domains = sd ? JSON.parse(sd) : structuredClone(DEFAULT_DOMAINS);
    services = ss ? JSON.parse(ss) : structuredClone(DEFAULT_SERVICES);
    projects = sp ? JSON.parse(sp) : structuredClone(DEFAULT_PROJECTS);
  } catch {
    domains = structuredClone(DEFAULT_DOMAINS);
    services = structuredClone(DEFAULT_SERVICES);
    projects = structuredClone(DEFAULT_PROJECTS);
  }

  // Migrate old domain colors to new editorial theme
  const OLD_COLORS = ['#6A9EBF', '#6a9ebf', '#C49A6C', '#c49a6c', '#e8ff47', '#E8FF47'];
  const COLOR_MAP = { 'web': '#2a3ef5', 'video': '#7a2ff7' };
  let migrated = false;
  domains.forEach(d => {
    if (OLD_COLORS.includes(d.color)) {
      d.color = COLOR_MAP[d.id] || '#2a3ef5';
      migrated = true;
    }
  });
  if (migrated) saveData();
}

function saveData() {
  try {
    window.localStorage.setItem('nc_domains', JSON.stringify(domains));
    window.localStorage.setItem('nc_services', JSON.stringify(services));
    window.localStorage.setItem('nc_projects', JSON.stringify(projects));
  } catch (e) { console.warn('Storage save failed:', e); }
}

// ===================== HELPERS =====================
function getDomain(id) {
  return domains.find(d => d.id === id);
}

function domainBadgeHTML(domainId) {
  const d = getDomain(domainId);
  if (!d) return `<span class="domain-badge" style="background:rgba(0,0,0,0.06);color:var(--text-muted);">${domainId}</span>`;
  const bg = hexToRgba(d.color, 0.12);
  const textColor = darkenHex(d.color, 0.25);
  return `<span class="domain-badge" style="background:${bg};color:${textColor};">${d.name}</span>`;
}

function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function darkenHex(hex, amount) {
  const r = Math.max(0, Math.round(parseInt(hex.slice(1, 3), 16) * (1 - amount)));
  const g = Math.max(0, Math.round(parseInt(hex.slice(3, 5), 16) * (1 - amount)));
  const b = Math.max(0, Math.round(parseInt(hex.slice(5, 7), 16) * (1 - amount)));
  return `rgb(${r},${g},${b})`;
}

function thumbGradientStyle(domainId) {
  const d = getDomain(domainId);
  if (!d) return 'background:rgba(0,0,0,0.04);';
  return `background:linear-gradient(135deg, ${hexToRgba(d.color, 0.15)}, ${hexToRgba(shiftHue(d.color, 60), 0.1)});`;
}

function shiftHue(hex, deg) {
  let r = parseInt(hex.slice(1, 3), 16) / 255;
  let g = parseInt(hex.slice(3, 5), 16) / 255;
  let b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  let h = 0, s, l = (max + min) / 2;
  if (d !== 0) {
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  } else { s = 0; }
  h = ((h * 360 + deg) % 360) / 360;
  function hue2rgb(p, q, t) {
    if (t < 0) t++; if (t > 1) t--;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  }
  const q2 = l < 0.5 ? l * (1 + (s || 0)) : l + (s || 0) - l * (s || 0);
  const p2 = 2 * l - q2;
  const rr = Math.round(hue2rgb(p2, q2, h + 1 / 3) * 255);
  const gg = Math.round(hue2rgb(p2, q2, h) * 255);
  const bb = Math.round(hue2rgb(p2, q2, h - 1 / 3) * 255);
  return `#${rr.toString(16).padStart(2, '0')}${gg.toString(16).padStart(2, '0')}${bb.toString(16).padStart(2, '0')}`;
}

// ===================== TOAST =====================
function showToast(message, type = 'success') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  toast.innerHTML = `<span class="toast-icon">${icons[type] || '✅'}</span><span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => { toast.classList.add('leaving'); setTimeout(() => toast.remove(), 300); }, 3000);
}

// ===================== POPULATE DOMAIN SELECTS =====================
function populateDomainSelects() {
  // Modal domain select
  const modalDomain = document.getElementById('modalDomain');
  const currentVal = modalDomain.value;
  modalDomain.innerHTML = '';
  domains.forEach(d => {
    const opt = document.createElement('option');
    opt.value = d.id;
    opt.textContent = d.name;
    modalDomain.appendChild(opt);
  });
  if (currentVal && domains.some(d => d.id === currentVal)) {
    modalDomain.value = currentVal;
  }

  // Contact form service interest dropdown
  const contactService = document.getElementById('contactService');
  // Preserve structure: first disabled option + dynamic domains + "other" at end
  const existingOther = contactService.querySelector('option[value="other"]');
  // Remove all dynamic domain options (keep first disabled and last "other")
  const toRemove = [];
  contactService.querySelectorAll('option').forEach(opt => {
    if (!opt.disabled && opt.value !== 'other') toRemove.push(opt);
  });
  toRemove.forEach(o => o.remove());
  // Insert domain options before "other"
  domains.forEach(d => {
    const opt = document.createElement('option');
    opt.value = d.id;
    opt.textContent = d.name;
    contactService.insertBefore(opt, existingOther);
  });
}

// ===================== RENDER FILTER TABS =====================
function renderFilterTabs() {
  const container = document.getElementById('filterTabs');
  container.innerHTML = '';

  // "All" tab
  const allTab = document.createElement('button');
  allTab.className = 'filter-tab' + (currentFilter === 'all' ? ' active' : '');
  allTab.dataset.filter = 'all';
  allTab.textContent = 'All';
  container.appendChild(allTab);

  // One tab per domain
  domains.forEach(d => {
    const tab = document.createElement('button');
    tab.className = 'filter-tab' + (currentFilter === d.id ? ' active' : '');
    tab.dataset.filter = d.id;
    tab.textContent = d.name;
    container.appendChild(tab);
  });
}

// ===================== RENDER SERVICES =====================
function renderServices() {
  const grid = document.getElementById('servicesGrid');
  grid.innerHTML = '';
  services.forEach((s, i) => {
    const card = document.createElement('div');
    card.className = 'service-card reveal-card';
    card.style.transitionDelay = `${i * 0.08}s`;
    card.innerHTML = `
      ${isAdmin ? `
        <button class="btn-edit admin-edit" data-type="service" data-id="${s.id}" aria-label="Edit service">✎</button>
        <button class="btn-danger admin-delete" data-type="service" data-id="${s.id}" aria-label="Delete service">✕</button>
      ` : ''}
      <span class="service-icon">${s.icon}</span>
      <h3 class="service-title">${s.title}</h3>
      <p class="service-desc">${s.desc}</p>
      ${domainBadgeHTML(s.domain)}
    `;
    grid.appendChild(card);
  });
  requestAnimationFrame(() => {
    document.querySelectorAll('#servicesGrid .reveal-card').forEach(c => observeElement(c));
  });
}

// ===================== RENDER PROJECTS =====================
function renderProjects() {
  const grid = document.getElementById('portfolioGrid');
  grid.innerHTML = '';
  const filtered = currentFilter === 'all' ? projects : projects.filter(p => p.domain === currentFilter);
  filtered.forEach((p, i) => {
    const hasLink = p.link && p.link.trim() !== '';
    const wrapper = document.createElement(isAdmin ? 'div' : (hasLink ? 'a' : 'div'));
    if (!isAdmin && hasLink) {
      wrapper.href = p.link;
      wrapper.target = '_blank';
      wrapper.rel = 'noopener noreferrer';
      wrapper.className = 'project-card-link';
    }
    const card = document.createElement('div');
    card.className = 'project-card reveal-card';
    card.style.transitionDelay = `${i * 0.08}s`;

    const hasThumbnail = p.thumbnail && p.thumbnail.trim() !== '';

    card.innerHTML = `
      ${isAdmin ? `
        <button class="btn-edit admin-edit" data-type="project" data-id="${p.id}" aria-label="Edit project">✎</button>
        <button class="btn-danger admin-delete" data-type="project" data-id="${p.id}" aria-label="Delete project">✕</button>
      ` : ''}
      <div class="project-thumb">
        ${hasThumbnail
        ? `<img src="${p.thumbnail}" alt="${p.title}" loading="lazy" />`
        : `<div class="thumb-gradient" style="${thumbGradientStyle(p.domain)}"></div>
             <span style="position:relative;z-index:1;">${p.icon}</span>`
      }
        ${(!isAdmin && hasLink) ? '<span class="project-link-indicator">↗</span>' : ''}
      </div>
      <span class="project-badge">${domainBadgeHTML(p.domain)}</span>
      <div class="project-body">
        <h3 class="project-title">${p.title}</h3>
        <p class="project-desc">${p.desc}</p>
        <div class="project-tags">
          ${p.tags.map(t => `<span class="project-tag">${t}</span>`).join('')}
        </div>
      </div>
    `;

    if (!isAdmin && hasLink) { wrapper.appendChild(card); grid.appendChild(wrapper); }
    else grid.appendChild(card);
  });
  requestAnimationFrame(() => {
    document.querySelectorAll('#portfolioGrid .reveal-card').forEach(c => observeElement(c));
  });
}

// ===================== RENDER DOMAIN LIST (MODAL) =====================
function renderDomainList() {
  const list = document.getElementById('domainList');
  list.innerHTML = '';
  domains.forEach(d => {
    const usedBy = services.filter(s => s.domain === d.id).length + projects.filter(p => p.domain === d.id).length;
    const item = document.createElement('div');
    item.className = 'domain-item';
    item.innerHTML = `
      <span class="domain-color-dot" style="background:${d.color};"></span>
      <span class="domain-item-name">${d.name}</span>
      <span class="domain-item-slug">${d.id}</span>
      <span class="domain-item-count">${usedBy} item${usedBy !== 1 ? 's' : ''}</span>
      <button class="domain-item-delete" data-domain-id="${d.id}" title="Delete domain">✕</button>
    `;
    list.appendChild(item);
  });
}

// ===================== OBSERVER =====================
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) { entry.target.classList.add('visible'); observer.unobserve(entry.target); }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

function observeElement(el) { el.classList.remove('visible'); observer.observe(el); }

// ===================== ADMIN =====================
function enterAdmin() {
  isAdmin = true;
  document.getElementById('adminToggle').classList.add('active');
  document.getElementById('adminBar').style.display = 'flex';
  document.getElementById('addServiceBtn').style.display = 'inline-flex';
  document.getElementById('addProjectBtn').style.display = 'inline-flex';
  renderServices();
  renderProjects();
  showToast('Admin mode activated', 'info');
}

function exitAdmin() {
  isAdmin = false;
  document.getElementById('adminToggle').classList.remove('active');
  document.getElementById('adminBar').style.display = 'none';
  document.getElementById('addServiceBtn').style.display = 'none';
  document.getElementById('addProjectBtn').style.display = 'none';
  renderServices();
  renderProjects();
  showToast('Admin mode deactivated', 'info');
}

// ===================== MODAL SYSTEM =====================
function openModal(mode, existingItem = null) {
  modalMode = mode;
  editingId = existingItem ? existingItem.id : null;
  const overlay = document.getElementById('modalOverlay');
  const title = document.getElementById('modalTitle');
  const submitText = document.getElementById('modalSubmitText');
  const tagsGroup = document.getElementById('tagsGroup');
  const linkGroup = document.getElementById('linkGroup');
  const thumbnailGroup = document.getElementById('thumbnailGroup');
  document.getElementById('modalForm').reset();
  resetThumbPreview();
  populateDomainSelects();

  const isEditing = !!existingItem;
  if (mode === 'service') {
    title.textContent = isEditing ? 'Edit Service' : 'Add Service';
    submitText.textContent = isEditing ? 'Save Changes' : 'Add Service';
    tagsGroup.style.display = 'none';
    linkGroup.style.display = 'none';
    thumbnailGroup.style.display = 'none';
  } else {
    title.textContent = isEditing ? 'Edit Project' : 'Add Project';
    submitText.textContent = isEditing ? 'Save Changes' : 'Add Project';
    tagsGroup.style.display = 'block';
    linkGroup.style.display = 'block';
    thumbnailGroup.style.display = 'block';
  }

  if (isEditing) {
    document.getElementById('modalIcon').value = existingItem.icon || '';
    document.getElementById('modalItemTitle').value = existingItem.title || '';
    document.getElementById('modalDesc').value = existingItem.desc || '';
    document.getElementById('modalDomain').value = existingItem.domain || '';
    if (mode === 'project') {
      document.getElementById('modalTags').value = (existingItem.tags || []).join(', ');
      document.getElementById('modalLink').value = existingItem.link || '';
      document.getElementById('modalThumbnail').value = existingItem.thumbnail || '';
      updateThumbPreview(existingItem.thumbnail || '');
    }
  }
  overlay.classList.add('show');
}

function resetThumbPreview() {
  const img = document.getElementById('thumbPreviewImg');
  img.classList.remove('visible');
  img.src = '';
}

function updateThumbPreview(url) {
  const img = document.getElementById('thumbPreviewImg');
  if (url && url.trim()) {
    img.src = url;
    img.onload = () => img.classList.add('visible');
    img.onerror = () => img.classList.remove('visible');
  } else {
    img.classList.remove('visible');
    img.src = '';
  }
}

function closeModal() {
  document.getElementById('modalOverlay').classList.remove('show');
  modalMode = null; editingId = null;
}

function closePasswordModal() {
  document.getElementById('passwordOverlay').classList.remove('show');
  document.getElementById('passwordForm').reset();
}

function openDomainModal() {
  renderDomainList();
  document.getElementById('domainOverlay').classList.add('show');
}

function closeDomainModal() {
  document.getElementById('domainOverlay').classList.remove('show');
  document.getElementById('domainAddForm').reset();
}

// ===================== SVG RIBBON ANIMATION =====================
function animateRibbon() {
  const ribbon = document.querySelector('.ribbon-path');
  if (!ribbon) return;
  // Subtle path morphing animation
  const paths = [
    'M-100,150 C200,50 350,400 600,350 S900,100 1100,300 S1400,600 1600,450',
    'M-100,200 C200,100 300,450 600,300 S950,80 1100,350 S1350,550 1600,400',
    'M-100,120 C250,30 400,380 600,380 S850,130 1100,280 S1450,620 1600,480'
  ];
  let current = 0;
  setInterval(() => {
    current = (current + 1) % paths.length;
    ribbon.setAttribute('d', paths[current]);
  }, 5000);
}

// ===================== COUNT-UP =====================
function animateCounters() {
  document.querySelectorAll('.stat-number').forEach(counter => {
    const target = +counter.dataset.target;
    const duration = 2000, startTime = performance.now();
    function step(now) {
      const progress = Math.min((now - startTime) / duration, 1);
      counter.textContent = Math.floor((1 - Math.pow(1 - progress, 3)) * target);
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  });
}

// ===================== NAV SCROLL =====================
function handleNavScroll() {
  document.getElementById('navbar').classList.toggle('scrolled', window.scrollY > 50);
}

function updateActiveLink() {
  const sections = ['home', 'services', 'work', 'contact'];
  const scrollPos = window.scrollY + 200;
  for (let i = sections.length - 1; i >= 0; i--) {
    const sec = document.getElementById(sections[i]);
    if (sec && sec.offsetTop <= scrollPos) {
      document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
      document.querySelector(`.nav-link[href="#${sections[i]}"]`)?.classList.add('active');
      break;
    }
  }
}

// ===================== DELETE / EDIT HANDLERS =====================
function handleDelete(e) {
  const btn = e.target.closest('.admin-delete');
  if (!btn) return;
  e.preventDefault(); e.stopPropagation();
  const { type, id } = btn.dataset;
  if (type === 'service') {
    services = services.filter(s => s.id !== id);
    saveData(); renderServices(); showToast('Service deleted', 'success');
  } else if (type === 'project') {
    projects = projects.filter(p => p.id !== id);
    saveData(); renderProjects(); showToast('Project deleted', 'success');
  }
}

function handleEdit(e) {
  const btn = e.target.closest('.admin-edit');
  if (!btn) return;
  e.preventDefault(); e.stopPropagation();
  const { type, id } = btn.dataset;
  if (type === 'service') {
    const item = services.find(s => s.id === id);
    if (item) openModal('service', item);
  } else if (type === 'project') {
    const item = projects.find(p => p.id === id);
    if (item) openModal('project', item);
  }
}

// ===================== FULL REFRESH (after domain changes) =====================
function fullRefresh() {
  populateDomainSelects();
  renderFilterTabs();
  renderServices();
  renderProjects();
}

// ===================== INITIALIZATION =====================
document.addEventListener('DOMContentLoaded', () => {
  loadData();
  animateRibbon();
  populateDomainSelects();
  renderFilterTabs();
  renderServices();
  renderProjects();

  setTimeout(() => {
    document.querySelectorAll('.hero .animate-in').forEach(el => el.classList.add('visible'));
  }, 200);
  setTimeout(animateCounters, 800);

  window.addEventListener('scroll', () => { handleNavScroll(); updateActiveLink(); }, { passive: true });

  document.querySelectorAll('.section-header, .contact-form, .contact-info .info-card').forEach(el => {
    el.classList.add('reveal-card'); observeElement(el);
  });

  // -------- THUMBNAIL PREVIEW --------
  document.getElementById('modalThumbnail').addEventListener('input', (e) => {
    updateThumbPreview(e.target.value);
  });

  // -------- HAMBURGER --------
  const hamburger = document.getElementById('hamburger');
  const navLinks = document.getElementById('navLinks');
  hamburger.addEventListener('click', () => { hamburger.classList.toggle('open'); navLinks.classList.toggle('open'); });
  navLinks.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => { hamburger.classList.remove('open'); navLinks.classList.remove('open'); });
  });

  // -------- ADMIN TOGGLE --------
  document.getElementById('adminToggle').addEventListener('click', () => {
    if (isAdmin) exitAdmin();
    else document.getElementById('passwordOverlay').classList.add('show');
  });

  document.getElementById('passwordForm').addEventListener('submit', (e) => {
    e.preventDefault();
    if (document.getElementById('adminPassword').value === 'Cre8labs@2026') {
      closePasswordModal(); enterAdmin();
    } else showToast('Incorrect password', 'error');
  });
  document.getElementById('passwordClose').addEventListener('click', closePasswordModal);
  document.getElementById('exitAdminBtn').addEventListener('click', exitAdmin);

  // -------- ADD BUTTONS --------
  document.getElementById('addServiceBtn').addEventListener('click', () => openModal('service'));
  document.getElementById('addProjectBtn').addEventListener('click', () => openModal('project'));

  // -------- MANAGE DOMAINS --------
  document.getElementById('manageDomainsBtn').addEventListener('click', openDomainModal);
  document.getElementById('domainClose').addEventListener('click', closeDomainModal);
  document.getElementById('domainOverlay').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeDomainModal();
  });

  // Add domain
  document.getElementById('domainAddForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const color = document.getElementById('domainColor').value;
    const slug = document.getElementById('domainSlug').value.trim().toLowerCase().replace(/[^a-z0-9\-]/g, '');
    const name = document.getElementById('domainDisplayName').value.trim();

    if (!slug || !name) return;
    if (domains.some(d => d.id === slug)) {
      showToast(`Domain "${slug}" already exists`, 'error');
      return;
    }

    domains.push({ id: slug, name, color });
    saveData();
    renderDomainList();
    fullRefresh();
    document.getElementById('domainAddForm').reset();
    showToast(`Domain "${name}" added`, 'success');
  });

  // Delete domain (delegated)
  document.getElementById('domainList').addEventListener('click', (e) => {
    const btn = e.target.closest('.domain-item-delete');
    if (!btn) return;
    const domainId = btn.dataset.domainId;
    const d = getDomain(domainId);
    const usedBy = services.filter(s => s.domain === domainId).length + projects.filter(p => p.domain === domainId).length;

    if (usedBy > 0) {
      showToast(`Cannot delete "${d?.name || domainId}" — ${usedBy} item${usedBy > 1 ? 's' : ''} still assigned to it. Reassign them first.`, 'error');
      return;
    }

    domains = domains.filter(dd => dd.id !== domainId);
    saveData();
    renderDomainList();
    if (currentFilter === domainId) currentFilter = 'all';
    fullRefresh();
    showToast(`Domain "${d?.name || domainId}" removed`, 'success');
  });

  // -------- MODAL CLOSE --------
  document.getElementById('modalClose').addEventListener('click', closeModal);
  document.getElementById('modalOverlay').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeModal();
  });

  // -------- MODAL FORM SUBMIT --------
  document.getElementById('modalForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const icon = document.getElementById('modalIcon').value.trim() || '📦';
    const title = document.getElementById('modalItemTitle').value.trim();
    const desc = document.getElementById('modalDesc').value.trim();
    const domain = document.getElementById('modalDomain').value;
    if (!title || !desc) return;

    if (modalMode === 'service') {
      if (editingId) {
        const idx = services.findIndex(s => s.id === editingId);
        if (idx !== -1) {
          services[idx] = { ...services[idx], icon, title, desc, domain };
          saveData(); renderServices(); closeModal();
          showToast('Service updated successfully', 'success');
        }
      } else {
        services.push({ id: 's_' + Date.now(), icon, title, desc, domain });
        saveData(); renderServices(); closeModal();
        showToast('Service added successfully', 'success');
      }
    } else if (modalMode === 'project') {
      const tagsRaw = document.getElementById('modalTags').value;
      const tags = tagsRaw ? tagsRaw.split(',').map(t => t.trim()).filter(Boolean) : [];
      const link = document.getElementById('modalLink').value.trim();
      const thumbnail = document.getElementById('modalThumbnail').value.trim();
      if (editingId) {
        const idx = projects.findIndex(p => p.id === editingId);
        if (idx !== -1) {
          projects[idx] = { ...projects[idx], icon, title, desc, domain, tags, link, thumbnail };
          saveData(); renderProjects(); closeModal();
          showToast('Project updated successfully', 'success');
        }
      } else {
        projects.push({ id: 'p_' + Date.now(), icon, title, desc, domain, tags, link, thumbnail });
        saveData(); renderProjects(); closeModal();
        showToast('Project added successfully', 'success');
      }
    }
  });

  // -------- FILTER TABS (delegated) --------
  document.getElementById('filterTabs').addEventListener('click', (e) => {
    const tab = e.target.closest('.filter-tab');
    if (!tab) return;
    document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    currentFilter = tab.dataset.filter;
    renderProjects();
  });

  // -------- DELETE + EDIT DELEGATION --------
  document.getElementById('servicesGrid').addEventListener('click', (e) => { handleDelete(e); handleEdit(e); });
  document.getElementById('portfolioGrid').addEventListener('click', (e) => { handleDelete(e); handleEdit(e); });

  // -------- CONTACT FORM --------
  document.getElementById('contactForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const form = e.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalBtnHTML = submitBtn.innerHTML;

    // Gather form data
    const formData = {
      name: document.getElementById('contactName').value.trim(),
      email: document.getElementById('contactEmail').value.trim(),
      service: document.getElementById('contactService').value,
      budget: document.getElementById('contactBudget').value,
      message: document.getElementById('contactMessage').value.trim()
    };

    // Check if Google Sheet URL is configured
    if (!GOOGLE_SHEET_URL || GOOGLE_SHEET_URL === 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE') {
      document.getElementById('formSuccess').classList.add('show');
      showToast('Message received! (Google Sheet not configured yet)', 'info');
      setTimeout(() => { document.getElementById('formSuccess').classList.remove('show'); form.reset(); }, 4000);
      return;
    }

    // Show loading state
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span>Sending...</span>';

    // Build GET URL with form data as query parameters
    const params = new URLSearchParams(formData).toString();
    const requestUrl = `${GOOGLE_SHEET_URL}?${params}`;

    // Load via hidden iframe (bypasses all CORS — works from file://)
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = requestUrl;
    document.body.appendChild(iframe);

    // Show success after a short delay, then clean up
    setTimeout(() => {
      document.getElementById('formSuccess').classList.add('show');
      showToast('Message sent successfully!', 'success');
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalBtnHTML;
      setTimeout(() => { document.getElementById('formSuccess').classList.remove('show'); form.reset(); }, 4000);
      iframe.remove();
    }, 2000);
  });

  // -------- ESCAPE KEY --------
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { closeModal(); closePasswordModal(); closeDomainModal(); }
  });

  handleNavScroll();
  updateActiveLink();
});
