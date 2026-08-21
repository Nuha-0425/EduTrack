const teacherWelcome = document.getElementById('teacherWelcome');
const teacherNavName = document.getElementById('teacherNavName');
const teacherAvatar = document.getElementById('teacherAvatar');
const classesContainer = document.getElementById('classesContainer');
const assignmentForm = document.getElementById('assignmentForm');
const assignmentClass = document.getElementById('assignmentClass');
const assignmentSubject = document.getElementById('assignmentSubject');
const assignmentMessage = document.getElementById('assignmentMessage');

let teacherClasses = [];
let selectedTeacherAssignment = null;

async function loadTeacherDashboard() {
    try {
        const result = await api.get('/auth/teacher-classes.php');

        if (!result.success) {
            teacherWelcome.textContent =
                result.message || 'Access denied. Teachers only.';
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 1200);
            return;
        }

        const teacher = result.teacher || {};
        teacherClasses = Array.isArray(result.classes) ? result.classes : [];

        const fullName =
            `${teacher.firstName || ''} ${teacher.lastName || ''}`.trim() || 'Teacher';

        teacherWelcome.textContent = `Welcome, ${fullName}! 👋`;
        teacherNavName.textContent = fullName;
        teacherAvatar.textContent =
            getInitials(teacher.firstName || '', teacher.lastName || '');

        populateClassDropdown();

        if (!teacherClasses.length) {
            classesContainer.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">🏫</div>
                    <p>You have not been assigned any classes yet.</p>
                </div>
            `;
        } else {
            classesContainer.innerHTML = teacherClasses.map(item => `
                <div class="teacher-class-card">
                    <div class="teacher-class-icon">📚</div>
                    <div>
                        <strong>Grade ${escapeHtml(item.grade)}${escapeHtml(item.section)}</strong>
                        <span>${escapeHtml(item.subject)}</span>
                    </div>
                </div>
            `).join('');
        }

        await loadTeacherAssignments();
        await loadTeacherQuestions();
    } catch (error) {
        console.error('Teacher dashboard error:', error);
        teacherWelcome.textContent = 'Could not load teacher information.';
        classesContainer.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">⚠️</div>
                <p>Could not load your assigned classes.</p>
            </div>
        `;
    }
}

function populateClassDropdown() {
    assignmentClass.innerHTML = '<option value="">Select a class</option>';
    assignmentSubject.innerHTML = '<option value="">Select a class first</option>';
    assignmentSubject.disabled = true;
    selectedTeacherAssignment = null;

    // Show each Grade + Section only once.
    const seen = new Set();

    teacherClasses.forEach(item => {
        const key = `${item.classId}|${item.grade}|${item.section}`;

        if (seen.has(key)) {
            return;
        }

        seen.add(key);

        const option = document.createElement('option');
        option.value = item.classId;
        option.textContent = `Grade ${item.grade}${item.section}`;
        assignmentClass.appendChild(option);
    });
}

function populateSubjectDropdown() {
    const classId = assignmentClass.value;

    assignmentSubject.innerHTML = '<option value="">Select a subject</option>';
    assignmentSubject.disabled = !classId;
    selectedTeacherAssignment = null;

    if (!classId) {
        assignmentSubject.innerHTML =
            '<option value="">Select a class first</option>';
        return;
    }

    const classAssignments = teacherClasses.filter(
        item => String(item.classId) === String(classId)
    );

    classAssignments.forEach(item => {
        const option = document.createElement('option');

        // The value is the teacher_assignments.id.
        option.value = item.assignmentId;
        option.textContent = item.subject;

        assignmentSubject.appendChild(option);
    });

    if (!classAssignments.length) {
        assignmentSubject.innerHTML =
            '<option value="">No assigned subjects for this class</option>';
        assignmentSubject.disabled = true;
    }
}

assignmentClass?.addEventListener('change', populateSubjectDropdown);

assignmentSubject?.addEventListener('change', () => {
    selectedTeacherAssignment = assignmentSubject.value || null;
});

assignmentForm?.addEventListener('submit', async event => {
    event.preventDefault();

    if (!assignmentClass.value || !assignmentSubject.value) {
        assignmentMessage.textContent =
            'Please select a class and subject.';
        assignmentMessage.className = 'admin-message error-text';
        return;
    }

    assignmentMessage.textContent = 'Publishing assignment...';
    assignmentMessage.className = 'admin-message';

    const dueDate = document.getElementById('assignmentDueDate').value;

    const data = {
        teacher_assignment_id: Number(selectedTeacherAssignment),
        title: document.getElementById('assignmentTitle').value.trim(),
        description: document.getElementById('assignmentDescription').value.trim(),
        due_date: dueDate
    };

    try {
        const result = await api.post('/auth/create-assignment.php', data);

        if (!result.success) {
            assignmentMessage.textContent =
                result.message || 'Failed to publish assignment.';
            assignmentMessage.className = 'admin-message error-text';
            return;
        }

        assignmentMessage.textContent =
            'Assignment published successfully.';
        assignmentMessage.className = 'admin-message success-text';

        assignmentForm.reset();
        assignmentSubject.innerHTML =
            '<option value="">Select a class first</option>';
        assignmentSubject.disabled = true;
        selectedTeacherAssignment = null;

        await loadTeacherAssignments();
    } catch (error) {
        console.error('Create assignment error:', error);
        assignmentMessage.textContent =
            'Network error. Please try again.';
        assignmentMessage.className = 'admin-message error-text';
    }
});

async function loadTeacherAssignments() {
    const list = document.getElementById('teacherAssignmentsList');
    const count = document.getElementById('teacherAssignmentCount');

    if (!list || !count) return;

    try {
        const result = await api.get('/auth/teacher-assignments.php');

        if (!result.success) {
            list.innerHTML = `
                <div class="empty-state">
                    <p>${escapeHtml(result.message || 'Unable to load assignments.')}</p>
                </div>
            `;
            return;
        }

        const assignments = Array.isArray(result.assignments)
            ? result.assignments
            : [];

        count.textContent = assignments.length;

        if (!assignments.length) {
            list.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📚</div>
                    <p>No assignments published yet.</p>
                </div>
            `;
            return;
        }

        list.innerHTML = assignments.map(item => `
            <article class="assignment-card">
                <div class="assignment-card-head">
                    <div>
                        <span class="assignment-subject">
                            ${escapeHtml(item.subject)}
                        </span>
                        <h3>${escapeHtml(item.title)}</h3>
                    </div>
                    <span class="assignment-class">
                        Grade ${escapeHtml(item.grade)}${escapeHtml(item.section)}
                    </span>
                </div>
                <p class="assignment-description">
                    ${escapeHtml(item.description || 'No description provided.')}
                </p>
                <div class="assignment-meta">
                    <span>📅 Due ${escapeHtml(formatDate(item.dueDate))}</span>
                    <span>Published ${escapeHtml(formatDateTime(item.createdAt))}</span>
                </div>
            </article>
        `).join('');
    } catch (error) {
        console.error('Teacher assignments error:', error);
        list.innerHTML = `
            <div class="empty-state">
                <p>Unable to load assignments.</p>
            </div>
        `;
    }
}

function formatDateTime(value) {
    if (!value) return '—';

    const date = new Date(String(value).replace(' ', 'T'));

    return Number.isNaN(date.getTime())
        ? value
        : date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
}



/* =========================
   STUDENT QUESTION RESPONSES
========================= */
async function loadTeacherQuestions() {
    const list = document.getElementById('teacherQuestionsList');
    const count = document.getElementById('teacherQuestionCount');
    if (!list) return;

    const result = await api.get('/auth/teacher-questions.php');
    if (!result.success) {
        list.innerHTML = `<div class="empty-state"><div class="empty-state-icon">⚠️</div><p>${escapeHtml(result.message || 'Unable to load student questions.')}</p></div>`;
        return;
    }

    const questions = result.questions || [];
    if (count) count.textContent = questions.length;
    if (!questions.length) {
        list.innerHTML = '<div class="empty-state"><div class="empty-state-icon">💬</div><p>No student questions yet.</p></div>';
        return;
    }

    list.innerHTML = questions.map(q => `
        <article class="teacher-question-card">
            <div class="teacher-question-head">
                <div>
                    <span class="assignment-subject">${escapeHtml(q.subject)}</span>
                    <h4>${escapeHtml(q.student.name)}</h4>
                    <small>Grade ${escapeHtml(q.student.grade)}${escapeHtml(q.student.section)} • ${escapeHtml(q.student.studentId || 'No ID')}</small>
                </div>
                <span class="badge ${q.status === 'answered' ? 'badge-success' : 'badge-primary'}">${q.status === 'answered' ? 'Answered' : 'Needs response'}</span>
            </div>
            <p class="question-text"><strong>Question:</strong><br>${escapeHtml(q.question)}</p>
            ${q.response ? `<div class="teacher-response-box"><strong>Your response:</strong><p>${escapeHtml(q.response)}</p></div>` : `
                <form class="teacher-response-form" data-question-id="${q.id}">
                    <textarea class="form-control" rows="3" maxlength="4000" required placeholder="Write your response to the student..."></textarea>
                    <button class="btn btn-primary btn-sm" type="submit">Send Response</button>
                    <p class="admin-message response-status"></p>
                </form>`}
            <small>Asked ${escapeHtml(formatDateTime(q.createdAt))}</small>
        </article>
    `).join('');

    list.querySelectorAll('.teacher-response-form').forEach(form => {
        form.addEventListener('submit', async event => {
            event.preventDefault();
            const textarea = form.querySelector('textarea');
            const status = form.querySelector('.response-status');
            const response = textarea.value.trim();
            if (!response) return;
            status.textContent = 'Sending response...';
            const result = await api.post('/auth/teacher-questions.php', {question_id: Number(form.dataset.questionId), response});
            if (!result.success) {
                status.textContent = result.message || 'Could not send response.';
                status.className = 'admin-message error-text response-status';
                return;
            }
            await loadTeacherQuestions();
        });
    });
}

async function teacherLogout(event) {
    if (event) event.preventDefault();

    try {
        await api.post('/auth/logout.php');
    } finally {
        Auth.clear();
        window.location.href = 'index.html';
    }
}

document.getElementById('teacherLogoutBtn')?.addEventListener(
    'click',
    teacherLogout
);

document.getElementById('mobileTeacherLogout')?.addEventListener(
    'click',
    teacherLogout
);

loadTeacherDashboard();
