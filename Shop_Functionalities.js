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
        const minusBtn = controls.querySelector(".decrease");
        const plusBtn = controls.querySelector(".increase");
        const quantitySpan = controls.querySelector(".quantity");

        if (minusBtn && plusBtn && quantitySpan) {
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
        }
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
                showCustomAlert(`${name} (x${quantity}) was added to your cart.`);
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
            const sendOrderBtn = document.getElementById("send-order");

            if (cart.length === 0) {
                cartItemsContainer.innerHTML = "<p>Your cart is empty.</p>";
                totalElement.innerText = "";
                if (sendOrderBtn) {
                    sendOrderBtn.disabled = true;
                }
                return;
            }

            if (sendOrderBtn) {
                sendOrderBtn.disabled = false;
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
                        <button class="qty-btn decrease" data-index="${index}">−</button>
                        <span class="quantity-display">${item.quantity}</span>
                        <button class="qty-btn increase" data-index="${index}">+</button>
                        <span class="item-total">${itemTotal} RON</span>
                        <button class="remove-from-cart" data-index="${index}">✕</button>
                    </div>
                `;
                cartItemsContainer.appendChild(itemDiv);
            });

            totalElement.innerText = `Total: ${total} RON`;

            document.querySelectorAll(".increase").forEach(button => {
                button.addEventListener("click", () => {
                    const idx = parseInt(button.dataset.index);
                    cart[idx].quantity += 1;
                    localStorage.setItem("cart", JSON.stringify(cart));
                    cartChannel.postMessage(cart);
                    renderCart();
                });
            });

            document.querySelectorAll(".decrease").forEach(button => {
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

    const userFormModal = document.getElementById("userFormModal");
    const userDataForm = document.getElementById("userDataForm");
    const cancelFormBtn = document.getElementById("cancelForm");

    function updateSendOrderButton() {
        const sendOrderBtn = document.getElementById("send-order");
        if (sendOrderBtn) {
            sendOrderBtn.disabled = cart.length === 0;
        }
    }
    updateSendOrderButton();

    const sendOrderButton = document.getElementById("send-order");
    if (sendOrderButton) {
        sendOrderButton.addEventListener("click", () => {
            if (cart.length === 0) {
                showCustomAlert("Your cart is empty!");
                return;
            }

            if (userFormModal) {
                userFormModal.classList.add("active");
            } else {
                processOrderWithoutUserData();
            }
        });
    }

    if (cancelFormBtn) {
        cancelFormBtn.addEventListener("click", function() {
            userFormModal.classList.remove("active");
        });
    }

    if (userDataForm) {
        userDataForm.addEventListener("submit", function(e) {
            e.preventDefault();

            const userName = document.getElementById("userName").value.trim();
            const userPhone = document.getElementById("userPhone").value.trim();
            const nameError = document.getElementById("nameError");
            const phoneError = document.getElementById("phoneError");
            const nameInput = document.getElementById("userName");
            const phoneInput = document.getElementById("userPhone");

            nameError.classList.remove("show");
            phoneError.classList.remove("show");
            nameInput.classList.remove("invalid");
            phoneInput.classList.remove("invalid");

            let isValid = true;

            const nameRegex = /^[a-zA-ZÀ-ÿ\u0100-\u017F\u0180-\u024F]+\s+[a-zA-ZÀ-ÿ\u0100-\u017F\u0180-\u024F]+.*$/;
            if (!nameRegex.test(userName) || userName.length < 3) {
                nameError.textContent = "Please enter your full name (first and last name)";
                nameError.classList.add("show");
                nameInput.classList.add("invalid");
                isValid = false;
            }

            const phoneRegex = /^0[2-9][0-9]{8}$/;
            const cleanPhone = userPhone.replace(/\s/g, '');
            if (!phoneRegex.test(cleanPhone)) {
                phoneError.classList.add("show");
                phoneInput.classList.add("invalid");
                isValid = false;
            }

            if (isValid) {
                processOrderWithUserData(userName, cleanPhone);
            }
        });
    }

    if (userFormModal) {
        userFormModal.addEventListener("click", function(e) {
            if (e.target === userFormModal) {
                userFormModal.classList.remove("active");
            }
        });
    }

    function processOrderWithUserData(userName, userPhone) {
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

        sessionStorage.setItem("current_user", JSON.stringify({
            name: userName,
            phone: userPhone
        }));

        showCustomAlert("Sending order...");

        fetch('save_order.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                customer_name: userName,
                phone: userPhone,
                order_data: orderItems,
                total_amount: totalAmount
            })
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                console.log('Server response:', data);

                if (data.success) {
                    const order = {
                        items: orderItems,
                        total: totalAmount,
                        time: new Date().toLocaleString(),
                        userData: {
                            name: userName,
                            phone: userPhone
                        },
                        php_order_id: data.order_id
                    };

                    const history = JSON.parse(localStorage.getItem("orders_history")) || [];
                    history.push(order);
                    localStorage.setItem("orders_history", JSON.stringify(history));
                    ordersChannel.postMessage(history);

                    cart = [];
                    localStorage.setItem("cart", JSON.stringify(cart));
                    cartChannel.postMessage(cart);

                    if (userFormModal) {
                        userFormModal.classList.remove("active");
                        userDataForm.reset();
                    }

                    showCustomAlert(`Order sent successfully! Thank you, ${userName}! Order ID: ${data.order_id}`);
                    setTimeout(() => window.location.href = "Orders_History.html", 1500);
                } else {
                    showCustomAlert("Error: " + (data.error || "Unknown error"));
                    console.error('Order error:', data);
                }
            })
            .catch(error => {
                console.error('Network error:', error);
                showCustomAlert("Network error. Check if server is running and save_order.php exists.");
            });
    }

    function processOrderWithoutUserData() {
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
    }

    const ordersList = document.getElementById("orders-list");
    if (ordersList) {
        async function loadOrdersFromDatabase() {
            try {
                const currentUser = JSON.parse(sessionStorage.getItem("current_user"));
                if (!currentUser) {
                    ordersList.innerHTML = '<p class="empty-history">No orders found. Place an order to see your history here!</p>';
                    return;
                }
                ordersList.innerHTML = `<p class="empty-history">Loading your orders, ${currentUser.name}...</p>`;
                const response = await fetch('get_orders.php');
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                console.log('Orders data:', data);

                if (data.success && data.orders && data.orders.length > 0) {
                    const userOrders = data.orders.filter(order =>
                        order.customer_name === currentUser.name &&
                        order.phone === currentUser.phone
                    );

                    if (userOrders.length > 0) {
                        ordersList.innerHTML = `
                            <div class="coffee-welcome">
                                <div class="welcome-icon">☕</div>
                                <h2 class="welcome-greeting">Welcome back, ${currentUser.name}!</h2>
                                <p class="thank-you-message">Every cup tells a story. Thank you for letting us be a part of yours! ❤️</p>
                                <p class="welcome-message">Here's your order history:</p>
                            </div>
                        `;

                        userOrders.forEach((order) => {
                            const orderDiv = document.createElement("div");
                            orderDiv.classList.add("order-entry");

                            const orderTitle = document.createElement("h3");
                            orderTitle.textContent = `Order #${order.id} — ${order.order_date}`;

                            const userInfo = document.createElement("p");
                            userInfo.classList.add("user-info");
                            userInfo.textContent = `Ordered by: ${order.customer_name} (${order.phone})`;
                            userInfo.style.marginTop = "10px";

                            const itemsList = document.createElement("ul");

                            try {
                                const orderItems = JSON.parse(order.order_data);
                                orderItems.forEach(item => {
                                    const li = document.createElement("li");
                                    li.textContent = `${item.name} ${item.grams} × ${item.quantity} - ${item.subtotal} RON`;
                                    itemsList.appendChild(li);
                                });
                            } catch (e) {
                                console.error('Error parsing order data:', e);
                                const li = document.createElement("li");
                                li.textContent = "Error loading order items";
                                itemsList.appendChild(li);
                            }

                            const total = document.createElement("p");
                            total.classList.add("order-total");
                            total.textContent = `Total: ${order.total_amount} RON`;

                            orderDiv.appendChild(orderTitle);
                            orderDiv.appendChild(userInfo);
                            orderDiv.appendChild(itemsList);
                            orderDiv.appendChild(total);
                            ordersList.appendChild(orderDiv);
                        });
                    } else {
                        ordersList.innerHTML = `
                            <p class="empty-history">No orders found for ${currentUser.name}.</p>
                            <p style="margin-top: 10px; color: #666;">Start ordering to see your history here!</p>
                        `;
                    }
                } else {
                    ordersList.innerHTML = `<p class="empty-history">No orders found for ${currentUser.name}.</p>`;
                }
            } catch (error) {
                console.error('Error loading orders:', error);
                ordersList.innerHTML = `<p class="empty-history">Error loading orders: ${error.message}<br>Check if server is running and get_orders.php exists.</p>`;
            }
        }

        loadOrdersFromDatabase();
        setInterval(loadOrdersFromDatabase, 30000);
    }

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
    if (storyElements.length > 0) {
        const observer2 = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add("animate");
                    observer2.unobserve(entry.target);
                }
            });
        }, { threshold: 0.2 });
        storyElements.forEach(el => observer2.observe(el));
    }

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && userFormModal && userFormModal.classList.contains('active')) {
            userFormModal.classList.remove('active');
            userDataForm.reset();
        }
    });

    const starRating = document.getElementById('starRating');
    const ratingText = document.getElementById('ratingText');
    const reviewForm = document.getElementById('reviewForm');
    const submitReviewBtn = document.getElementById('submitReview');
    let selectedRating = 0;

    if (submitReviewBtn) {
        submitReviewBtn.disabled = true;
    }

    if (starRating) {
        const stars = starRating.querySelectorAll('.rating-star');

        stars.forEach((star, index) => {
            star.addEventListener('mouseenter', () => {
                stars.forEach((s, i) => {
                    if (i <= index) {
                        s.classList.add('hover');
                    } else {
                        s.classList.remove('hover');
                    }
                });
            });

            star.addEventListener('mouseleave', () => {
                stars.forEach(s => s.classList.remove('hover'));
            });

            star.addEventListener('click', () => {
                selectedRating = parseInt(star.dataset.rating);

                stars.forEach((s, i) => {
                    if (i < selectedRating) {
                        s.classList.add('selected');
                    } else {
                        s.classList.remove('selected');
                    }
                });

                const ratingMessages = {
                    1: "😞 We're very sorry to hear that!",
                    2: "😕 Ok, we can do better",
                    3: "😊 Thank you for your feedback",
                    4: "😄 Great! We're glad you enjoyed",
                    5: "🤩 Awesome! Thank you so much!"
                };
                ratingText.textContent = ratingMessages[selectedRating];
                if (submitReviewBtn && selectedRating > 0) {
                    submitReviewBtn.disabled = false;
                }
            });
        });
    }

    if (reviewForm) {
        reviewForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            if (selectedRating === 0) {
                showCustomAlert("Please select a rating first!");
                return;
            }

            const reviewName = document.getElementById('reviewName').value.trim();
            const reviewTextValue = document.getElementById('reviewText').value.trim();

            const ratingData = {
                rating: selectedRating,
                customer_name: reviewName || 'Anonymous',
                review_text: reviewTextValue
            };

            showCustomAlert("Submitting your rating...");

            try {
                const response = await fetch('save_rating.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(ratingData)
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                console.log('Rating response:', data);

                if (data.success) {
                    showCustomAlert("Thank you for your feedback! ⭐");
                    reviewForm.reset();
                    selectedRating = 0;
                    if (submitReviewBtn) {
                        submitReviewBtn.disabled = true;
                    }

                    const stars = starRating.querySelectorAll('.star');
                    stars.forEach(s => s.classList.remove('selected'));
                    ratingText.textContent = "Click to rate";

                    setTimeout(() => {
                        window.location.href = "Shop_Structure.html";
                    }, 1500);

                } else {
                    showCustomAlert("Error: " + (data.error || "Unknown error"));
                    console.error('Rating error:', data);
                }
            } catch (error) {
                console.error('Network error:', error);
                showCustomAlert("Network error. Check if server is running.");
            }
        });
    }

    const recentRatingsContainer = document.getElementById('recentRatings');
    if (recentRatingsContainer) {
        async function loadRatingsFromDatabase() {
            try {
                const response = await fetch('get_ratings.php');

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                console.log('Ratings data:', data);

                if (data.success && data.ratings && data.ratings.length > 0) {
                    recentRatingsContainer.innerHTML = '';

                    data.ratings.forEach(rating => {
                        const ratingDiv = document.createElement('div');
                        ratingDiv.classList.add('rating-item');

                        let starsHTML = '';
                        for (let i = 1; i <= 5; i++) {
                            if (i <= rating.rating) {
                                starsHTML += '⭐';
                            } else {
                                starsHTML += '☆';
                            }
                        }

                        const date = new Date(rating.created_at);
                        const formattedDate = date.toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        });

                        ratingDiv.innerHTML = `
                            <div class="rating-header-info">
                                <span class="rating-stars-display">${starsHTML}</span>
                                <span class="rating-date">${formattedDate}</span>
                            </div>
                            <div class="rating-name">${rating.customer_name}</div>
                            ${rating.review_text ? `<div class="rating-review-text">${rating.review_text}</div>` : ''}
                        `;

                        recentRatingsContainer.appendChild(ratingDiv);
                    });
                } else {
                    recentRatingsContainer.innerHTML = '<p class="no-ratings">No reviews yet. Be the first to rate us! ⭐</p>';
                }
            } catch (error) {
                console.error('Error loading ratings:', error);
                recentRatingsContainer.innerHTML = '<p class="no-ratings">Error loading reviews. Please try again later.</p>';
            }
        }

        loadRatingsFromDatabase();
        setInterval(loadRatingsFromDatabase, 30000);
    }
});