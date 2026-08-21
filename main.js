const API_BASE = new URL('Backend', window.location.href).pathname.replace(/\/$/, '');
const Auth = {
  save(token, student) {
    localStorage.setItem('srs_token', token);
    localStorage.setItem('srs_student', JSON.stringify(student));
  },
  getToken() {
    return localStorage.getItem('srs_token');
  },
  getStudent() {
    const data = localStorage.getItem('srs_student');
    return data ? JSON.parse(data) : null;
  },
  updateStudent(student) {
    localStorage.setItem('srs_student', JSON.stringify(student));
  },
  isLoggedIn() {
    return !!this.getToken();
  },
  clear() {
    localStorage.removeItem('srs_token');
    localStorage.removeItem('srs_student');
  },
  requireLogin() {
    if (!this.isLoggedIn()) {
      window.location.href = 'login.html';
    }
  },
  redirectIfLoggedIn() {
    const student = this.getStudent();
    if (!this.isLoggedIn() || !student) return;

    if (student.role === 'admin') {
      window.location.href = 'admin.html';
    } else if (student.role === 'teacher') {
      window.location.href = 'teacher.html';
    } else {
      window.location.href = 'dashboard.html';
    }
  },
};
const api = {
  /**
   * @param {string} path     
   * @param {string} method   
   * @param {object} body     
   * @returns {Promise<object>}
   */
  async request(path, method = 'GET', body = null) {
    const token = Auth.getToken();

    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }
    if (body) {
      options.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(`${API_BASE}${path}`, options);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('API request failed:', error);
      return {
        success: false,
        message: 'Network error. Please check your connection.',
      };
    }
  },
  get(path)          { return this.request(path, 'GET'); },
  post(path, body)   { return this.request(path, 'POST', body); },
  put(path, body)    { return this.request(path, 'PUT', body); },
};
const Toast = {
  getContainer() {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }
    return container;
  },

  /**
   * Show a toast notification.
   *
   * @param {string} message  
   * @param {string} type     
   * @param {number} duration 
   */
  show(message, type = 'info', duration = 4000) {
    const container = this.getContainer();
    const icons = {
      success: '✅',
      error:   '❌',
      info:    'ℹ️',
    };
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <span class="toast-icon">${icons[type] || icons.info}</span>
      <span class="toast-message">${message}</span>
    `;

    container.appendChild(toast);
    setTimeout(() => {
      toast.style.animation = 'fadeOut 0.3s ease forwards';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  },

  success(msg) { this.show(msg, 'success'); },
  error(msg)   { this.show(msg, 'error'); },
  info(msg)    { this.show(msg, 'info'); },
};
function setupNavbar() {
  const currentPath = window.location.pathname;
  const navLinks = document.querySelectorAll('.navbar-links a, .navbar-mobile a');
  navLinks.forEach(link => {
    if (link.getAttribute('href') === currentPath) {
      link.classList.add('active');
    }
  });
  const toggle = document.getElementById('navbarToggle');
  const mobileMenu = document.getElementById('navbarMobile');

  if (toggle && mobileMenu) {
    toggle.addEventListener('click', () => {
      mobileMenu.classList.toggle('open');
    });
  }
}
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text == null ? '' : String(text);
  return div.innerHTML;
}

function getInitials(firstName, lastName) {
  const first = (firstName || '').charAt(0).toUpperCase();
  const last  = (lastName  || '').charAt(0).toUpperCase();
  return first + last;
}
function formatDate(dateString) {
  if (!dateString) return '—';
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(dateString + 'T00:00:00').toLocaleDateString('en-US', options);
}
function formatGrade(grade) {
  const gradeMap = {
    '9':  '9th Grade',
    '10': '10th Grade',
    '11': '11th Grade',
    '12': '12th Grade',
  };
  return gradeMap[grade] || grade;
}

/**
 * Show an inline alert message on the page.
 *
 * @param {string} elementId 
 * @param {string} message  
 * @param {string} type     
 */
function showAlert(elementId, message, type = 'error') {
  const el = document.getElementById(elementId);
  if (!el) return;

  el.className = `alert alert-${type}`;
  el.innerHTML = `
    <span class="alert-icon">${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}</span>
    <span>${message}</span>
  `;
  el.classList.remove('hidden');
  el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}
function hideAlert(elementId) {
  const el = document.getElementById(elementId);
  if (el) el.classList.add('hidden');
}
function setButtonLoading(button, loading, originalText) {
  if (loading) {
    button.disabled = true;
    button.innerHTML = `<span class="spinner"></span> Please wait...`;
  } else {
    button.disabled = false;
    button.innerHTML = originalText;
  }
}
document.addEventListener('DOMContentLoaded', setupNavbar);