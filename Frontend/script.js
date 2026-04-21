const BASE_URL = "http://localhost:3000";

/* ================= REGISTER ================= */
function register() {
  const name = regName.value;
  const email = regEmail.value;
  const password = regPassword.value;

  if (!name || !email || !password) {
    alert("All fields are required");
    return;
  }

  fetch(`${BASE_URL}/register`, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({ name, email, password })
  })
  .then(res => res.text())
  .then(data => {
    if (data.includes("Successfully")) {
      alert("Registration Successful");
      window.location.href = "login.html";
    } else {
      alert(data);
    }
  })
  .catch(() => alert("Server error"));
}

/* ================= LOGIN ================= */
function login() {
  const email = loginEmail.value;
  const password = loginPassword.value;
  const selectedRole = loginRole ? loginRole.value : null;

  if (!email || !password) {
    alert("Enter email and password");
    return;
  }

  fetch(`${BASE_URL}/login`, {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify({ email, password })
  })
  .then(res => res.json())
  .then(data => {

    if (!data.user) {
      alert("Invalid credentials");
      return;
    }

    const actualRole = data.user.role?.toLowerCase();

    if (selectedRole && actualRole !== selectedRole.toLowerCase()) {
      alert("Wrong role selected");
      return;
    }

    localStorage.setItem("user", JSON.stringify(data.user));

    if (actualRole === "admin") {
      window.location.href = "admin.html";
    } else {
      window.location.href = "dashboard.html";
    }
  })
  .catch(() => alert("Login failed"));
}

/* ================= LOGOUT ================= */
function logout() {
  localStorage.removeItem("user");
  window.location.href = "index.html";
}

/* ================= AUTH CHECK ================= */
function checkLogin() {
  if (!localStorage.getItem("user")) {
    window.location.href = "login.html";
  }
}

/* ================= ROLE CONTROL ================= */
function restrictUser() {
  const user = JSON.parse(localStorage.getItem("user"));
  if (user.role !== "user") {
    window.location.href = "admin.html";
  }
}

function restrictAdmin() {
  const user = JSON.parse(localStorage.getItem("user"));
  if (user.role !== "admin") {
    window.location.href = "dashboard.html";
  }
}

/* ================= LOAD USER ================= */
function loadUser() {
  const user = JSON.parse(localStorage.getItem("user"));
  const el = document.getElementById("profileName");
  if (el) el.innerText = user.name;
}

/* ================= DONATE ================= */
function donate() {
  const user = JSON.parse(localStorage.getItem("user"));
  const amt = amount.value;

  if (!amt || amt <= 0) {
    alert("Enter valid amount");
    return;
  }

  fetch(`${BASE_URL}/donate`, {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify({
      user_id: user.id,
      amount: amt
    })
  })
  .then(res => res.text())
  .then(() => {
    amount.value = "";
    getHistory();
    loadAuditLogs();
  });
}

/* ================= USER HISTORY ================= */
function getHistory() {
  const user = JSON.parse(localStorage.getItem("user"));

  fetch(`${BASE_URL}/donations/${user.id}`)
    .then(res => res.json())
    .then(data => {
      const list = document.getElementById("history");
      if (!list) return;

      list.innerHTML = "";

      data.forEach(d => {
        const li = document.createElement("li");
        li.innerText = `₹${d.amount}`;
        list.appendChild(li);
      });
    });
}

/* ================= STATS ================= */
function loadStats() {
  fetch(`${BASE_URL}/stats`)
    .then(res => res.json())
    .then(data => {

      if (document.getElementById("totalDonations"))
        totalDonations.innerText = "₹" + data.totalDonations.toFixed(2);

      if (document.getElementById("totalExpenses"))
        totalExpenses.innerText = "₹" + data.totalExpenses.toFixed(2);

      if (document.getElementById("balance"))
        balance.innerText = "₹" + data.balance.toFixed(2);
    });
}

/* ================= ALLOCATE ================= */
function allocate() {
  const purpose = purposeAlloc.value;
  const amt = amountAlloc.value;

  if (!purpose || !amt || amt <= 0) {
    alert("Enter valid allocation details");
    return;
  }

  fetch(`${BASE_URL}/allocate`, {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify({ purpose, amount: amt })
  })
  .then(res => res.text())
  .then(() => {
    purposeAlloc.value = "";
    amountAlloc.value = "";
    loadStats();
    loadAuditLogs();
    loadAllocations();
  });
}

/* ================= EXPENSE ================= */
function addExpense() {
  const title = expenseTitle.value;
  const amt = expenseAmount.value;

  if (!title || !amt || amt <= 0) {
    alert("Enter valid expense");
    return;
  }

  fetch(`${BASE_URL}/expense`, {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify({ title, amount: amt })
  })
  .then(res => res.text())
  .then(() => {
    expenseTitle.value = "";
    expenseAmount.value = "";
    loadStats();
    loadAuditLogs();
    loadExpenses();
  });
}

/* ================= AUDIT LOGS ================= */
function loadAuditLogs() {
  fetch(`${BASE_URL}/audit`)
    .then(res => res.json())
    .then(data => {

      const list = document.getElementById("auditList");
      if (!list) return;

      list.innerHTML = "";

      data.forEach(log => {
        const li = document.createElement("li");

        const date = new Date(log.date || Date.now())
          .toLocaleString();

        li.innerText = `${log.action} (${date})`;

        list.appendChild(li);
      });
    });
}

/* ================= ALLOCATION HISTORY ================= */
function loadAllocations() {
  fetch(`${BASE_URL}/allocations`)
    .then(res => res.json())
    .then(data => {

      const list = document.getElementById("allocationList");
      if (!list) return;

      list.innerHTML = "";

      data.forEach(a => {
        const li = document.createElement("li");
        li.innerText = `₹${a.amount} → ${a.purpose}`;
        list.appendChild(li);
      });
    });
}

/* ================= EXPENSE HISTORY ================= */
function loadExpenses() {
  fetch(`${BASE_URL}/expenses`)
    .then(res => res.json())
    .then(data => {

      const list = document.getElementById("expenseList");
      if (!list) return;

      list.innerHTML = "";

      data.forEach(e => {
        const li = document.createElement("li");
        li.innerText = `₹${e.amount} → ${e.title}`;
        list.appendChild(li);
      });
    });
}