let shippingFee = 30000;
let cartIssue = "";
let discountPercent = 0;
let appliedCoupon = "";

try {
    const savedCheckout = JSON.parse(localStorage.getItem("memoriCheckout") || "{}");
    discountPercent = Number(savedCheckout.discountPercent) === 10 ? 10 : 0;
    appliedCoupon = discountPercent ? "MEMORI10" : "";
} catch (error) {
    console.error("Could not read saved checkout preferences.", error);
}

function showCartMessage(message) {
    const container = document.querySelector(".cart-container");
    if (!container) return;

    let messageElement = container.querySelector(".cart-message");
    if (!messageElement) {
        messageElement = document.createElement("p");
        messageElement.className = "cart-message";
        messageElement.setAttribute("role", "alert");
        container.prepend(messageElement);
    }
    messageElement.textContent = message;
}

function normalizeCartItem(item) {
    if (!item || typeof item !== "object") return null;

    const name = typeof item.name === "string" ? item.name.trim() : "";
    const rawPrice = typeof item.price === "number"
        ? item.price
        : Number(String(item.price ?? "").replace(/[^\d]/g, ""));
    const quantity = Number(item.quantity ?? item.qty);

    if (!name || !Number.isFinite(rawPrice) || rawPrice < 0 || !Number.isInteger(quantity) || quantity < 1) {
        return null;
    }

    const size = typeof item.size === "string" ? item.size.trim() : "";
    const detail = typeof item.detail === "string" && item.detail.trim()
        ? item.detail.trim()
        : size ? `Kích thước: ${size}` : "";
    const id = item.id !== undefined && item.id !== null
        ? String(item.id)
        : `${name.toLocaleLowerCase("vi-VN")}::${(size || detail).toLocaleLowerCase("vi-VN")}`;

    return {
        id,
        name,
        detail,
        price: rawPrice,
        quantity,
        image: typeof item.image === "string" ? item.image.trim() : "",
        size,
    };
}

function getCart() {
    cartIssue = "";

    let rawCart;
    try {
        rawCart = localStorage.getItem("memoriCart");
    } catch (error) {
        cartIssue = "Không thể truy cập giỏ hàng đã lưu trên thiết bị này.";
        console.error("Could not read the saved cart.", error);
        return [];
    }

    if (rawCart === null) return [];

    let parsedCart;
    try {
        parsedCart = JSON.parse(rawCart);
    } catch (error) {
        cartIssue = "Dữ liệu giỏ hàng bị lỗi và không thể đọc. Vui lòng xóa dữ liệu giỏ hàng rồi thử lại.";
        console.error("The saved cart contains invalid JSON.", error);
        return [];
    }

    if (!Array.isArray(parsedCart)) {
        cartIssue = "Dữ liệu giỏ hàng không hợp lệ.";
        console.error("The saved cart is not an array.");
        return [];
    }

    const cart = parsedCart.map(normalizeCartItem);
    if (cart.some((item) => item === null)) {
        cartIssue = "Một số sản phẩm trong giỏ có dữ liệu không hợp lệ; vui lòng kiểm tra trước khi thanh toán.";
        console.error("One or more saved cart items are invalid.");
        return cart.filter(Boolean);
    }

    return cart;
}

function saveCart(cart) {
    try {
        localStorage.setItem("memoriCart", JSON.stringify(cart));
        cartIssue = "";
        return true;
    } catch (error) {
        cartIssue = "Không thể lưu thay đổi giỏ hàng. Hãy kiểm tra dung lượng lưu trữ của trình duyệt.";
        console.error("Could not save the cart.", error);
        showCartMessage(cartIssue);
        return false;
    }
}

function formatPrice(value) {
    return `${value.toLocaleString("vi-VN")}đ`;
}

function createCartItem(item) {
    const row = document.createElement("div");
    row.className = "cart-item";
    row.dataset.id = item.id;

    const productInfo = document.createElement("div");
    productInfo.className = "product-info";

    const imageBox = document.createElement("div");
    imageBox.className = "product-image";
    if (item.image) {
        try {
            const imageUrl = new URL(item.image, window.location.href);
            if (imageUrl.protocol === "https:" || imageUrl.protocol === "http:") {
                const image = document.createElement("img");
                image.src = imageUrl.href;
                image.alt = item.name;
                image.loading = "lazy";
                image.addEventListener("error", () => {
                    image.replaceWith(document.createTextNode("Ảnh bánh"));
                }, { once: true });
                imageBox.append(image);
            } else {
                imageBox.textContent = "Ảnh bánh";
            }
        } catch (error) {
            console.error("Could not display a cart product image.", error);
            imageBox.textContent = "Ảnh bánh";
        }
    } else {
        imageBox.textContent = "Ảnh bánh";
    }

    const productCopy = document.createElement("div");
    const productName = document.createElement("div");
    productName.className = "product-name";
    productName.textContent = item.name;
    const productDetail = document.createElement("div");
    productDetail.className = "product-detail";
    productDetail.textContent = item.detail;
    productCopy.append(productName, productDetail);
    productInfo.append(imageBox, productCopy);

    const unitPrice = document.createElement("div");
    unitPrice.className = "price unit-price";
    unitPrice.textContent = formatPrice(item.price);

    const quantity = document.createElement("div");
    quantity.className = "quantity";
    const decreaseButton = document.createElement("button");
    decreaseButton.type = "button";
    decreaseButton.textContent = "−";
    decreaseButton.setAttribute("aria-label", `Giảm số lượng ${item.name}`);
    decreaseButton.addEventListener("click", () => changeQty(item.id, -1));
    const quantityValue = document.createElement("span");
    quantityValue.textContent = String(item.quantity);
    const increaseButton = document.createElement("button");
    increaseButton.type = "button";
    increaseButton.textContent = "+";
    increaseButton.setAttribute("aria-label", `Tăng số lượng ${item.name}`);
    increaseButton.addEventListener("click", () => changeQty(item.id, 1));
    quantity.append(decreaseButton, quantityValue, increaseButton);

    const lineTotal = document.createElement("div");
    lineTotal.className = "price line-total";
    lineTotal.textContent = formatPrice(item.price * item.quantity);

    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.className = "remove-btn";
    removeButton.textContent = "Xóa";
    removeButton.setAttribute("aria-label", `Xóa ${item.name} khỏi giỏ`);
    removeButton.addEventListener("click", () => removeItem(item.id));

    row.append(productInfo, unitPrice, quantity, lineTotal, removeButton);
    return row;
}

function renderCart() {
    const cart = getCart();
    const container = document.getElementById("cart-items");
    const emptyElement = document.getElementById("empty-cart");
    const headerElement = document.getElementById("cart-header");
    const bottomElement = document.getElementById("cart-bottom");
    const countElement = document.getElementById("cart-count");
    if (!container || !emptyElement || !headerElement || !bottomElement || !countElement) return;

    countElement.textContent = String(cart.reduce((sum, item) => sum + item.quantity, 0));
    container.replaceChildren(...cart.map(createCartItem));

    const isEmpty = cart.length === 0;
    emptyElement.style.display = isEmpty ? "block" : "none";
    headerElement.style.display = isEmpty ? "none" : "grid";
    bottomElement.style.display = isEmpty ? "none" : "flex";

    if (cartIssue) showCartMessage(cartIssue);
    updateSummary(cart);
}

function changeQty(id, delta) {
    const cart = getCart();
    if (cartIssue) {
        showCartMessage(cartIssue);
        updateSummary(cart);
        return;
    }

    const item = cart.find((product) => String(product.id) === String(id));
    if (!item) return;

    item.quantity = Math.max(1, item.quantity + delta);
    if (saveCart(cart)) renderCart();
}

function removeItem(id) {
    const cart = getCart();
    if (cartIssue) {
        showCartMessage(cartIssue);
        updateSummary(cart);
        return;
    }

    const remainingCart = cart.filter((product) => String(product.id) !== String(id));
    if (saveCart(remainingCart)) renderCart();
}

function updateShipping() {
    const selectedDelivery = document.querySelector('input[name="delivery"]:checked');
    const delivery = selectedDelivery?.value || "delivery";
    shippingFee = delivery === "delivery" ? 30000 : 0;

    document.getElementById("opt-delivery")?.classList.toggle("active", delivery === "delivery");
    document.getElementById("opt-pickup")?.classList.toggle("active", delivery === "pickup");
    updateSummary();
}

function updateSummary(cart = getCart()) {
    const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const discount = Math.round(subtotal * discountPercent / 100);
    const subtotalElement = document.getElementById("subtotal");
    const shippingElement = document.getElementById("shipping");
    const totalElement = document.getElementById("total");
    const checkoutButton = document.getElementById("checkout-btn");
    const discountRow = document.getElementById("discount-row");
    const discountElement = document.getElementById("discount");

    if (subtotalElement) subtotalElement.textContent = formatPrice(subtotal);
    if (shippingElement) shippingElement.textContent = shippingFee === 0 ? "Miễn phí" : formatPrice(shippingFee);
    if (discountRow) discountRow.hidden = discount === 0;
    if (discountElement) discountElement.textContent = `-${formatPrice(discount)}`;
    if (totalElement) totalElement.textContent = formatPrice(subtotal + shippingFee - discount);
    if (checkoutButton) checkoutButton.disabled = cart.length === 0 || Boolean(cartIssue);
}

function applyCoupon() {
    const code = document.getElementById("coupon-code")?.value.trim().toUpperCase() || "";
    const message = document.getElementById("coupon-message");
    if (!code) {
        if (message) message.textContent = "Vui lòng nhập mã giảm giá.";
        return;
    }

    if (code === "MEMORI10") {
        discountPercent = 10;
        appliedCoupon = code;
        if (message) message.textContent = "Đã áp dụng mã MEMORI10 giảm 10%.";
        updateSummary();
        return;
    }

    discountPercent = 0;
    appliedCoupon = "";
    if (message) message.textContent = "Mã giảm giá không hợp lệ.";
    updateSummary();
}

function goCheckout() {
    const cart = getCart();
    if (cartIssue) {
        showCartMessage(cartIssue);
        updateSummary(cart);
        return;
    }
    if (cart.length === 0) return;

    const delivery = document.querySelector('input[name="delivery"]:checked')?.value || "delivery";
    const note = document.getElementById("shop-note")?.value || "";
    const checkoutInfo = {
        note,
        delivery,
        shippingFee,
        discountPercent,
        couponCode: appliedCoupon,
    };

    try {
        localStorage.setItem("memoriCheckout", JSON.stringify(checkoutInfo));
    } catch (error) {
        showCartMessage("Không thể lưu thông tin nhận hàng. Hãy kiểm tra dung lượng lưu trữ của trình duyệt.");
        console.error("Could not save checkout preferences.", error);
        return;
    }

    window.location.href = "../checkout-thanks/checkout.html";
}

function addToCart(product) {
    if (!product || typeof product !== "object") {
        console.error("Cannot add an invalid product to the cart.");
        return;
    }

    const cart = getCart();
    if (cartIssue) {
        showCartMessage(cartIssue);
        updateSummary(cart);
        return;
    }

    const item = normalizeCartItem({
        ...product,
        quantity: product.quantity ?? product.qty ?? 1,
    }, cart.length);
    if (!item) {
        console.error("Cannot add a product with invalid name, price, or quantity.");
        return;
    }

    const existing = cart.find((cartItem) => cartItem.id === item.id);
    if (existing) {
        existing.quantity += item.quantity;
    } else {
        cart.push(item);
    }

    if (saveCart(cart) && document.getElementById("cart-items")) renderCart();
}

document.addEventListener("DOMContentLoaded", () => {
    renderCart();
    updateShipping();
    const couponInput = document.getElementById("coupon-code");
    const couponMessage = document.getElementById("coupon-message");
    if (couponInput && appliedCoupon) couponInput.value = appliedCoupon;
    if (couponMessage && appliedCoupon) couponMessage.textContent = "Đã áp dụng mã MEMORI10 giảm 10%.";

    const cartContainer = document.querySelector(".cart-container");
    const checkoutButton = document.getElementById("checkout-btn");
    if (cartContainer && checkoutButton && "IntersectionObserver" in window) {
        const observer = new IntersectionObserver(([entry]) => {
            cartContainer.classList.toggle("is-visible", entry.isIntersecting);
            if (entry.isIntersecting) observer.disconnect();
        }, { threshold: 0.08 });
        cartContainer.classList.add("js-reveal");
        observer.observe(cartContainer);
    } else {
        cartContainer?.classList.add("is-visible");
    }
});
