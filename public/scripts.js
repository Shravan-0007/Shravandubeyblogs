document.addEventListener("DOMContentLoaded", () => {
    const menuToggle = document.getElementById("mobile-menu");
    const navList = document.querySelector(".nav-list");
    const menuBlur = document.createElement("div"); // Background blur
    menuBlur.classList.add("menu-blur");
    document.body.appendChild(menuBlur);
    const searchInput = document.getElementById("searchInput");
    const suggestionsDiv = document.getElementById("suggestions");
    const resultDiv = document.getElementById("result");
    let blogPosts = []; // Store fetched blog posts

    menuToggle.addEventListener("click", function () {
        this.classList.toggle("active");
        navList.classList.toggle("active");
        menuBlur.classList.toggle("active");
    });
    
        // Close menu when clicking outside
        menuBlur.addEventListener("click", function () {
            menuToggle.classList.remove("active");
            navList.classList.remove("active");
            this.classList.remove("active");
        });
    

    fetchLatestBlogs();
    fetchAllBlogs(); // Fetch all blogs for search functionality

    // ✅ Fetch Latest Blogs
    async function fetchLatestBlogs() {
        try {
            let response = await fetch("/latest-blogs");
            let blogs = await response.json();
            let blogContainer = document.querySelector(".blog-container");

            if (!blogContainer) {
                console.error("Error: .blog-container not found.");
                return;
            }

            blogContainer.innerHTML = ""; // Clear previous content

            if (blogs.length === 0) {
                blogContainer.innerHTML = "<p>No blogs available yet. Stay tuned!</p>";
                return;
            }

            blogs.forEach(blog => {
                let blogDiv = document.createElement("div");
                blogDiv.classList.add("blog-post");
                blogDiv.innerHTML = `
                    <h3>${blog.title}</h3>
                    <p>${blog.description || "Read more..."}</p>
                `;

                blogDiv.onclick = () => {
                    window.location.href = `blog-details.html?id=${blog._id}`;
                };

                blogContainer.appendChild(blogDiv);
            });
        } catch (error) {
            console.error("Error fetching latest blogs:", error);
            document.querySelector(".blog-container").innerHTML = "<p>Error loading blogs.</p>";
        }
    }

    // ✅ Fetch All Blogs for Search
    async function fetchAllBlogs() {
        try {
            let response = await fetch("/all-blogs"); // Ensure this route exists in `server.js`
            blogPosts = await response.json();
        } catch (error) {
            console.error("Error fetching blog posts for search:", error);
        }
    }

    // ✅ Show suggestions while typing
    searchInput.addEventListener("input", () => {
        const query = searchInput.value.toLowerCase();
        suggestionsDiv.innerHTML = "";

        if (query.length > 0) {
            const filteredSuggestions = blogPosts.filter(post =>
                post.title.toLowerCase().includes(query)
            );

            if (filteredSuggestions.length === 0) {
                suggestionsDiv.innerHTML = "<p>No results found</p>";
                return;
            }

            filteredSuggestions.forEach(post => {
                const div = document.createElement("div");
                div.textContent = post.title;
                div.classList.add("suggestion-item");
                div.onclick = () => {
                    searchInput.value = post.title;
                    suggestionsDiv.innerHTML = "";
                    openBlog(post._id);
                };
                suggestionsDiv.appendChild(div);
            });
        }
    });

    // ✅ Perform search when pressing Enter
    searchInput.addEventListener("keypress", (event) => {
        if (event.key === "Enter") {
            searchPosts();
        }
    });

    // ✅ Search for Blog Posts
    function searchPosts() {
        const query = searchInput.value.toLowerCase();
        const matchedResults = blogPosts.filter(post =>
            post.title.toLowerCase().includes(query)
        );

        resultDiv.innerHTML =
            matchedResults.length > 0
                ? matchedResults.map(post => `<p onclick="openBlog('${post._id}')" class="search-result">${post.title}</p>`).join("")
                : "<p>No results found</p>";

        resultDiv.style.display = "block";
    }

    // ✅ Open the selected blog
    function openBlog(blogId) {
        if (blogId) {
            window.location.href = `blog-details.html?id=${blogId}`;
        } else {
            console.error("Invalid blog ID");
        }
    }

    // ✅ If on `blog-details.html`, Load Blog Content from URL Parameter
    function loadBlogFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        const blogId = urlParams.get("id");

        if (blogId) {
            fetch(`/blog/${blogId}`)
                .then(response => response.json())
                .then(blog => {
                    const blogDetailsContainer = document.getElementById("blogDetails");
                    if (blogDetailsContainer) {
                        blogDetailsContainer.innerHTML = `
                            <h2>${blog.title}</h2>
                            <p>${blog.content}</p>
                        `;
                    }
                })
                .catch(error => console.error("Error loading blog:", error));
        }
    }

    // Run this function if on `blog-details.html`
    if (window.location.pathname.includes("blog-details.html")) {
        loadBlogFromURL();
    }

    // ✅ Subscription Box (Email Notifications)
    document.querySelector(".subscription-box button").addEventListener("click", () => {
        const email = document.querySelector(".subscription-box input").value;

        if (!email) {
            alert("Please enter a valid email!");
            return;
        }

        fetch("/subscribe", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email })
        })
        .then(response => response.json())
        .then(data => alert(data.message))
        .catch(error => console.error("Error:", error));
    });
});

//✅ Get most watched blog for the main page
document.addEventListener("DOMContentLoaded", function () {
    fetch("/api/most-viewed-blogs")
        .then(response => response.json())
        .then(blogs => {
            const container = document.getElementById("mostViewedBlogs");
            container.innerHTML = ""; // Clear existing content

            blogs.forEach((blog, index) => {
                // Alternating layout for images left and right
                const isLeft = index % 2 === 0;

                const blogHTML = `
                    <div class="blog-card ${isLeft ? "left-image" : "right-image"}" data-id="${blog._id}">
                        <img src="${blog.image}" alt="Blog Image">
                        <div class="blog-content">
                            <h3>${blog.title}</h3>
                            <p>${blog.description.substring(0, 70)}...</p>
                            <a href="blog-details.html?id=${blog._id}" class="read-more-btn">Read More</a>
                        </div>
                    </div>
                `;
                container.innerHTML += blogHTML;
            });

            // Add click event to open blog details
            document.querySelectorAll(".blog-card").forEach(card => {
                card.addEventListener("click", function () {
                    const blogId = this.getAttribute("data-id");
                    if (blogId) {
                        window.location.href = `blog-details.html?id=${blogId}`;
                    }
                });
            });
        })
        .catch(error => console.error("Error fetching most viewed blogs:", error));
});

// For comment
document.addEventListener('DOMContentLoaded', () => {
    const commentForm = document.getElementById('comment-form');
    const commentsContainer = document.getElementById('comments-container');
  
    const blogId = new URLSearchParams(window.location.search).get('id');
  
    // Fetch comments
    fetch(`/api/comments/${blogId}`)
      .then(res => res.json())
      .then(comments => {
        comments.forEach(comment => {
          const div = document.createElement('div');
          div.className = 'comment';

        const initials = (comment.name || 'A').charAt(0).toUpperCase();

        div.innerHTML = `
        <div class="comment-avatar">${initials}</div>
        <div class="comment-content">
            <strong>${comment.name || 'Anonymous'}</strong>: ${comment.text}
            <small>${new Date(comment.timestamp).toLocaleString()}</small>
        </div> `;

          commentsContainer.appendChild(div);
        });
      });
  
  
    // Submit comment
    commentForm.addEventListener('submit', e => {
      e.preventDefault();
      const name = document.getElementById('commenter-name').value.trim();
      const text = document.getElementById('comment-text').value.trim();
      if (!text) return;
  
      fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blogId, name, text })
      })
        .then(res => res.json())
        .then(saved => {
          const div = document.createElement('div');
          div.className = 'comment';

        const initials = (comment.name || 'A').charAt(0).toUpperCase();

        div.innerHTML = `
        <div class="comment-avatar">${initials}</div>
        <div class="comment-content">
            <strong>${comment.name || 'Anonymous'}</strong>: ${comment.text}
            <small>${new Date(comment.timestamp).toLocaleString()}</small>
        </div> `;

          commentsContainer.prepend(div);
          commentForm.reset();
        });
    });
  });



