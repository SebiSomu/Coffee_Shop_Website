document.addEventListener("DOMContentLoaded", async function() {
    const footerPlaceholder = document.getElementById("footer-placeholder");
    if (footerPlaceholder) {
        try {
            const response = await fetch("footer.html");
            if (response.ok) {
                footerPlaceholder.innerHTML = await response.text();
            } else {
                console.error("Footer file not found");
            }
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

    document.querySelectorAll("button[data-target]").forEach(button => {
        button.addEventListener("click", () => {
            window.location.href = button.dataset.target;
        });
    });

    document.querySelectorAll(".quantity-controls").forEach((controls) => {
        const minusBtn = controls.querySelector(".minus");
        const plusBtn = controls.querySelector(".plus");
        const quantitySpan = controls.querySelector(".quantity");

        minusBtn.addEventListener("click", () => {
            let currentQty = parseInt(quantitySpan.textContent);
            if (currentQty > 1) {
                quantitySpan.textContent = currentQty - 1;
            }
        });

        plusBtn.addEventListener("click", () => {
            let currentQty = parseInt(quantitySpan.textContent);
            quantitySpan.textContent = currentQty + 1;
        });
    });

    document.querySelectorAll(".add-to-cart")?.forEach((button) => {
        button.addEventListener("click", () => {
            const coffeeItem = button.closest(".coffee-item");
            const name = coffeeItem.querySelector("h3").innerText;
            const priceText = coffeeItem.querySelector(".price").innerText;
            const price = parseFloat(priceText.replace(" RON", ""));
            const gramsElement = coffeeItem.querySelector(".coffee-grams");
            const grams = gramsElement ? gramsElement.innerText : "";
            const quantity = parseInt(coffeeItem.querySelector(".quantity").textContent);

            const existingItem = cart.find(item => item.name === name);

            if (existingItem) {
                existingItem.quantity += quantity;
                showCustomAlert(`${name} quantity increased to ${existingItem.quantity}`);
            } else {
                cart.push({ name, price, grams, quantity });
                showCustomAlert(`${name} was added to your cart.`);
            }

            localStorage.setItem("cart", JSON.stringify(cart));
            cartChannel.postMessage(cart);

            coffeeItem.querySelector(".quantity").textContent = "1";
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
                const itemTotal = item.price * item.quantity;
                total += itemTotal;

                itemDiv.innerHTML = `
                    <div class="cart-item-info">
                        <strong>${item.name}</strong> ${item.grams} - ${item.price} RON
                    </div>
                    <div class="cart-item-controls">
                        <button class="quantity-btn decrease-qty" data-index="${index}">−</button>
                        <span class="quantity-display">${item.quantity}</span>
                        <button class="quantity-btn increase-qty" data-index="${index}">+</button>
                        <span class="item-total">${itemTotal} RON</span>
                        <button class="remove-from-cart" data-index="${index}">✕</button>
                    </div>
                `;
                cartItemsContainer.appendChild(itemDiv);
            });

            totalElement.innerText = `Total: ${total} RON`;

            document.querySelectorAll(".increase-qty").forEach(button => {
                button.addEventListener("click", () => {
                    const idx = parseInt(button.dataset.index);
                    cart[idx].quantity += 1;
                    localStorage.setItem("cart", JSON.stringify(cart));
                    cartChannel.postMessage(cart);
                    renderCart();
                });
            });

            document.querySelectorAll(".decrease-qty").forEach(button => {
                button.addEventListener("click", () => {
                    const idx = parseInt(button.dataset.index);
                    if (cart[idx].quantity > 1) {
                        cart[idx].quantity -= 1;
                    } else {
                        const removed = cart[idx].name;
                        cart.splice(idx, 1);
                        showCustomAlert(`${removed} was removed from your cart.`);
                    }
                    localStorage.setItem("cart", JSON.stringify(cart));
                    cartChannel.postMessage(cart);
                    renderCart();
                });
            });

            document.querySelectorAll(".remove-from-cart").forEach(button => {
                button.addEventListener("click", () => {
                    const idx = parseInt(button.dataset.index);
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

            let totalAmount = 0;
            const orderItems = cart.map(item => {
                totalAmount += item.price * item.quantity;
                return {
                    name: item.name,
                    grams: item.grams,
                    price: item.price,
                    quantity: item.quantity,
                    subtotal: item.price * item.quantity
                };
            });

            const order = {
                items: orderItems,
                total: totalAmount,
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
                    if (item.quantity > 1) {
                        li.textContent = `${item.name} ${item.grams} × ${item.quantity} - ${item.subtotal} RON`;
                    } else {
                        li.textContent = `${item.name} ${item.grams} - ${item.price} RON`;
                    }
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

const specialMessage = document.getElementById("goodVibes");
if (specialMessage) {
    const initialText = specialMessage.textContent;
    specialMessage.addEventListener("mousedown", () => {
        specialMessage.textContent = "Take a moment to slow down.\n" +
            "    Feel the aroma, hear the quiet hum of the café, and let the world pause for a sip.\n" +
            "    Because at Coffee Time, every cup is a reminder that the little things make life beautiful. ☕✨";
    });
    specialMessage.addEventListener("mouseup", () => {
        specialMessage.textContent = initialText;
    });
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if(entry.isIntersecting) {
                specialMessage.classList.add("animate");
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 1,
    });
    observer.observe(specialMessage);
}

const storyElements = document.querySelectorAll("#story h3, .story-text");
const observer2 = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add("animate");
            observer2.unobserve(entry.target);
        }
    });
}, { threshold: 0.2 });
storyElements.forEach(el => observer2.observe(el));