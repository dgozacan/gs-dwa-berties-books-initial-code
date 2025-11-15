// Create a new router
const express = require("express")
const router = express.Router()

router.get('/search',function(req, res, next){
    res.render("search.ejs")
});

router.get('/search-result', function (req, res, next) {
    //searching in the database
    res.send("You searched for: " + req.query.keyword)
});

router.get('/list', function(req, res, next) {
    let sqlquery = "SELECT * FROM books"; // query database to get all the books

    db.query(sqlquery, (err, result) => {
        if (err) {
            return next(err);
        }
        res.render('list.ejs', { availableBooks: result });
    });
});

// Show the "add book" form
router.get('/addbook', function(req, res, next) {
    res.render('addbook.ejs');
});

// Handle form submission to add a book
router.post('/bookadded', function(req, res, next) {
    let sqlquery = "INSERT INTO books (name, price) VALUES (?, ?)";

    let newrecord = [req.body.name, req.body.price];

    db.query(sqlquery, newrecord, (err, result) => {
        if (err) {
            return next(err);
        }
        res.send('This book is added to database, name: ' +
                 req.body.name + ' price ' + req.body.price);
    });
});

// List books under £20 (bargain books)
router.get('/bargainbooks', function(req, res, next) {
    let sqlquery = "SELECT * FROM books WHERE price < 20";

    db.query(sqlquery, (err, result) => {
        if (err) {
            return next(err);
        }
        res.render('bargainbooks.ejs', { bargainBooks: result });
    });
});


// Export the router object so index.js can access it
module.exports = router
