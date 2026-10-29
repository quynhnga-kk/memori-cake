let checkoutCart = [];
let checkoutInfo = {};
let checkoutDiscountPercent = 0;
const checkoutMoney = (value) => `${Number(value || 0).toLocaleString("vi-VN")}đ`;
const checkoutPriceValue = (value) => typeof value === "number"
    ? value
    : Number(String(value ?? "").replace(/[^\d]/g, ""));

function readCheckoutData() {
    try {
        const cartValue = JSON.parse(localStorage.getItem("memoriCart") || "[]");
        const infoValue = JSON.parse(localStorage.getItem("memoriCheckout") || "{}");
        if (!Array.isArray(cartValue)) throw new TypeError("Cart data is not an array.");

        checkoutCart = cartValue.filter((item) => item
            && typeof item.name === "string"
            && Number.isFinite(checkoutPriceValue(item.price))
            && checkoutPriceValue(item.price) >= 0
            && Number.isInteger(Number(item.quantity ?? item.qty))
            && Number(item.quantity ?? item.qty) > 0)
            .map((item) => ({
                ...item,
                price: checkoutPriceValue(item.price),
                quantity: Number(item.quantity ?? item.qty),
                size: typeof item.size === "string" ? item.size : "",
            }));
        checkoutInfo = infoValue && typeof infoValue === "object" ? infoValue : {};
        checkoutDiscountPercent = Number(checkoutInfo.discountPercent) === 10 ? 10 : 0;
    } catch (error) {
        console.error("Could not load checkout data.", error);
        checkoutCart = [];
        checkoutInfo = {};
        checkoutDiscountPercent = 0;
    }
}

function formatCheckoutPrice(value) {
    return checkoutMoney(value);
}

function renderCheckout() {
    const itemsContainer = document.getElementById("order-items");
    const subtotalElement = document.getElementById("subtotal");
    const shippingElement = document.getElementById("shipping");
    const totalElement = document.getElementById("total");
    const discountRow = document.getElementById("discount-row");
    const discountElement = document.getElementById("discount");
    const confirmButton = document.getElementById("confirm-btn");
    if (!itemsContainer || !subtotalElement || !shippingElement || !totalElement) return;

    if (checkoutCart.length === 0) {
        const empty = document.createElement("div");
        empty.className = "empty-order";
        const message = document.createElement("p");
        message.textContent = "Giỏ hàng đang trống. Hãy chọn bánh trước khi thanh toán.";
        const link = document.createElement("a");
        link.href = "../products/products.html";
        link.textContent = "Xem sản phẩm";
        empty.append(message, link);
        itemsContainer.replaceChildren(empty);
        if (confirmButton) confirmButton.disabled = true;
        const form = document.getElementById("checkout-form");
        form?.querySelectorAll("input, select, textarea, button").forEach((control) => {
            control.disabled = true;
        });
        return;
    }

    const fragment = document.createDocumentFragment();
    checkoutCart.forEach((item) => {
        const row = document.createElement("div");
        row.className = "product-item";
        const imageBox = document.createElement("div");
        imageBox.className = "product-image";
        const image = new Image();
        image.alt = item.name;
        image.src = item.image || "";
        image.loading = "lazy";
        image.addEventListener("error", () => {
            image.replaceWith(document.createTextNode("Bánh"));
        }, { once: true });
        imageBox.append(image);

        const info = document.createElement("div");
        info.className = "product-info";
        const name = document.createElement("div");
        name.className = "product-name";
        name.textContent = item.name;
        const detail = document.createElement("div");
        detail.className = "product-detail";
        detail.textContent = item.size ? `Kích thước: ${item.size}` : item.detail || "";
        const quantity = document.createElement("div");
        quantity.className = "quantity";
        quantity.textContent = `Số lượng: ${item.quantity}`;
        info.append(name, detail, quantity);

        const price = document.createElement("div");
        price.className = "product-price";
        price.textContent = formatCheckoutPrice(item.price * item.quantity);
        row.append(imageBox, info, price);
        fragment.append(row);
    });
    itemsContainer.replaceChildren(fragment);

    const subtotal = checkoutCart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const shipping = checkoutInfo.delivery === "pickup" ? 0 : 30000;
    const discount = Math.round(subtotal * checkoutDiscountPercent / 100);
    subtotalElement.textContent = formatCheckoutPrice(subtotal);
    shippingElement.textContent = shipping === 0 ? "Miễn phí" : formatCheckoutPrice(shipping);
    totalElement.textContent = formatCheckoutPrice(subtotal + shipping - discount);
    if (discountRow && discountElement) {
        discountRow.style.display = discount > 0 ? "flex" : "none";
        discountElement.textContent = `-${formatCheckoutPrice(discount)}`;
    }

    const note = document.getElementById("note");
    if (note && !note.value) note.value = typeof checkoutInfo.note === "string" ? checkoutInfo.note : "";
    const couponInput = document.getElementById("coupon-code");
    const couponMessage = document.querySelector(".coupon-message");
    if (couponInput && checkoutInfo.couponCode) couponInput.value = checkoutInfo.couponCode;
    if (couponMessage && checkoutDiscountPercent) couponMessage.textContent = "Đã áp dụng mã MEMORI10 giảm 10%.";
    updateDeliveryFields();
    showQR();
}

function updateDeliveryFields() {
    const delivery = checkoutInfo.delivery || "delivery";
    const address = document.getElementById("address");
    if (address) {
        address.required = delivery !== "pickup";
        address.placeholder = delivery === "pickup" ? "Không cần nhập nếu đến lấy tại tiệm" : "Số nhà, tên đường, phường/xã, quận/huyện, thành phố";
    }
    const shippingElement = document.getElementById("shipping");
    if (shippingElement && delivery === "pickup") shippingElement.textContent = "Miễn phí";
}

function showQR() {
    const selected = document.querySelector('input[name="payment"]:checked');
    const qrBox = document.getElementById("qrBox");
    if (!qrBox) return;
    qrBox.style.display = selected?.value === "bank" ? "block" : "none";
}

function applyCoupon() {
    const codeInput = document.getElementById("coupon-code");
    const code = codeInput?.value.trim().toUpperCase() || "";
    const couponBox = document.querySelector(".coupon");
    let message = couponBox?.querySelector(".coupon-message");
    if (couponBox && !message) {
        message = document.createElement("p");
        message.className = "coupon-message";
        message.setAttribute("role", "status");
        couponBox.append(message);
    }
    if (code !== "MEMORI10") {
        checkoutDiscountPercent = 0;
        delete checkoutInfo.discountPercent;
        delete checkoutInfo.couponCode;
        try {
            localStorage.setItem("memoriCheckout", JSON.stringify(checkoutInfo));
        } catch (error) {
            console.error("Could not clear the coupon.", error);
        }
        if (message) message.textContent = code ? "Mã giảm giá không hợp lệ." : "Vui lòng nhập mã giảm giá.";
        renderCheckout();
        return;
    }

    checkoutDiscountPercent = 10;
    checkoutInfo.discountPercent = 10;
    checkoutInfo.couponCode = code;
    try {
        localStorage.setItem("memoriCheckout", JSON.stringify(checkoutInfo));
    } catch (error) {
        console.error("Could not save the coupon.", error);
        if (message) message.textContent = "Không thể lưu mã giảm giá; vui lòng thử lại.";
        return;
    }

    if (message) message.textContent = "Đã áp dụng mã MEMORI10 giảm 10%.";
    renderCheckout();
}

function confirmOrder() {
    const form = document.getElementById("checkout-form");
    const selectedPayment = document.querySelector('input[name="payment"]:checked');
    const dateInput = document.getElementById("date");
    const phoneInput = document.getElementById("phone");
    const confirmButton = document.getElementById("confirm-btn");
    if (!form || checkoutCart.length === 0) {
        window.alert("Giỏ hàng trống. Vui lòng chọn bánh trước khi đặt hàng.");
        return;
    }

    if (!form.reportValidity()) return;
    if (phoneInput && !/^(?:\+?84|0)[0-9\s.-]{8,12}$/.test(phoneInput.value.trim())) {
        phoneInput.setCustomValidity("Vui lòng nhập số điện thoại Việt Nam hợp lệ.");
        phoneInput.reportValidity();
        phoneInput.addEventListener("input", () => phoneInput.setCustomValidity(""), { once: true });
        return;
    }

    if (!selectedPayment) {
        window.alert("Vui lòng chọn phương thức thanh toán.");
        return;
    }
    const district = document.getElementById("district")?.value;
    if (selectedPayment.value === "cod" && district === "Khác") {
        window.alert("Thanh toán khi nhận bánh chỉ áp dụng trong nội thành Hà Nội. Vui lòng chọn phương thức khác.");
        return;
    }
    if (dateInput && dateInput.value < dateInput.min) {
        dateInput.setCustomValidity("Ngày nhận bánh phải từ hôm nay trở đi.");
        dateInput.reportValidity();
        dateInput.addEventListener("input", () => dateInput.setCustomValidity(""), { once: true });
        return;
    }

    const subtotal = checkoutCart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const shippingFee = checkoutInfo.delivery === "pickup" ? 0 : 30000;
    const discountAmount = Math.round(subtotal * checkoutDiscountPercent / 100);
    const customer = Object.fromEntries(new FormData(form).entries());
    customer.note = document.getElementById("note")?.value.trim() || "";
    if (checkoutInfo.delivery === "pickup") customer.address = "Nhận tại cửa hàng Memori Cake";

    const order = {
        id: `MC-${Date.now().toString(36).toUpperCase()}`,
        createdAt: new Date().toISOString(),
        customer,
        cart: checkoutCart,
        checkoutInfo: {
            ...checkoutInfo,
            shippingFee,
        },
        payment: selectedPayment.value,
        paymentStatus: "pending_confirmation",
        discountPercent: checkoutDiscountPercent,
        discountAmount,
        total: subtotal + shippingFee - discountAmount,
    };

    let oldOrder;
    let oldCart;
    try {
        oldOrder = localStorage.getItem("memoriLastOrder");
        oldCart = localStorage.getItem("memoriCart");
    } catch (error) {
        console.error("Could not prepare to save the order.", error);
        window.alert("Không thể truy cập dữ liệu đặt hàng trên thiết bị này.");
        return;
    }

    try {
        localStorage.setItem("memoriLastOrder", JSON.stringify(order));
        localStorage.setItem("memoriCart", JSON.stringify([]));
        localStorage.removeItem("memoriCheckout");
    } catch (error) {
        try {
            if (oldOrder === null) localStorage.removeItem("memoriLastOrder");
            else localStorage.setItem("memoriLastOrder", oldOrder);
            if (oldCart === null) localStorage.removeItem("memoriCart");
            else localStorage.setItem("memoriCart", oldCart);
        } catch (rollbackError) {
            console.error("Could not restore checkout data after a failed order save.", rollbackError);
        }
        console.error("Could not save the order.", error);
        const summary = document.getElementById("order-summary");
        let errorMessage = summary?.querySelector(".checkout-error");
        if (summary && !errorMessage) {
            errorMessage = document.createElement("p");
            errorMessage.className = "checkout-error";
            errorMessage.setAttribute("role", "alert");
            summary.prepend(errorMessage);
        }
        if (errorMessage) errorMessage.textContent = "Không lưu được đơn hàng. Đơn chưa được đặt; vui lòng thử lại.";
        return;
    }

    if (confirmButton) {
        confirmButton.disabled = true;
        confirmButton.textContent = "Đang hoàn tất...";
    }
    window.location.href = "thanks.html";
}

document.addEventListener("DOMContentLoaded", () => {
    readCheckoutData();

    if (checkoutCart.length === 0) {
        window.location.replace("../cart/cart.html");
        return;
    }

    const dateInput = document.getElementById("date");
    if (dateInput) {
        const today = new Date();
        const offset = today.getTimezoneOffset();
        dateInput.min = new Date(today.getTime() - offset * 60000).toISOString().slice(0, 10);
    }

    document.getElementById("confirm-btn")?.addEventListener("click", confirmOrder);
    document.getElementById("checkout-form")?.addEventListener("submit", (event) => {
        event.preventDefault();
        confirmOrder();
    });
    document.querySelectorAll('input[name="payment"]').forEach((input) => {
        input.addEventListener("change", showQR);
    });
    renderCheckout();
});
