// Base API wrapper to handle tokens and common headers
const API_URL = 'http://localhost:3000/api';

const api = {
    getToken: () => localStorage.getItem('quicknotes-token'),

    setToken: (token) => {
        if (token) {
            localStorage.setItem('quicknotes-token', token);
        } else {
            localStorage.removeItem('quicknotes-token');
        }
    },

    getUser: () => {
        const user = localStorage.getItem('quicknotes-user');
        return user ? JSON.parse(user) : null;
    },

    setUser: (user) => {
        if (user) {
            localStorage.setItem('quicknotes-user', JSON.stringify(user));
        } else {
            localStorage.removeItem('quicknotes-user');
        }
    },

    logout: () => {
        api.setToken(null);
        api.setUser(null);
        window.location.href = '/login.html';
    },

    // Generic fetch wrapper with auth header
    request: async (endpoint, options = {}) => {
        const token = api.getToken();

        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        if (token) {
            headers.Authorization = `Bearer ${token}`;
        }

        const config = {
            ...options,
            headers
        };

        try {
            const response = await fetch(`${API_URL}${endpoint}`, config);

            // Handle unauthorized (expired token)
            if (response.status === 401 && endpoint !== '/auth/login') {
                api.logout();
                throw new Error('Session expired. Please login again.');
            }

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Something went wrong');
            }

            return data;
        } catch (error) {
            throw error;
        }
    }
};

// Simple Toast Notification System
const Toast = {
    show: (message, type = 'info') => {
        const toastId = 'toast-container';
        let container = document.getElementById(toastId);

        if (!container) {
            container = document.createElement('div');
            container.id = toastId;
            container.className = 'toast-container';
            document.body.appendChild(container);
        }

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;

        const iconClasses = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            info: 'fa-info-circle'
        };

        toast.innerHTML = `
            <i class="fa-solid ${iconClasses[type]}"></i>
            <span>${message}</span>
        `;

        container.appendChild(toast);

        // Animate in
        setTimeout(() => toast.classList.add('show'), 10);

        // Remove after 3 seconds
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
};
