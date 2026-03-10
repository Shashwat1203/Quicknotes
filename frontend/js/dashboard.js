document.addEventListener('DOMContentLoaded', () => {
    // Redirect if not logged in
    const user = api.getUser();
    if (!user || !api.getToken()) {
        window.location.href = '/login.html';
        return;
    }

    initDashboard(user);
    setupTheme();
});

function setupTheme() {
    const themeToggle = document.getElementById('theme-toggle');
    if (!themeToggle) return;

    if (localStorage.getItem('quicknotes-theme') === 'dark') {
        document.body.classList.add('dark');
        themeToggle.querySelector('i').classList.replace('fa-moon', 'fa-sun');
    }

    themeToggle.addEventListener('click', () => {
        const isDark = document.body.classList.toggle('dark');
        const icon = themeToggle.querySelector('i');

        if (isDark) {
            icon.classList.replace('fa-moon', 'fa-sun');
            localStorage.setItem('quicknotes-theme', 'dark');
        } else {
            icon.classList.replace('fa-sun', 'fa-moon');
            localStorage.setItem('quicknotes-theme', 'light');
        }
    });
}

async function initDashboard(user) {
    // Populate User Info
    document.getElementById('display-name').textContent = user.name;
    document.getElementById('display-role').textContent = user.role;
    document.getElementById('avatar-initial').textContent = user.name.charAt(0).toUpperCase();
    document.getElementById('welcome-text').textContent = `Welcome back, ${user.name.split(' ')[0]}`;

    // Logout
    document.getElementById('logout-btn').addEventListener('click', (e) => {
        e.preventDefault();
        api.logout();
    });

    // Handle Roles
    if (user.role === 'admin' || user.role === 'teacher') {
        document.getElementById('admin-analytics').style.display = 'block';
        document.getElementById('user-dashboard').style.display = 'none';

        loadAnalytics();

        // Only Admin gets users and settings management
        if (user.role === 'admin') {
            document.getElementById('admin-links').style.display = 'block';
            setupAdminNavigation();
        }
    }
}

function setupAdminNavigation() {
    const navDashboard = document.getElementById('nav-dashboard');
    const navUsers = document.getElementById('nav-users');
    const navSettings = document.getElementById('nav-settings');

    const panelAnalytics = document.getElementById('admin-analytics');
    const panelUsers = document.getElementById('admin-users');
    const panelSettings = document.getElementById('admin-settings');

    function switchTab(activeNav, activePanel) {
        // Reset navs
        navDashboard.classList.remove('active');
        navUsers.classList.remove('active');
        navSettings.classList.remove('active');

        // Reset panels
        panelAnalytics.style.display = 'none';
        panelUsers.style.display = 'none';
        panelSettings.style.display = 'none';

        // Set active
        activeNav.classList.add('active');
        activePanel.style.display = 'block';
    }

    navDashboard.addEventListener('click', (e) => {
        e.preventDefault();
        switchTab(navDashboard, panelAnalytics);
    });

    navUsers.addEventListener('click', (e) => {
        e.preventDefault();
        switchTab(navUsers, panelUsers);
        loadUsers();
    });

    navSettings.addEventListener('click', (e) => {
        e.preventDefault();
        switchTab(navSettings, panelSettings);
    });
}

async function loadUsers() {
    try {
        const users = await api.request('/admin/users');
        const tbody = document.getElementById('users-table-body');
        tbody.innerHTML = '';

        if (users.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="padding: 1rem; text-align: center; color: var(--text-secondary);">No users found.</td></tr>';
            return;
        }

        users.forEach(u => {
            const tr = document.createElement('tr');
            tr.style.borderBottom = '1px solid var(--border)';
            tr.innerHTML = `
                <td style="padding: 1rem;">
                    <div style="font-weight: 600; color: var(--text-primary);">${escapeHTML(u.name)}</div>
                </td>
                <td style="padding: 1rem; color: var(--text-secondary);">${escapeHTML(u.email)}</td>
                <td style="padding: 1rem;">
                    <span style="background: var(--select-bg); padding: 0.3rem 0.6rem; border-radius: 100px; font-size: 0.75rem; text-transform: capitalize; font-weight: 500;">${escapeHTML(u.role)}</span>
                </td>
                <td style="padding: 1rem; color: var(--text-secondary);">${new Date(u.createdAt).toLocaleDateString()}</td>
                <td style="padding: 1rem; text-align: right;">
                    <button onclick="window.deleteUser('${u._id}')" title="Delete User" style="color: #ef4444; border: 1px solid #ef4444; border-radius: var(--radius-sm); cursor: pointer; background: transparent; padding: 0.4rem 0.75rem; transition: all 0.2s;">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (error) {
        Toast.show('Failed to load users: ' + error.message, 'error');
    }
}

window.deleteUser = async function (id) {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;

    try {
        await api.request(`/admin/users/${id}`, { method: 'DELETE' });
        Toast.show('User deleted successfully', 'success');
        loadUsers(); // Refresh the list
    } catch (error) {
        Toast.show(error.message, 'error');
    }
};

function escapeHTML(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.innerText = str;
    return div.innerHTML;
}

async function loadAnalytics() {
    try {
        const data = await api.request('/admin/analytics');

        // Update Stats
        document.getElementById('stat-total-users').textContent = data.totals.users;
        document.getElementById('stat-total-notes').textContent = data.totals.notes;
        document.getElementById('stat-students').textContent = data.roles.students;

        // Render Top Users
        const listContainer = document.getElementById('top-users-list');
        listContainer.innerHTML = '';

        if (data.topUsers.length === 0) {
            listContainer.innerHTML = '<p style="color:var(--text-secondary)">No active users found.</p>';
            return;
        }

        data.topUsers.forEach(u => {
            const el = document.createElement('div');
            el.style.display = 'flex';
            el.style.justifyContent = 'space-between';
            el.style.alignItems = 'center';
            el.style.padding = '1rem';
            el.style.background = 'var(--input-bg)';
            el.style.borderRadius = 'var(--radius-sm)';
            el.style.border = '1px solid var(--border)';

            el.innerHTML = `
                <div>
                    <h4 style="margin-bottom: 0.25rem;">${u.name || 'Unknown User'}</h4>
                    <span style="font-size: 0.8rem; color: var(--text-secondary);">${u.email || ''}</span>
                </div>
                <div style="text-align: right;">
                    <span style="font-size: 1.25rem; font-weight: 700; color: var(--primary);">${u.noteCount}</span>
                    <span style="font-size: 0.75rem; color: var(--text-secondary); display: block;">Notes</span>
                </div>
            `;
            listContainer.appendChild(el);
        });

    } catch (error) {
        Toast.show('Failed to load analytics: ' + error.message, 'error');
    }
}
