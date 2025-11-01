document.getElementById("menu")?.addEventListener("click", function() {
    window.location.href = "Menu.html";
});

document.getElementById("back")?.addEventListener("click", function() {
    window.location.href = "Shop_Structure.html";
});

document.getElementById("order")?.addEventListener("click", function() {
    window.location.href = "Order.html";
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

let cart = JSON.parse(localStorage.getItem("cart")) || [];
const cartChannel = new BroadcastChannel('cart_channel');

document.querySelectorAll(".add-to-cart")?.forEach((button) => {
    button.addEventListener("click", () => {
        const coffeeItem = button.closest(".coffee-item");
        const name = coffeeItem.querySelector("h3").innerText;
        const priceText = coffeeItem.querySelector(".price").innerText;
        const price = parseFloat(priceText.replace(" RON", ""));

        cart.push({ name, price });
        localStorage.setItem("cart", JSON.stringify(cart));
        cartChannel.postMessage(cart);
        alert(`${name} a fost adăugat în coș!`);
    });
});

document.getElementById("back-to-menu")?.addEventListener("click", () => {
    window.location.href = "Menu.html";
});

document.addEventListener("DOMContentLoaded", function() {
    const cartItemsContainer = document.getElementById("cart-items");
    const totalElement = document.getElementById("total");

    if (cartItemsContainer) {
        function renderCart() {
            cartItemsContainer.innerHTML = "";
            if(cart.length === 0) {
                cartItemsContainer.innerHTML = "<p>Your cart is empty.</p>";
                totalElement.innerText = "";
                return;
            }

            let total = 0;
            cart.forEach((item, index) => {
                const itemDiv = document.createElement("div");
                itemDiv.classList.add("cart-item");
                itemDiv.innerHTML = `<strong>${item.name}</strong> - ${item.price} RON 
                                     <button class="remove-from-cart" data-index="${index}">Remove</button>`;
                cartItemsContainer.appendChild(itemDiv);
                total += item.price;
            });

            totalElement.innerText = `Total: ${total} RON`;

            document.querySelectorAll(".remove-from-cart").forEach(button => {
                button.addEventListener("click", () => {
                    const idx = button.dataset.index;
                    cart.splice(idx, 1);
                    localStorage.setItem("cart", JSON.stringify(cart));
                    cartChannel.postMessage(cart); // live update
                    renderCart();
                });
            });
        }

        renderCart();

        cartChannel.onmessage = (e) => {
            cart = e.data;
            renderCart();
        }
    }
});
