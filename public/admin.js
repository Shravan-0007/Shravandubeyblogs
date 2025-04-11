document.addEventListener("DOMContentLoaded", () => {
    fetchUnpublishedBlogs();
    fetchPublishedBlogs();
});

// ✅ Save Blog as Draft
document.getElementById("saveDraftBtn").addEventListener("click", async () => {
    const title = document.getElementById("title").value.trim();
    const description = document.getElementById("description").value.trim();
    const content = document.getElementById("content").value.trim();
    const image = document.getElementById("image").value.trim() || "default-image.jpg";

    if (!title || !content) {
        alert("Title and content are required!");
        return;
    }

    const blogData = { title, description, content, image, published: false };

    try {
        const response = await fetch("/save-draft", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(blogData),
        });

        const data = await response.json();
        alert(data.message);
        fetchUnpublishedBlogs();
    } catch (error) {
        console.error("Error saving draft:", error);
    }
});

// ✅ Fetch Unpublished Blogs
async function fetchUnpublishedBlogs() {
    try {
        const response = await fetch("/unpublished-blogs");
        const blogs = await response.json();

        const container = document.getElementById("unpublishedBlogs");
        container.innerHTML = ""; // Clear previous content

        if (blogs.length === 0) {
            container.innerHTML = "<p>No unpublished blogs found.</p>";
            return;
        }

        blogs.forEach(blog => {
            const blogCard = document.createElement("div");
            blogCard.classList.add("blog-item");

            blogCard.innerHTML = `
                <img class="blog-image" src="${blog.image}" alt="Blog Image">
                <h3>${blog.title}</h3>
                <p>${blog.description || "No description available"}</p>
                <button class="publish-btn" onclick="publishBlog('${blog._id}')">Publish</button>
                <button class="delete-btn" onclick="deleteBlog('${blog._id}')">Delete</button>
            `;

            container.appendChild(blogCard);
        });
    } catch (error) {
        console.error("Error fetching unpublished blogs:", error);
    }
}

// ✅ Publish a Blog
async function publishBlog(blogId) {
    try {
        const response = await fetch(`/publish/${blogId}`, { method: "PUT" });
        const data = await response.json();
        alert(data.message);
        fetchUnpublishedBlogs();
        fetchPublishedBlogs();
    } catch (error) {
        console.error("Error publishing blog:", error);
    }
}

// ✅ Delete a Blog
async function deleteBlog(id) {
    if (!confirm("Are you sure you want to delete this blog?")) return;

    try {
        const response = await fetch(`/delete-blog/${id}`, { method: "DELETE" });
        const result = await response.json();

        alert(result.message);
        fetchPublishedBlogs(); // Refresh list
    } catch (error) {
        console.error("Error deleting blog:", error);
    }
}


// ✅ Fetch Published Blogs
async function fetchPublishedBlogs() {
    try {
        const response = await fetch("/api/blogs");
        const blogs = await response.json();

        const publishedBlogsContainer = document.getElementById("publishedBlogs");
        publishedBlogsContainer.innerHTML = ""; // Clear existing content

        blogs.forEach(blog => {
            const blogCard = document.createElement("div");
            blogCard.classList.add("blog-item");

            blogCard.innerHTML = `
                <img src="${blog.image}" class="blog-image">
                <h3>${blog.title}</h3>
                <p>${blog.description}</p>
                <button class="edit-btn" onclick="openEditModal('${blog._id}', '${blog.title}', '${blog.description}', '${blog.content}', '${blog.image}')">Edit</button>
                <button class="delete-btn" onclick="deleteBlog('${blog._id}')">Delete</button>
            `;

            publishedBlogsContainer.appendChild(blogCard);
        });
    } catch (error) {
        console.error("Error fetching published blogs:", error);
    }
}

fetchPublishedBlogs(); // Load blogs on page load

// Edit blogs
function openEditModal(id, title, description, content, image) {
    document.getElementById("editBlogId").value = id;
    document.getElementById("editTitle").value = title;
    document.getElementById("editDescription").value = description;
    document.getElementById("editContent").value = content;
    document.getElementById("editImage").value = image;

    document.getElementById("editModal").style.display = "flex";
}

// Close modal when clicking "X"
document.querySelector(".close-btn").addEventListener("click", () => {
    document.getElementById("editModal").style.display = "none";
});



// Send data to the server
document.getElementById("updateBlogBtn").addEventListener("click", async () => {
    const id = document.getElementById("editBlogId").value;
    const updatedBlog = {
        title: document.getElementById("editTitle").value,
        description: document.getElementById("editDescription").value,
        content: document.getElementById("editContent").value,
        image: document.getElementById("editImage").value
    };

    try {
        const response = await fetch(`/update-blog/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updatedBlog)
        });

        const result = await response.json();
        alert(result.message);

        document.getElementById("editModal").style.display = "none";
        fetchPublishedBlogs(); // Refresh list
    } catch (error) {
        console.error("Error updating blog:", error);
    }
});


fetch('/api/blogs')
  .then(res => res.text())  // Get raw text
  .then(text => {
    try {
      let data = JSON.parse(text);
      console.log(data);
    } catch (e) {
      console.error("Invalid JSON:", text);
    }
  });