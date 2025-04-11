document.getElementById("contactForm").addEventListener("submit", async function(event) {
    event.preventDefault(); // Prevent default form submission

    // Collect form data
    const formData = {
        first_name: document.querySelector("input[name='first_name']").value,
        last_name: document.querySelector("input[name='last_name']").value,
        email: document.querySelector("input[name='email']").value,
        message: document.querySelector("textarea[name='message']").value,
        subscribe: document.querySelector("input[name='subscribe']").checked
    };

    try {
        // Send data to the server
        const response = await fetch("/send-email", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(formData)
        });

        const result = await response.text();
        document.getElementById("responseMessage").innerText = result; // Show response message
    } catch (error) {
        console.error("Error:", error);
        document.getElementById("responseMessage").innerText = "Error sending email.";
    }
});