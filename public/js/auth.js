// Switch between login and signup tabs
function showTab(tab) {
    document.getElementById('loginForm').classList.toggle('hidden', tab !== 'login');
    document.getElementById('signupForm').classList.toggle('hidden', tab !== 'signup');
    document.getElementById('loginTab').classList.toggle('active', tab === 'login');
    document.getElementById('signupTab').classList.toggle('active', tab === 'signup');
}

// Toggle password visibility (show/hide)
function togglePassword(id, el) {
    const input = document.getElementById(id);
    if (input.type === 'password') {
        input.type = 'text';
        el.querySelector('svg').style.color = '#2563eb'; // Change icon color when showing
    } else {
        input.type = 'password';
        el.querySelector('svg').style.color = '#60a5fa'; // Change icon color when hiding
    }
}

// Show the loading spinner
function showLoader() {
    const loader = document.getElementById('universalLoader');
    if (loader) {
        loader.style.opacity = 1;
        loader.style.display = 'flex';
    }
}

// Hide the loading spinner
function hideLoader() {
    const loader = document.getElementById('universalLoader');
    if (loader) {
        loader.style.opacity = 0;
        setTimeout(() => loader.style.display = 'none', 400);
    }
}

// Hide loader once page finishes loading
window.addEventListener('load', hideLoader);

// Handle login form submission
document.getElementById('loginForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    showLoader();

    // Get input values
    const email = this.querySelector('input[name="email"]').value;
    const password = this.querySelector('input[name="password"]').value;
    const remember = this.querySelector('input[name="remember"]').checked;

    // Store for OTP verification
    window._loginEmail = email;
    window._loginRemember = remember;

    let data;

    try {
        const res = await fetch('/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, remember })
        });
        try {
            data = await res.json();
        } catch {
            data = await res.text();
        }
    } catch (err) {
        hideLoader();
        Swal.fire({
            icon: 'error',
            title: 'Network Error',
            text: 'Server se connect nahi ho pa rahe.',
            background: '#f0f6ff',
            color: '#ef4444',
            confirmButtonColor: '#2563eb'
        });
        return;
    }

    hideLoader();

    // If OTP is required
    if (
        (data && data.message && data.message.toLowerCase().includes('otp sent')) ||
        (typeof data === 'string' && data.toLowerCase().includes('otp sent'))
    ) {
        this.classList.add('hidden');
        document.getElementById('loginOtpForm').classList.remove('hidden');
        setTimeout(() => {
            Swal.fire({
                icon: 'info',
                title: 'OTP Sent',
                text: 'OTP aapke email par bheja gaya hai.',
                background: '#f0f6ff',
                color: '#2563eb',
                confirmButtonColor: '#2563eb'
            });
        }, 100);
        return;
    }

    // If login is successful
    if (data && data.message && data.token) {
        if (remember) localStorage.setItem('proplanner_token', data.token);
        else localStorage.removeItem('proplanner_token');
        Swal.fire({
            icon: 'success',
            title: 'Login Success',
            text: 'Login successful!',
            background: '#f0f6ff',
            color: '#2563eb',
            confirmButtonColor: '#2563eb'
        }).then(() => {
            window.location.href = '/dashboard';
        });
        return;
    }

    // Login failed
    Swal.fire({
        icon: 'error',
        title: 'Login Failed',
        text: (data && data.message) ? data.message : data,
        background: '#f0f6ff',
        color: '#ef4444',
        confirmButtonColor: '#2563eb'
    });
});

// Handle login OTP verification
document.getElementById('loginOtpForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    showLoader();

    const otp = this.querySelector('input').value;
    const email = window._loginEmail;
    const remember = window._loginRemember;

    const res = await fetch('/verify-login-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp })
    });

    let data;
    try {
        data = await res.json();
    } catch {
        data = await res.text();
    }

    hideLoader();

    if (data && data.message && data.token) {
        if (remember) localStorage.setItem('proplanner_token', data.token);
        else localStorage.removeItem('proplanner_token');
        Swal.fire({
            icon: 'success',
            title: 'Login Success',
            text: 'Login successful!',
            background: '#f0f6ff',
            color: '#2563eb',
            confirmButtonColor: '#2563eb'
        }).then(() => {
            window.location.href = '/dashboard';
        });
        return;
    }

    // OTP verification failed
    Swal.fire({
        icon: 'error',
        title: 'OTP Failed',
        text: (data && data.message) ? data.message : data,
        background: '#f0f6ff',
        color: '#ef4444',
        confirmButtonColor: '#2563eb'
    });
});

// Auto-login if token exists in localStorage
window.addEventListener('DOMContentLoaded', async function () {
    const token = localStorage.getItem('proplanner_token');
    if (token) {
        try {
            const res = await fetch('/auto-login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token })
            });
            const data = await res.json();
            if (data && data.message && data.message.includes('Auto-login successful')) {
                window.location.href = '/dashboard';
            }
        } catch (err) {
            // Ignore any error
        }
    }
});

// Handle signup form submission
document.getElementById('signupForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    showLoader();

    // Get form input values
    const name = this.querySelector('input[name="name"]').value;
    const email = this.querySelector('input[name="email"]').value;
    const password = this.querySelector('input[name="password"]').value;
    const confirmPassword = this.querySelector('input[name="confirmPassword"]').value;
    window._signupEmail = email;

    // Send signup data to backend
    const res = await fetch('/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, confirmPassword })
    });

    const text = await res.text();
    hideLoader();

    if (text.includes('OTP sent')) {
        this.classList.add('hidden');
        document.getElementById('signupOtpForm').classList.remove('hidden');
        Swal.fire({
            icon: 'info',
            title: 'OTP Sent',
            text: 'OTP aapke email par bheja gaya hai.',
            background: '#f0f6ff',
            color: '#2563eb',
            confirmButtonColor: '#2563eb'
        });
    } else {
        Swal.fire({
            icon: 'error',
            title: 'Signup Failed',
            text: text,
            background: '#f0f6ff',
            color: '#ef4444',
            confirmButtonColor: '#2563eb'
        });
    }
});

// Handle signup OTP verification
document.getElementById('signupOtpForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    showLoader();

    const otp = this.querySelector('input').value;
    const email = window._signupEmail;

    const res = await fetch('/verify-signup-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp })
    });

    const text = await res.text();
    hideLoader();

    if (text.includes('Signup successful')) {
        Swal.fire({
            icon: 'success',
            title: 'Signup Success',
            text: 'Signup successful!',
            background: '#f0f6ff',
            color: '#2563eb',
            confirmButtonColor: '#2563eb'
        }).then(() => {
            window.location.href = '/dashboard';
        });
    } else {
        Swal.fire({
            icon: 'error',
            title: 'OTP Failed',
            text: text,
            background: '#f0f6ff',
            color: '#ef4444',
            confirmButtonColor: '#2563eb'
        });
    }
});
