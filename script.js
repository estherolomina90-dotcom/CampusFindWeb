const ADMIN_EMAIL = "estherveritas@campusfind.com";
const ADMIN_PASSWORD = "esther12345";

let users = JSON.parse(localStorage.getItem("users")) || [];
let items = JSON.parse(localStorage.getItem("items")) || [];
let currentUser = JSON.parse(localStorage.getItem("currentUser")) || null;

function saveData() {
    localStorage.setItem("users", JSON.stringify(users));
    localStorage.setItem("items", JSON.stringify(items));
}

function escapeHTML(str) {
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function signup(event) {
    event.preventDefault();

    const name = document.getElementById("signupName").value;
    const email = document.getElementById("signupEmail").value;
    const password = document.getElementById("signupPassword").value;

    const userExists = users.some(function(user) {
        return user.email === email;
    });

    if (userExists) {
        alert("An account with this email already exists.");
        return;
    }

    const newUser = {
        id: Date.now(),
        name: name,
        email: email,
        password: password
    };

    users.push(newUser);
    saveData();

    alert("Account created successfully!");
    window.location.href = "login.html";
}

function login(event) {
    event.preventDefault();

    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;

    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
        currentUser = {
            name: "Administrator",
            email: ADMIN_EMAIL,
            role: "admin"
        };

        localStorage.setItem("currentUser", JSON.stringify(currentUser));
        window.location.href = "admin.html";
        return;
    }

    const user = users.find(function(user) {
        return user.email === email && user.password === password;
    });

    if (!user) {
        alert("Incorrect email or password.");
        return;
    }

    currentUser = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: "user"
    };

    localStorage.setItem("currentUser", JSON.stringify(currentUser));
    window.location.href = "dashboard.html";
}

function logout() {
    localStorage.removeItem("currentUser");
    window.location.href = "index.html";
}

function addItem(event) {
    event.preventDefault();

    if (!currentUser || currentUser.role !== "admin") {
        alert("Only the administrator can upload items.");
        return;
    }

    const name = document.getElementById("itemName").value;
    const description = document.getElementById("itemDescription").value;
    const location = document.getElementById("itemLocation").value;
    const imageInput = document.getElementById("itemImage");

    if (imageInput.files.length === 0) {
        alert("Please select an image.");
        return;
    }

    const file = imageInput.files[0];
    const reader = new FileReader();

    reader.onload = function() {
        const newItem = {
            id: Date.now(),
            name: name,
            description: description,
            location: location,
            image: reader.result,
            date: new Date().toLocaleString(),
            status: "Available",
            comments: []
        };

        items.unshift(newItem);
        saveData();

        alert("Found item uploaded successfully!");

        document.getElementById("itemName").value = "";
        document.getElementById("itemDescription").value = "";
        document.getElementById("itemLocation").value = "";
        document.getElementById("itemImage").value = "";

        displayAdminItems();
    };

    reader.readAsDataURL(file);
}

function createItemCard(item) {
    const statusClass = item.status === "Returned" ? "returned" : "";

    return `
        <div class="item-card">
            <img src="${item.image}" alt="${escapeHTML(item.name)}">
            <div class="item-card-content">
                <span class="status ${statusClass}">${item.status}</span>
                <h3>${escapeHTML(item.name)}</h3>
                <p>${escapeHTML(item.description)}</p>
                <p>📍 ${escapeHTML(item.location)}</p>
                <p>🕒 ${item.date}</p>
                <a href="item.html?id=${item.id}" class="view-btn">View Item</a>
            </div>
        </div>
    `;
}

function filterItems(searchInputId) {
    const searchInput = document.getElementById(searchInputId);
    const search = searchInput ? searchInput.value.toLowerCase() : "";

    return items.filter(function(item) {
        return (
            item.name.toLowerCase().includes(search) ||
            item.description.toLowerCase().includes(search) ||
            item.location.toLowerCase().includes(search)
        );
    });
}

function displayHomeItems() {
    const container = document.getElementById("homeItems");
    if (!container) return;

    const filteredItems = filterItems("searchInput");

    if (filteredItems.length === 0) {
        container.innerHTML = `
            <div class="no-items">
                <h3>No items found</h3>
                <p>Try searching for something else.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = filteredItems.map(createItemCard).join("");
}

function displayDashboardItems() {
    const container = document.getElementById("dashboardItems");
    if (!container) return;

    const filteredItems = filterItems("dashboardSearch");

    if (filteredItems.length === 0) {
        container.innerHTML = `
            <div class="no-items">
                <h3>No matching items found.</h3>
            </div>
        `;
        return;
    }

    container.innerHTML = filteredItems.map(createItemCard).join("");
}

function displayItemDetails() {
    const container = document.getElementById("itemDetails");
    if (!container) return;

    const urlParams = new URLSearchParams(window.location.search);
    const itemId = Number(urlParams.get("id"));

    const item = items.find(function(item) {
        return item.id === itemId;
    });

    if (!item) {
        container.innerHTML = `
            <div class="no-items">
                <h2>Item not found</h2>
            </div>
        `;
        return;
    }

    if (!item.comments) {
        item.comments = [];
    }

    let commentsHTML = "";

    if (item.comments.length === 0) {
        commentsHTML = "<p>No comments yet.</p>";
    } else {
        item.comments.forEach(function(comment) {
            commentsHTML += `
                <div class="comment">
                    <strong>${escapeHTML(comment.name)}</strong>
                    <p>${escapeHTML(comment.text)}</p>
                    <small>${comment.date}</small>
                </div>
            `;
        });
    }

    let claimForm = "";

    if (currentUser && currentUser.role === "user" && item.status !== "Returned") {
        claimForm = `
            <div class="comment-form">
                <h3>Is this your item?</h3>
                <p>Tell the administrator how you can prove that this item belongs to you.</p>
                <textarea id="commentText" placeholder="Explain why this item belongs to you..."></textarea>
                <button class="primary-btn" onclick="addComment(${item.id})">Submit Claim</button>
            </div>
        `;
    }

    const statusClass = item.status === "Returned" ? "returned" : "";

    container.innerHTML = `
        <div class="item-detail-card">
            <div>
                <img src="${item.image}" alt="${escapeHTML(item.name)}">
            </div>
            <div class="item-info">
                <span class="status ${statusClass}">${item.status}</span>
                <h1>${escapeHTML(item.name)}</h1>
                <p><strong>Description:</strong><br>${escapeHTML(item.description)}</p>
                <p><strong>Location Found:</strong><br>${escapeHTML(item.location)}</p>
                <p><strong>Uploaded:</strong><br>${item.date}</p>
                <div class="comments-section">
                    <h2>Comments</h2>
                    ${commentsHTML}
                    ${claimForm}
                </div>
            </div>
        </div>
    `;
}

function addComment(itemId) {
    if (!currentUser) {
        alert("Please login first.");
        window.location.href = "login.html";
        return;
    }

    const commentBox = document.getElementById("commentText");
    if (!commentBox) return;

    const text = commentBox.value.trim();

    if (text === "") {
        alert("Please write a comment.");
        return;
    }

    const item = items.find(function(item) {
        return item.id === itemId;
    });

    if (!item) {
        alert("Item not found.");
        return;
    }

    if (!item.comments) {
        item.comments = [];
    }

    item.comments.push({
        name: currentUser.name,
        text: text,
        date: new Date().toLocaleString()
    });

    saveData();

    alert("Your claim has been sent to the administrator.");

    displayItemDetails();
}

function displayAdminItems() {
    const container = document.getElementById("adminItems");
    if (!container) return;

    if (items.length === 0) {
        container.innerHTML = `
            <div class="no-items">
                <h3>No found items yet.</h3>
            </div>
        `;
        return;
    }

    let html = "";

    items.forEach(function(item) {
        if (!item.comments) {
            item.comments = [];
        }

        let actionButton = "";

        if (item.status !== "Returned") {
            actionButton = `
                <button class="return-btn" onclick="markReturned(${item.id})">Mark Returned</button>
            `;
        }

        html += `
            <div class="admin-item">
                <img src="${item.image}" alt="${escapeHTML(item.name)}">
                <div class="admin-item-info">
                    <h3>${escapeHTML(item.name)}</h3>
                    <p>${escapeHTML(item.description)}</p>
                    <p>📍 ${escapeHTML(item.location)}</p>
                    <p>🕒 ${item.date}</p>
                    <p><strong>Status:</strong> ${item.status}</p>
                    <p>💬 ${item.comments.length} claim(s)</p>
                    <div class="admin-actions">
                        <a href="item.html?id=${item.id}" class="primary-btn">View</a>
                        ${actionButton}
                        <button class="delete-btn" onclick="deleteItem(${item.id})">Delete</button>
                    </div>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
}

function markReturned(itemId) {
    const item = items.find(function(item) {
        return item.id === itemId;
    });

    if (!item) return;

    const confirmed = confirm("Have you verified that the claimant owns this item?");
    if (!confirmed) return;

    item.status = "Returned";
    saveData();
    displayAdminItems();
    alert("Item has been marked as returned.");
}

function deleteItem(itemId) {
    const confirmed = confirm("Are you sure you want to delete this item?");
    if (!confirmed) return;

    items = items.filter(function(item) {
        return item.id !== itemId;
    });

    saveData();
    displayAdminItems();
}

function checkUserPages() {
    const page = window.location.pathname;

    if (page.includes("dashboard.html") && (!currentUser || currentUser.role !== "user")) {
        window.location.href = "login.html";
        return;
    }

    if (page.includes("admin.html") && (!currentUser || currentUser.role !== "admin")) {
        window.location.href = "login.html";
        return;
    }

    const userName = document.getElementById("userName");

    if (userName && currentUser) {
        userName.textContent = currentUser.name;
    }
}

document.addEventListener("DOMContentLoaded", function() {
    checkUserPages();
    displayHomeItems();
    displayDashboardItems();
    displayAdminItems();
    displayItemDetails();
});