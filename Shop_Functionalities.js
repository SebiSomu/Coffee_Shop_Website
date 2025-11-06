document.addEventListener("DOMContentLoaded", async function() {
    // === FOOTER LOADING ===
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

    // === GLOBAL STATE ===
    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    const cartChannel = new BroadcastChannel("cart_channel");
    const ordersChannel = new BroadcastChannel("orders_channel");

    // === NAVIGATION BUTTONS (using data-target) ===
    document.querySelectorAll(".base_button").forEach(button => {
        const target = button.dataset.target;
        if (target) {
            button.addEventListener("click", () => {
                window.location.href = target;
            });
        }
    });

    // === ADD TO CART FUNCTIONALITY ===
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

    // === CART PAGE FUNCTIONALITY ===
    const cartItemsContainer = document.getElementById("cart-items");
    const totalElement = document.getElementById("total");

    if (cartItemsContainer) {
        function renderCart() {
            cartItemsContainer.innerHTML = "";
            if (cart.length === 0) {
                cartItemsContainer.innerHTML = "<p>Your cart is empty.</p>";
                totalElement.innerText = "";
                return;
            }

            let total = 0;
            cart.forEach((item, index) => {
                const itemDiv = document.createElement("div");
                itemDiv.classList.add("cart-item");
                itemDiv.innerHTML = `
                    <strong>${item.name}</strong> - ${item.price} RON
                    <button class="remove-from-cart base_button" data-index="${index}">Remove</button>
                `;
                cartItemsContainer.appendChild(itemDiv);
                total += item.price;
            });

            totalElement.innerText = `Total: ${total} RON`;

            document.querySelectorAll(".remove-from-cart").forEach(button => {
                button.addEventListener("click", () => {
                    const idx = button.dataset.index;
                    cart.splice(idx, 1);
                    localStorage.setItem("cart", JSON.stringify(cart));
                    cartChannel.postMessage(cart);
                    renderCart();
                });
            });
        }

        renderCart();
        cartChannel.onmessage = (e) => {
            cart = e.data;
            renderCart();
        };
    }

    // === ORDER SUBMISSION ===
    const sendOrderButton = document.getElementById("send-order");
    if (sendOrderButton) {
        sendOrderButton.addEventListener("click", () => {
            if (cart.length === 0) {
                alert("Your cart is empty!");
                return;
            }

            const now = new Date();
            const order = {
                items: cart,
                total: cart.reduce((sum, item) => sum + item.price, 0),
                time: now.toLocaleString()
            };

            const history = JSON.parse(localStorage.getItem("orders_history")) || [];
            history.push(order);
            localStorage.setItem("orders_history", JSON.stringify(history));

            // Update all open tabs / pages
            ordersChannel.postMessage(history);

            // Clear cart
            cart = [];
            localStorage.setItem("cart", JSON.stringify(cart));
            cartChannel.postMessage(cart);

            alert("Order sent successfully!");
            window.location.href = "Orders_History.html";
        });
    }

    // === ORDERS HISTORY PAGE ===
    const ordersList = document.getElementById("orders-list");
    if (ordersList) {
        function renderHistory() {
            const history = JSON.parse(localStorage.getItem("orders_history")) || [];
            ordersList.innerHTML = "";

            if (history.length === 0) {
                ordersList.innerHTML = "<p class='empty-history'>No past orders found.</p>";
                return;
            }

            history.forEach((order, index) => {
                const orderDiv = document.createElement("div");
                orderDiv.classList.add("order-entry");

                const orderTitle = document.createElement("h3");
                orderTitle.textContent = `Order #${index + 1} — ${order.time}`;

                const itemsList = document.createElement("ul");
                order.items.forEach(item => {
                    const li = document.createElement("li");
                    li.textContent = `${item.name} - ${item.price} RON`;
                    itemsList.appendChild(li);
                });

                const total = document.createElement("p");
                total.classList.add("order-total");
                total.textContent = `Total: ${order.total} RON`;

                orderDiv.appendChild(orderTitle);
                orderDiv.appendChild(itemsList);
                orderDiv.appendChild(total);
                ordersList.appendChild(orderDiv);
            });
        }

        renderHistory();

        // Ascultă actualizările în timp real
        ordersChannel.onmessage = () => {
            renderHistory();
        };
    }
});
