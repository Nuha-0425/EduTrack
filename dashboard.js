let currentStudent = null;

function capitalizeFirst(str) {
    if (!str) return '—';
    return String(str).charAt(0).toUpperCase() + String(str).slice(1).replace(/_/g, ' ');
}

function memberSinceText(value) {
    if (!value) return '—';
    const date = new Date(String(value).replace(' ', 'T'));
    if (Number.isNaN(date.getTime())) return formatDate(String(value).slice(0, 10));
    const days = Math.max(0, Math.floor((Date.now() - date.getTime()) / 86400000));
    const dateText = date.toLocaleDateString('en-US', {year:'numeric', month:'long', day:'numeric'});
    if (days === 0) return `${dateText} (today)`;
    if (days === 1) return `${dateText} (1 day ago)`;
    return `${dateText} (${days} days ago)`;
}

async function displayStudentInfo() {
    const localStudent = Auth.getStudent();
    if (!localStudent || !Auth.isLoggedIn()) {
        Auth.clear();
        window.location.href = 'login.html';
        return false;
    }

    if (localStudent.role && localStudent.role !== 'student') {
        window.location.href = localStudent.role === 'admin' ? 'admin.html' : 'teacher.html';
        return false;
    }

    // Always refresh the profile from MySQL so stale localStorage cannot break the dashboard.
    const result = await api.get('/student/me.php');
    if (!result.success || !result.student) {
        Auth.clear();
        window.location.href = 'login.html';
        return false;
    }

    currentStudent = result.student;
    Auth.updateStudent(currentStudent);

    const setText = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.textContent = value ?? '—';
    };

    setText('navAvatar', getInitials(currentStudent.firstName, currentStudent.lastName));
    setText('navUserName', `${currentStudent.firstName || ''} ${currentStudent.lastName || ''}`.trim());
    setText('welcomeMessage', `Welcome back, ${currentStudent.firstName || 'Student'}! 👋`);
    setText('welcomeSubtext', `Student ID: ${currentStudent.studentId || '—'} • Grade ${currentStudent.grade || '—'}${currentStudent.section || ''}`);
    setText('infoName', `${currentStudent.firstName || ''} ${currentStudent.lastName || ''}`.trim());
    setText('infoStudentId', currentStudent.studentId);
    setText('infoEmail', currentStudent.email);
    setText('infoPhone', currentStudent.phone);
    setText('infoGrade', formatGrade(currentStudent.grade));
    setText('infoSection', currentStudent.section ? `Section ${currentStudent.section}` : '—');
    setText('infoDOB', formatDate(currentStudent.dateOfBirth));
    setText('infoGender', capitalizeFirst(currentStudent.gender));
    setText('infoJoined', memberSinceText(currentStudent.createdAt));
    return true;
}

async function logout() {
    try { await api.post('/auth/logout.php'); } finally {
        Auth.clear();
        window.location.href = 'index.html';
    }
}

document.getElementById('logoutBtn')?.addEventListener('click', logout);
document.getElementById('mobileLogoutBtn')?.addEventListener('click', e => { e.preventDefault(); logout(); });

function isNewAnnouncement(value) {
    const date = new Date(String(value || '').replace(' ', 'T'));
    return !Number.isNaN(date.getTime()) && (Date.now() - date.getTime()) < 24 * 60 * 60 * 1000 && Date.now() >= date.getTime();
}
async function loadAnnouncements() {
    const list = document.getElementById('announcementsList');
    const count = document.getElementById('announcementCount');

    if (!list) return;

    try {
        const result = await api.get('/announcements.php');

        if (!result.success) {
            throw new Error(result.message);
        }

        const allAnnouncements = result.announcements || [];

        if (count) {
            count.textContent = allAnnouncements.length;
        }

        const announcements = allAnnouncements.slice(0, 3);

        if (!announcements.length) {
            list.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📢</div><p>No announcements yet.</p></div>';
            return;
        }

        list.innerHTML = announcements.map(item => `
            <article class="announcement-item">
                <div class="announcement-top">
                    <div>
                        <h4>${escapeHtml(item.title)}</h4>
                        <p>${escapeHtml(item.content)}</p>
                    </div>
                    ${isNewAnnouncement(item.created_at) ? '<span class="badge badge-primary">NEW</span>' : ''}
                </div>
                <small>${escapeHtml(formatAnnouncementDate(item.created_at))}</small>
            </article>
        `).join('');

        if (allAnnouncements.length > 3) {
            list.innerHTML += `
                <button class="view-all-announcements" id="viewAllAnnouncements">
                    View All Announcements →
                </button>
            `;

            document.getElementById('viewAllAnnouncements').addEventListener('click', () => {
                list.innerHTML = allAnnouncements.map(item => `
                    <article class="announcement-item">
                        <div class="announcement-top">
                            <div>
                                <h4>${escapeHtml(item.title)}</h4>
                                <p>${escapeHtml(item.content)}</p>
                            </div>
                            ${isNewAnnouncement(item.created_at) ? '<span class="badge badge-primary">NEW</span>' : ''}
                        </div>
                        <small>${escapeHtml(formatAnnouncementDate(item.created_at))}</small>
                    </article>
                `).join('');

                list.innerHTML += `
                    <button class="view-all-announcements" id="showRecentAnnouncements">
                        ← Show Recent Announcements
                    </button>
                `;

                document.getElementById('showRecentAnnouncements').addEventListener('click', loadAnnouncements);
            });
        }

    } catch (error) {
        console.error('Announcements error:', error);
        list.innerHTML = '<div class="empty-state"><div class="empty-state-icon">⚠️</div><p>Unable to load announcements.</p></div>';
    }
}

function formatAnnouncementDate(value) {
    if (!value) return '';
    const date = new Date(String(value).replace(' ', 'T'));
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleDateString('en-US', {year:'numeric', month:'long', day:'numeric'});
}

async function loadStudentAssignments() {
    const container = document.getElementById('studentAssignments');
    const count = document.getElementById('assignmentCount');

    if (!container) return;

    const result = await api.get('/auth/student-assignments.php');

    if (!result.success) {
        container.innerHTML = `<div class="empty-state"><div class="empty-state-icon">⚠️</div><p>${escapeHtml(result.message || 'Could not load assignments.')}</p></div>`;
        return;
    }

    const allAssignments = result.assignments || [];

    if (count) count.textContent = allAssignments.length;

    const assignments = allAssignments.slice(0, 3);

    if (!assignments.length) {
        container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📚</div><p>No assignments yet.</p></div>';
        return;
    }

    const renderAssignments = (items) => {
        return items.map(a => `
            <article class="assignment-card">
                <div class="assignment-card-head">
                    <div>
                        <span class="assignment-subject">${escapeHtml(a.subject || 'Subject')}</span>
                        <h3>${escapeHtml(a.title || 'Untitled assignment')}</h3>
                    </div>
                    <span class="assignment-class">
                        Grade ${escapeHtml(a.grade || '')}${escapeHtml(a.section || '')}
                    </span>
                </div>

                <p class="assignment-description">
                    ${escapeHtml(a.description || 'No description provided.')}
                </p>

                <div class="assignment-meta">
                    <span>👩‍🏫 ${escapeHtml(a.teacher || 'Teacher')}</span>
                    <span>📅 Due ${escapeHtml(formatDate(a.dueDate))}</span>
                </div>
            </article>
        `).join('');
    };

    container.innerHTML = renderAssignments(assignments);

    if (allAssignments.length > 3) {
        container.innerHTML += `
            <button class="view-all-announcements" id="viewAllAssignments">
                View All Assignments →
            </button>
        `;

        document.getElementById('viewAllAssignments').addEventListener('click', () => {
            container.innerHTML = renderAssignments(allAssignments);

            container.innerHTML += `
                <button class="view-all-announcements" id="showRecentAssignments">
                    ← Show Recent Assignments
                </button>
            `;

            document.getElementById('showRecentAssignments').addEventListener('click', loadStudentAssignments);
        });
    }
}

/* =========================
   STUDENT → TEACHER QUESTIONS
========================= */
const teacherQuestionForm = document.getElementById('teacherQuestionForm');
const questionTeacher = document.getElementById('questionTeacher');
const teacherQuestionText = document.getElementById('teacherQuestionText');
const teacherQuestionStatus = document.getElementById('teacherQuestionStatus');
const teacherQuestionsList = document.getElementById('teacherQuestionsList');
const questionCount = document.getElementById('questionCount');

async function loadTeacherQuestions() {
    if (!questionTeacher || !teacherQuestionsList) return;
    const result = await api.get('/student/questions.php');
    if (!result.success) {
        questionTeacher.innerHTML = '<option value="">Unable to load teachers</option>';
        teacherQuestionsList.innerHTML = `<div class="empty-state"><div class="empty-state-icon">⚠️</div><p>${escapeHtml(result.message || 'Unable to load questions.')}</p></div>`;
        return;
    }

    const teachers = result.teachers || [];
    questionTeacher.innerHTML = '<option value="">Select a teacher</option>';
    teachers.forEach(t => {
        const option = document.createElement('option');
        option.value = t.assignmentId;
        option.textContent = `${t.teacherName} — ${t.subject}`;
        questionTeacher.appendChild(option);
    });
    questionTeacher.disabled = teachers.length === 0;
    if (!teachers.length) questionTeacher.innerHTML = '<option value="">No teachers assigned to your class yet</option>';

    const questions = result.questions || [];
    if (questionCount) questionCount.textContent = questions.length;
    if (!questions.length) {
        teacherQuestionsList.innerHTML = '<div class="empty-state"><div class="empty-state-icon">💬</div><p>You have not sent any questions yet.</p></div>';
        return;
    }
    teacherQuestionsList.innerHTML = questions.map(q => `
        <article class="question-card">
            <div class="question-card-head"><div><span class="assignment-subject">${escapeHtml(q.subject)}</span><h4>${escapeHtml(q.teacherName)}</h4></div><span class="badge ${q.status === 'answered' ? 'badge-success' : 'badge-primary'}">${q.status === 'answered' ? 'Answered' : 'Waiting for response'}</span></div>
            <p><strong>Your question:</strong><br>${escapeHtml(q.question)}</p>
            ${q.response ? `<div class="question-response"><strong>Teacher response:</strong><p>${escapeHtml(q.response)}</p></div>` : '<div class="question-pending">Your teacher has not responded yet.</div>'}
            <small>${escapeHtml(formatAnnouncementDate(q.createdAt))}</small>
        </article>`).join('');
}

teacherQuestionForm?.addEventListener('submit', async event => {
    event.preventDefault();
    const assignmentId = Number(questionTeacher.value);
    const question = teacherQuestionText.value.trim();
    if (!assignmentId || !question) return;
    teacherQuestionStatus.textContent = 'Sending question...';
    const result = await api.post('/student/questions.php', {teacher_assignment_id: assignmentId, question});
    if (!result.success) {
        teacherQuestionStatus.textContent = result.message || 'Could not send question.';
        teacherQuestionStatus.className = 'admin-message error-text';
        return;
    }
    teacherQuestionText.value = '';
    teacherQuestionStatus.textContent = result.message || 'Question sent.';
    teacherQuestionStatus.className = 'admin-message success-text';
    await loadTeacherQuestions();
});

/* =========================
   NOTIFICATIONS
========================= */
const notificationBtn = document.getElementById('notificationBtn');
const notificationDropdown = document.getElementById('notificationDropdown');
const notificationBadge = document.getElementById('notificationBadge');
const notificationList = document.getElementById('notificationList');
const notificationCountText = document.getElementById('notificationCountText');
const markNotificationsRead = document.getElementById('markNotificationsRead');
let currentNotifications = [];
let readNotificationIds = new Set(JSON.parse(localStorage.getItem('edutrack_read_notifications') || '[]'));

async function loadNotifications() {
    if (!notificationList) return;
    const result = await api.get('/announcements.php');
    if (!result.success) return;
    currentNotifications = result.announcements || [];
    renderNotifications();
}

function renderNotifications() {
    const notifications = currentNotifications.filter(item => isNewAnnouncement(item.created_at) && !readNotificationIds.has(String(item.id)));
    if (!notifications.length) {
        notificationBadge.style.display = 'none';
        notificationCountText.textContent = 'No new notifications';
        notificationList.innerHTML = '<div class="notification-empty"><div>🔔</div><p>No new notifications</p></div>';
        return;
    }
    notificationBadge.textContent = notifications.length > 99 ? '99+' : notifications.length;
    notificationBadge.style.display = 'flex';
    notificationCountText.textContent = `${notifications.length} new notification${notifications.length === 1 ? '' : 's'}`;
    notificationList.innerHTML = notifications.map(n => `<div class="notification-item"><div class="notification-item-title"><strong>${escapeHtml(n.title)}</strong><span class="notification-new-dot"></span></div><div class="notification-item-content">${escapeHtml(n.content)}</div><small class="notification-item-date">${escapeHtml(formatAnnouncementDate(n.created_at))}</small></div>`).join('');
}

if (notificationBtn && notificationDropdown) {
    notificationBtn.addEventListener('click', e => { e.stopPropagation(); notificationDropdown.classList.toggle('open'); });
    notificationDropdown.addEventListener('click', e => e.stopPropagation());
    document.addEventListener('click', () => notificationDropdown.classList.remove('open'));
}
markNotificationsRead?.addEventListener('click', () => {
    currentNotifications.filter(n => isNewAnnouncement(n.created_at)).forEach(n => readNotificationIds.add(String(n.id)));
    localStorage.setItem('edutrack_read_notifications', JSON.stringify([...readNotificationIds]));
    renderNotifications();
    notificationCountText.textContent = 'All caught up!';
});

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text == null ? '' : String(text);
    return div.innerHTML;
}

(async function initializeStudentDashboard() {
    if (!(await displayStudentInfo())) return;
    await Promise.all([loadAnnouncements(), loadStudentAssignments(), loadTeacherQuestions(), loadNotifications()]);
})();
