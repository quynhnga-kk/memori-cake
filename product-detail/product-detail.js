(() => {
    const box = document.getElementById("detail");
    const moneyValue = (value) => Number(String(value ?? "").replace(/[^\d]/g, "")) || 0;
    const formatMoney = (value) => `${value.toLocaleString("vi-VN")}đ`;
    const slugify = (value) => value.trim().toLocaleLowerCase("vi-VN").replace(/\s+/g, "-");

    let product;
    try {
        product = JSON.parse(localStorage.getItem("memoriProduct") || "null");
    } catch (error) {
        console.error("Could not read the selected product.", error);
    }

    if (!product || typeof product.name !== "string" || !product.name.trim()) {
        const emptyState = document.createElement("div");
        emptyState.className = "detail-empty";
        const title = document.createElement("h3");
        title.textContent = "Chưa chọn sản phẩm";
        const message = document.createElement("p");
        message.textContent = "Hãy chọn một chiếc bánh từ danh sách để xem chi tiết và đặt hàng.";
        const link = document.createElement("a");
        link.href = "../products/products.html";
        link.className = "btn-add-cart detail-btn";
        link.textContent = "Xem sản phẩm";
        emptyState.append(title, message, link);
        box?.replaceChildren(emptyState);
        return;
    }

    const basePrice = moneyValue(product.price);
    const baseOldPrice = moneyValue(product.oldPrice);
    if (basePrice <= 0) {
        console.error("The selected product has an invalid price.");
        box.textContent = "Thông tin giá sản phẩm không hợp lệ. Vui lòng quay lại danh sách bánh.";
        return;
    }

    const productName = product.name.trim();
    const supportsSizes = basePrice >= 100000 && !/tart|cupcake|cookie|set/i.test(productName);
    const sizes = [
        { label: "Mini (10cm)", rate: 0.5 },
        { label: "Size S (16cm)", rate: 1 },
        { label: "Size M (20cm)", rate: 1.4 },
        { label: "Size L (24cm)", rate: 1.8 },
    ];
    let selectedSize = supportsSizes ? (sizes.findIndex((size) => size.label === product.size) >= 0
        ? sizes.findIndex((size) => size.label === product.size)
        : 1) : -1;
    let quantity = 1;

    document.title = `${productName} | Memori Cake`;

    function currentPrice() {
        const rate = selectedSize < 0 ? 1 : sizes[selectedSize].rate;
        return Math.round(basePrice * rate / 1000) * 1000;
    }

    function setQuantity(value) {
        quantity = Math.min(99, Math.max(1, Number.parseInt(value, 10) || 1));
        render();
    }

    function appendText(parent, tag, className, value) {
        const element = document.createElement(tag);
        if (className) element.className = className;
        element.textContent = value;
        parent.append(element);
        return element;
    }

    function render() {
        const article = document.createElement("article");
        article.className = "detail-card";

        const imageBox = document.createElement("div");
        imageBox.className = "detail-image";
        if (product.badge) appendText(imageBox, "span", `badge ${product.badgeClass || ""}`.trim(), product.badge);

        const image = document.createElement("img");
        image.src = product.image || "";
        image.alt = productName;
        image.loading = "eager";
        image.addEventListener("error", () => {
            image.alt = `${productName} (ảnh chưa khả dụng)`;
        }, { once: true });
        imageBox.append(image);

        const info = document.createElement("div");
        info.className = "detail-info";
        appendText(info, "h1", "", productName);
        appendText(info, "div", "rating", `${product.stars || "★★★★★"} (${product.reviews || "0"} đánh giá)`);

        const priceBox = document.createElement("div");
        priceBox.className = "price-box";
        appendText(priceBox, "span", "price-current detail-price", formatMoney(currentPrice()));
        if (baseOldPrice) {
            const oldPrice = Math.round(baseOldPrice * (selectedSize < 0 ? 1 : sizes[selectedSize].rate) / 1000) * 1000;
            appendText(priceBox, "span", "price-old", formatMoney(oldPrice));
        }
        info.append(priceBox);
        appendText(info, "p", "detail-desc", product.desc || "Bánh tươi được làm thủ công từ nguyên liệu chọn lọc.");

        if (supportsSizes) {
            const sizeGroup = document.createElement("div");
            sizeGroup.className = "option-group";
            appendText(sizeGroup, "div", "filter-title", "Kích thước");
            const sizeList = document.createElement("div");
            sizeList.className = "size-list";
            sizes.forEach((size, index) => {
                const button = document.createElement("button");
                button.type = "button";
                button.className = `size-btn${index === selectedSize ? " active" : ""}`;
                button.textContent = size.label;
                button.setAttribute("aria-pressed", String(index === selectedSize));
                button.addEventListener("click", () => {
                    selectedSize = index;
                    render();
                });
                sizeList.append(button);
            });
            sizeGroup.append(sizeList);
            info.append(sizeGroup);
        }

        const quantityGroup = document.createElement("div");
        quantityGroup.className = "option-group";
        appendText(quantityGroup, "div", "filter-title", "Số lượng");
        const quantityBox = document.createElement("div");
        quantityBox.className = "qty-box";
        const decrease = document.createElement("button");
        decrease.type = "button";
        decrease.setAttribute("aria-label", "Giảm số lượng");
        decrease.textContent = "−";
        decrease.addEventListener("click", () => setQuantity(quantity - 1));
        const quantityInput = document.createElement("input");
        quantityInput.type = "number";
        quantityInput.id = "qty";
        quantityInput.min = "1";
        quantityInput.max = "99";
        quantityInput.value = String(quantity);
        quantityInput.setAttribute("aria-label", "Số lượng bánh");
        quantityInput.addEventListener("change", () => setQuantity(quantityInput.value));
        const increase = document.createElement("button");
        increase.type = "button";
        increase.setAttribute("aria-label", "Tăng số lượng");
        increase.textContent = "+";
        increase.addEventListener("click", () => setQuantity(quantity + 1));
        quantityBox.append(decrease, quantityInput, increase);
        quantityGroup.append(quantityBox);
        info.append(quantityGroup);

        const total = document.createElement("p");
        total.className = "detail-total";
        total.append(document.createTextNode("Tạm tính: "));
        appendText(total, "strong", "", formatMoney(currentPrice() * quantity));
        info.append(total);

        const actions = document.createElement("div");
        actions.className = "card-actions detail-actions";
        const buyButton = document.createElement("button");
        buyButton.type = "button";
        buyButton.className = "btn-detail detail-btn";
        buyButton.textContent = "Mua ngay";
        buyButton.addEventListener("click", () => {
            if (addToCart()) window.location.href = "../cart/cart.html";
        });
        const addButton = document.createElement("button");
        addButton.type = "button";
        addButton.className = "btn-add-cart detail-btn";
        addButton.textContent = "Thêm vào giỏ";
        addButton.addEventListener("click", () => {
            if (addToCart()) window.alert(`Đã thêm ${productName} vào giỏ hàng.`);
        });
        actions.append(buyButton, addButton);
        info.append(actions);

        const meta = document.createElement("ul");
        meta.className = "detail-meta";
        appendText(meta, "li", "", `Thành phần: ${product.ingredients || "Bột mì, trứng, sữa, bơ và nguyên liệu tươi chọn lọc."}`);
        appendText(meta, "li", "", `Bảo quản: ${product.storage || "Bảo quản ngăn mát, dùng ngon nhất trong 1–3 ngày."}`);
        appendText(meta, "li", "", "Giao hàng: Nội thành Hà Nội; vui lòng đặt trước để tiệm chuẩn bị bánh tươi.");
        info.append(meta);

        article.append(imageBox, info);
        box.replaceChildren(article);
    }

    function addToCart() {
        let cart;
        try {
            cart = JSON.parse(localStorage.getItem("memoriCart") || "[]");
            if (!Array.isArray(cart)) throw new TypeError("Cart data is not an array.");
        } catch (error) {
            console.error("Could not read the cart.", error);
            window.alert("Giỏ hàng đang lỗi dữ liệu. Vui lòng tải lại trang hoặc xóa dữ liệu giỏ hàng.");
            return false;
        }

        const size = selectedSize < 0 ? "" : sizes[selectedSize].label;
        const id = `${slugify(productName)}::${size.toLocaleLowerCase("vi-VN")}`;
        const existing = cart.find((item) => item.id === id
            || item.name?.toLocaleLowerCase("vi-VN") === productName.toLocaleLowerCase("vi-VN")
                && (item.size || "") === size);

        if (existing) {
            existing.id = id;
            existing.name = productName;
            existing.detail = size ? `Kích thước: ${size}` : "";
            existing.size = size;
            existing.price = currentPrice();
            existing.quantity = Number(existing.quantity ?? existing.qty ?? 0) + quantity;
        } else {
            cart.push({
                id,
                name: productName,
                detail: size ? `Kích thước: ${size}` : "",
                size,
                price: currentPrice(),
                quantity,
                image: product.image || "",
            });
        }

        try {
            localStorage.setItem("memoriCart", JSON.stringify(cart));
            const badge = document.getElementById("cartBadge");
            if (badge) badge.textContent = String(cart.reduce((sum, item) => sum + Number(item.quantity ?? item.qty ?? 0), 0));
            return true;
        } catch (error) {
            console.error("Could not save the cart.", error);
            window.alert("Không thể lưu giỏ hàng. Hãy kiểm tra dung lượng lưu trữ của trình duyệt.");
            return false;
        }
    }

    render();
    try {
        const cart = JSON.parse(localStorage.getItem("memoriCart") || "[]");
        const badge = document.getElementById("cartBadge");
        if (badge && Array.isArray(cart)) {
            badge.textContent = String(cart.reduce((sum, item) => sum + Number(item.quantity ?? item.qty ?? 0), 0));
        }
    } catch (error) {
        console.error("Could not update cart badge.", error);
    }
})();
