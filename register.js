Auth.redirectIfLoggedIn();


const form =
    document.getElementById('registerForm');

const submitBtn =
    document.getElementById('submitBtn');

const togglePasswordBtn =
    document.getElementById('togglePassword');

const toggleConfirmPasswordBtn =
    document.getElementById('toggleConfirmPassword');

const passwordInput =
    document.getElementById('password');

const confirmPasswordInput =
    document.getElementById('confirmPassword');


// Password visibility
if (togglePasswordBtn) {

    togglePasswordBtn.addEventListener('click', () => {

        const isHidden =
            passwordInput.type === 'password';

        passwordInput.type =
            isHidden ? 'text' : 'password';

        togglePasswordBtn.textContent =
            isHidden ? '🙈' : '👁️';

    });

}


// Confirm password visibility
if (toggleConfirmPasswordBtn) {

    toggleConfirmPasswordBtn.addEventListener('click', () => {

        const isHidden =
            confirmPasswordInput.type === 'password';

        confirmPasswordInput.type =
            isHidden ? 'text' : 'password';

        toggleConfirmPasswordBtn.textContent =
            isHidden ? '🙈' : '👁️';

    });

}


// Show field error
function showFieldError(
    fieldId,
    errorId,
    message
) {

    const field =
        document.getElementById(fieldId);

    const error =
        document.getElementById(errorId);

    if (field) {
        field.classList.add('error');
    }

    if (error) {

        error.textContent =
            message;

        error.classList.add('visible');

    }

    return false;
}


// Clear field error
function clearFieldError(
    fieldId,
    errorId
) {

    const field =
        document.getElementById(fieldId);

    const error =
        document.getElementById(errorId);

    if (field) {
        field.classList.remove('error');
    }

    if (error) {
        error.classList.remove('visible');
    }

    return true;
}


// Validate first name
function validateFirstName() {

    const value =
        document.getElementById('firstName').value.trim();

    if (!value) {

        return showFieldError(
            'firstName',
            'firstNameError',
            'First name is required.'
        );

    }

    return clearFieldError(
        'firstName',
        'firstNameError'
    );

}


// Validate last name
function validateLastName() {

    const value =
        document.getElementById('lastName').value.trim();

    if (!value) {

        return showFieldError(
            'lastName',
            'lastNameError',
            'Last name is required.'
        );

    }

    return clearFieldError(
        'lastName',
        'lastNameError'
    );

}


// Validate email
function validateEmail() {

    const value =
        document.getElementById('email').value.trim();

    const emailRegex =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

    return clearFieldError(
        'email',
        'emailError'
    );

}


// Validate password
function validatePassword() {

    const value =
        document.getElementById('password').value;

    if (!value) {

        return showFieldError(
            'password',
            'passwordError',
            'Password is required.'
        );

    }

    if (value.length < 6) {

        return showFieldError(
            'password',
            'passwordError',
            'Password must be at least 6 characters.'
        );

    }

    return clearFieldError(
        'password',
        'passwordError'
    );

}


// Validate confirm password
function validateConfirmPassword() {

    const value =
        document.getElementById('confirmPassword').value;

    const password =
        document.getElementById('password').value;

    if (!value) {

        return showFieldError(
            'confirmPassword',
            'confirmPasswordError',
            'Please confirm your password.'
        );

    }

    if (value !== password) {

        return showFieldError(
            'confirmPassword',
            'confirmPasswordError',
            'Passwords do not match.'
        );

    }

    return clearFieldError(
        'confirmPassword',
        'confirmPasswordError'
    );

}


// Validate student ID
function validateStudentId() {

    const value =
        document.getElementById('studentId').value.trim();

    if (!value) {

        return showFieldError(
            'studentId',
            'studentIdError',
            'Student ID is required.'
        );

    }

    return clearFieldError(
        'studentId',
        'studentIdError'
    );

}


// Validate gender
function validateGender() {

    const value =
        document.getElementById('gender').value;

    if (!value) {

        return showFieldError(
            'gender',
            'genderError',
            'Please select your gender.'
        );

    }

    return clearFieldError(
        'gender',
        'genderError'
    );

}


// Validate date of birth
function validateDateOfBirth() {

    const value =
        document.getElementById('dateOfBirth').value;

    if (!value) {

        return showFieldError(
            'dateOfBirth',
            'dateOfBirthError',
            'Date of birth is required.'
        );

    }

    return clearFieldError(
        'dateOfBirth',
        'dateOfBirthError'
    );

}


// Validate grade
function validateGrade() {

    const value =
        document.getElementById('grade').value;

    if (!value) {

        return showFieldError(
            'grade',
            'gradeError',
            'Please select your grade.'
        );

    }

    return clearFieldError(
        'grade',
        'gradeError'
    );

}


// Validate section
function validateSection() {

    const value =
        document.getElementById('section').value;

    if (!value) {

        return showFieldError(
            'section',
            'sectionError',
            'Please select your section.'
        );

    }

    return clearFieldError(
        'section',
        'sectionError'
    );

}


// Validate phone
function validatePhone() {

    const value =
        document.getElementById('phone').value.trim();

    if (!value) {

        return showFieldError(
            'phone',
            'phoneError',
            'Phone number is required.'
        );

    }

    return clearFieldError(
        'phone',
        'phoneError'
    );

}


// Field validation on blur
document
    .getElementById('firstName')
    .addEventListener('blur', validateFirstName);

document
    .getElementById('lastName')
    .addEventListener('blur', validateLastName);

document
    .getElementById('email')
    .addEventListener('blur', validateEmail);

document
    .getElementById('password')
    .addEventListener('blur', validatePassword);

document
    .getElementById('confirmPassword')
    .addEventListener('blur', validateConfirmPassword);

document
    .getElementById('studentId')
    .addEventListener('blur', validateStudentId);

document
    .getElementById('gender')
    .addEventListener('change', validateGender);

document
    .getElementById('dateOfBirth')
    .addEventListener('change', validateDateOfBirth);

document
    .getElementById('grade')
    .addEventListener('change', validateGrade);

document
    .getElementById('section')
    .addEventListener('change', validateSection);

document
    .getElementById('phone')
    .addEventListener('blur', validatePhone);


// Registration
form.addEventListener('submit', async (event) => {

    event.preventDefault();

    hideAlert('formAlert');


    const isValid = [

        validateFirstName(),

        validateLastName(),

        validateEmail(),

        validatePassword(),

        validateConfirmPassword(),

        validateStudentId(),

        validateGender(),

        validateDateOfBirth(),

        validateGrade(),

        validateSection(),

        validatePhone()

    ].every(Boolean);


    if (!isValid) {
        return;
    }


    const originalText =
        submitBtn.textContent;

    setButtonLoading(
        submitBtn,
        true,
        originalText
    );


    const formData = {

        firstName:
            document
                .getElementById('firstName')
                .value
                .trim(),

        lastName:
            document
                .getElementById('lastName')
                .value
                .trim(),

        email:
            document
                .getElementById('email')
                .value
                .trim()
                .toLowerCase(),

        password:
            document
                .getElementById('password')
                .value,

        studentId:
            document
                .getElementById('studentId')
                .value
                .trim(),

        gender:
            document
                .getElementById('gender')
                .value,

        dateOfBirth:
            document
                .getElementById('dateOfBirth')
                .value,

        grade:
            document
                .getElementById('grade')
                .value,

        section:
            document
                .getElementById('section')
                .value,

        phone:
            document
                .getElementById('phone')
                .value
                .trim()

    };


    const result =
        await api.post(
            '/register.php',
            formData
        );


    setButtonLoading(
        submitBtn,
        false,
        originalText
    );


    if (result.success) {

        Toast.success(
            'Registration successful! Redirecting...'
        );


        setTimeout(() => {

            window.location.href =
                'login.html';

        }, 800);

    } else {

        showAlert(
            'formAlert',
            result.message ||
                'Registration failed. Please try again.',
            'error'
        );

    }

});