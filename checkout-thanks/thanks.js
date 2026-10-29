document.addEventListener("DOMContentLoaded", () => {
    const container = document.getElementById("order-details");
    const orderInfo = document.getElementById("order-info");
    if (!container || !orderInfo) return;

    let order;
    try {
        order = JSON.parse(localStorage.getItem("memoriLastOrder") || "null");
    } catch (error) {
        console.error("Could not read the saved order.", error);
    }

    if (!order || !Array.isArray(order.cart) || order.cart.length === 0) {
        orderInfo.hidden = true;
        const title = document.querySelector(".thankyou-card > h1");
        const subtitle = document.querySelector(".thankyou-card > .subtitle");
        if (title) title.textContent = "Chưa tìm thấy đơn hàng";
        if (subtitle) subtitle.textContent = "Bạn chưa hoàn tất đặt hàng trên trình duyệt này. Hãy quay lại giỏ hàng để tiếp tục.";
        return;
    }

    const formatPrice = (value) => `${Number(value || 0).toLocaleString("vi-VN")}đ`;
    const paymentNames = {
        bank: "Chuyển khoản ngân hàng (chờ cửa hàng xác nhận)",
        card: "Thẻ (bản mô phỏng, chưa xử lý thanh toán)",
        momo: "Ví điện tử (bản mô phỏng, chưa xử lý thanh toán)",
        cod: "Thanh toán khi nhận hàng",
    };

    function addInfoRow(labelText, valueText) {
        const row = document.createElement("div");
        row.className = "info-row";
        const label = document.createElement("span");
        label.className = "label";
        label.textContent = labelText;
        const value = document.createElement("span");
        value.className = "value";
        value.textContent = valueText || "—";
        row.append(label, value);
        container.append(row);
    }

    const customer = order.customer || {};
    addInfoRow("Mã đơn hàng", order.id);
    addInfoRow("Người nhận", customer.fullname);
    addInfoRow("Số điện thoại", customer.phone);
    addInfoRow("Địa chỉ / nhận tại", customer.address);
    addInfoRow("Ngày nhận", [customer.date, customer.time].filter(Boolean).join(" • "));
    addInfoRow("Thanh toán", paymentNames[order.payment] || order.payment);

    const items = document.createElement("div");
    items.className = "order-items";
    order.cart.forEach((item) => {
        const row = document.createElement("div");
        row.className = "order-item";
        const name = document.createElement("span");
        name.textContent = `${item.name} × ${item.quantity}`;
        const price = document.createElement("span");
        price.textContent = formatPrice(Number(item.price) * Number(item.quantity));
        row.append(name, price);
        items.append(row);
    });
    container.append(items);

    const shippingFee = Number(order.checkoutInfo?.shippingFee) || 0;
    const discount = Number(order.discountAmount)
        || Math.round(order.cart.reduce((sum, item) => sum + Number(item.price) * Number(item.quantity), 0)
            * Number(order.discountPercent || 0) / 100);
    const total = Number.isFinite(Number(order.total))
        ? Number(order.total)
        : order.cart.reduce((sum, item) => sum + Number(item.price) * Number(item.quantity), 0) + shippingFee - discount;

    if (shippingFee > 0) addInfoRow("Phí giao hàng", formatPrice(shippingFee));
    if (discount > 0) addInfoRow("Giảm giá", `-${formatPrice(discount)}`);
    addInfoRow("Tổng cộng", formatPrice(total));

    if (customer.note) addInfoRow("Ghi chú", customer.note);
});
