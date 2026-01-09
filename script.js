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
    professions: JSON.parse(localStorage.getItem('army_professions')) || [
        "Technician", "Operator", "Driver Signal", "Clerk", "SMT Clerk"
    ],
    sections: JSON.parse(localStorage.getItem('army_sections')) || [
        "BHQ COY", "HQ COY", "RDO COY", "RR COY", "OP COY", "108 COY", "109 COY", "RP", "MT"
    ],
    unitsData: JSON.parse(localStorage.getItem('army_units')) || {
        "9 SIG BN": [],
        "Army Camp": ["Narsindi Camp", "Sippur Camp"]
    },
    currentPersonnelFilter: 'All',
    currentUnitFilter: 'All',
    currentRankFilter: 'All',
    currentDutyFilter: 'All',
    currentDutyCategory: 'All',

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
        localStorage.setItem('army_professions', JSON.stringify(this.professions));
        localStorage.setItem('army_sections', JSON.stringify(this.sections));
        localStorage.setItem('army_units', JSON.stringify(this.unitsData));
    },

    handleTabSwitch(e) {
        const target = e.currentTarget;
        const tab = target.getAttribute('data-tab');

        // Update active class
        this.navItems.forEach(item => item.classList.remove('active'));
        target.classList.add('active');

        // Reset sub-filters when switching main tabs
        document.querySelectorAll('.submenu li').forEach(li => li.classList.remove('active-sub'));

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
                    <h1>Tactical Duty List</h1>
                    <p>Manage deployment locations and active assignments.</p>
                </div>
                <div style="display:flex; gap:10px; align-items:center;">
                    <select onchange="app.setRegistryFilter('currentDutyCategory', this.value)" style="background:var(--secondary-bg); border:1px solid #444; color:#fff; padding:8px 15px; border-radius:4px; font-size:0.8rem;">
                        <option value="All" ${this.currentDutyCategory === 'All' ? 'selected' : ''}>All Locations</option>
                        <option value="9 SIG BN" ${this.currentDutyCategory === '9 SIG BN' ? 'selected' : ''}>9 SIG BN</option>
                        <option value="Army Camp" ${this.currentDutyCategory === 'Army Camp' ? 'selected' : ''}>Army Camp</option>
                        <option value="RP Duty" ${this.currentDutyCategory === 'RP Duty' ? 'selected' : ''}>RP Duty</option>
                        <option value="MT Duty" ${this.currentDutyCategory === 'MT Duty' ? 'selected' : ''}>MT Duty</option>
                    </select>
                    <button class="btn-primary" onclick="app.showAddPostModal()"><i class="fas fa-plus"></i> Add New Post</button>
                </div>
            </div>
            
            <div class="posts-grid">
                ${this.posts
                .filter(post => {
                    const postUnit = post.unit || '9 SIG BN';
                    if (this.currentDutyCategory === 'All') return true;
                    return postUnit === this.currentDutyCategory;
                })
                .map(post => {
                    const postAssignments = this.assignments.filter(a => a.postId === post.id);
                    const slots = post.slots || 1;
                    const used = postAssignments.length;
                    const isFull = used >= slots;

                    return `
                        <div class="post-card" data-id="${post.id}" style="${isFull ? 'border-color: #e74c3c22;' : ''}">
                            <div class="post-header">
                                <div>
                                    <div class="post-title">${post.name}</div>
                                    <div class="post-category" style="font-size:0.75rem; color:var(--accent-color);">${post.unit || '9 SIG BN'}</div>
                                    <div class="capacity-tag" style="font-size:0.75rem; margin-top:5px; color:${isFull ? '#e74c3c' : 'var(--text-secondary)'};">
                                        <i class="fas fa-users"></i> Slots: ${used} / ${slots}
                                    </div>
                                </div>
                                <i class="fas fa-trash delete-post" style="cursor:pointer; opacity:0.5;"></i>
                            </div>
                            <div class="post-assignments">
                                ${postAssignments.length > 0 ?
                            postAssignments.map(a => `
                                        <div class="assignment-item" style="border-left: 2px solid var(--accent-color);">
                                            <div class="assignee-info">
                                                <div class="assignee-rank">${a.personnelRank}</div>
                                                <div class="assignee-name">${a.personnelName}</div>
                                                <div class="assignee-shift" style="font-size:0.7rem; color:var(--accent-color); margin-top:2px;">
                                                    <i class="fas fa-clock"></i> ${a.shift || 'N/A'}
                                                </div>
                                            </div>
                                            <i class="fas fa-times remove-assignment" data-id="${a.id}"></i>
                                        </div>
                                    `).join('') :
                            '<div style="color:var(--text-secondary); font-size:0.8rem; font-style:italic;">No active assignments</div>'
                        }
                            </div>
                            <button class="assign-btn" ${isFull ? 'disabled style="opacity:0.5; cursor:not-allowed;"' : ''}>
                                <i class="fas fa-user-plus"></i> ${isFull ? 'Slots Full' : 'Assign Personnel'}
                            </button>
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
                    <label>Duty Capacity (Slots)</label>
                    <input type="number" id="new-post-slots" value="1" min="1" max="50">
                </div>
                <div class="form-group">
                    <label>Location / Unit</label>
                    <select id="new-post-unit">
                        <option value="9 SIG BN">9 SIG BN</option>
                        <option value="Army Camp">Army Camp / Camp Duty</option>
                        <option value="RP Duty">RP Duty</option>
                        <option value="MT Duty">MT Duty</option>
                    </select>
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
        const slots = parseInt(document.getElementById('new-post-slots').value) || 1;
        const unit = document.getElementById('new-post-unit').value;
        const id = 'POST-' + Math.random().toString(36).substr(2, 5).toUpperCase();

        if (name) {
            this.posts.push({ id, name, unit, slots });
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
        const post = this.posts.find(p => p.id === postId);
        const postAssignments = this.assignments.filter(a => a.postId === postId);
        if (post && postAssignments.length >= (post.slots || 1)) {
            alert("This post has reached its maximum duty capacity!");
            return;
        }

        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content">
                <h2>Assign Personnel</h2>
                <div class="form-group">
                    <label>Select Soldier</label>
                    <select id="assign-personnel">
                        ${this.personnel
                .filter(p => !this.assignments.some(a => a.personnelName === p.name))
                .map(p => `<option value="${p.name}|${p.rank}">${p.rank} ${p.name}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label>Select Shift</label>
                    <select id="assign-shift">
                        <option value="06:00 AM - 12:00 PM">06:00 AM - 12:00 PM</option>
                        <option value="12:00 PM - 06:00 PM">12:00 PM - 06:00 PM</option>
                        <option value="06:00 PM - 11:00 PM">06:00 PM - 11:00 PM</option>
                        <option value="11:00 PM - 02:00 AM">11:00 PM - 02:00 AM</option>
                        <option value="02:00 AM - 06:00 AM">02:00 AM - 06:00 AM</option>
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
        const shift = document.getElementById('assign-shift').value;
        const name = selection[0];
        const rank = selection[1];

        this.assignments.push({
            id: Date.now(),
            postId: postId,
            personnelName: name,
            personnelRank: rank,
            shift: shift
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
                    <label>Soldier No</label>
                    <input type="text" id="sol-id" placeholder="e.g. 12345">
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
                    <label>Profession / Trade</label>
                    <select id="sol-profession">
                        ${this.professions.map(p => `<option value="${p}">${p}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label>Full Name</label>
                    <input type="text" id="sol-name" placeholder="e.g. John Doe">
                </div>
                <div class="form-group">
                    <label>Section</label>
                    <select id="sol-section">
                        ${this.sections.map(s => `<option value="${s}">${s}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label>Unit</label>
                    <select id="sol-unit" onchange="app.updateUnitSubOptions()">
                        <option value="">Select Unit</option>
                        ${Object.keys(this.unitsData).map(unit => `<option value="${unit}">${unit}</option>`).join('')}
                    </select>
                </div>
                <div id="camp-location-group" class="form-group" style="display:none;">
                    <label>Camp Location</label>
                    <select id="sol-camp-location">
                        <!-- Options populated dynamically -->
                    </select>
                </div>
                <div class="form-group">
                    <label>Duty List</label>
                    <select id="sol-duty-list">
                        <option value="On">On</option>
                        <option value="Off">Off</option>
                    </select>
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

    updateUnitSubOptions() {
        const unitName = document.getElementById('sol-unit').value;
        const campGroup = document.getElementById('camp-location-group');
        const campSelect = document.getElementById('sol-camp-location');

        const camps = this.unitsData[unitName] || [];

        if (camps.length > 0) {
            campGroup.style.display = 'block';
            campSelect.innerHTML = camps.map(c => `<option value="${c}">${c}</option>`).join('');
        } else {
            campGroup.style.display = 'none';
            campSelect.innerHTML = '';
        }
    },

    addSoldier() {
        const name = document.getElementById('sol-name').value;
        const rank = document.getElementById('sol-rank').value;
        const id = document.getElementById('sol-id').value;
        const category = document.getElementById('sol-category').value;
        const unit = document.getElementById('sol-unit').value;
        const campLocation = document.getElementById('sol-camp-location').value;
        const section = document.getElementById('sol-section').value;
        const profession = document.getElementById('sol-profession').value;
        const dutyList = document.getElementById('sol-duty-list').value;

        if (name && rank && id) {
            const camps = this.unitsData[unit] || [];
            const finalUnit = camps.length > 0 ? campLocation : unit;
            this.personnel.push({
                id,
                name,
                rank,
                category,
                unit: finalUnit,
                section,
                profession,
                dutyList
            });
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
                <h1>Tactical System Settings</h1>
                <p>Configure command data and operational parameters.</p>
            </div>
            
            <div class="settings-grid" style="display:grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap:20px;">
                <div class="panel">
                    <div class="panel-header"><h2>Base Information</h2></div>
                    <div class="panel-body p-20">
                        <div class="form-group">
                            <label>Base Location</label>
                            <input type="text" value="Dhaka Cantonment" readonly style="background:transparent; border:1px solid #333; color:#fff; padding:10px; width:100%; margin-top:10px;">
                        </div>
                        <div class="form-group" style="margin-top:20px;">
                            <label>Security Level</label>
                            <span style="color:var(--accent-color); margin-left:10px; font-weight:bold;">LEVEL 4 - RESTRICTED</span>
                        </div>
                    </div>
                </div>

                <div class="panel">
                    <div class="panel-header"><h2>Manage Trades / Professions</h2></div>
                    <div class="panel-body p-20">
                        <div id="profession-list" style="margin-bottom:15px; max-height: 150px; overflow-y: auto;">
                            ${this.professions.map(p => `
                                <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(255,255,255,0.05); padding:8px 12px; margin-bottom:5px; border-radius:4px;">
                                    <span>${p}</span>
                                    <i class="fas fa-times" onclick="app.removeProfession('${p}')" style="color:#e74c3c; cursor:pointer; font-size:0.8rem;"></i>
                                </div>
                            `).join('')}
                        </div>
                        <div class="form-group" style="display:flex; gap:10px;">
                            <input type="text" id="new-profession-input" placeholder="New Trade Name..." style="flex:1; background:transparent; border:1px solid #333; color:#fff; padding:8px; border-radius:4px;">
                            <button class="btn-primary" onclick="app.addProfession()" style="padding:8px 15px;"><i class="fas fa-plus"></i></button>
                        </div>
                    </div>
                </div>

                <div class="panel">
                    <div class="panel-header"><h2>Manage Sections</h2></div>
                    <div class="panel-body p-20">
                        <div id="section-list" style="margin-bottom:15px; max-height: 150px; overflow-y: auto;">
                            ${this.sections.map(s => `
                                <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(255,255,255,0.05); padding:8px 12px; margin-bottom:5px; border-radius:4px;">
                                    <span>${s}</span>
                                    <i class="fas fa-times" onclick="app.removeSection('${s}')" style="color:#e74c3c; cursor:pointer; font-size:0.8rem;"></i>
                                </div>
                            `).join('')}
                        </div>
                        <div class="form-group" style="display:flex; gap:10px;">
                            <input type="text" id="new-section-input" placeholder="New Section Name..." style="flex:1; background:transparent; border:1px solid #333; color:#fff; padding:8px; border-radius:4px;">
                            <button class="btn-primary" onclick="app.addSection()" style="padding:8px 15px;"><i class="fas fa-plus"></i></button>
                        </div>
                    </div>
                </div>

                <div class="panel">
                    <label style="color:var(--accent-color); font-weight:bold; margin-bottom:10px; display:block;">UNIT & CAMP MANAGEMENT</label>
                    <div id="unit-mgmt-container" style="display:grid; grid-template-columns: 1fr 1.5fr; gap:15px;">
                        <div class="mgmt-column">
                            <h4 style="font-size:0.8rem; margin-bottom:10px; color:var(--text-secondary);">Units</h4>
                            <div id="unit-list" style="max-height: 200px; overflow-y: auto;">
                                ${Object.keys(this.unitsData).map(u => `
                                    <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(255,255,255,0.05); padding:8px 12px; margin-bottom:5px; border-radius:4px; cursor:pointer; border:1px solid ${this.activeSettingsUnit === u ? 'var(--accent-color)' : 'transparent'}" onclick="app.setActiveSettingsUnit('${u}')">
                                        <span style="font-size:0.9rem;">${u}</span>
                                        <i class="fas fa-times" onclick="event.stopPropagation(); app.removeUnit('${u}')" style="color:#e74c3c; cursor:pointer; font-size:0.7rem;"></i>
                                    </div>
                                `).join('')}
                            </div>
                            <div class="form-group" style="display:flex; gap:5px; margin-top:10px;">
                                <input type="text" id="new-unit-input" placeholder="Unit..." style="flex:1; background:transparent; border:1px solid #333; color:#fff; padding:6px; border-radius:4px; font-size:0.8rem;">
                                <button class="btn-primary" onclick="app.addUnit()" style="padding:4px 10px;"><i class="fas fa-plus"></i></button>
                            </div>
                        </div>
                        <div class="mgmt-column">
                            <h4 style="font-size:0.8rem; margin-bottom:10px; color:var(--text-secondary);">Location/Camps for: ${this.activeSettingsUnit || 'Select Unit'}</h4>
                            <div id="camp-list" style="max-height: 200px; overflow-y: auto;">
                                ${this.activeSettingsUnit && this.unitsData[this.activeSettingsUnit] ? this.unitsData[this.activeSettingsUnit].map(c => `
                                    <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(255,255,255,0.05); padding:8px 12px; margin-bottom:5px; border-radius:4px;">
                                        <span style="font-size:0.9rem;">${c}</span>
                                        <i class="fas fa-times" onclick="app.removeCamp('${this.activeSettingsUnit}', '${c}')" style="color:#e74c3c; cursor:pointer; font-size:0.7rem;"></i>
                                    </div>
                                `).join('') : '<div style="color:var(--text-secondary); font-size:0.8rem; text-align:center; padding-top:20px;">Select a unit to manage camps</div>'}
                            </div>
                            ${this.activeSettingsUnit ? `
                                <div class="form-group" style="display:flex; gap:5px; margin-top:10px;">
                                    <input type="text" id="new-camp-input" placeholder="Camp Name..." style="flex:1; background:transparent; border:1px solid #333; color:#fff; padding:6px; border-radius:4px; font-size:0.8rem;">
                                    <button class="btn-primary" onclick="app.addCamp()" style="padding:4px 10px;"><i class="fas fa-plus"></i></button>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                </div>

                <div class="panel">
                    <div class="panel-header"><h2>Data Management</h2></div>
                    <div class="panel-body p-20">
                        <p style="color:var(--text-secondary); font-size:0.9rem; margin-bottom:15px;">Warning: This will clear all personnel, assignments, and custom settings.</p>
                        <button class="btn-primary" onclick="app.resetSystem()" style="background:#e74c3c; border:none; width:100%;">
                            <i class="fas fa-redo"></i> Factory Reset System
                        </button>
                    </div>
                </div>
            </div>
        `;
    },

    addProfession() {
        const input = document.getElementById('new-profession-input');
        const val = input.value.trim();
        if (val && !this.professions.includes(val)) {
            this.professions.push(val);
            this.saveData();
            this.renderSettings();
        }
    },

    removeProfession(val) {
        if (confirm(`Remove "${val}" from trades? This won't affect existing soldiers.`)) {
            this.professions = this.professions.filter(p => p !== val);
            this.saveData();
            this.renderSettings();
        }
    },

    addSection() {
        const input = document.getElementById('new-section-input');
        const val = input.value.trim();
        if (val && !this.sections.includes(val)) {
            this.sections.push(val);
            this.saveData();
            this.renderSettings();
        }
    },

    removeSection(val) {
        if (confirm(`Remove "${val}" from sections? This won't affect existing soldiers.`)) {
            this.sections = this.sections.filter(s => s !== val);
            this.saveData();
            this.renderSettings();
        }
    },

    resetSystem() {
        if (confirm('CRITICAL ACTION: Are you sure you want to wipe all tactical data? This cannot be undone.')) {
            localStorage.clear();
            location.reload();
        }
    },

    setActiveSettingsUnit(unit) {
        this.activeSettingsUnit = unit;
        this.renderSettings();
    },

    addUnit() {
        const input = document.getElementById('new-unit-input');
        const val = input.value.trim();
        if (val && !this.unitsData[val]) {
            this.unitsData[val] = [];
            this.saveData();
            this.renderSettings();
        }
    },

    removeUnit(unit) {
        if (confirm(`Remove unit "${unit}" and all its camps?`)) {
            delete this.unitsData[unit];
            if (this.activeSettingsUnit === unit) this.activeSettingsUnit = null;
            this.saveData();
            this.renderSettings();
        }
    },

    addCamp() {
        const input = document.getElementById('new-camp-input');
        const val = input.value.trim();
        if (val && this.activeSettingsUnit && !this.unitsData[this.activeSettingsUnit].includes(val)) {
            this.unitsData[this.activeSettingsUnit].push(val);
            this.saveData();
            this.renderSettings();
        }
    },

    removeCamp(unit, camp) {
        if (confirm(`Remove location "${camp}" from ${unit}?`)) {
            this.unitsData[unit] = this.unitsData[unit].filter(c => c !== camp);
            this.saveData();
            this.renderSettings();
        }
    },

    setPersonnelFilter(filter) {
        this.currentPersonnelFilter = filter;
        this.renderPersonnel();
    },

    setRegistryFilter(key, value) {
        this[key] = value;
        if (key === 'currentDutyCategory') {
            this.renderDutyPosts();
        } else {
            this.renderPersonnel();
        }
    },

    resetFilters() {
        this.currentPersonnelFilter = 'All';
        this.currentUnitFilter = 'All';
        this.currentRankFilter = 'All';
        this.currentDutyFilter = 'All';
        this.renderPersonnel();
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
                                    <td><span style="color:var(--accent-color);">${a.shift || '08:00 - 16:00'}</span></td>
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
        const uniqueRanks = [...new Set(this.personnel.map(p => p.rank))].sort();
        const allPossibleUnits = ["9 SIG BN", ...Object.values(this.unitsData).flat()];

        this.contentArea.innerHTML = `
            <div class="dashboard-header" style="display:flex; justify-content:space-between; align-items:center;">
                <div>
                    <h1>Personnel Registry</h1>
                    <p>Register and manage all military personnel records.</p>
                </div>
                <button class="btn-primary" onclick="app.showAddSoldierModal()"><i class="fas fa-user-plus"></i> Add Soldier</button>
            </div>

            <div class="filter-bar" style="display:flex; gap:10px; margin-bottom:20px; flex-wrap:wrap; background:rgba(255,255,255,0.02); padding:15px; border-radius:8px; border:1px solid rgba(255,255,255,0.05);">
                <div class="filter-item">
                    <label style="display:block; font-size:0.7rem; color:var(--text-secondary); margin-bottom:5px;">CATEGORY</label>
                    <select onchange="app.setRegistryFilter('currentPersonnelFilter', this.value)" style="background:var(--secondary-bg); border:1px solid #444; color:#fff; padding:8px 12px; border-radius:4px; font-size:0.75rem; width:180px;">
                        <option value="All" ${this.currentPersonnelFilter === 'All' ? 'selected' : ''}>All Categories</option>
                        <option value="Officer (Class 1 Gazetted Officer)" ${this.currentPersonnelFilter === 'Officer (Class 1 Gazetted Officer)' ? 'selected' : ''}>Officers</option>
                        <option value="Junior Commissioned Officer (JCO)" ${this.currentPersonnelFilter === 'Junior Commissioned Officer (JCO)' ? 'selected' : ''}>JCOs</option>
                        <option value="NCOs/Soldiers" ${this.currentPersonnelFilter === 'NCOs/Soldiers' ? 'selected' : ''}>NCOs/Soldiers</option>
                    </select>
                </div>

                <div class="filter-item">
                    <label style="display:block; font-size:0.7rem; color:var(--text-secondary); margin-bottom:5px;">UNIT/CAMP</label>
                    <select onchange="app.setRegistryFilter('currentUnitFilter', this.value)" style="background:var(--secondary-bg); border:1px solid #444; color:#fff; padding:8px 12px; border-radius:4px; font-size:0.75rem; width:150px;">
                        <option value="All" ${this.currentUnitFilter === 'All' ? 'selected' : ''}>All Units</option>
                        ${allPossibleUnits.map(u => `<option value="${u}" ${this.currentUnitFilter === u ? 'selected' : ''}>${u}</option>`).join('')}
                    </select>
                </div>

                <div class="filter-item">
                    <label style="display:block; font-size:0.7rem; color:var(--text-secondary); margin-bottom:5px;">RANK</label>
                    <select onchange="app.setRegistryFilter('currentRankFilter', this.value)" style="background:var(--secondary-bg); border:1px solid #444; color:#fff; padding:8px 12px; border-radius:4px; font-size:0.75rem; width:150px;">
                        <option value="All" ${this.currentRankFilter === 'All' ? 'selected' : ''}>All Ranks</option>
                        ${uniqueRanks.map(r => `<option value="${r}" ${this.currentRankFilter === r ? 'selected' : ''}>${r}</option>`).join('')}
                    </select>
                </div>

                <div class="filter-item">
                    <label style="display:block; font-size:0.7rem; color:var(--text-secondary); margin-bottom:5px;">DUTY LIST</label>
                    <select onchange="app.setRegistryFilter('currentDutyFilter', this.value)" style="background:var(--secondary-bg); border:1px solid #444; color:#fff; padding:8px 12px; border-radius:4px; font-size:0.75rem; width:120px;">
                        <option value="All" ${this.currentDutyFilter === 'All' ? 'selected' : ''}>All Status</option>
                        <option value="On" ${this.currentDutyFilter === 'On' ? 'selected' : ''}>In List (On)</option>
                        <option value="Off" ${this.currentDutyFilter === 'Off' ? 'selected' : ''}>Excluded (Off)</option>
                    </select>
                    <div class="filter-item" style="display:flex; align-items:flex-end;">
                    <button onclick="app.resetFilters()" style="background:#e74c3c; border:none; color:#fff; padding:8px 15px; border-radius:4px; font-size:0.75rem; cursor:pointer; height:36px; display:flex; align-items:center; gap:5px;">
                        <i class="fas fa-undo"></i> Reset Filters
                    </button>
                </div>
            </div>
            </div>

            <div class="stats-grid">
                <div class="stat-card ${this.currentPersonnelFilter === 'Officer (Class 1 Gazetted Officer)' ? 'active-filter' : ''}" 
                     onclick="app.setRegistryFilter('currentPersonnelFilter', 'Officer (Class 1 Gazetted Officer)')" 
                     style="cursor:pointer; transition: transform 0.2s;">
                    <div class="stat-info">
                        <h3>Officers</h3>
                        <div class="value">${this.personnel.filter(p => p.category === "Officer (Class 1 Gazetted Officer)").length}</div>
                    </div>
                </div>
                <div class="stat-card ${this.currentPersonnelFilter === 'Junior Commissioned Officer (JCO)' ? 'active-filter' : ''}" 
                     onclick="app.setRegistryFilter('currentPersonnelFilter', 'Junior Commissioned Officer (JCO)')" 
                     style="cursor:pointer; transition: transform 0.2s;">
                    <div class="stat-info">
                        <h3>JCOs</h3>
                        <div class="value">${this.personnel.filter(p => p.category === "Junior Commissioned Officer (JCO)").length}</div>
                    </div>
                </div>
                <div class="stat-card ${this.currentPersonnelFilter === 'NCOs/Soldiers' ? 'active-filter' : ''}" 
                     onclick="app.setRegistryFilter('currentPersonnelFilter', 'NCOs/Soldiers')" 
                     style="cursor:pointer; transition: transform 0.2s;">
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
                                <th>Rank</th>
                                <th>Trade</th>
                                <th>Name</th>
                                <th>Section</th>
                                <th>Unit/Camp</th>
                                <th>Duty List</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${this.personnel
                .filter(p => {
                    const matchCategory = this.currentPersonnelFilter === 'All' || p.category === this.currentPersonnelFilter;
                    const matchUnit = this.currentUnitFilter === 'All' || (p.unit || '9 SIG BN') === this.currentUnitFilter;
                    const matchRank = this.currentRankFilter === 'All' || p.rank === this.currentRankFilter;
                    const matchDuty = this.currentDutyFilter === 'All' || p.dutyList === this.currentDutyFilter;
                    return matchCategory && matchUnit && matchRank && matchDuty;
                })
                .map(p => `
                                <tr>
                                    <td style="font-family: 'Orbitron', sans-serif; font-size:0.8rem;">${p.id}</td>
                                    <td><span style="color:var(--accent-color); font-weight:500;">${p.rank}</span></td>
                                    <td style="font-size: 0.85rem; color: var(--text-secondary);">${p.profession || 'N/A'}</td>
                                    <td>${p.name}</td>
                                    <td style="font-size: 0.85rem;">${p.section || 'N/A'}</td>
                                    <td style="font-size: 0.85rem; color: var(--accent-color);">${p.unit || '9 SIG BN'}</td>
                                    <td><span class="status-badge ${p.dutyList === 'On' ? 'active' : 'completed'}">${p.dutyList === 'On' ? 'In List' : 'Excluded'}</span></td>
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
