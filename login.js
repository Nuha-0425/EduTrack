Auth.redirectIfLoggedIn();

const form = document.getElementById('loginForm');
const submitBtn = document.getElementById('submitBtn');
const toggleBtn = document.getElementById('togglePassword');
const pwdInput = document.getElementById('password');

toggleBtn.addEventListener('click', () => {
    const isHidden = pwdInput.type === 'password';

    pwdInput.type = isHidden ? 'text' : 'password';
    toggleBtn.textContent = isHidden ? '🙈' : '👁️';
});


function showFieldError(fieldId, errorId, message) {
    document.getElementById(fieldId).classList.add('error');

    const err = document.getElementById(errorId);
    err.textContent = message;
    err.classList.add('visible');

    return false;
}


function clearFieldError(fieldId, errorId) {
    document.getElementById(fieldId).classList.remove('error');
    document.getElementById(errorId).classList.remove('visible');

    return true;
}


function validateEmail() {
    const value = document.getElementById('email').value.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!value) {
        return showFieldError(
            'email',
            'emailError',
            'Email is required.'
        );
    }

    if (!emailRegex.test(value)) {
        return showFieldError(
            'email',
            'emailError',
            'Enter a valid email address.'
        );
    }

    return clearFieldError('email', 'emailError');
}


function validatePassword() {
    const value = document.getElementById('password').value;

    if (!value) {
        return showFieldError(
            'password',
            'passwordError',
            'Password is required.'
        );
    }

    return clearFieldError('password', 'passwordError');
}


document.getElementById('email').addEventListener('blur', validateEmail);
document.getElementById('password').addEventListener('blur', validatePassword);


form.addEventListener('submit', async (event) => {

    event.preventDefault();

    hideAlert('formAlert');

    const isValid = [
        validateEmail(),
        validatePassword()
    ].every(Boolean);

    if (!isValid) {
        return;
    }

    const originalText = submitBtn.textContent;

    setButtonLoading(submitBtn, true, originalText);


    const result = await api.post('/auth/login.php', {

        email: document
            .getElementById('email')
            .value
            .trim()
            .toLowerCase(),

        password: document.getElementById('password').value

    });


    setButtonLoading(submitBtn, false, originalText);


    if (result.success) {

        console.log('LOGIN RESULT:', result);
        console.log('USER ROLE:', result.student.role);

        Auth.save(result.token, result.student);

        Toast.success('Login successful! Redirecting...');


        setTimeout(() => {

            if (result.student.role === 'admin') {

                window.location.href = 'admin.html';

            } else if (result.student.role === 'teacher') {

                window.location.href = 'teacher.html';

            } else {

                window.location.href = 'dashboard.html';

            }

        }, 800);


    } else {

        showAlert(
            'formAlert',
            result.message || 'Login failed. Please try again.',
            'error'
        );

    }

});