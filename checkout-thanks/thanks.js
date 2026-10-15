function formatPrice(num) {
        return num.toLocaleString("vi-VN") + "đ";
    }

    function formatDate(dateStr) {
        if (!dateStr) return "—";
        const d = new Date(dateStr);
        return d.toLocaleDateString("vi-VN");
    }

    function renderOrderInfo() {
        const orderData = localStorage.getItem("memoriLastOrder");
        const container = document.getElementById("order-details");
        const orderInfoBox = document.getElementById("order-info");

        if (!orderData) {
            // Không có đơn hàng → ẩn phần chi tiết
            orderInfoBox.style.display = "none";
            return;
        }

        const order = JSON.parse(orderData);
        const customer = order.customer || {};
        const cart = order.cart || [];
        const checkoutInfo = order.checkoutInfo || {};
        const discountPercent = order.discountPercent || 0;

        // Tính toán
        const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
        const shipping = checkoutInfo.shippingFee || 0;
        const discountAmount = Math.round(subtotal * discountPercent / 100);
        const total = subtotal + shipping - discountAmount;

        // Phương thức thanh toán
        const paymentMap = {
            bank: "Chuyển khoản ngân hàng",
            card: "Thẻ tín dụng / ghi nợ",
            momo: "Ví điện tử",
            cod: "Thanh toán khi nhận hàng (COD)"
        };

        let itemsHtml = cart.map(item => `
            <div class="order-item">
                <span>${item.name} × ${item.quantity}</span>
                <span>${formatPrice(item.price * item.quantity)}</span>
            </div>
        `).join("");

        container.innerHTML = `
            <div class="info-row">
                <span class="label">Người nhận</span>
                <span class="value">${customer.fullname || "—"}</span>
            </div>
            <div class="info-row">
                <span class="label">Số điện thoại</span>
                <span class="value">${customer.phone || "—"}</span>
            </div>
            <div class="info-row">
                <span class="label">Địa chỉ</span>
                <span class="value">${customer.address || "—"}</span>
            </div>
            <div class="info-row">
                <span class="label">Ngày nhận</span>
                <span class="value">${customer.date || "—"} • ${customer.time || ""}</span>
            </div>
            <div class="info-row">
                <span class="label">Thanh toán</span>
                <span class="value">${paymentMap[order.payment] || order.payment}</span>
            </div>

            <div class="order-items">
                ${itemsHtml}
            </div>

            <div class="total-line">
                <span>Tổng cộng</span>
                <span>${formatPrice(total)}</span>
            </div>
        `;
    }

    document.addEventListener("DOMContentLoaded", renderOrderInfo);