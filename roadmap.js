// Roadmap page functionality for StudyHub
// Handles course roadmap display, filtering, and search

class RoadmapManager {
    constructor() {
        this.roadmaps = [];
        this.filteredRoadmaps = [];
        this.currentFilter = 'all';
        this.searchTerm = '';
        this.init();
    }

    init() {
        this.loadRoadmaps();
        this.initFilters();
        this.initSearch();
        this.initModalHandlers();
    }

    loadRoadmaps() {
        // Sample roadmap data - in a real app, this would come from an API
        this.roadmaps = [
            {
                id: 1,
                title: 'Introduction to Programming',
                category: 'cs',
                difficulty: 'Beginner',
                popularity: 4.8,
                duration: '8 weeks',
                description: 'Learn the fundamentals of programming with hands-on projects and real-world applications.',
                steps: [
                    'Variables and Data Types',
                    'Control Structures',
                    'Functions and Methods',
                    'Object-Oriented Programming',
                    'Data Structures',
                    'Algorithm Basics',
                    'Project: Build a Calculator',
                    'Final Project: Simple Game'
                ],
                prerequisites: ['Basic computer skills'],
                technologies: ['Python', 'VS Code', 'Git'],
                projects: ['Calculator App', 'Text-based Adventure Game'],
                resources: [
                    { name: 'Python Official Tutorial', url: '#' },
                    { name: 'Codecademy Python Course', url: '#' },
                    { name: 'Python Crash Course Book', url: '#' }
                ]
            },
            {
                id: 2,
                title: 'Data Structures & Algorithms',
                category: 'cs',
                difficulty: 'Intermediate',
                popularity: 4.9,
                duration: '12 weeks',
                description: 'Master essential data structures and algorithms for technical interviews and efficient programming.',
                steps: [
                    'Array and String Manipulation',
                    'Linked Lists',
                    'Stacks and Queues',
                    'Trees and Binary Search Trees',
                    'Hash Tables',
                    'Graph Algorithms',
                    'Dynamic Programming',
                    'Practice Problems'
                ],
                prerequisites: ['Basic programming knowledge', 'Introduction to Programming'],
                technologies: ['Python', 'Java', 'LeetCode'],
                projects: ['Binary Search Tree Implementation', 'Graph Traversal Visualizer'],
                resources: [
                    { name: 'Cracking the Coding Interview', url: '#' },
                    { name: 'LeetCode Practice', url: '#' },
                    { name: 'Algorithm Visualizer', url: '#' }
                ]
            },
            {
                id: 3,
                title: 'Calculus I: Limits and Derivatives',
                category: 'math',
                difficulty: 'Intermediate',
                popularity: 4.6,
                duration: '16 weeks',
                description: 'Comprehensive introduction to differential calculus with practical applications.',
                steps: [
                    'Functions and Limits',
                    'Continuity',
                    'The Derivative',
                    'Differentiation Rules',
                    'Applications of Derivatives',
                    'Related Rates',
                    'Optimization Problems',
                    'Mean Value Theorem'
                ],
                prerequisites: ['Pre-calculus', 'Trigonometry'],
                technologies: ['Graphing Calculator', 'Desmos', 'WolframAlpha'],
                projects: ['Optimization Project', 'Real-world Applications'],
                resources: [
                    { name: 'Khan Academy Calculus', url: '#' },
                    { name: 'Paul\'s Online Math Notes', url: '#' },
                    { name: 'Stewart Calculus Textbook', url: '#' }
                ]
            },
            {
                id: 4,
                title: 'Web Development Fundamentals',
                category: 'cs',
                difficulty: 'Beginner',
                popularity: 4.7,
                duration: '10 weeks',
                description: 'Build modern, responsive websites from scratch using HTML, CSS, and JavaScript.',
                steps: [
                    'HTML Structure and Semantics',
                    'CSS Styling and Layouts',
                    'Responsive Design',
                    'JavaScript Basics',
                    'DOM Manipulation',
                    'Fetch API and AJAX',
                    'Project: Portfolio Website',
                    'Deployment and Hosting'
                ],
                prerequisites: ['Basic computer skills'],
                technologies: ['HTML5', 'CSS3', 'JavaScript', 'Git', 'Netlify'],
                projects: ['Personal Portfolio', 'Todo App', 'Weather Dashboard'],
                resources: [
                    { name: 'MDN Web Docs', url: '#' },
                    { name: 'freeCodeCamp', url: '#' },
                    { name: 'CSS-Tricks', url: '#' }
                ]
            },
            {
                id: 5,
                title: 'Linear Algebra Essentials',
                category: 'math',
                difficulty: 'Intermediate',
                popularity: 4.5,
                duration: '14 weeks',
                description: 'Master vectors, matrices, and linear transformations for applications in data science and engineering.',
                steps: [
                    'Vector Operations',
                    'Matrix Algebra',
                    'Systems of Linear Equations',
                    'Vector Spaces',
                    'Linear Transformations',
                    'Eigenvalues and Eigenvectors',
                    'Applications in ML',
                    'Project Applications'
                ],
                prerequisites: ['Algebra II', 'Basic programming'],
                technologies: ['MATLAB', 'Python NumPy', 'Jupyter Notebooks'],
                projects: ['Image Compression with SVD', 'Principal Component Analysis'],
                resources: [
                    { name: '3Blue1Brown Linear Algebra', url: '#' },
                    { name: 'Gilbert Strang MIT Course', url: '#' },
                    { name: 'Linear Algebra Done Right', url: '#' }
                ]
            },
            {
                id: 6,
                title: 'Mechanical Engineering Dynamics',
                category: 'eng',
                difficulty: 'Advanced',
                popularity: 4.3,
                duration: '16 weeks',
                description: 'Study motion of particles and rigid bodies with applications to real-world engineering problems.',
                steps: [
                    'Kinematics of Particles',
                    'Kinetics of Particles',
                    'Work and Energy Methods',
                    'Impulse and Momentum',
                    'Kinematics of Rigid Bodies',
                    'Kinetics of Rigid Bodies',
                    'Vibrations',
                    'Engineering Applications'
                ],
                prerequisites: ['Physics I', 'Calculus II', 'Statics'],
                technologies: ['MATLAB', 'SolidWorks', 'Engineering Calculator'],
                projects: ['Pendulum Analysis', 'Vehicle Dynamics Simulation'],
                resources: [
                    { name: 'Engineering Mechanics Textbook', url: '#' },
                    { name: 'MATLAB Dynamics Toolbox', url: '#' },
                    { name: 'MIT OpenCourseWare', url: '#' }
                ]
            },
            {
                id: 7,
                title: 'Organic Chemistry I',
                category: 'science',
                difficulty: 'Advanced',
                popularity: 4.2,
                duration: '16 weeks',
                description: 'Comprehensive study of carbon-based compounds, reactions, and mechanisms.',
                steps: [
                    'Structure and Bonding',
                    'Functional Groups',
                    'Stereochemistry',
                    'Reaction Mechanisms',
                    'Substitution Reactions',
                    'Elimination Reactions',
                    'Addition Reactions',
                    'Synthesis Strategies'
                ],
                prerequisites: ['General Chemistry I & II'],
                technologies: ['ChemDraw', 'Molecular Models', 'Spectroscopy Software'],
                projects: ['Synthesis Pathway Design', 'Mechanism Prediction'],
                resources: [
                    { name: 'Organic Chemistry Textbook', url: '#' },
                    { name: 'Khan Academy Organic Chemistry', url: '#' },
                    { name: 'Organic Chemistry Tutor YouTube', url: '#' }
                ]
            },
            {
                id: 8,
                title: 'Database Design & Management',
                category: 'cs',
                difficulty: 'Intermediate',
                popularity: 4.6,
                duration: '12 weeks',
                description: 'Learn to design, implement, and manage relational databases for modern applications.',
                steps: [
                    'Database Fundamentals',
                    'Entity-Relationship Modeling',
                    'Normalization',
                    'SQL Basics',
                    'Advanced SQL Queries',
                    'Indexing and Performance',
                    'Transactions and Concurrency',
                    'Database Administration'
                ],
                prerequisites: ['Basic programming knowledge'],
                technologies: ['MySQL', 'PostgreSQL', 'SQL Server', 'MongoDB'],
                projects: ['Library Management System', 'E-commerce Database'],
                resources: [
                    { name: 'SQLBolt Interactive Tutorial', url: '#' },
                    { name: 'Database Design Book', url: '#' },
                    { name: 'MySQL Documentation', url: '#' }
                ]
            }
        ];

        this.filteredRoadmaps = [...this.roadmaps];
        this.renderRoadmaps();
    }

    initFilters() {
        const filterBtns = document.querySelectorAll('.filter-btn');

        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                // Update active filter button
                filterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                // Update current filter
                this.currentFilter = btn.getAttribute('data-filter');
                this.applyFilters();
            });
        });
    }

    initSearch() {
        const searchInput = document.getElementById('roadmap-search');
        if (!searchInput) return;

        const debouncedSearch = this.debounce((term) => {
            this.searchTerm = term;
            this.applyFilters();
        }, 300);

        searchInput.addEventListener('input', (e) => {
            debouncedSearch(e.target.value.toLowerCase().trim());
        });
    }

    applyFilters() {
        this.showLoading();

        setTimeout(() => {
            this.filteredRoadmaps = this.roadmaps.filter(roadmap => {
                const matchesCategory = this.currentFilter === 'all' || roadmap.category === this.currentFilter;
                const matchesSearch = !this.searchTerm ||
                    roadmap.title.toLowerCase().includes(this.searchTerm) ||
                    roadmap.description.toLowerCase().includes(this.searchTerm) ||
                    roadmap.steps.some(step => step.toLowerCase().includes(this.searchTerm));

                return matchesCategory && matchesSearch;
            });

            this.hideLoading();
            this.renderRoadmaps();
        }, 500);
    }

    renderRoadmaps() {
        const grid = document.getElementById('roadmap-grid');
        const noResults = document.getElementById('no-results');

        if (!grid) return;

        if (this.filteredRoadmaps.length === 0) {
            grid.innerHTML = '';
            if (noResults) noResults.style.display = 'block';
            return;
        }

        if (noResults) noResults.style.display = 'none';

        grid.innerHTML = this.filteredRoadmaps.map(roadmap => this.createRoadmapCard(roadmap)).join('');

        // Toggle details on button click
        grid.querySelectorAll('.view-btn').forEach((btn) => {
            btn.addEventListener('click', () => {
                const details = btn.closest('.roadmap-card').querySelector('.roadmap-details');
                const isVisible = details.style.display === 'block';
                details.style.display = isVisible ? 'none' : 'block';
                btn.innerHTML = isVisible
                    ? '<i class="fas fa-eye"></i> View Full Roadmap'
                    : '<i class="fas fa-eye-slash"></i> Hide Full Roadmap';
            });
        });
    }




    createRoadmapCard(roadmap) {
        const difficultyColor = {
            'Beginner': 'var(--success-color)',
            'Intermediate': 'var(--warning-color)',
            'Advanced': 'var(--danger-color)'
        };

        return `
            <div class="roadmap-card" data-id="${roadmap.id}">
                <div class="roadmap-header">
                    <h3>${roadmap.title}</h3>
                    <div class="roadmap-meta">
                        <span class="category" style="background: var(--accent-color);">
                            ${this.getCategoryName(roadmap.category)}
                        </span>
                        <span class="difficulty" style="color: ${difficultyColor[roadmap.difficulty]};">
                            ${roadmap.difficulty}
                        </span>
                    </div>
                </div>
                
                <div class="popularity">
                    <i class="fas fa-star"></i>
                    <span>${roadmap.popularity}/5.0</span>
                    <span class="duration">• ${roadmap.duration}</span>
                </div>
                
                <p class="roadmap-description">${roadmap.description}</p>
                
                <button class="view-btn">
                    <i class="fas fa-eye"></i>
                    View Full Roadmap
                </button>

                <!-- Hidden details (collapsed by default) -->
                <div class="roadmap-details" style="display: none; margin-top: 1rem;">
                    <h4>Steps</h4>
                    <ul>
                        ${roadmap.steps.map(step => `<li>${step}</li>`).join('')}
                    </ul>
                    <h4>Technologies</h4>
                    <p>${roadmap.technologies.join(', ')}</p>
                    <h4>Prerequisites</h4>
                    <p>${roadmap.prerequisites.join(', ')}</p>
                    <h4>Projects</h4>
                    <p>${roadmap.projects.join(', ')}</p>
                    <h4>Resources</h4>
                    <p>${roadmap.resources.join(', ')}</p>
                </div>
            </div>
        `;
    }



    showRoadmapDetails(roadmap) {
        const modal = document.getElementById('roadmap-modal');
        const modalTitle = document.getElementById('modal-title');
        const modalBody = document.getElementById('modal-body');

        if (!modal || !modalTitle || !modalBody) return;

        modalTitle.innerHTML = `
            <i class="fas fa-route"></i>
            ${roadmap.title}
        `;

        modalBody.innerHTML = `
            <div class="roadmap-details">
                <div class="roadmap-overview">
                    <div class="overview-stats">
                        <div class="stat">
                            <i class="fas fa-star"></i>
                            <span>${roadmap.popularity}/5.0 Rating</span>
                        </div>
                        <div class="stat">
                            <i class="fas fa-clock"></i>
                            <span>${roadmap.duration}</span>
                        </div>
                        <div class="stat">
                            <i class="fas fa-signal"></i>
                            <span>${roadmap.difficulty}</span>
                        </div>
                        <div class="stat">
                            <i class="fas fa-tag"></i>
                            <span>${this.getCategoryName(roadmap.category)}</span>
                        </div>
                    </div>
                    
                    <p class="roadmap-full-description">${roadmap.description}</p>
                </div>

                <div class="roadmap-prerequisites">
                    <h3><i class="fas fa-list-check"></i> Prerequisites</h3>
                    <ul>
                        ${roadmap.prerequisites.map(prereq => `<li>${prereq}</li>`).join('')}
                    </ul>
                </div>

                <div class="roadmap-curriculum">
                    <h3><i class="fas fa-graduation-cap"></i> Complete Learning Path</h3>
                    <ol class="curriculum-list">
                        ${roadmap.steps.map((step, index) => `
                            <li class="curriculum-item">
                                <div class="step-number">${index + 1}</div>
                                <div class="step-content">
                                    <h4>${step}</h4>
                                </div>
                            </li>
                        `).join('')}
                    </ol>
                </div>

                <div class="roadmap-technologies-full">
                    <h3><i class="fas fa-tools"></i> Technologies & Tools</h3>
                    <div class="tech-grid">
                        ${roadmap.technologies.map(tech => `
                            <div class="tech-item">
                                <i class="fas fa-check-circle"></i>
                                <span>${tech}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="roadmap-projects">
                    <h3><i class="fas fa-project-diagram"></i> Projects You'll Build</h3>
                    <div class="projects-list">
                        ${roadmap.projects.map(project => `
                            <div class="project-item">
                                <i class="fas fa-code"></i>
                                <span>${project}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="roadmap-resources">
                    <h3><i class="fas fa-book"></i> Recommended Resources</h3>
                    <div class="resources-list">
                        ${roadmap.resources.map(resource => `
                            <div class="resource-item">
                                <i class="fas fa-external-link-alt"></i>
                                <a href="${resource.url}" target="_blank">${resource.name}</a>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="roadmap-actions">
                    <button class="action-btn primary" onclick="window.studyHub.showNotification('Roadmap bookmarked!', 'success')">
                        <i class="fas fa-bookmark"></i>
                        Bookmark Roadmap
                    </button>
                    <button class="action-btn" onclick="window.studyHub.showNotification('Roadmap shared!', 'success')">
                        <i class="fas fa-share"></i>
                        Share Roadmap
                    </button>
                    <button class="action-btn" onclick="window.print()">
                        <i class="fas fa-print"></i>
                        Print Roadmap
                    </button>
                </div>
            </div>
        `;

        // Show modal
        window.studyHub.openModal(modal);
    }

    initModalHandlers() {
        // Modal handlers are initialized in main.js
        // This is for roadmap-specific modal functionality
        const modal = document.getElementById('roadmap-modal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    window.studyHub.closeModal(modal);
                }
            });
        }
    }

    getCategoryName(category) {
        const categoryNames = {
            'cs': 'Computer Science',
            'math': 'Mathematics',
            'eng': 'Engineering',
            'science': 'Science'
        };
        return categoryNames[category] || category;
    }

    showLoading() {
        const loadingElement = document.getElementById('loading-roadmaps');
        const gridElement = document.getElementById('roadmap-grid');

        if (loadingElement) loadingElement.style.display = 'flex';
        if (gridElement) gridElement.style.display = 'none';
    }

    hideLoading() {
        const loadingElement = document.getElementById('loading-roadmaps');
        const gridElement = document.getElementById('roadmap-grid');

        if (loadingElement) loadingElement.style.display = 'none';
        if (gridElement) gridElement.style.display = 'grid';
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
}

// Initialize RoadmapManager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.roadmapManager = new RoadmapManager();
});
