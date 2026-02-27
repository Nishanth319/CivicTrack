const API = "http://127.0.0.1:8000";
let currentUser = null;

// --- AUTHENTICATION ---
function toggleAuth(view) {
  if (view === 'login') {
    document.getElementById('loginForm').classList.remove('hidden');
    document.getElementById('registerForm').classList.add('hidden');
  } else {
    document.getElementById('loginForm').classList.add('hidden');
    document.getElementById('registerForm').classList.remove('hidden');
  }
}

function register() {
  const name = document.getElementById("r_name").value;
  const email = document.getElementById("r_email").value;

  fetch(`${API}/users/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email })
  })
    .then(async res => {
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || "Error creating account");
      }
      return res.json();
    })
    .then(data => {
      alert("Account created!");
      loginSuccess(name, email);
    })
    .catch(err => alert(err.message === "Failed to fetch" ? "Backend not running" : err.message));
}

function login() {
  const email = document.getElementById("l_email").value;
  if (!email) {
    alert("Enter an email");
    return;
  }
  // Simply assuming email suffix is the name for this demo
  const name = email.split("@")[0];
  loginSuccess(name, email);
}

function loginSuccess(name, email) {
  currentUser = { name, email };

  // Transition to Dashboard
  document.getElementById("authView").classList.add("hidden");
  document.getElementById("dashboardView").classList.remove("hidden");

  // Update UI Elements
  document.getElementById("userNameDisplay").innerText = name;
  document.getElementById("headerName").innerText = name;
  document.getElementById("avatarText").innerText = name.charAt(0).toUpperCase();

  // Load Initial Data
  switchTab("dashboard");
  fetchComplaints();
}

function toggleProfileMenu() {
  const menu = document.getElementById("profileMenu");
  menu.classList.toggle("hidden");
}

function showSettings(section) {
  // Hide menu
  document.getElementById("profileMenu").classList.add("hidden");

  // Show settings tab
  switchTab("settings");

  // Pre-fill profile if opening edit
  if (section === 'editProfile' && currentUser) {
    document.getElementById("s_name").value = currentUser.name;
    document.getElementById("s_email").value = currentUser.email;
  }
}

function saveSettings() {
  const newName = document.getElementById("s_name").value;
  const newEmail = document.getElementById("s_email").value;

  if (newName && newEmail) {
    currentUser.name = newName;
    currentUser.email = newEmail;

    // Update labels globally
    document.getElementById("userNameDisplay").innerText = newName;
    document.getElementById("headerName").innerText = newName;
    document.getElementById("avatarText").innerText = newName.charAt(0).toUpperCase();

    alert("Profile saved successfully!");
  }
}

// Close menu if clicking outside
document.addEventListener('click', function (event) {
  const profileMenu = document.getElementById('profileMenu');
  const userProfile = document.querySelector('.user-profile');

  if (profileMenu && !profileMenu.classList.contains('hidden')) {
    if (!profileMenu.contains(event.target) && !userProfile.contains(event.target)) {
      profileMenu.classList.add('hidden');
    }
  }
});

function logout() {
  currentUser = null;
  document.getElementById("dashboardView").classList.add("hidden");
  document.getElementById("authView").classList.remove("hidden");
  document.getElementById("l_email").value = "";
}

// --- NAVIGATION ---
function switchTab(tabId) {
  // Hide all tabs
  document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
  document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active-tab'));

  // Deactivate all nav items
  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));

  // Show selected tab
  document.getElementById(`tab-${tabId}`).classList.remove('hidden');
  document.getElementById(`tab-${tabId}`).classList.add('active-tab');

  // Highlight selected nav
  document.getElementById(`nav-${tabId}`).classList.add('active');
}

// --- DATA FETCHING ---
function fetchComplaints() {
  fetch(`${API}/complaints/`)
    .then(res => res.json())
    .then(data => {
      // Filter for this user
      const userComplaints = data.filter(c => c.user_email === currentUser.email);
      updateDashboard(userComplaints);
    })
    .catch(() => {
      console.error("Could not load complaints");
    });
}

function updateDashboard(complaints) {
  const recentList = document.getElementById("recentComplaintsList");
  const fullList = document.getElementById("fullComplaintsList");

  // Update Stats
  const total = complaints.length;
  // For demo: treat 'Open' as Pending. 
  const pending = complaints.filter(c => c.status === "Open" || c.status === "Pending").length;
  const active = complaints.filter(c => c.status === "In Progress" || c.status === "Active").length;
  const resolved = complaints.filter(c => c.status === "Resolved" || c.status === "Closed").length;

  document.getElementById("statTotal").innerText = total;
  document.getElementById("statPending").innerText = pending;
  document.getElementById("statActive").innerText = active;
  document.getElementById("statResolved").innerText = resolved;

  // Clear Lists
  recentList.innerHTML = "";
  fullList.innerHTML = "";

  if (total === 0) {
    const emptyMsg = `<div style="color:#8b949e;">No complaints filed yet. Head to 'New Complaint' to report an issue.</div>`;
    recentList.innerHTML = emptyMsg;
    fullList.innerHTML = emptyMsg;
    return;
  }

  // Populate Lists
  complaints.reverse().forEach((c, index) => {

    // Status Logic
    let badgeClass = "badge-pending";
    let statusText = "Pending ⏳";

    const s = c.status.toLowerCase();
    if (s === "resolved") { badgeClass = "badge-resolved"; statusText = "Resolved ✅"; }
    else if (s === "closed") { badgeClass = "badge-rejected"; statusText = "Closed ❌"; }
    else if (s === "active" || s === "in progress") { badgeClass = "badge-active"; statusText = "Active 🔧"; }
    else { badgeClass = "badge-pending"; statusText = "Pending ⏳"; } // Default Open

    const rowHTML = `
      <div class="complaint-row">
        <div class="complaint-info">
          <h4>${c.title}</h4>
          <p>${c.category} • ${c.description || "No description provided"}</p>
        </div>
        <div class="status-badge ${badgeClass}">${statusText}</div>
      </div>
    `;

    fullList.innerHTML += rowHTML;

    // Only show top 3 in "Recent"
    if (index < 3) {
      recentList.innerHTML += rowHTML;
    }
  });
}

// --- SUBMIT COMPLAINT ---
function submitComplaint() {
  const category = document.getElementById("c_category").value;
  const place = document.getElementById("c_place").value;
  const desc = document.getElementById("c_desc").value;

  if (!place || !desc) {
    alert("Please fill in the location and description.");
    return;
  }

  // Create complaint on backend
  fetch(`${API}/complaints/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: `${category} Issue at ${place}`,
      description: desc,
      category: category,
      user_email: currentUser.email
    })
  })
    .then(() => {
      // Show inline success message
      const successMsg = document.getElementById("successMessage");
      successMsg.classList.remove("hidden");

      // Clear inputs
      document.getElementById("c_place").value = "";
      document.getElementById("c_desc").value = "";

      // Wait a few seconds before returning to dashboard
      setTimeout(() => {
        successMsg.classList.add("hidden");
        fetchComplaints(); // refresh the list and stats
        switchTab("dashboard");
      }, 2500);
    })
    .catch(err => alert("Error saving complaint. Ensure backend is running via port 8000."));
}