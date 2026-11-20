const express = require("express");
const cors = require("cors");
const path = require("path");

require("dotenv").config({
    path: path.join(__dirname, ".env")
});

const db = require("./db");

const app = express();


// =====================================
// MIDDLEWARE
// =====================================

app.use(cors());

app.use(express.json());

app.use(express.urlencoded({
    extended: true
}));


// =====================================
// SERVE FRONTEND
// =====================================

app.use(express.static(
    path.join(__dirname, "../frontend")
));


// =====================================
// CUSTOMER ROUTES
// =====================================

app.use(
    "/api/customers",
    require("./routes/customers")
);


// =====================================
// ROOM ROUTES
// =====================================

app.use(
    "/api/rooms",
    require("./routes/rooms")
);


// =====================================
// BOOKING ROUTES
// =====================================

app.use(
    "/api/bookings",
    require("./routes/bookings")
);


// =====================================
// ADMIN AUTHENTICATION ROUTES
// =====================================

app.use(
    "/api/admin",
    require("./routes/adminAuth")
);


// =====================================
// HOME API
// =====================================

app.get("/api", (req, res) => {

    res.json({

        success: true,

        message: "Hotel Booking System API is running!"

    });

});


// =====================================
// DATABASE TEST API
// =====================================

app.get("/api/test-db", (req, res) => {

    db.query("SELECT 1", (err) => {

        if (err) {

            console.error("Database Error:", err);

            return res.status(500).json({

                success: false,

                message: "Database connection failed"

            });

        }

        res.json({

            success: true,

            message: "MySQL Database Connected Successfully!"

        });

    });

});


// =====================================
// API NOT FOUND
// =====================================

app.use("/api", (req, res) => {

    res.status(404).json({

        success: false,

        message: "API endpoint not found!"

    });

});


// =====================================
// GLOBAL ERROR HANDLING
// =====================================

app.use((err, req, res, next) => {

    console.error("Server Error:", err);

    res.status(500).json({

        success: false,

        message: "Internal Server Error"

    });

});


// =====================================
// START SERVER
// =====================================

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {

    console.log("--------------------------------------");

    console.log(" GRAND STAY HOTEL BOOKING SYSTEM ");

    console.log("--------------------------------------");

    console.log(
        `Server running at http://localhost:${PORT}`
    );

    console.log(
        `Database Test: http://localhost:${PORT}/api/test-db`
    );

    console.log(
        `Admin Login: http://localhost:${PORT}/api/admin/login`
    );

    console.log("--------------------------------------");

});