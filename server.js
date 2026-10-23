//Muhammad Shoban
//Test 5 



const express = require("express");
const { MongoClient } = require("mongodb");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

// Check MongoDB connection string
if (!process.env.M_URI) {
    console.error("M_URI not found in environment variables");
    process.exit(1);
}

// MongoDB connection
const client = new MongoClient(process.env.M_URI);
let db;

// Home route
app.get("/", (req, res) => {
    res.send("My API is running!");
});

// Get all courses
app.get("/courses", async (req, res) => {
    try {
        const courses = await db
            .collection("courses")
            .find()
            .sort({ name: 1 })
            .toArray();

        res.status(200).json(courses);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: "Could not read courses from the database"
        });
    }
});

// Count courses
// Keep this route before /courses/:id
app.get("/courses/count", async (req, res) => {
    try {
        const countedCourses = await db
            .collection("courses")
            .countDocuments();

        res.status(200).json({
            count: countedCourses
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: "Could not count courses"
        });
    }
});

// Get one course by your custom ID
app.get("/courses/:id", async (req, res) => {
    try {
        const id = req.params.id;

        const course = await db
            .collection("courses")
            .findOne({course_id:id });

        if (!course) {
            return res.status(404).json({
                error: "Course not found"
            });
        }

        res.status(200).json(course);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: "Could not read course from the database"
        });
    }
});

//Test 5a
// 5a. GET /students/:id/age
app.get("/students/:id/age", async (req, res) => {
    try {
        // 1. Validate student ID
        const id = Number(req.params.id);

        if (!Number.isInteger(id)) {
            return res.status(400).json({
                error: "Student ID must be a whole number"
            });
        }

        // 2. Find student
        const student = await db.collection("students").findOne({
            student_id: id
        });

        // 3. Student not found
        if (!student) {
            return res.status(404).json({
                error: `Student ${id} not found`
            });
        }

        // 4. Return only required fields
        res.status(200).json({
            student_id: student.student_id,
            name: student.name,
            age: student.age
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: "Could not read student age"
        });
    }
});
//5b
app.get("/courses/:id/b-count", async (req, res) => {
    try {
        const id = req.params.id;

        // 1. Check if the course exists
        const course = await db.collection("courses").findOne({
            course_id: id
        });

        if (!course) {
            return res.status(404).json({
                error: `Course ${id} not found`
            });
        }

        // 2. Count enrollments with grade B
        const bGrades = await db.collection("enrollments").countDocuments({
            course_id: id,
            grade: "B"
        });

        // 3. Return the result
        res.status(200).json({
            course_id: id,
            b_grades: bGrades
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: "Could not count B grades"
        });
    }
});
//5c 
app.get("/students/:id/total-credits", async (req, res) => {
    try {
        // 1. Validate student ID
        const studentId = Number(req.params.id);

        if (!Number.isInteger(studentId)) {
            return res.status(400).json({
                error: "Student ID must be a whole number"
            });
        }

        // 2. Find the student
        const student = await db.collection("students").findOne({
            student_id: studentId
        });

        if (!student) {
            return res.status(404).json({
                error: `Student ${studentId} not found`
            });
        }

        // 3. Find all enrollments of this student
        const enrollments = await db.collection("enrollments")
            .find({ student_id: studentId })
            .toArray();

        // 4. Extract course IDs from enrollments
        const courseIds = enrollments.map(e => e.course_id);

        // 5. Find the courses the student is enrolled in
        const courses = await db.collection("courses")
            .find({
                course_id: { $in: courseIds }
            })
            .toArray();

        // 6. Calculate total credits
        let total = 0;

        for (const c of courses) {
            total = total + c.credits;
        }

        // 7. Return the result
        res.status(200).json({
            student_id: studentId,
            name: student.name,
            total_credits: total
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            error: "Could not calculate total credits"
        });
    }
});
// Get students between ages 21 and 23
app.get("/students", async (req, res) => {
    try {
        const students = await db
            .collection("students")
            .find({
                age: {
                    $gte: 21,
                    $lte: 23
                }
            })
            .toArray();

        res.status(200).json(students);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: "Could not read students from the database"
        });
    }
});

// Connect to MongoDB and start server
async function start() {
    await client.connect();

    db = client.db(process.env.DB_NAME);

    console.log("Connected to MongoDB Atlas");

    app.listen(PORT, (error) => {
        if (error) {
            console.error(
                "Could not start the API:",
                error.message
            );
            process.exit(1);
        }

        console.log(`API running at http://localhost:${PORT}`);
    });
}

start().catch((error) => {
    console.error(
        "Could not connect to MongoDB:",
        error.message
    );
    process.exit(1);
});