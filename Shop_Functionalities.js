document.addEventListener("DOMContentLoaded", async function() {
    const footerPlaceholder = document.getElementById("footer-placeholder");
    if (footerPlaceholder) {
        try {
            const response = await fetch("footer.html");
            footerPlaceholder.innerHTML = await response.text();
        } catch (err) {
            console.error("Error during footer loading:", err);
        }
    }

    function showCustomAlert(message) {
        const alertBox = document.createElement("div");
        alertBox.classList.add("custom-alert");
        alertBox.textContent = message;

        document.body.appendChild(alertBox);

        setTimeout(() => alertBox.classList.add("visible"), 10);

        setTimeout(() => {
            alertBox.classList.remove("visible");
            setTimeout(() => alertBox.remove(), 400);
        }, 3000);
    }

    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    const cartChannel = new BroadcastChannel("cart_channel");
    const ordersChannel = new BroadcastChannel("orders_channel");

    document.querySelectorAll(".base_button").forEach(button => {
        const target = button.dataset.target;
        if (target) {
            button.addEventListener("click", () => {
                window.location.href = target;
            });
        }
    });

    document.querySelectorAll(".add-to-cart")?.forEach((button) => {
        button.addEventListener("click", () => {
            const coffeeItem = button.closest(".coffee-item");
            const name = coffeeItem.querySelector("h3").innerText;
            const priceText = coffeeItem.querySelector(".price").innerText;
            const price = parseFloat(priceText.replace(" RON", ""));

            cart.push({ name, price });
            localStorage.setItem("cart", JSON.stringify(cart));
            cartChannel.postMessage(cart);

            showCustomAlert(`${name} was added to your cart.`);
        });
    });

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
                    const removed = cart[idx].name;
                    cart.splice(idx, 1);
                    localStorage.setItem("cart", JSON.stringify(cart));
                    cartChannel.postMessage(cart);
                    renderCart();
                    showCustomAlert(`${removed} was removed from your cart.`);
                });
            });
        }

        renderCart();
        cartChannel.onmessage = (e) => {
            cart = e.data;
            renderCart();
        };
    }

    const sendOrderButton = document.getElementById("send-order");
    if (sendOrderButton) {
        sendOrderButton.addEventListener("click", () => {
            if (cart.length === 0) {
                showCustomAlert("Your cart is empty!");
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

            ordersChannel.postMessage(history);

            cart = [];
            localStorage.setItem("cart", JSON.stringify(cart));
            cartChannel.postMessage(cart);

            showCustomAlert("Order sent successfully!");
            setTimeout(() => window.location.href = "Orders_History.html", 1200);
        });
    }

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
        ordersChannel.onmessage = () => {
            renderHistory();
        };
    }
});
