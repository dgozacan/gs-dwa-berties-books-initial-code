const express = require("express");
const router = express.Router();
const { check, validationResult } = require("express-validator");
const bcrypt = require("bcrypt");
const saltRounds = 10;

const db = global.db;   // use the pool from index.js

const redirectLogin = (req, res, next) => {
    if (!req.session.userId) {
        res.redirect("./login"); // redirect to the login page
    } else {
        next(); // move to the next middleware function
    }
};

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

router.post(
    "/registered",
    [
        check("email").isEmail(),
        check("username").isLength({ min: 5, max: 20 }),
        check("password").isLength({ min: 8 }),
        check("first").notEmpty(),
        check("last").notEmpty()
    ],
    (req, res, next) => {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.render("register.ejs");
        }

        const first = req.sanitize(req.body.first);
        const last = req.body.last;
        const username = req.body.username;
        const email = req.body.email;
        const plainPassword = req.body.password;

        bcrypt.hash(plainPassword, saltRounds, (err, hashedPassword) => {
            if (err) return next(err);

            const sql = `
              INSERT INTO users (username, firstname, lastname, email, hashedPassword)
              VALUES (?, ?, ?, ?, ?)
            `;

            const params = [
                username,
                first,
                last,
                email,
                hashedPassword
            ];

            db.query(sql, params, err => {
                if (err) return next(err);

                const msg =
                    "Hello " +
                    first +
                    " " +
                    last +
                    " you are now registered! We will send an email to " +
                    email +
                    "<br>Your password is: " +
                    plainPassword +
                    "<br>Your hashed password is: " +
                    hashedPassword;

                res.send(msg);
            });
        });
    }
);


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

router.get("/logout", redirectLogin, (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.redirect("/users/list");
        }
        res.send("You are now logged out.<br><a href='/users/login'>Login</a>");
    });
});

module.exports = router;
