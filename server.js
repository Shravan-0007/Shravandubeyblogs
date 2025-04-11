require("dotenv").config();
const express = require("express");
const nodemailer = require("nodemailer");
const cors = require("cors");
const mongoose = require("mongoose");
const path = require("path");
const crypto = require('crypto');
const session = require("express-session");
const bcrypt = require("bcrypt");
const jwt = require('jsonwebtoken');
const bodyParser = require("body-parser");

const app = express();
const PORT = 5500;

// ✅ Middleware
app.use(express.json());
app.use(cors());
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Serve Static Files
app.use(express.static(path.join(__dirname, "frontend/pages"))); // HTML files
app.use(express.static(path.join(__dirname, "public"))); // CSS, JS, images

// ✅ Session Configuration
app.use(
    session({
        secret: "your-secret-key", // Change this for security
        resave: false,
        saveUninitialized: true,
    })
);

// ✅ MongoDB Connection
mongoose.connect("mongodb://127.0.0.1:27017/blogDB", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => console.log("✅ MongoDB connected"))
    .catch(err => console.log("❌ MongoDB connection error:", err));

// ✅ Secure Admin Credentials
const adminUser = {
    username: "admin",
    password: "$2b$10$kYt4ORgW7ZGJu57u6kG.Fu7wjDflVct0BNlPuT./XvI/RuRSqdUvi" // Hashed password
};


// Configure Email Transporter (Use your Gmail/SMTP credentials)
const transporter = nodemailer.createTransport({
    service: 'shravandubey321azm@gmail.com',
    auth: {
        user: process.env.EMAIL, // Your Email
        pass: process.env.EMAIL_PASSWORD, // Your App Password
    },
});


// **Reset Password: Generate Token & Send Email**
app.post('/forgot-password', async (req, res) => {
    const { email } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: "User not found" });

        // Generate token
        const resetToken = crypto.randomBytes(32).toString("hex");
        user.resetToken = resetToken;
        user.resetTokenExpiry = Date.now() + 3600000; // 1 hour expiry
        await user.save();

        // Send reset link via email
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        const resetLink = `http://localhost:3000/reset-password.html?token=${resetToken}`;

        await transporter.sendMail({
            to: user.email,
            subject: "Password Reset Request",
            html: `<p>Click <a href="${resetLink}">here</a> to reset your password.</p>`,
        });

        res.json({ message: "Password reset link sent to your email." });
    } catch (error) {
        console.error("Forgot password error:", error);
        res.status(500).json({ message: "Server error" });
    }
}); 

// **Reset Password: Update Password**
app.post('/reset-password', async (req, res) => {
    const { token, newPassword } = req.body;

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);

        if (!user || user.resetToken !== token || user.resetTokenExpiry < Date.now()) {
            return res.status(400).json({ message: 'Invalid or expired token' });
        }

        // Hash new password and update user record
        user.password = await bcrypt.hash(newPassword, 10);
        user.resetToken = null;
        user.resetTokenExpiry = null;
        await user.save();

        res.json({ message: 'Password reset successful. Redirecting to login...' });
    } catch (error) {
        res.status(400).json({ message: 'Invalid token' });
    }
});

// ✅ Define Mongoose Models
const Subscriber = mongoose.model("Subscriber", new mongoose.Schema({ email: String }));

const blogSchema = new mongoose.Schema({
    title: String,
    description: String,
    content: String,
    image: String,
    published: Boolean,
    views: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
});
const Blog = mongoose.model("Blog", blogSchema);

// comment schema
const commentSchema = new mongoose.Schema({
    blogId: { type: String, required: true },
    name: String,
    text: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
  });
  const Comment = mongoose.model('Comment', commentSchema);

  // Get comments for a blog
app.get('/api/comments/:blogId', async (req, res) => {
    try {
      const comments = await Comment.find({ blogId: req.params.blogId }).sort({ timestamp: -1 });
      res.json(comments);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch comments' });
    }
  });
  
  // Post a new comment
  app.post('/api/comments', async (req, res) => {
    try {
      const { blogId, name, text } = req.body;
      const comment = new Comment({ blogId, name, text });
      const saved = await comment.save();
      res.json(saved);
    } catch (err) {
      res.status(400).json({ error: 'Failed to save comment' });
    }
  });

// ✅ Routes for Static Pages
app.get("/", (req, res) => res.sendFile(path.join(__dirname, "frontend/pages/index.html")));
app.get("/about", (req, res) => res.sendFile(path.join(__dirname, "frontend/pages/about.html")));
app.get("/blogs", (req, res) => res.sendFile(path.join(__dirname, "frontend/pages/blogs.html")));
app.get("/blog-details", (req, res) => res.sendFile(path.join(__dirname, "frontend/pages/blog-details.html")));
app.get("/contact", (req, res) => res.sendFile(path.join(__dirname, "frontend/pages/contact.html")));
app.get("/login", (req, res) => res.sendFile(path.join(__dirname, "frontend/pages/login.html")));
app.get('/reset-password', (req, res) => res.sendFile(path.join(__dirname, "frontend/pages/reset-password.html")));

// ✅ Admin Authentication Routes
app.post("/login", async (req, res) => {
    const { username, password } = req.body;
    if (username === adminUser.username) {
        const isMatch = await bcrypt.compare(password, adminUser.password);
        if (isMatch) {
            req.session.admin = true;
            return res.json({ success: true, message: "Login successful" });
        }
    }
    res.status(401).json({ success: false, message: "Invalid credentials" });
});

app.get("/logout", (req, res) => {
    req.session.destroy(() => {
        res.redirect("/login.html");
    });
});

// ✅ Protect Admin Page
app.get("/admin", (req, res) => {
    if (!req.session.admin) return res.redirect("/login.html");
    res.sendFile(path.join(__dirname, "frontend/pages/admin.html"));
});

// ✅ Blog Management Routes
app.post("/add-blog", async (req, res) => {
    try {
        const { title, description, content, image, published } = req.body;
        
        if (!title || !content) {
            return res.json({ success: false, message: "Title and content are required!" });
        }

        const newBlog = new Blog({
            title,
            description,
            content,
            image,
            published // Will be false if saving as draft
        });

        await newBlog.save();
        res.json({ success: true, message: published ? "Blog published successfully!" : "Blog saved as draft." });
    } catch (error) {
        console.error("Error adding blog:", error);
        res.json({ success: false, message: "Failed to add blog." });
    }
});

// ✅ Save Blog as Draft
app.post("/save-draft", async (req, res) => {
    try {
        const newBlog = new Blog({ ...req.body, published: false });
        await newBlog.save();
        res.json({ message: "Blog saved as draft!" });
    } catch (error) {
        res.status(500).json({ error: "Failed to save blog." });
    }
});


// ✅ Publish a Blog
app.put("/publish/:id", async (req, res) => {
    try {
        await Blog.findByIdAndUpdate(req.params.id, { published: true });
        res.json({ message: "Blog published successfully!" });
    } catch (error) {
        res.status(500).json({ error: "Failed to publish blog." });
    }
});


// ✅ Get Unpublished Blogs
app.get("/unpublished-blogs", async (req, res) => {
    const blogs = await Blog.find({ published: false });
    res.json(blogs);
});

// ✅ Get Published Blogs
app.get("/published-blogs", async (req, res) => {
    const blogs = await Blog.find({ published: true });
    res.json(blogs);
});

// ✅ Delete a Blog
app.delete("/delete-blog/:id", async (req, res) => {
    try {
        const deletedBlog = await Blog.findByIdAndDelete(req.params.id);

        if (!deletedBlog) return res.status(404).json({ message: "Blog not found" });

        res.json({ success: true, message: "Blog deleted successfully!" });
    } catch (error) {
        res.status(500).json({ message: "Error deleting blog", error });
    }
});

// ✅ Most watched blog
app.get("/api/most-viewed-blogs", async (req, res) => {
    try {
        const blogs = await Blog.find().sort({ views: -1 }).limit(4); // Sort by most views
        res.json(blogs);
    } catch (error) {
        res.status(500).json({ error: "Error fetching blogs" });
    }
});




// ✅ update a Blog
app.put("/update-blog/:id", async (req, res) => {
    try {
        const { title, description, content, image } = req.body;
        const updatedBlog = await Blog.findByIdAndUpdate(
            req.params.id,
            { title, description, content, image },
            { new: true }
        );

        if (!updatedBlog) return res.status(404).json({ message: "Blog not found" });

        res.json({ success: true, message: "Blog updated successfully!", updatedBlog });
    } catch (error) {
        res.status(500).json({ message: "Error updating blog", error });
    }
});



app.get("/all-blogs", async (req, res) => {
    try {
        const blogs = await Blog.find(); // Fetch all blogs from MongoDB
        res.json(blogs);
    } catch (error) {
        res.status(500).json({ message: "Error fetching blogs", error });
    }
});

// ✅ Fetch Latest 3 Published Blogs
app.get("/latest-blogs", async (req, res) => {
    try {
        const latestBlogs = await Blog.find({ published: true }).sort({ createdAt: -1 }).limit(3);
        res.json(latestBlogs);
    } catch (error) {
        res.status(500).json({ error: "Error fetching latest blogs" });
    }
});

// ✅ Fetch All Published Blogs
app.get("/api/blogs", async (req, res) => {
    try {
        const blogs = await Blog.find({ published: true }).sort({ createdAt: -1 });
        res.json(blogs);
    } catch (error) {
        res.status(500).json({ message: "Error fetching blogs", error });
    }
});

// ✅ Fetch Blog Details
app.get("/blog/:id", async (req, res) => {
    try {
        let blog = await Blog.findById(req.params.id);
        if (!blog) return res.status(404).json({ error: "Blog not found" });

        blog.views += 1;
        await blog.save();
        res.json(blog);
    } catch (error) {
        res.status(500).json({ error: "Error fetching blog" });
    }
});

// ✅ Subscriber System
app.post("/subscribe", async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ message: "Email is required" });
    }

    try {
        const existingSubscriber = await Subscriber.findOne({ email });
        if (existingSubscriber) {
            return res.json({ message: "Already subscribed!" });
        }

        await new Subscriber({ email }).save();
        res.json({ message: "Subscription successful!" });
    } catch (err) {
        res.status(500).json({ message: "Server error!" });
    }
});

// ✅ Email Notification System
async function sendEmailNotification(blogTitle, blogContent) {
    const subscribers = await Subscriber.find({});
    const emails = subscribers.map(sub => sub.email);

    if (emails.length === 0) return;

    let transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.EMAIL,
            pass: process.env.PASSWORD,
        },
    });

    let mailOptions = {
        from: process.env.EMAIL,
        to: emails.join(","),
        subject: `New Blog Published: ${blogTitle}`,
        text: `Check out our latest blog:\n\n${blogTitle}\n\n${blogContent.substring(0, 100)}...\n\nRead more on our website!`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) console.error("Error sending email:", error);
        else console.log("✅ Email sent: " + info.response);
    });
}

// ✅ Start Server
app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
});
