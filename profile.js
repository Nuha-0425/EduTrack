Auth.requireLogin();
const editBtn    = document.getElementById('editBtn');
const cancelBtn  = document.getElementById('cancelBtn');
const cancelBtn2 = document.getElementById('cancelBtn2');
const editForm   = document.getElementById('editForm');
const viewMode   = document.getElementById('viewMode');
const profileForm = document.getElementById('profileForm');
const saveBtn    = document.getElementById('saveBtn');
function displayProfile(student) {
  const fullName = `${student.firstName} ${student.lastName}`;

  document.getElementById('profileAvatar').textContent  = getInitials(student.firstName, student.lastName);
  document.getElementById('profileFullName').textContent = fullName;
  document.getElementById('profileStudentId').textContent = `Student ID: ${student.studentId}`;
  document.getElementById('profileGrade').textContent   = formatGrade(student.grade);
  document.getElementById('navAvatar').textContent   = getInitials(student.firstName, student.lastName);
  document.getElementById('navUserName').textContent = fullName;
  document.getElementById('viewFirstName').textContent = student.firstName;
  document.getElementById('viewLastName').textContent  = student.lastName;
  document.getElementById('viewStudentId').textContent = student.studentId;
  document.getElementById('viewEmail').textContent     = student.email;
  document.getElementById('viewPhone').textContent     = student.phone;
  document.getElementById('viewGender').textContent    = capitalizeGender(student.gender);
  document.getElementById('viewDOB').textContent       = formatDate(student.dateOfBirth);
  document.getElementById('viewGrade').textContent     = formatGrade(student.grade);
  document.getElementById('viewSection').textContent   = student.section ? `Section ${student.section}` : '—';
  document.getElementById('viewCreatedAt').textContent = formatDate(student.createdAt?.slice(0, 10));
}

function capitalizeGender(gender) {
  if (!gender) return '—';
  return gender.charAt(0).toUpperCase() + gender.slice(1).replace(/_/g, ' ');
}
function enterEditMode() {
  const student = Auth.getStudent();
  document.getElementById('editFirstName').value = student.firstName || '';
  document.getElementById('editLastName').value  = student.lastName  || '';
  document.getElementById('editPhone').value     = student.phone     || '';
  document.getElementById('editDOB').value       = student.dateOfBirth || '';
  setSelectValue('editGender', student.gender);
  setSelectValue('editGrade', student.grade);
  editForm.classList.add('visible');
  viewMode.classList.add('hidden');

  hideAlert('editAlert');

  editForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
function setSelectValue(selectId, value) {
  const select = document.getElementById(selectId);
  for (const option of select.options) {
    if (option.value === value) {
      option.selected = true;
      break;
    }
  }
}

function exitEditMode() {
  editForm.classList.remove('visible');
  viewMode.classList.remove('hidden');
  hideAlert('editAlert');
}

editBtn.addEventListener('click', enterEditMode);
cancelBtn.addEventListener('click', exitEditMode);
cancelBtn2.addEventListener('click', exitEditMode);

function showFieldError(fieldId, errorId, message) {
  const field = document.getElementById(fieldId);
  const error = document.getElementById(errorId);
  if (field) field.classList.add('error');
  if (error) {
    error.textContent = message;
    error.classList.add('visible');
  }
  return false;
}

function clearFieldError(fieldId, errorId) {
  const field = document.getElementById(fieldId);
  const error = document.getElementById(errorId);
  if (field) field.classList.remove('error');
  if (error) error.classList.remove('visible');
  return true;
}

function validateEditFirstName() {
  const value = document.getElementById('editFirstName').value.trim();
  if (!value) return showFieldError('editFirstName', 'editFirstNameError', 'First name is required.');
  if (!/^[a-zA-Z\s'-]+$/.test(value))
    return showFieldError('editFirstName', 'editFirstNameError', 'First name can only contain letters.');
  return clearFieldError('editFirstName', 'editFirstNameError');
}

function validateEditLastName() {
  const value = document.getElementById('editLastName').value.trim();
  if (!value) return showFieldError('editLastName', 'editLastNameError', 'Last name is required.');
  if (!/^[a-zA-Z\s'-]+$/.test(value))
    return showFieldError('editLastName', 'editLastNameError', 'Last name can only contain letters.');
  return clearFieldError('editLastName', 'editLastNameError');
}

function validateEditPhone() {
  const value = document.getElementById('editPhone').value.trim();
  const phoneRegex = /^[+\d\s\-().]{7,20}$/;
  if (!value) return showFieldError('editPhone', 'editPhoneError', 'Phone number is required.');
  if (!phoneRegex.test(value))
    return showFieldError('editPhone', 'editPhoneError', 'Please enter a valid phone number.');
  return clearFieldError('editPhone', 'editPhoneError');
}

document.getElementById('editFirstName').addEventListener('blur', validateEditFirstName);
document.getElementById('editLastName').addEventListener('blur', validateEditLastName);
document.getElementById('editPhone').addEventListener('blur', validateEditPhone);

profileForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  hideAlert('editAlert');

  const isValid = [
    validateEditFirstName(),
    validateEditLastName(),
    validateEditPhone(),
  ].every(Boolean);

  if (!isValid) return;

  const originalText = saveBtn.textContent;
  setButtonLoading(saveBtn, true, originalText);
  const updates = {
    firstName:   document.getElementById('editFirstName').value.trim(),
    lastName:    document.getElementById('editLastName').value.trim(),
    phone:       document.getElementById('editPhone').value.trim(),
    gender:      document.getElementById('editGender').value,
    dateOfBirth: document.getElementById('editDOB').value,
    grade:       document.getElementById('editGrade').value,
  };
  const result = await api.put('/student/me.php', updates);

  setButtonLoading(saveBtn, false, originalText);

  if (result.success) {
    Auth.updateStudent(result.student);
    displayProfile(result.student);
    exitEditMode();
    Toast.success(result.message || 'Profile updated successfully!');
    showAlert('profileAlert', '✅ ' + (result.message || 'Profile updated!'), 'success');
  } else {
    showAlert('editAlert', result.message || 'Update failed. Please try again.', 'error');
  }
});

async function logout() {
  await api.post('/auth/logout.php');
  Auth.clear();
  window.location.href = 'index.html';
}

document.getElementById('logoutBtn').addEventListener('click', logout);
document.getElementById('logoutBtnProfile').addEventListener('click', logout);

const mobileLogout = document.getElementById('mobileLogoutBtn');
if (mobileLogout) {
  mobileLogout.addEventListener('click', (e) => {
    e.preventDefault();
    logout();
  });
}
async function initializeProfile() {
  if (!Auth.isLoggedIn()) {
    Auth.clear();
    window.location.href = 'login.html';
    return;
  }

  const result = await api.get('/student/me.php');
  if (!result.success || !result.student) {
    Auth.clear();
    window.location.href = 'login.html';
    return;
  }

  Auth.updateStudent(result.student);
  displayProfile(result.student);
}

initializeProfile();