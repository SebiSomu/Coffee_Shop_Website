document.getElementById("menu")?.addEventListener("click", function() {
    window.location.href = "Menu.html";
});

document.getElementById("back")?.addEventListener("click", function() {
    window.location.href = "Shop_Structure.html";
});

document.addEventListener("DOMContentLoaded", async function() {
    const footerPlaceholder = document.getElementById("footer-placeholder");

    if (footerPlaceholder) {
        try {
            const response = await fetch("footer.html");
            const data = await response.text();
            footerPlaceholder.innerHTML = data;
        } catch (err) {
            console.error("Error during footer loading:", err);
        }
    }
});
