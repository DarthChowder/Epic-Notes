class EpicNotesApp {
    constructor() {
        this.currentNote = null;
        this.notesTree = {};
        this.debounceTimeout = null;
        this.isPaginated = false;
        this.formattingPresets = {
            normal: {},
            screenplay: {
                fontFamily: 'Courier New',
                fontSize: '12pt',
                lineHeight: '1.2',
                margins: { left: '1.5in', right: '1in' }
            },
            novel: {
                fontFamily: 'Times New Roman',
                fontSize: '12pt',
                lineHeight: '2',
                margins: { left: '1in', right: '1in' }
            },
            blog: {
                fontFamily: 'Arial',
                fontSize: '11pt',
                lineHeight: '1.6'
            }
        };
        
        this.initUI();
        this.initEventListeners();
        this.loadLocalData();
    }

    initUI() {
        this.editor = document.getElementById('editor');
        this.saveStatus = document.getElementById('save-status');
        this.notesTreeElement = document.getElementById('notes-tree');
        this.aboutModal = document.getElementById('about-modal');
        this.modeToggle = document.querySelector('.mode-toggle');
    }

    initEventListeners() {
        document.querySelectorAll('.format-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.execCommand(btn.dataset.command, false, null);
            });
        });

        this.editor.addEventListener('input', () => {
            this.saveStatus.textContent = 'Saving...';
            clearTimeout(this.debounceTimeout);
            this.debounceTimeout = setTimeout(() => this.saveNote(), 1500);
        });

        document.getElementById('new-project').addEventListener('click', () => {
            this.createProject();
        });

        document.getElementById('new-project').addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.showContextMenu(e);
        });

        document.getElementById('export-pdf').addEventListener('click', () => {
            this.exportToPDF();
        });

        document.getElementById('print-btn').addEventListener('click', () => {
            window.print();
        });

        document.getElementById('style-select').addEventListener('change', (e) => {
            document.execCommand('formatBlock', false, e.target.value);
        });

        document.getElementById('preset-formats').addEventListener('change', (e) => {
            this.applyPresetFormat(e.target.value);
        });

        this.modeToggle.addEventListener('click', () => {
            this.togglePagination();
        });

        document.getElementById('about-btn').addEventListener('click', () => {
            this.aboutModal.style.display = 'flex';
        });

        document.getElementById('close-about').addEventListener('click', () => {
            this.aboutModal.style.display = 'none';
        });
    }

    saveNote() {
        if (!this.currentNote) return;
        
        this.currentNote.content = this.editor.innerHTML;
        this.updateWordCount();
        localStorage.setItem('epicNotesData', JSON.stringify(this.notesTree));
        this.saveToCloud();
        
        this.saveStatus.textContent = 'Saved';
    }

    updateWordCount() {
        const text = this.editor.textContent;
        const words = text.split(/\s+/).filter(w => w.length > 0).length;
        document.getElementById('word-count').textContent = `${words} words`;
    }

    createProject() {
        const projectName = prompt('Enter project name:');
        if (projectName) {
            this.notesTree[projectName] = { type: 'project', folders: {}, notes: {} };
            this.renderTree();
        }
    }

    renderTree() {
        this.notesTreeElement.innerHTML = '';
        Object.entries(this.notesTree).forEach(([projectName, project]) => {
            const projectEl = document.createElement('div');
            projectEl.className = 'project';
            projectEl.innerHTML = `<h4>${projectName}</h4>`;
            
            const foldersEl = this.renderFolder(project.folders, project.notes, projectName);
            projectEl.appendChild(foldersEl);
            this.notesTreeElement.appendChild(projectEl);
        });
    }

    renderFolder(folders, notes, path) {
        const container = document.createElement('div');
        container.className = 'folder-container';
        
        Object.entries(folders).forEach(([name, content]) => {
            const folderEl = document.createElement('div');
            folderEl.className = 'folder';
            folderEl.innerHTML = `<i class="fas fa-folder"></i> ${name}`;
            folderEl.addEventListener('click', () => this.selectFolder(`${path}/${name}`));
            folderEl.appendChild(this.renderFolder(content.folders || {}, content.notes || {}, `${path}/${name}`));
            container.appendChild(folderEl);
        });

        Object.entries(notes).forEach(([name, note]) => {
            const noteEl = document.createElement('div');
            noteEl.className = 'note';
            noteEl.innerHTML = `<i class="fas fa-file"></i> ${name}`;
            noteEl.addEventListener('click', () => this.loadNote(note));
            container.appendChild(noteEl);
        });

        return container;
    }

    exportToPDF() {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        doc.html(this.editor.innerHTML, {
            callback: function(doc) {
                doc.save('epic-note.pdf');
            }
        });
    }

    async saveToCloud() {
        // Implement cloud storage integration here
    }

    loadLocalData() {
        const data = localStorage.getItem('epicNotesData');
        if (data) {
            this.notesTree = JSON.parse(data);
            this.renderTree();
        }
    }

    applyPresetFormat(preset) {
        const style = this.formattingPresets[preset];
        this.editor.style.fontFamily = style.fontFamily || '';
        this.editor.style.fontSize = style.fontSize || '';
        this.editor.style.lineHeight = style.lineHeight || '';
        if (style.margins) {
            this.editor.style.marginLeft = style.margins.left || '';
            this.editor.style.marginRight = style.margins.right || '';
        }
    }

    togglePagination() {
        this.isPaginated = !this.isPaginated;
        this.editor.classList.toggle('paginated');
        this.modeToggle.querySelector('i').classList.toggle('fa-book');
        this.modeToggle.querySelector('i').classList.toggle('fa-scroll');

        if (this.isPaginated) {
            this.convertToPages();
        } else {
            this.convertToScroll();
        }
    }

    convertToPages() {
        const content = this.editor.innerHTML;
        this.editor.innerHTML = '';
        const page = document.createElement('div');
        page.className = 'page';
        page.innerHTML = content;
        this.editor.appendChild(page);
    }

    convertToScroll() {
        const pages = this.editor.querySelectorAll('.page');
        let content = '';
        pages.forEach(page => content += page.innerHTML);
        this.editor.innerHTML = content;
    }

    showContextMenu(e) {
        const menu = document.createElement('div');
        menu.className = 'context-menu';
        menu.innerHTML = `
            <div class="menu-item" data-action="new-note">New Note</div>
            <div class="menu-item" data-action="new-folder">New Folder</div>
        `;
        menu.style.position = 'absolute';
        menu.style.left = `${e.pageX}px`;
        menu.style.top = `${e.pageY}px`;
        document.body.appendChild(menu);

        menu.addEventListener('click', (e) => {
            const action = e.target.dataset.action;
            if (action === 'new-note') this.createNote();
            if (action === 'new-folder') this.createFolder();
            menu.remove();
        });

        document.addEventListener('click', () => menu.remove(), { once: true });
    }

    createNote() {
        const name = prompt('Note name:');
        if (name) {
            const path = this.currentNote ? this.currentNote.path : '';
            const note = { content: '', path, name };
            const project = path ? this.notesTree[path.split('/')[0]] : this.notesTree['root'] || { notes: {}, folders: {} };
            project.notes[name] = note;
            if (!this.notesTree[path.split('/')[0]]) this.notesTree['root'] = project;
            this.renderTree();
            this.loadNote(note);
        }
    }

    createFolder() {
        const name = prompt('Folder name:');
        if (name) {
            const path = this.currentNote ? this.currentNote.path : '';
            const project = path ? this.notesTree[path.split('/')[0]] : this.notesTree['root'] || { notes: {}, folders: {} };
            project.folders[name] = { folders: {}, notes: {} };
            if (!this.notesTree[path.split('/')[0]]) this.notesTree['root'] = project;
            this.renderTree();
        }
    }

    loadNote(note) {
        this.currentNote = note;
        this.editor.innerHTML = note.content;
        this.updateWordCount();
    }

    selectFolder(path) {
        this.currentNote = { path };
        this.editor.innerHTML = '';
    }

    loadCustomTheme(themeData) {
        const style = document.createElement('style');
        style.textContent = `
            .toolbar { background: ${themeData.toolbar}; }
            .file-organizer { background: ${themeData.fileOrganizer}; }
            .editor { background: ${themeData.editor}; }
            .editor-content { color: ${themeData.text}; }
        `;
        document.head.appendChild(style);
    }
}

const customTheme = {
    toolbar: 'linear-gradient(to bottom, #e8ecef, #d1d5d8)',
    fileOrganizer: '#f5f5f7',
    editor: '#ffffff',
    text: '#333333'
};

const app = new EpicNotesApp();
// app.loadCustomTheme(customTheme);

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js');
}
