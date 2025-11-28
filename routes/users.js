const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const saltRounds = 10;

const db = global.db;   // use the pool from index.js

const redirectLogin = (req, res, next) => {
    if (!req.session.userId) {
        res.redirect('./login') // redirect to the login page
    } else {
        next() // move to the next middleware function
    }
}


router.get("/register", (req, res) => {
  res.render("register.ejs");
});

// GET /users/list — show users without passwords
router.get("/list", redirectLogin, (req, res, next) => {
  const sql = `
    SELECT username, firstname, lastname, email
    FROM users
    ORDER BY username
  `;
  db.query(sql, (err, rows) => {
    if (err) return next(err);

    res.render("users-list.ejs", {
      users: rows,
      shopData: req.app.locals.shopData
    });
  });
});

// simple test route to prove router is mounted
router.get("/test", (req, res) => {
  res.send("users router is working");
});

router.post("/registered", (req, res, next) => {
  const plainPassword = req.body.password;

  bcrypt.hash(plainPassword, saltRounds, (err, hashedPassword) => {
    if (err) return next(err);

    const sql = `
      INSERT INTO users (username, firstname, lastname, email, hashedPassword)
      VALUES (?, ?, ?, ?, ?)
    `;
    const params = [
      req.body.username,
      req.body.first,
      req.body.last,
      req.body.email,
      hashedPassword
    ];

    db.query(sql, params, (err) => {
      if (err) return next(err);

      const msg =
        "Hello " + req.body.first + " " + req.body.last +
        " you are now registered! We will send an email to " + req.body.email +
        "<br>Your password is: " + req.body.password +
        "<br>Your hashed password is: " + hashedPassword;

      res.send(msg);
    });
  });
});

router.get("/login", (req, res) => {
  res.render("login.ejs");
});

router.post("/loggedin", (req, res, next) => {
  const username = req.body.username;
  const password = req.body.password;

  const sql = "SELECT hashedPassword FROM users WHERE username = ?";
  db.query(sql, [username], (err, rows) => {
    if (err) return next(err);

    // no such user
    if (rows.length === 0) {
      return res.send("Login failed: user not found.");
    }

    const hashedPassword = rows[0].hashedPassword;

    // compare the supplied password to the stored hash
    bcrypt.compare(password, hashedPassword, (err, result) => {
      if (err) return next(err);

      if (result === true) {
        req.session.userId = req.body.username;
        res.send("Login successful. Welcome " + username + "!");
      } else {
        res.send("Login failed: incorrect password.");
      }
    });
  });
});


module.exports = router;
