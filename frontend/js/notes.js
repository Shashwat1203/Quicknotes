// State
let currentCategory = 'All';
let currentSearch = '';

// DOM Elements
const notesGrid = document.getElementById('notes-grid');
const noteForm = document.getElementById('note-form');
const categoryList = document.getElementById('category-list');
const searchInput = document.getElementById('search-input');
const pinToggle = document.getElementById('pin-toggle');
const currentCategoryTitle = document.getElementById('current-category-title');
const themeToggle = document.getElementById('theme-toggle');

// Edit Modal Elements
const editModal = document.getElementById('edit-modal');
const editForm = document.getElementById('edit-form');
const closeModalBtn = document.getElementById('close-modal');
const editPinToggle = document.getElementById('edit-pin-toggle');
const editColorContainer = document.getElementById('edit-color-container');

// Colors
const colors = [
    { value: '#ffffff', id: 'default', class: 'default' },
    { value: '#fef08a', id: 'yellow', class: 'yellow' },
    { value: '#bbf7d0', id: 'green', class: 'green' },
    { value: '#bfdbfe', id: 'blue', class: 'blue' },
    { value: '#fbcfe8', id: 'pink', class: 'pink' }
];

document.addEventListener('DOMContentLoaded', () => {
    const user = api.getUser();
    if (!user || !api.getToken()) {
        window.location.href = '/login.html';
        return;
    }

    // Populate userInfo
    document.getElementById('display-name').textContent = user.name.split(' ')[0];
    document.getElementById('display-role').textContent = user.role;
    document.getElementById('avatar-initial').textContent = user.name.charAt(0).toUpperCase();

    // Logout
    document.getElementById('logout-btn').addEventListener('click', (e) => {
        e.preventDefault();
        api.logout();
    });

    initApp(user);
});

function initApp(user) {
    loadTheme();
    setupRoleUI(user);
    initViewMode();
    fetchNotes();
    setupEventListeners();
}

// ================= ROLE & VIEW UI =================

let currentView = 'my-notes';

function initViewMode() {
    const params = new URLSearchParams(window.location.search);
    const view = params.get('view');
    const headerTitle = document.querySelector('.dashboard-header h1');
    const headerSub = document.querySelector('.dashboard-header p');

    document.querySelectorAll('.sidebar-nav .nav-item').forEach(item => item.classList.remove('active'));

    if (view === 'students') {
        currentView = 'students';
        document.getElementById('nav-class-notes').classList.add('active');
        headerTitle.textContent = 'Class Notes';
        headerSub.textContent = 'Monitoring notes strictly created by your Students.';
    } else if (view === 'all') {
        currentView = 'all';
        document.getElementById('nav-all-activity').classList.add('active');
        headerTitle.textContent = 'Global Activity';
        headerSub.textContent = 'Monitoring all notes across the entire platform.';
    } else {
        currentView = 'my-notes';
        document.getElementById('nav-my-notes').classList.add('active');
        headerTitle.textContent = 'My Notes';
        headerSub.textContent = 'Capture your thoughts and assignment details.';
    }
}

function setupRoleUI(user) {
    if (user.role === 'admin' || user.role === 'teacher') {
        document.getElementById('homework-toggle-container').style.display = 'flex';

        if (user.role === 'teacher') {
            document.getElementById('teacher-links').style.display = 'block';
        }
        if (user.role === 'admin') {
            document.getElementById('admin-links').style.display = 'block';
        }
    }
}

// ================= DARK MODE =================

function loadTheme() {
    if (localStorage.getItem('quicknotes-theme') === 'dark') {
        document.body.classList.add('dark');
        themeToggle.querySelector('i').classList.replace('fa-moon', 'fa-sun');
    }
}

function toggleTheme() {
    const isDark = document.body.classList.toggle('dark');
    const icon = themeToggle.querySelector('i');

    if (isDark) {
        icon.classList.replace('fa-moon', 'fa-sun');
        localStorage.setItem('quicknotes-theme', 'dark');
    } else {
        icon.classList.replace('fa-sun', 'fa-moon');
        localStorage.setItem('quicknotes-theme', 'light');
    }
}

// ================= EVENT LISTENERS =================

function setupEventListeners() {
    themeToggle.addEventListener('click', toggleTheme);

    // Form Submit
    noteForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const title = document.getElementById('note-title').value;
        const content = document.getElementById('note-content').value;
        const category = document.getElementById('note-category').value;

        let color = '#ffffff';
        const checkedColor = document.querySelector('input[name="noteColor"]:checked');
        if (checkedColor) color = checkedColor.value;

        const isPinned = pinToggle.classList.contains('active');
        const isHomeworkToggle = document.getElementById('is-homework-toggle');
        const type = (isHomeworkToggle && isHomeworkToggle.checked) ? 'homework' : 'personal';

        const submitBtn = document.getElementById('add-btn');
        const originalBtnHtml = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';
        submitBtn.disabled = true;

        await saveNoteData({ title, content, category, color, isPinned, type });

        noteForm.reset();
        pinToggle.classList.remove('active');
        if (isHomeworkToggle) isHomeworkToggle.checked = false;
        document.getElementById('c-default').checked = true;
        submitBtn.innerHTML = originalBtnHtml;
        submitBtn.disabled = false;
    });

    // Pin Toggle
    pinToggle.addEventListener('click', () => pinToggle.classList.toggle('active'));
    editPinToggle.addEventListener('click', () => editPinToggle.classList.toggle('active'));

    // Category Sidebar filter
    categoryList.addEventListener('click', (e) => {
        const li = e.target.closest('li.nav-item');
        if (!li) return;

        document.querySelectorAll('#category-list .nav-item').forEach(item => item.classList.remove('active'));
        li.classList.add('active');

        currentCategory = li.dataset.category;
        currentCategoryTitle.textContent = currentCategory === 'All' ? 'All Notes' : currentCategory;
        fetchNotes();
    });

    // Search debounce
    let debounceTimer;
    searchInput.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            currentSearch = e.target.value.trim();
            fetchNotes();
        }, 300);
    });

    // Edit Modal Close
    closeModalBtn.addEventListener('click', closeEditModal);
    editModal.addEventListener('click', (e) => {
        if (e.target === editModal) closeEditModal();
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && editModal.classList.contains('active')) closeEditModal();
    });

    // Edit Form Submit
    editForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const id = document.getElementById('edit-id').value;
        const title = document.getElementById('edit-title').value;
        const content = document.getElementById('edit-content').value;
        const category = document.getElementById('edit-category').value;
        const color = document.querySelector('input[name="editNoteColor"]:checked').value;
        const isPinned = editPinToggle.classList.contains('active');

        const submitBtn = editForm.querySelector('.save-btn');
        const originalHtml = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';
        submitBtn.disabled = true;

        try {
            await api.request(`/notes/${id}`, {
                method: 'PUT',
                body: JSON.stringify({ title, content, category, color, isPinned })
            });
            Toast.show('Note updated', 'success');
            closeEditModal();
            fetchNotes();
        } catch (error) {
            Toast.show(error.message, 'error');
        } finally {
            submitBtn.innerHTML = originalHtml;
            submitBtn.disabled = false;
        }
    });

    // Color picker fix for grid layout issues (forces only one to be selected visually)
    const colorRadios = document.querySelectorAll('input[name="noteColor"]');
    colorRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            colorRadios.forEach(r => {
                if (r !== e.target) r.checked = false;
            });
        });
    });
}

// ================= API CALLS =================

async function fetchNotes() {
    notesGrid.innerHTML = `
        <div class="skeleton-card"></div>
        <div class="skeleton-card"></div>
        <div class="skeleton-card"></div>
    `;

    try {
        const queryParams = new URLSearchParams();
        if (currentSearch) queryParams.append('search', currentSearch);
        if (currentCategory && currentCategory !== 'All') queryParams.append('category', currentCategory);
        if (currentView !== 'my-notes') queryParams.append('view', currentView);

        const responseData = await api.request(`/notes?${queryParams}`);
        // API returns { count, total, data: notes }
        renderNotes(responseData.data);
    } catch (error) {
        notesGrid.innerHTML = `
            <div class="empty-state" style="border-color:#fca5a5;">
                <i class="fa-solid fa-triangle-exclamation" style="color:#f87171;opacity:1;"></i>
                <p style="color:#f87171;">Could not load notes</p>
                <p style="font-size:0.8rem;color:var(--text-secondary);margin-top:0.5rem;">${error.message}</p>
            </div>`;
    }
}

async function saveNoteData(noteData) {
    try {
        await api.request('/notes', {
            method: 'POST',
            body: JSON.stringify(noteData)
        });

        Toast.show('Note created successfully', 'success');

        if (currentCategory !== 'All' && noteData.category !== currentCategory) {
            document.querySelectorAll('#category-list .nav-item').forEach(i => i.classList.remove('active'));
            document.querySelector('[data-category="All"]').classList.add('active');
            currentCategory = 'All';
            currentCategoryTitle.textContent = 'All Notes';
        }
        await fetchNotes();
    } catch (error) {
        Toast.show(error.message, 'error');
    }
}

async function deleteNote(id, event) {
    if (event) event.stopPropagation();
    if (!confirm('Are you sure you want to delete this note?')) return;

    try {
        await api.request(`/notes/${id}`, { method: 'DELETE' });
        Toast.show('Note deleted', 'info');
        fetchNotes();
    } catch (error) {
        Toast.show(error.message, 'error');
    }
}

// ================= RENDERING =================

function renderNotes(notes) {
    notesGrid.innerHTML = '';

    if (!notes || notes.length === 0) {
        notesGrid.innerHTML = `
            <div class="empty-state">
                <i class="fa-regular fa-folder-open"></i>
                <p>No notes found in this section.</p>
            </div>`;
        return;
    }

    const currentUser = api.getUser();

    notes.forEach((note, index) => {
        const card = document.createElement('div');
        card.className = 'note-card';
        card.style.animationDelay = `${index * 0.04}s`;

        const isDark = document.body.classList.contains('dark');
        if (note.color && note.color !== '#ffffff') {
            card.style.backgroundColor = isDark ? hexToRGBA(note.color, 0.15) : note.color;
            card.style.borderColor = isDark ? hexToRGBA(note.color, 0.3) : hexToRGBA(note.color, 0.5);
        }

        // Determine Ownership & Permissions
        const noteAuthorObj = typeof note.user === 'object' ? note.user : null;
        const noteAuthorId = noteAuthorObj ? noteAuthorObj._id : note.user;
        const isMyNote = noteAuthorId === currentUser.id;

        let authorBadge = '';
        if (note.type === 'homework') {
            const teacherName = noteAuthorObj ? noteAuthorObj.name : 'A Teacher';
            authorBadge = `<div style="font-size: 0.75rem; color: var(--primary); font-weight: 600; margin-bottom: 0.5rem;"><i class="fa-solid fa-chalkboard-user"></i> Homework by ${teacherName}</div>`;
            card.style.borderTop = '3px solid var(--primary)';
        } else if (!isMyNote && noteAuthorObj) {
            authorBadge = `<div style="font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 0.5rem;"><i class="fa-solid fa-user"></i> ${noteAuthorObj.name}</div>`;
        }

        const canEdit = isMyNote || currentUser.role === 'admin';

        if (canEdit) {
            card.onclick = () => openEditModal(note);
        }

        const date = new Date(note.createdAt).toLocaleDateString(undefined, {
            month: 'short', day: 'numeric'
        });

        const pinIcon = note.isPinned ? `<div class="pin-icon"><i class="fa-solid fa-thumbtack"></i></div>` : '';

        const actionsHTML = canEdit ? `
        <div class="card-actions">
            <button class="action-btn btn-delete" onclick="deleteNote('${note._id}', event)" title="Delete">
                <i class="fa-solid fa-trash-can"></i>
            </button>
        </div>` : '';

        card.innerHTML = `
            ${pinIcon}
            ${authorBadge}
            <h3>${escapeHTML(note.title || 'Untitled')}</h3>
            <p class="content">${escapeHTML(note.content).replace(/\n/g, '<br>')}</p>
            <div class="note-footer">
                <span class="card-category">${escapeHTML(note.category || 'General')}</span>
                <span class="card-date">${date}</span>
                ${actionsHTML}
            </div>
        `;

        notesGrid.appendChild(card);
    });
}

// ================= EDIT MODAL =================

function openEditModal(note) {
    document.getElementById('edit-id').value = note._id;
    document.getElementById('edit-title').value = note.title || '';
    document.getElementById('edit-content').value = note.content;
    document.getElementById('edit-category').value = note.category || 'General';

    if (note.isPinned) {
        editPinToggle.classList.add('active');
    } else {
        editPinToggle.classList.remove('active');
    }

    editColorContainer.innerHTML = '';
    colors.forEach(c => {
        const isChecked = note.color === c.value ? 'checked' : '';
        editColorContainer.innerHTML += `
            <input type="radio" name="editNoteColor" value="${c.value}" id="edit-c-${c.id}" ${isChecked}>
            <label for="edit-c-${c.id}" class="color-dot ${c.class}" title="${c.id}"></label>
        `;
    });

    if (!document.querySelector('input[name="editNoteColor"]:checked')) {
        const defaultRadio = document.getElementById('edit-c-default');
        if (defaultRadio) defaultRadio.checked = true;
    }

    // Attach single select logic to dynamic radios
    const colorRadios = document.querySelectorAll('input[name="editNoteColor"]');
    colorRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            colorRadios.forEach(r => {
                if (r !== e.target) r.checked = false;
            });
        });
    });

    editModal.classList.add('active');
}

function closeEditModal() {
    editModal.classList.remove('active');
}

// ================= UTILITIES =================

function escapeHTML(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.innerText = str;
    return div.innerHTML;
}

function hexToRGBA(hex, alpha) {
    if (!hex || hex.length < 7) return 'rgba(255,255,255,0)';
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
