const API_URL = 'http://localhost:3000/notes';

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
    initApp();
});

function initApp() {
    loadTheme();
    fetchNotes();
    setupEventListeners();
}

// ================= DARK MODE =================

function loadTheme() {
    const saved = localStorage.getItem('quicknotes-theme');
    if (saved === 'dark') {
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
    // Theme Toggle
    themeToggle.addEventListener('click', toggleTheme);

    // Form Submit
    noteForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const title = document.getElementById('note-title').value;
        const content = document.getElementById('note-content').value;
        const category = document.getElementById('note-category').value;
        const color = document.querySelector('input[name="noteColor"]:checked').value;
        const isPinned = pinToggle.classList.contains('active');

        const submitBtn = document.getElementById('add-btn');
        const originalBtnHtml = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Adding...';
        submitBtn.disabled = true;

        await addNote({ title, content, category, color, isPinned });

        noteForm.reset();
        pinToggle.classList.remove('active');
        document.getElementById('c-default').checked = true;
        submitBtn.innerHTML = originalBtnHtml;
        submitBtn.disabled = false;
    });

    // Pin Toggle
    pinToggle.addEventListener('click', () => pinToggle.classList.toggle('active'));
    editPinToggle.addEventListener('click', () => editPinToggle.classList.toggle('active'));

    // Category Sidebar filters
    categoryList.addEventListener('click', (e) => {
        const li = e.target.closest('li.nav-item');
        if (!li) return;

        document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
        li.classList.add('active');

        currentCategory = li.dataset.category;
        currentCategoryTitle.textContent = currentCategory === 'All' ? 'All Notes' : currentCategory;
        fetchNotes();
    });

    // Search with debounce
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

    // Escape key closes modal
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

        await updateNote(id, { title, content, category, color, isPinned });

        submitBtn.innerHTML = originalHtml;
        submitBtn.disabled = false;
        closeEditModal();
        fetchNotes();
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

        const response = await fetch(`${API_URL}?${queryParams}`);
        if (!response.ok) throw new Error('Server error');
        const notes = await response.json();
        renderNotes(notes);
    } catch (error) {
        console.error('Error fetching notes:', error);
        notesGrid.innerHTML = `
            <div class="error-state">
                <i class="fa-solid fa-triangle-exclamation"></i>
                <p>Could not load notes</p>
                <p class="error-hint">Make sure your backend server is running on port 3000 and MongoDB is connected.</p>
            </div>`;
    }
}

async function addNote(noteData) {
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(noteData)
        });

        if (response.ok) {
            if (currentCategory !== 'All' && noteData.category !== currentCategory) {
                document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
                document.querySelector('[data-category="All"]').classList.add('active');
                currentCategory = 'All';
                currentCategoryTitle.textContent = 'All Notes';
            }
            await fetchNotes();
        }
    } catch (error) {
        console.error('Error adding note:', error);
        alert('Failed to add note. Is the server running?');
    }
}

async function deleteNote(id, event) {
    if (event) event.stopPropagation();
    if (!confirm('Delete this note?')) return;

    try {
        const response = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
        if (response.ok) fetchNotes();
    } catch (error) {
        console.error('Error deleting note:', error);
    }
}

async function updateNote(id, noteData) {
    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(noteData)
        });
        if (!response.ok) throw new Error('Update failed');
    } catch (error) {
        console.error('Error updating note:', error);
        alert('Failed to update note.');
    }
}

// ================= RENDERING =================

function renderNotes(notes) {
    notesGrid.innerHTML = '';

    if (notes.length === 0) {
        notesGrid.innerHTML = `
            <div class="empty-state">
                <i class="fa-regular fa-folder-open"></i>
                <p>No notes found. Create your first note above!</p>
            </div>`;
        return;
    }

    notes.forEach((note, index) => {
        const card = document.createElement('div');
        card.className = 'note-card';
        card.style.animationDelay = `${index * 0.04}s`;

        // Apply color — in dark mode use subtle background tint
        const isDark = document.body.classList.contains('dark');
        if (note.color && note.color !== '#ffffff') {
            card.style.backgroundColor = isDark ? hexToRGBA(note.color, 0.15) : note.color;
            card.style.borderColor = isDark ? hexToRGBA(note.color, 0.3) : hexToRGBA(note.color, 0.5);
        }

        card.onclick = () => openEditModal(note);

        const date = new Date(note.createdAt).toLocaleDateString(undefined, {
            month: 'short', day: 'numeric'
        });

        const pinIcon = note.isPinned ? `<div class="pin-icon"><i class="fa-solid fa-thumbtack"></i></div>` : '';

        card.innerHTML = `
            ${pinIcon}
            <h3>${escapeHTML(note.title || 'Untitled')}</h3>
            <p class="content">${escapeHTML(note.content).replace(/\n/g, '<br>')}</p>
            <div class="note-footer">
                <span class="card-category">${escapeHTML(note.category || 'General')}</span>
                <span class="card-date">${date}</span>
                <div class="card-actions">
                    <button class="action-btn btn-delete" onclick="deleteNote('${note._id}', event)" title="Delete">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                </div>
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

    // Generate Color Pickers
    editColorContainer.innerHTML = '';
    colors.forEach(c => {
        const isChecked = note.color === c.value ? 'checked' : '';
        editColorContainer.innerHTML += `
            <input type="radio" name="editNoteColor" value="${c.value}" id="edit-c-${c.id}" ${isChecked}>
            <label for="edit-c-${c.id}" class="color-dot ${c.class}" title="${c.id}"></label>
        `;
    });

    if (!document.querySelector('input[name="editNoteColor"]:checked')) {
        document.getElementById('edit-c-default').checked = true;
    }

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
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
