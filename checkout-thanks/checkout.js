const DELIVERY_FEE = 30000;
const CART_KEY = "memoriCart";
let cart = readCart();
let checkoutInfo = readCheckoutInfo();
let shippingFee = Number.isFinite(Number(checkoutInfo.shippingFee))
    ? Number(checkoutInfo.shippingFee)
    : DELIVERY_FEE;
let discountPercent = Number(checkoutInfo.discount) > 0 ? 10 : 0;

function readStorageJson(key, fallback) {
    try {
        const value = localStorage.getItem(key);
        return value ? JSON.parse(value) : fallback;
    } catch (error) {
        console.error(`Không thể đọc dữ liệu ${key}:`, error);
        return fallback;
    }
}

function readCart() {
    const stored = readStorageJson(CART_KEY, []);
    if (!Array.isArray(stored)) return [];
    return stored.filter((item) => item && typeof item === "object").map((item) => ({
        ...item,
        quantity: Math.max(1, Number(item.quantity ?? item.qty ?? 1) || 1),
        price: Math.max(0, Number(item.price) || 0),
        detail: item.detail || item.size || ""
    }));
}

function readCheckoutInfo() {
    const stored = readStorageJson("memoriCheckout", {});
    return stored && typeof stored === "object" ? stored : {};
}

function formatPrice(value) {
    return `${Math.max(0, Number(value) || 0).toLocaleString("vi-VN")}đ`;
}

function getSubtotal() {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
}

function getDiscount() {
    return Math.round(getSubtotal() * discountPercent / 100);
}

function updateSummary() {
    const subtotal = getSubtotal();
    const discount = getDiscount();
    document.getElementById("subtotal").textContent = formatPrice(subtotal);
    document.getElementById("shipping").textContent = shippingFee ? formatPrice(shippingFee) : "Miễn phí";
    document.getElementById("discount").textContent = `-${formatPrice(discount)}`;
    document.getElementById("discount-row").style.display = discount ? "flex" : "none";
    document.getElementById("total").textContent = formatPrice(subtotal + shippingFee - discount);
}

function renderCart() {
    const itemsContainer = document.getElementById("order-items");
    const confirmButton = document.getElementById("confirm-btn");
    const badge = document.getElementById("cart-badge");
    badge.textContent = cart.reduce((total, item) => total + item.quantity, 0);
    confirmButton.disabled = cart.length === 0;

    if (!cart.length) {
        const empty = document.createElement("div");
        empty.className = "empty-order";
        empty.textContent = "Giỏ hàng của bạn đang trống. ";
        const link = document.createElement("a");
        link.href = "../products/products.html";
        link.textContent = "Khám phá sản phẩm";
        empty.appendChild(link);
        itemsContainer.replaceChildren(empty);
        updateSummary();
        return;
    }

    const fragment = document.createDocumentFragment();
    cart.forEach((item) => {
        const row = document.createElement("div");
        row.className = "product-item";

        const imageBox = document.createElement("div");
        imageBox.className = "product-image";
        if (item.image) {
            const image = document.createElement("img");
            image.src = item.image;
            image.alt = item.name || "Sản phẩm Memori Cake";
            imageBox.appendChild(image);
        } else {
            imageBox.textContent = "Ảnh bánh";
        }

        const info = document.createElement("div");
        info.className = "product-info";
        const name = document.createElement("div");
        name.className = "product-name";
        name.textContent = item.name || "Bánh Memori Cake";
        const detail = document.createElement("div");
        detail.className = "product-detail";
        detail.textContent = item.detail || "Bánh Memori Cake";
        const quantity = document.createElement("div");
        quantity.className = "quantity";
        quantity.textContent = `Số lượng: ${item.quantity}`;
        info.append(name, detail, quantity);

        const price = document.createElement("div");
        price.className = "product-price";
        price.textContent = formatPrice(item.price * item.quantity);
        row.append(imageBox, info, price);
        fragment.appendChild(row);
    });

    itemsContainer.replaceChildren(fragment);
    updateSummary();
}

function setPaymentDisplay() {
    const selected = document.querySelector('input[name="payment"]:checked');
    const qrBox = document.getElementById("qrBox");
    qrBox.hidden = !selected || selected.value !== "bank";
    document.querySelectorAll(".payment-option").forEach((option) => {
        option.classList.toggle("selected", option.querySelector("input").checked);
    });
}

function applyCoupon() {
    const codeInput = document.getElementById("coupon-code");
    const message = document.getElementById("coupon-message");
    const code = codeInput.value.trim().toUpperCase();
    message.classList.remove("error");

    if (code === "MEMORI10" && cart.length) {
        discountPercent = 10;
        message.textContent = "Đã áp dụng ưu đãi 10%.";
    } else {
        discountPercent = 0;
        message.textContent = code ? "Mã giảm giá chưa hợp lệ." : "Vui lòng nhập mã giảm giá.";
        message.classList.add("error");
    }
    updateSummary();
}

function confirmOrder() {
    const form = document.getElementById("checkout-form");
    if (!cart.length) {
        window.location.href = "../cart/cart.html";
        return;
    }
    if (!form.reportValidity()) return;

    const payment = document.querySelector('input[name="payment"]:checked');
    if (!payment) {
        document.querySelector(".payment-list").scrollIntoView({ behavior: "smooth", block: "center" });
        return;
    }

    const customer = {
        fullname: document.getElementById("fullname").value.trim(),
        phone: document.getElementById("phone").value.trim(),
        address: document.getElementById("address").value.trim(),
        district: document.getElementById("district").value,
        date: document.getElementById("date").value,
        time: document.getElementById("time").value,
        email: document.getElementById("email").value.trim()
    };
    const order = {
        customer,
        cart,
        payment: payment.value,
        discountPercent,
        checkoutInfo: {
            ...checkoutInfo,
            note: document.getElementById("note").value.trim(),
            shippingFee,
            discountAmount: getDiscount()
        }
    };

    try {
        localStorage.setItem("memoriLastOrder", JSON.stringify(order));
        localStorage.removeItem(CART_KEY);
        localStorage.removeItem("memoriCheckout");
    } catch (error) {
        console.error("Không thể lưu đơn hàng:", error);
        window.alert("Không thể lưu đơn hàng. Vui lòng kiểm tra dung lượng trình duyệt và thử lại.");
        return;
    }
    window.location.href = "thanks.html";
}

document.querySelectorAll('input[name="payment"]').forEach((input) => {
    input.addEventListener("change", setPaymentDisplay);
});
document.getElementById("coupon-btn").addEventListener("click", applyCoupon);
document.getElementById("coupon-code").addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        event.preventDefault();
        applyCoupon();
    }
});
document.getElementById("confirm-btn").addEventListener("click", confirmOrder);

document.getElementById("note").value = checkoutInfo.note || "";
if (Number(checkoutInfo.discount) > 0) {
    document.getElementById("coupon-code").value = "MEMORI10";
    document.getElementById("coupon-message").textContent = "Đã áp dụng ưu đãi 10%.";
}

const dateInput = document.getElementById("date");
const today = new Date();
dateInput.min = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
setPaymentDisplay();
renderCart();