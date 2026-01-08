const app = {
    posts: JSON.parse(localStorage.getItem('army_posts')) || [
        { id: 'POST-001', name: 'Main Gate Alpha' },
        { id: 'POST-002', name: 'Watchtower 3' },
        { id: 'POST-003', name: 'Ammo Depot' }
    ],
    assignments: JSON.parse(localStorage.getItem('army_assignments')) || [
        { id: 1, postId: 'POST-001', personnelName: 'Sgt. Akram Khan', personnelRank: 'Sergeant' }
    ],
    personnel: JSON.parse(localStorage.getItem('army_personnel')) || [
        { id: 'ADM-001', name: 'Maj. Gen. Rahman', rank: 'Major General', category: 'Officer (Class 1 Gazetted Officer)' },
        { id: 'ADM-402', name: 'Sgt. Akram Khan', rank: 'Sergeant', category: 'NCOs/Soldiers' },
        { id: 'ADM-403', name: 'Cpl. Jahid Hasan', rank: 'Corporal', category: 'NCOs/Soldiers' },
        { id: 'ADM-404', name: 'Lc. Kabir Hossain', rank: 'Lance Corporal', category: 'NCOs/Soldiers' }
    ],

    init() {
        this.cacheDOM();
        this.bindEvents();
        this.renderDashboard(); // Default view
        this.saveData();
    },

    cacheDOM() {
        this.navItems = document.querySelectorAll('.sidebar-nav li');
        this.contentArea = document.getElementById('content-area');
    },

    bindEvents() {
        this.navItems.forEach(item => {
            item.addEventListener('click', (e) => this.handleTabSwitch(e));
        });

        // Event delegation for dynamic elements
        document.addEventListener('click', (e) => {
            if (e.target.closest('.delete-post')) {
                const postId = e.target.closest('.post-card').dataset.id;
                this.deletePost(postId);
            }
            if (e.target.closest('.assign-btn')) {
                const postId = e.target.closest('.post-card').dataset.id;
                this.showAssignModal(postId);
            }
            if (e.target.closest('.remove-assignment')) {
                const assignmentId = parseInt(e.target.closest('.remove-assignment').dataset.id);
                this.removeAssignment(assignmentId);
            }
            if (e.target.closest('.delete-person')) {
                const personId = e.target.closest('.delete-person').dataset.id;
                this.deleteSoldier(personId);
            }
        });
    },

    saveData() {
        localStorage.setItem('army_posts', JSON.stringify(this.posts));
        localStorage.setItem('army_assignments', JSON.stringify(this.assignments));
        localStorage.setItem('army_personnel', JSON.stringify(this.personnel));
    },

    handleTabSwitch(e) {
        const target = e.currentTarget;
        const tab = target.getAttribute('data-tab');

        // Update active class
        this.navItems.forEach(item => item.classList.remove('active'));
        target.classList.add('active');

        // Logic to load specific tab content
        switch (tab) {
            case 'dashboard':
                this.renderDashboard();
                break;
            case 'roster':
                this.renderRoster();
                break;
            case 'person':
                this.renderPersonnel();
                break;
            case 'posts':
                this.renderDutyPosts();
                break;
            case 'reports':
                this.renderReports();
                break;
            case 'settings':
                this.renderSettings();
                break;
            default:
                this.contentArea.innerHTML = `<div class="placeholder-view">View under construction: ${tab}</div>`;
        }
    },

    renderDutyPosts() {
        this.contentArea.innerHTML = `
            <div class="dashboard-header" style="display:flex; justify-content:space-between; align-items:center;">
                <div>
                    <h1>Tactical Duty Posts</h1>
                    <p>Manage deployment locations and active assignments.</p>
                </div>
                <button class="btn-primary" onclick="app.showAddPostModal()"><i class="fas fa-plus"></i> Add New Post</button>
            </div>
            
            <div class="posts-grid">
                ${this.posts.map(post => {
            const postAssignments = this.assignments.filter(a => a.postId === post.id);
            return `
                        <div class="post-card" data-id="${post.id}">
                            <div class="post-header">
                                <div>
                                    <div class="post-title">${post.name}</div>
                                    <div class="post-id">${post.id}</div>
                                </div>
                                <i class="fas fa-trash delete-post"></i>
                            </div>
                            <div class="post-assignments">
                                ${postAssignments.length > 0 ?
                    postAssignments.map(a => `
                                        <div class="assignment-item">
                                            <div class="assignee-info">
                                                <div class="assignee-rank">${a.personnelRank}</div>
                                                <div class="assignee-name">${a.personnelName}</div>
                                            </div>
                                            <i class="fas fa-times remove-assignment" data-id="${a.id}"></i>
                                        </div>
                                    `).join('') :
                    '<div style="color:var(--text-secondary); font-size:0.8rem; font-style:italic;">No active assignments</div>'
                }
                            </div>
                            <button class="assign-btn"><i class="fas fa-user-plus"></i> Assign Personnel</button>
                        </div>
                    `;
        }).join('')}
            </div>
        `;
    },

    showAddPostModal() {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content">
                <h2>Add New Deployment Post</h2>
                <div class="form-group">
                    <label>Post Name</label>
                    <input type="text" id="new-post-name" placeholder="e.g. Sector 7 Watchtower">
                </div>
                <div class="form-group">
                    <label>Post ID</label>
                    <input type="text" id="new-post-id" value="POST-${Math.floor(Math.random() * 1000)}" readonly>
                </div>
                <div class="form-actions">
                    <button class="btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
                    <button class="btn-primary" onclick="app.addPost()">Create Post</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    },

    addPost() {
        const name = document.getElementById('new-post-name').value;
        const id = document.getElementById('new-post-id').value;
        if (name) {
            this.posts.push({ id, name });
            this.saveData();
            this.renderDutyPosts();
            document.querySelector('.modal-overlay').remove();
        }
    },

    deletePost(id) {
        if (confirm('Are you sure you want to decommission this post?')) {
            this.posts = this.posts.filter(p => p.id !== id);
            this.assignments = this.assignments.filter(a => a.postId !== id);
            this.saveData();
            this.renderDutyPosts();
        }
    },

    showAssignModal(postId) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content">
                <h2>Assign Personnel</h2>
                <div class="form-group">
                    <label>Select Soldier</label>
                    <select id="assign-personnel">
                        ${this.personnel.map(p => `<option value="${p.name}|${p.rank}">${p.rank} ${p.name}</option>`).join('')}
                    </select>
                </div>
                <div class="form-actions">
                    <button class="btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
                    <button class="btn-primary" onclick="app.assignPersonnel('${postId}')">Confirm Assignment</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    },

    assignPersonnel(postId) {
        const selection = document.getElementById('assign-personnel').value.split('|');
        const name = selection[0];
        const rank = selection[1];

        this.assignments.push({
            id: Date.now(),
            postId: postId,
            personnelName: name,
            personnelRank: rank
        });

        this.saveData();
        this.renderDutyPosts();
        document.querySelector('.modal-overlay').remove();
    },

    removeAssignment(id) {
        this.assignments = this.assignments.filter(a => a.id !== id);
        this.saveData();
        this.renderDutyPosts();
    },

    ranksData: {
        "Officer (Class 1 Gazetted Officer)": [
            "Lieutenant", "Captain", "Major", "Lieutenant Colonel", "Colonel",
            "Brigadier General", "Major General", "Lieutenant General", "General"
        ],
        "Junior Commissioned Officer (JCO)": [
            "Warrant Officer", "Senior Warrant Officer", "Master Warrant Officer",
            "Honorary Lieutenant", "Honorary Captain"
        ],
        "NCOs/Soldiers": [
            "Sainik", "Lance Corporal", "Corporal", "Sergeant",
            "Company Battery Quarter Master Sergeant", "Company Battery Sergeant Major",
            "Battalion Regiment Quarter Master Sergeant", "Battalion Regiment Sergeant Major"
        ]
    },

    // Soldier Management
    showAddSoldierModal() {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content">
                <h2>Add New Soldier</h2>
                <div class="form-group">
                    <label>Full Name</label>
                    <input type="text" id="sol-name" placeholder="e.g. John Doe">
                </div>
                <div class="form-group">
                    <label>Rank Category</label>
                    <select id="sol-category" onchange="app.updateRankOptions()">
                        <option value="">Select Category</option>
                        ${Object.keys(this.ranksData).map(cat => `<option value="${cat}">${cat}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label>Specific Rank</label>
                    <select id="sol-rank">
                        <option value="">Select Category First</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Soldier No</label>
                    <input type="text" id="sol-id" placeholder="e.g. 12345">
                </div>
                <div class="form-actions">
                    <button class="btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
                    <button class="btn-primary" onclick="app.addSoldier()">Register Soldier</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    },

    updateRankOptions() {
        const category = document.getElementById('sol-category').value;
        const rankSelect = document.getElementById('sol-rank');
        rankSelect.innerHTML = '';

        if (category && this.ranksData[category]) {
            this.ranksData[category].forEach(rank => {
                const opt = document.createElement('option');
                opt.value = rank;
                opt.textContent = rank;
                rankSelect.appendChild(opt);
            });
        } else {
            const opt = document.createElement('option');
            opt.value = "";
            opt.textContent = "Select Category First";
            rankSelect.appendChild(opt);
        }
    },

    addSoldier() {
        const name = document.getElementById('sol-name').value;
        const rank = document.getElementById('sol-rank').value;
        const id = document.getElementById('sol-id').value;
        const category = document.getElementById('sol-category').value;

        if (name && rank && id) {
            this.personnel.push({ id, name, rank, category });
            this.saveData();
            this.renderPersonnel();
            document.querySelector('.modal-overlay').remove();
        } else {
            alert('Please fill all tactical data fields.');
        }
    },

    deleteSoldier(id) {
        if (confirm('Are you sure you want to remove this personnel from registry?')) {
            this.personnel = this.personnel.filter(p => p.id !== id);
            this.assignments = this.assignments.filter(a => a.personnelName !== this.personnel.find(per => per.id === id)?.name);
            this.saveData();
            this.renderPersonnel();
        }
    },

    renderReports() {
        this.contentArea.innerHTML = `
            <div class="dashboard-header">
                <h1>Operational Reports</h1>
                <p>Generate and view tactical deployment reports.</p>
            </div>
            <div class="panel">
                <div class="panel-body p-20">
                    <p>No active reports currently. System is gathering data from all sectors.</p>
                    <button class="btn-primary" style="margin-top: 20px;"><i class="fas fa-file-export"></i> Export Nightly Report</button>
                </div>
            </div>
        `;
    },

    renderSettings() {
        this.contentArea.innerHTML = `
            <div class="dashboard-header">
                <h1>System Settings</h1>
            </div>
            <div class="panel">
                <div class="panel-body p-20">
                    <div class="form-group">
                        <label>Base Location</label>
                        <input type="text" value="Dhaka Cantonment" readonly style="background:transparent; border:1px solid #333; color:#fff; padding:10px; width:100%; margin-top:10px;">
                    </div>
                    <div class="form-group" style="margin-top:20px;">
                        <label>Security Level</label>
                        <span style="color:red; margin-left:10px; font-weight:bold;">LEVEL 4 - RESTRICTED ACCESS</span>
                    </div>
                </div>
            </div>
        `;
    },

    renderDashboard() {
        this.contentArea.innerHTML = `
            <div class="dashboard-header">
                <h1>Tactical Overview</h1>
                <p>Real-time status of all active units and assignments.</p>
            </div>
            
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-icon"><i class="fas fa-users"></i></div>
                    <div class="stat-info">
                        <h3>Total Personnel</h3>
                        <div class="value">${this.personnel.length}</div>
                    </div>
                </div>
                <div class="stat-card active-duty">
                    <div class="stat-icon"><i class="fas fa-crosshairs"></i></div>
                    <div class="stat-info">
                        <h3>Active Duty</h3>
                        <div class="value">${this.assignments.length}</div>
                    </div>
                </div>
                <div class="stat-card standby">
                    <div class="stat-icon"><i class="fas fa-clock"></i></div>
                    <div class="stat-info">
                        <h3>Standby</h3>
                        <div class="value">${Math.max(0, this.personnel.length - this.assignments.length)}</div>
                    </div>
                </div>
                <div class="stat-card leave">
                    <div class="stat-icon"><i class="fas fa-umbrella-beach"></i></div>
                    <div class="stat-info">
                        <h3>On Leave</h3>
                        <div class="value">0</div>
                    </div>
                </div>
            </div>

            <div class="dashboard-content">
                <div class="panel recent-duty">
                    <div class="panel-header">
                        <h2>Recent Duty Assignments</h2>
                        <button class="btn-link">View All</button>
                    </div>
                    <div class="panel-body">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>Personnel</th>
                                    <th>Assignment</th>
                                    <th>Status</th>
                                    <th>Time</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${this.assignments.slice(-5).reverse().map(a => `
                                    <tr>
                                        <td>${a.personnelRank} ${a.personnelName}</td>
                                        <td>${this.posts.find(p => p.id === a.postId)?.name || 'Unknown Post'}</td>
                                        <td><span class="status-badge active">Ongoing</span></td>
                                        <td>${new Date().getHours()}:00 - ${(new Date().getHours() + 8) % 24}:00</td>
                                    </tr>
                                `).join('')}
                                ${this.assignments.length === 0 ? '<tr><td colspan="4" style="text-align:center; color:var(--text-secondary);">No active assignments found</td></tr>' : ''}
                            </tbody>
                        </table>
                    </div>
                </div>
                
                <div class="panel alert-panel">
                    <div class="panel-header">
                        <h2>System Alerts</h2>
                    </div>
                    <div class="panel-body">
                        <div class="alert-item high">
                            <i class="fas fa-exclamation-triangle"></i>
                            <div class="alert-content">
                                <strong>Logistics Delay</strong>
                                <p>Sect-4 Supply chain delayed by 2 hours.</p>
                            </div>
                        </div>
                        <div class="alert-item mid">
                            <i class="fas fa-info-circle"></i>
                            <div class="alert-content">
                                <strong>Shift Update</strong>
                                <p>Evening shift for Alpha Squad rescheduled.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    renderRoster() {
        this.contentArea.innerHTML = `
            <div class="dashboard-header">
                <h1>Deployment Roster</h1>
                <div class="actions">
                    <button class="btn-primary" onclick="app.handleTabSwitch({currentTarget: document.querySelector('[data-tab=posts]')})"><i class="fas fa-plus"></i> New Assignment</button>
                </div>
            </div>
            <div class="panel">
                <div class="panel-header">
                    <h2>Active Schedule</h2>
                </div>
                <div class="panel-body">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Soldier No</th>
                                <th>Name</th>
                                <th>Post</th>
                                <th>Duration</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${this.assignments.map(a => {
            const soldier = this.personnel.find(p => p.name === a.personnelName);
            return `
                                <tr>
                                    <td>${soldier ? soldier.id : 'N/A'}</td>
                                    <td>${a.personnelRank} ${a.personnelName}</td>
                                    <td>${this.posts.find(p => p.id === a.postId)?.name || 'Unknown'}</td>
                                    <td>08:00 - 16:00</td>
                                    <td><span class="status-badge active">On Duty</span></td>
                                </tr>
                            `;
        }).join('')}
                            ${this.assignments.length === 0 ? '<tr><td colspan="5" style="text-align:center; color:var(--text-secondary); padding: 20px;">No personnel currently on duty</td></tr>' : ''}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    },

    renderPersonnel() {
        this.contentArea.innerHTML = `
            <div class="dashboard-header" style="display:flex; justify-content:space-between; align-items:center;">
                <div>
                    <h1>Personnel Registry</h1>
                    <p>Register and manage all military personnel records.</p>
                </div>
                <button class="btn-primary" onclick="app.showAddSoldierModal()"><i class="fas fa-user-plus"></i> Add Soldier</button>
            </div>
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-info">
                        <h3>Officers</h3>
                        <div class="value">${this.personnel.filter(p => p.category === "Officer (Class 1 Gazetted Officer)").length}</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-info">
                        <h3>JCOs</h3>
                        <div class="value">${this.personnel.filter(p => p.category === "Junior Commissioned Officer (JCO)").length}</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-info">
                        <h3>NCOs/Soldiers</h3>
                        <div class="value">${this.personnel.filter(p => p.category === "NCOs/Soldiers").length}</div>
                    </div>
                </div>
            </div>
            <div class="panel">
                <div class="panel-body">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Soldier No</th>
                                <th>Name</th>
                                <th>Rank</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${this.personnel.map(p => `
                                <tr>
                                    <td style="font-family: 'Orbitron', sans-serif; font-size:0.8rem;">${p.id}</td>
                                    <td>${p.name}</td>
                                    <td><span style="color:var(--accent-color); font-weight:500;">${p.rank}</span></td>
                                    <td><span class="status-badge ${this.assignments.some(a => a.personnelName === p.name) ? 'active' : 'completed'}">${this.assignments.some(a => a.personnelName === p.name) ? 'On Duty' : 'Ready'}</span></td>
                                    <td><i class="fas fa-trash-alt delete-person" data-id="${p.id}" style="color:#e74c3c; cursor:pointer;"></i></td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }
};

document.addEventListener('DOMContentLoaded', () => app.init());
