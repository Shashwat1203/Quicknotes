document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');

    // If already logged in, redirect to dashboard
    if (api.getToken() && (window.location.pathname.includes('login.html') || window.location.pathname.includes('signup.html'))) {
        window.location.href = '/dashboard.html';
        return;
    }

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const submitBtn = loginForm.querySelector('button[type="submit"]');

            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Logging in...';

            try {
                const data = await api.request('/auth/login', {
                    method: 'POST',
                    body: JSON.stringify({ email, password })
                });

                api.setToken(data.token);
                api.setUser({ id: data._id, name: data.name, email: data.email, role: data.role });

                Toast.show('Login successful! Redirecting...', 'success');
                setTimeout(() => window.location.href = '/dashboard.html', 1000);
            } catch (error) {
                Toast.show(error.message, 'error');
                submitBtn.disabled = false;
                submitBtn.innerHTML = 'Sign In';
            }
        });
    }

    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirm-password').value;
            const role = document.getElementById('role').value;
            const submitBtn = signupForm.querySelector('button[type="submit"]');

            if (password !== confirmPassword) {
                return Toast.show('Passwords do not match', 'error');
            }

            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Creating account...';

            try {
                const data = await api.request('/auth/register', {
                    method: 'POST',
                    body: JSON.stringify({ name, email, password, role })
                });

                api.setToken(data.token);
                api.setUser({ id: data._id, name: data.name, email: data.email, role: data.role });

                Toast.show('Account created successfully!', 'success');
                setTimeout(() => window.location.href = '/dashboard.html', 1000);
            } catch (error) {
                Toast.show(error.message, 'error');
                submitBtn.disabled = false;
                submitBtn.innerHTML = 'Create Account';
            }
        });
    }
});
