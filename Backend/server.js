const db = require('./db');
const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

/* ================= TEST ================= */
app.get('/', (req, res) => {
  res.send("Server is running properly");
});

/* ================= REGISTER ================= */
app.post('/register', (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).send("All fields required");
  }

  const sql = "INSERT INTO users (name, email, password) VALUES (?, ?, ?)";

  db.query(sql, [name, email, password], (err) => {
    if (err) {
      console.log(err);
      return res.send("Error in registration");
    }

    res.send("User Registered Successfully");
  });
});

/* ================= LOGIN ================= */
app.post('/login', (req, res) => {
  const { email, password } = req.body;

  const sql = "SELECT * FROM users WHERE email=? AND password=?";

  db.query(sql, [email, password], (err, result) => {
    if (err) return res.send("Error in login");

    if (result.length > 0) {
      res.send({
        message: "Login Successful",
        user: result[0]
      });
    } else {
      res.send("Invalid email or password");
    }
  });
});

/* ================= DONATE ================= */
app.post('/donate', (req, res) => {
  const { user_id, amount } = req.body;

  if (!user_id || !amount || amount <= 0) {
    return res.send("Invalid donation");
  }

  const sql = "INSERT INTO donations (user_id, amount) VALUES (?, ?)";

  db.query(sql, [user_id, amount], (err) => {
    if (err) return res.send("Error in donation");

    // AUTO AUDIT LOG
    db.query(
      "INSERT INTO audit_logs (action, user_id) VALUES (?, ?)",
      [`Donated ₹${amount}`, user_id]
    );

    res.send("Donation Successful");
  });
});

/* ================= USER HISTORY ================= */
app.get('/donations/:user_id', (req, res) => {
  const userId = req.params.user_id;

  const sql = "SELECT * FROM donations WHERE user_id=?";

  db.query(sql, [userId], (err, result) => {
    if (err) return res.send("Error fetching donations");
    res.send(result);
  });
});

/* ================= ALLOCATE (ADMIN) ================= */
app.post('/allocate', (req, res) => {
  const { purpose, amount } = req.body;

  if (!purpose || !amount || amount <= 0) {
    return res.send("Invalid allocation");
  }

  const sql = "INSERT INTO allocations (purpose, amount) VALUES (?, ?)";

  db.query(sql, [purpose, amount], (err) => {
    if (err) return res.send("Error in allocation");

    // AUTO AUDIT
    db.query(
      "INSERT INTO audit_logs (action, user_id) VALUES (?, ?)",
      [`Allocated ₹${amount} for ${purpose}`, 1]
    );

    res.send("Fund Allocated Successfully");
  });
});

/* ================= EXPENSE ================= */
app.post('/expense', (req, res) => {
  const { title, amount } = req.body;

  if (!title || !amount || amount <= 0) {
    return res.send("Invalid expense");
  }

  const sql = "INSERT INTO expenses (title, amount) VALUES (?, ?)";

  db.query(sql, [title, amount], (err) => {
    if (err) return res.send("Error adding expense");

    // AUTO AUDIT
    db.query(
      "INSERT INTO audit_logs (action, user_id) VALUES (?, ?)",
      [`Expense ₹${amount} for ${title}`, 1]
    );

    res.send("Expense Added Successfully");
  });
});

/* ================= STATS ================= */
app.get('/stats', (req, res) => {

  const donationsQuery = "SELECT IFNULL(SUM(amount),0) AS total FROM donations";
  const expensesQuery = "SELECT IFNULL(SUM(amount),0) AS total FROM expenses";

  db.query(donationsQuery, (err1, result1) => {
    if (err1) return res.send(err1);

    db.query(expensesQuery, (err2, result2) => {
      if (err2) return res.send(err2);

      const donations = parseFloat(result1[0].total);
      const expenses = parseFloat(result2[0].total);
      const balance = donations - expenses;

      res.send({
        totalDonations: donations,
        totalExpenses: expenses,
        balance: balance
      });
    });
  });
});

/* ================= AUDIT LOGS ================= */
app.get('/audit', (req, res) => {
  const sql = "SELECT * FROM audit_logs ORDER BY id DESC";

  db.query(sql, (err, result) => {
    if (err) return res.send("Error fetching logs");
    res.send(result);
  });
});

/* ================= START ================= */
app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});

/* ALLOCATION HISTORY */
app.get('/allocations', (req, res) => {
  db.query("SELECT * FROM allocations ORDER BY id DESC", (err, result) => {
    if (err) return res.send("Error fetching allocations");
    res.send(result);
  });
});

/* EXPENSE HISTORY */
app.get('/expenses', (req, res) => {
  db.query("SELECT * FROM expenses ORDER BY id DESC", (err, result) => {
    if (err) return res.send("Error fetching expenses");
    res.send(result);
  });
});