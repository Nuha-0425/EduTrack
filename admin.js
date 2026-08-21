const adminMessage = document.getElementById('adminMessage');

const teacherFormContainer = document.getElementById('teacherFormContainer');
const teacherForm = document.getElementById('teacherForm');
const teacherFormMessage = document.getElementById('teacherFormMessage');
const assignmentForm = document.getElementById('assignmentForm');
const assignmentTeacher = document.getElementById('assignmentTeacher');
const assignmentClass = document.getElementById('assignmentClass');
const assignmentSubject = document.getElementById('assignmentSubject');
const assignmentMessage = document.getElementById('assignmentMessage');

let cachedTeachers = [];
let cachedClasses = [];

async function checkAdminAccess() {
    const result = await api.get('/auth/check-admin.php');

    if (!result.success) {
        if (adminMessage) adminMessage.textContent = 'Access denied. Admins only.';
        setTimeout(() => { window.location.href = 'login.html'; }, 1200);
        return false;
    }

    if (adminMessage) adminMessage.textContent = 'Manage your school from one place.';
    return true;
}

function setupAdminTabs() {
    document.querySelectorAll('.admin-tab').forEach(button => {
        button.addEventListener('click', () => {
            document.querySelectorAll('.admin-tab').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.admin-panel').forEach(p => p.classList.remove('active'));
            button.classList.add('active');
            document.getElementById(button.dataset.panel)?.classList.add('active');
        });
    });
}

function setupAdminLogout() {
    const logout = async event => {
        if (event) event.preventDefault();
        try { await api.post('/auth/logout.php'); } finally {
            Auth.clear();
            window.location.href = 'index.html';
        }
    };

    document.getElementById('adminLogoutBtn')?.addEventListener('click', logout);
    document.getElementById('mobileAdminLogout')?.addEventListener('click', logout);
}

function openTeacherForm() {
    teacherFormContainer.style.display = 'block';
    teacherForm?.reset();
    if (teacherFormMessage) teacherFormMessage.textContent = '';
    teacherFormContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function closeTeacherForm() {
    teacherFormContainer.style.display = 'none';
    teacherForm?.reset();
    if (teacherFormMessage) teacherFormMessage.textContent = '';
}

document.getElementById('teachersBtn')?.addEventListener('click', openTeacherForm);
document.getElementById('cancelTeacherBtn')?.addEventListener('click', closeTeacherForm);
document.getElementById('cancelTeacherBtn2')?.addEventListener('click', closeTeacherForm);

teacherForm?.addEventListener('submit', async event => {
    event.preventDefault();
    teacherFormMessage.textContent = 'Creating teacher...';

    const data = {
        firstName: document.getElementById('teacherFirstName').value.trim(),
        lastName: document.getElementById('teacherLastName').value.trim(),
        email: document.getElementById('teacherEmail').value.trim().toLowerCase(),
        teacherId: document.getElementById('teacherId').value.trim(),
        password: document.getElementById('teacherPassword').value
    };

    const result = await api.post('/auth/create-teacher.php', data);

    if (!result.success) {
        teacherFormMessage.textContent = result.message || 'Failed to create teacher.';
        teacherFormMessage.className = 'admin-message error-text';
        return;
    }

    teacherFormMessage.textContent = 'Teacher created successfully.';
    teacherFormMessage.className = 'admin-message success-text';
    teacherForm.reset();
    await loadTeachers();
    updateStats();
});

async function loadTeachers() {
    const result = await api.get('/auth/get-teachers.php');

    if (!result.success) {
        document.getElementById('teacherListStatus').textContent = result.message || 'Could not load teachers.';
        return;
    }

    cachedTeachers = result.teachers || [];
    assignmentTeacher.innerHTML = '<option value="">Select Teacher</option>';

    cachedTeachers.forEach(teacher => {
        const option = document.createElement('option');
        option.value = teacher.id;
        option.textContent = `${teacher.firstName} ${teacher.lastName} (${teacher.teacherId})`;
        assignmentTeacher.appendChild(option);
    });

    const list = document.getElementById('teacherList');
    document.getElementById('teacherListStatus').textContent =
        `${cachedTeachers.length} teacher${cachedTeachers.length === 1 ? '' : 's'} registered.`;

    if (!cachedTeachers.length) {
        list.innerHTML = '<div class="empty-state"><div class="empty-state-icon">👩‍🏫</div><p>No teachers yet.</p></div>';
        return;
    }

    list.innerHTML = cachedTeachers.map(teacher => `
        <div class="admin-list-row">
            <div class="table-avatar">${escapeHtml(getInitials(teacher.firstName, teacher.lastName))}</div>
            <div><strong>${escapeHtml(teacher.firstName)} ${escapeHtml(teacher.lastName)}</strong><small>${escapeHtml(teacher.teacherId)}</small></div>
        </div>
    `).join('');
}

async function loadClasses() {
    const result = await api.get('/auth/get-classes.php');

    if (!result.success) {
        assignmentMessage.textContent = result.message || 'Could not load classes.';
        return;
    }

    cachedClasses = result.classes || [];
    assignmentClass.innerHTML = '<option value="">Select Class</option>';

    cachedClasses.forEach(classItem => {
        const option = document.createElement('option');
        option.value = classItem.id;
        option.textContent = `Grade ${classItem.grade}${classItem.section}`;
        assignmentClass.appendChild(option);
    });
}

function getSubjects(grade, section) {
    if (grade === '9' || grade === '10') {
        return ['Amharic','English','Maths','Biology','Chemistry','Physics','Geography','Economics','History','Citizenship','Ethics','ICT','HPE'];
    }

    if (grade === '11' || grade === '12') {
        const subjects = ['English','Maths','Biology','Chemistry','Physics','Agriculture','ICT','Ethics'];
        if (section === 'A' || section === 'B') subjects.push('Health');
        if (section === 'C' || section === 'D') subjects.push('IT');
        return subjects;
    }

    return [];
}

assignmentClass?.addEventListener('change', () => {
    const selected = cachedClasses.find(item => String(item.id) === String(assignmentClass.value));
    assignmentSubject.innerHTML = '<option value="">Select Subject</option>';

    if (!selected) return;

    getSubjects(String(selected.grade), String(selected.section).toUpperCase()).forEach(subject => {
        const option = document.createElement('option');
        option.value = subject;
        option.textContent = subject;
        assignmentSubject.appendChild(option);
    });
});

assignmentForm?.addEventListener('submit', async event => {
    event.preventDefault();
    assignmentMessage.textContent = 'Assigning teacher...';

    const result = await api.post('/auth/assign-teacher.php', {
        teacher_id: assignmentTeacher.value,
        class_id: assignmentClass.value,
        subject: assignmentSubject.value
    });

    if (!result.success) {
        assignmentMessage.textContent = result.message || 'Failed to assign teacher.';
        assignmentMessage.className = 'admin-message error-text';
        return;
    }

    assignmentMessage.textContent = 'Teacher assigned successfully.';
    assignmentMessage.className = 'admin-message success-text';
    assignmentForm.reset();
    assignmentSubject.innerHTML = '<option value="">Select a class first</option>';
});

async function loadStudents(query = '') {
    const status = document.getElementById('studentStatus');
    const body = document.getElementById('adminStudentsBody');
    status.textContent = 'Loading students...';

    const result = await api.get(`/students.php?q=${encodeURIComponent(query)}`);

    if (!result.success) {
        status.textContent = result.message || 'Could not load students.';
        body.innerHTML = '';
        return;
    }

    const students = result.students || [];
    status.textContent = `${students.length} student${students.length === 1 ? '' : 's'} found.`;

    if (!students.length) {
        body.innerHTML = '<tr><td colspan="6"><div class="empty-state"><div class="empty-state-icon">🎓</div><p>No students found.</p></div></td></tr>';
        return;
    }

    body.innerHTML = students.map(student => `
        <tr>
            <td><div class="table-name"><div class="table-avatar">${escapeHtml(getInitials(student.firstName, student.lastName))}</div><span>${escapeHtml(student.firstName)} ${escapeHtml(student.lastName)}</span></div></td>
            <td>${escapeHtml(student.studentId || '—')}</td>
            <td>${escapeHtml(formatGrade(student.grade))}</td>
            <td>${escapeHtml(student.section || '—')}</td>
            <td>${escapeHtml(student.email || '—')}</td>
            <td>${escapeHtml(student.phone || '—')}</td>
        </tr>
    `).join('');
}

document.getElementById('adminStudentSearchBtn')?.addEventListener('click', () => {
    loadStudents(document.getElementById('adminStudentSearch').value.trim());
});

document.getElementById('adminStudentSearch')?.addEventListener('keydown', event => {
    if (event.key === 'Enter') loadStudents(event.target.value.trim());
});

document.getElementById('refreshStudentsBtn')?.addEventListener('click', () => loadStudents());
function formatAnnouncementDate(dateString) {
    if (!dateString) return '—';

    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) return '—';

    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

async function loadAdminAnnouncements() {
    const list = document.getElementById('adminAnnouncementsList');
    const result = await api.get('/announcements.php');

    if (!result.success) {
        list.innerHTML = '<div class="empty-state"><p>Unable to load announcements.</p></div>';
        return;
    }

    const announcements = result.announcements || [];
    const stat = document.getElementById('announcementStat');
    if (stat) stat.textContent = announcements.length;

    if (!announcements.length) {
        list.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📢</div><p>No announcements published yet.</p></div>';
        return;
    }

    list.innerHTML = announcements.map(item => `
        <article class="admin-announcement">
            <div class="flex-between"><h4>${escapeHtml(item.title)}</h4><span class="badge badge-primary">Published</span></div>
            <p class="admin-announcement-content">${escapeHtml(item.content)}</p>
            <small>${formatAnnouncementDate(item.created_at)}</small>
        </article>
    `).join('');
}

document.getElementById('announcementForm')?.addEventListener('submit', async event => {
    event.preventDefault();

    const message = document.getElementById('announcementMessage');
    message.textContent = 'Publishing...';

    const result = await api.post('/announcements.php', {
        title: document.getElementById('announcementTitle').value.trim(),
        content: document.getElementById('announcementContent').value.trim()
    });

    if (!result.success) {
        message.textContent = result.message || 'Failed to publish announcement.';
        message.className = 'admin-message error-text';
        return;
    }

    message.textContent = 'Announcement published successfully.';
    message.className = 'admin-message success-text';
    document.getElementById('announcementForm').reset();
    await loadAdminAnnouncements();
    await updateStats();
});

async function updateStats() {
    const students = await api.get('/students.php');
    const teachers = await api.get('/auth/get-teachers.php');
    document.getElementById('studentStat').textContent = students.success ? (students.students || []).length : '—';
    document.getElementById('teacherStat').textContent = teachers.success ? (teachers.teachers || []).length : '—';
}

async function initializeAdminDashboard() {
    if (!(await checkAdminAccess())) return;

    setupAdminTabs();
    setupAdminLogout();
    await Promise.all([loadTeachers(), loadClasses(), loadStudents(), loadAdminAnnouncements(), updateStats()]);
}

initializeAdminDashboard();
