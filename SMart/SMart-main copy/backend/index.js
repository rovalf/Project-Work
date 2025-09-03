/**
* index.js
*/

// Set up express, bodyparser and EJS
const express = require('express');
const bodyParser = require("body-parser");
const session = require('express-session');
const cookieParser = require('cookie-parser');
const SQLiteStore = require('connect-sqlite3')(session);
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const indexRoute = require('./routes/indexRoute.js');
const productRoute = require('./routes/product_page.js'); // Include your product routes

const app = express();
const port = 3000;

// Setting up middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs'); // set the app to use ejs for rendering
app.set('views', path.join(__dirname, '../frontend/views'));
app.use(express.static(path.join(__dirname, '../frontend/public'))); // set location of static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads'))); // serve static files from uploads
app.use(cookieParser());

// Set up SQLite
global.db = new sqlite3.Database('./database.db', function(err) {
    if (err) {
        console.error(err);
        process.exit(1); // bail out if we can't connect to the DB
    } else {
        console.log("Database connected");
        global.db.run("PRAGMA foreign_keys=ON"); // tell SQLite to pay attention to foreign key constraints
    }
});

// Use product route
app.use('/product', productRoute); // Include product routes for handling creation and display

// Other routes
app.get("/", (req, res) => {
    // Check authentication
    if (!req.session.isAuthenticated) {
        return res.redirect('/login');
    }

    const { product_name, transaction_type } = req.query;
    let query = "SELECT * FROM product WHERE 1=1";
    const params = [];
    if (product_name) {
        query += " AND product_name LIKE ?";
        params.push(`%${product_name}%`);
    }
    if (transaction_type) {
        query += " AND transaction_type = ?";
        params.push(transaction_type);
    }
    query += " ORDER BY created_at";
    global.db.all(query, params, (err, products) => {
        if (err) {
            return res.status(500).send(err.message);
        } else {
            res.render("index.ejs", {
                product: products,
                user: req.session.user,
                product_name: product_name,
                transaction_type: transaction_type
            });
        }
    });
});


// Display login page
app.get("/login", (req, res) => {
    res.render("login.ejs");
});

// Logout route
app.get("/logout", (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.log(err);
            return res.status(500).send('Failed to logout');
        }
        res.clearCookie('connect.sid'); // Clear the session cookie
        res.redirect('/'); // Redirect to login page after logout
    });
});

//Handle login
app.post("/login", (req, res) => {
    const { email, password } = req.body; // Use 'email' instead of 'name'

    const query = "SELECT * FROM users WHERE email = ? AND password = ?"; // Updated query

    console.log('Executing query:', query, 'with parameters:', [email, password]);

    global.db.get(query, [email, password], function (err, user) {
        if (err) {
            console.error('Error executing query:', err);
            return res.status(500).send(err.message);
        }
        if (user) {
            req.session.user = user;
            req.session.isAuthenticated = true;
            res.redirect('/');
        } else {
            res.render('login.ejs', { error: 'Incorrect email or password.' }); // Updated error message
        }
    });
});

// Display Register page
app.get("/register", (req, res) => {
    const query = "SELECT course_name FROM courses";
    
    global.db.all(query, [], (err, rows) => {
        // Define courses as empty array if there's an error
        const courses = err ? [] : rows;

        if (err) {
            return res.status(500).send(err.message);
        }

        res.render("register.ejs", { courses, error: null });
    });
});

// Handle registration
app.post("/register", async (req, res) => {
    const { name, password, email, course, description } = req.body;
    const emailDomain = '@mymail.sim.edu.sg';

    // Query for courses to include in the view
    const query = "SELECT course_name FROM courses";
    const courses = await new Promise((resolve, reject) => {
        global.db.all(query, [], (err, rows) => err ? reject(err) : resolve(rows));
    });

    // Back end email validation
    if (!email.endsWith(emailDomain)) {
        return res.render("register.ejs", { courses, error: `Please use a SIM email address with ${emailDomain}` });
    }

    // Check if all fields are provided
    if (!name || !password || !email || !course || !description) {
        return res.render("register.ejs", { courses, error: 'All fields are required.' });
    }

    try {
        // Check if email already exists
        const checkEmailQuery = "SELECT * FROM users WHERE email = ?";
        const row = await new Promise((resolve, reject) => {
            global.db.get(checkEmailQuery, [email], (err, row) => err ? reject(err) : resolve(row));
        });

        if (row) {
            return res.render("register.ejs", { courses, error: 'Email is already in use.' });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert new user into the database
        const Userquery = "INSERT INTO users (name, password, email, course, description, rating) VALUES (?, ?, ?, ?, ?, 0)";
        await new Promise((resolve, reject) => {
            global.db.run(Userquery, [name, hashedPassword, email, course, description], function (err) {
                if (err) reject(err);
                else resolve();
            });
        });

        res.redirect('/login');
    } catch (error) {
        res.status(500).send(error.message);
    }
});

app.use('/', indexRoute);

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});

app.use((req, res, next) => {
    req.session.isAuthenticated = true; // Set to true for all requests
    next();
});

//JORDAN's EDIT
// const express = require("express");
// const app = express();
// const path = require("path");
// const bodyParser = require("body-parser");
// const indexRoute = require("./routes/indexRoute");

// // Set up the middleware
// app.use(bodyParser.urlencoded({ extended: false }));
// app.use(bodyParser.json());
// app.use(express.static(path.join(__dirname, "public")));

// // Set the view engine
// app.set("view engine", "ejs");
// app.set("views", path.join(__dirname, "views"));

// // Use the router
// app.use("/", indexRoute);

// // Start the server
// const PORT = process.env.PORT || 3000;
// app.listen(PORT, () => {
//     console.log(`Server is running on http://localhost:${PORT}`);
// });
