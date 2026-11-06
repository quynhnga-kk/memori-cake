const DELIVERY_FEE = 30000;
let shippingFee = DELIVERY_FEE;
let discount = 0;

function getCart() {
    try {
        const stored = JSON.parse(localStorage.getItem("memoriCart") || "[]");
        return Array.isArray(stored) ? stored : [];
    } catch (error) {
        console.error("Không thể đọc giỏ hàng:", error);
        return [];
    }
}

function saveCart(cart) {
    localStorage.setItem("memoriCart", JSON.stringify(cart));
}

function formatPrice(value) {
    return `${Number(value).toLocaleString("vi-VN")}đ`;
}

function renderCart() {
    const cart = getCart();
    const container = document.getElementById("cart-items");
    const empty = document.getElementById("empty-cart");
    const header = document.getElementById("cart-header");
    const bottom = document.getElementById("cart-bottom");
    document.getElementById("cart-count").textContent = cart.reduce((total, item) => total + Number(item.quantity || 0), 0);

    empty.hidden = cart.length > 0;
    header.hidden = cart.length === 0;
    bottom.hidden = cart.length === 0;
    if (!cart.length) {
        container.innerHTML = "";
        return;
    }

    container.innerHTML = cart.map((item) => `
        <div class="cart-item" data-id="${item.id}">
            <div class="product-info">
                <div class="product-image">${item.image ? `<img src="${item.image}" alt="${item.name}">` : "Ảnh bánh"}</div>
                <div><div class="product-name">${item.name}</div><div class="product-detail">${item.detail || "Bánh Memori Cake"}</div></div>
            </div>
            <div class="price">${formatPrice(item.price)}</div>
            <div class="quantity"><button type="button" aria-label="Giảm số lượng" data-action="decrease">−</button><span>${item.quantity}</span><button type="button" aria-label="Tăng số lượng" data-action="increase">+</button></div>
            <div class="price">${formatPrice(item.price * item.quantity)}</div>
            <button type="button" class="remove-btn" data-action="remove">Xóa</button>
        </div>
    `).join("");
    updateSummary();
}

function updateSummary() {
    const subtotal = getCart().reduce((total, item) => total + item.price * item.quantity, 0);
    document.getElementById("subtotal").textContent = formatPrice(subtotal);
    document.getElementById("shipping").textContent = shippingFee ? formatPrice(shippingFee) : "Miễn phí";
    document.getElementById("discount").textContent = `-${formatPrice(discount)}`;
    document.getElementById("discount-row").hidden = discount === 0;
    document.getElementById("total").textContent = formatPrice(Math.max(0, subtotal + shippingFee - discount));
    document.getElementById("checkout-btn").disabled = subtotal === 0;
}

function changeQty(id, delta) {
    const cart = getCart();
    const item = cart.find((product) => String(product.id) === String(id));
    if (!item) return;
    item.quantity = Math.max(1, Number(item.quantity) + delta);
    saveCart(cart);
    renderCart();
}

document.getElementById("cart-items").addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;
    const id = button.closest(".cart-item").dataset.id;
    if (button.dataset.action === "remove") saveCart(getCart().filter((item) => String(item.id) !== id));
    if (button.dataset.action === "increase") changeQty(id, 1);
    if (button.dataset.action === "decrease") changeQty(id, -1);
    renderCart();
});

document.querySelectorAll('input[name="delivery"]').forEach((input) => {
    input.addEventListener("change", () => {
        shippingFee = input.value === "delivery" ? DELIVERY_FEE : 0;
        document.querySelectorAll(".delivery-option").forEach((option) => option.classList.toggle("active", option.querySelector("input").checked));
        updateSummary();
    });
});

document.getElementById("coupon-btn").addEventListener("click", () => {
    const message = document.getElementById("coupon-message");
    const code = document.getElementById("coupon-code").value.trim().toUpperCase();
    if (code === "MEMORI10") {
        const subtotal = getCart().reduce((total, item) => total + item.price * item.quantity, 0);
        discount = Math.round(subtotal * 0.1);
        message.textContent = "Đã áp dụng ưu đãi 10%.";
    } else {
        discount = 0;
        message.textContent = code ? "Mã giảm giá chưa hợp lệ." : "";
    }
    updateSummary();
});

document.getElementById("checkout-btn").addEventListener("click", () => {
    if (!getCart().length) return;
    localStorage.setItem("memoriCheckout", JSON.stringify({
        note: document.getElementById("shop-note").value,
        delivery: document.querySelector('input[name="delivery"]:checked').value,
        shippingFee,
        discount
    }));
    window.location.href = "../checkout-thanks/checkout.html";
});

window.addToCart = function addToCart(product) {
    const cart = getCart();
    const existing = cart.find((item) => item.id === product.id);
    if (existing) existing.quantity += 1;
    else cart.push({ ...product, quantity: 1 });
    saveCart(cart);
    renderCart();
};

renderCart();
