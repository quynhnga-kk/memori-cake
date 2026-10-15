// ==================== CART LOGIC ====================
        // Dữ liệu mẫu (khi chưa có gì trong localStorage)
        const sampleProducts = [
            {
                id: 1,
                name: "Strawberry Cake",
                detail: "Size: 16cm | Vị: Dâu",
                price: 250000,
                quantity: 1,
                image: ""          // để trống hoặc điền link ảnh
            },
            {
                id: 2,
                name: "Chocolate Cake",
                detail: "Size: 18cm | Vị: Chocolate",
                price: 280000,
                quantity: 2,
                image: ""
            }
        ];

        // Lấy giỏ hàng từ localStorage
        function getCart() {
            const cart = localStorage.getItem("memoriCart");
            if (cart) {
                return JSON.parse(cart);
            }
            // Nếu chưa có thì dùng dữ liệu mẫu + lưu lại
            localStorage.setItem("memoriCart", JSON.stringify(sampleProducts));
            return sampleProducts;
        }

        // Lưu giỏ hàng
        function saveCart(cart) {
            localStorage.setItem("memoriCart", JSON.stringify(cart));
        }

        // Format tiền
        function formatPrice(num) {
            return num.toLocaleString("vi-VN") + "đ";
        }

        // Render lại toàn bộ giỏ hàng
        function renderCart() {
            const cart = getCart();
            const container = document.getElementById("cart-items");
            const emptyEl = document.getElementById("empty-cart");
            const headerEl = document.getElementById("cart-header");
            const bottomEl = document.getElementById("cart-bottom");
            const countEl = document.getElementById("cart-count");

            // Cập nhật số lượng trên header
            const totalQty = cart.reduce((sum, item) => sum + item.quantity, 0);
            countEl.textContent = totalQty;

            if (cart.length === 0) {
                container.innerHTML = "";
                emptyEl.style.display = "block";
                headerEl.style.display = "none";
                bottomEl.style.display = "none";
                return;
            }

            emptyEl.style.display = "none";
            headerEl.style.display = "grid";
            bottomEl.style.display = "flex";

            container.innerHTML = cart.map(item => `
                <div class="cart-item" data-id="${item.id}">
                    <div class="product-info">
                        <div class="product-image">
                            ${item.image 
                                ? `<img src="${item.image}" alt="${item.name}">` 
                                : "Ảnh bánh"}
                        </div>
                        <div>
                            <div class="product-name">${item.name}</div>
                            <div class="product-detail">${item.detail}</div>
                        </div>
                    </div>

                    <div class="price">${formatPrice(item.price)}</div>

                    <div class="quantity">
                        <button onclick="changeQty(${item.id}, -1)">−</button>
                        <span>${item.quantity}</span>
                        <button onclick="changeQty(${item.id}, 1)">+</button>
                    </div>

                    <div class="price">${formatPrice(item.price * item.quantity)}</div>

                    <button class="remove-btn" onclick="removeItem(${item.id})">Xóa</button>
                </div>
            `).join("");

            updateSummary();
        }

        // Thay đổi số lượng
        function changeQty(id, delta) {
            let cart = getCart();
            const item = cart.find(p => p.id === id);
            if (!item) return;

            item.quantity += delta;
            if (item.quantity < 1) item.quantity = 1;

            saveCart(cart);
            renderCart();
        }

        // Xóa sản phẩm
        function removeItem(id) {
            let cart = getCart();
            cart = cart.filter(p => p.id !== id);
            saveCart(cart);
            renderCart();
        }

        // Tính tổng + phí ship
        let shippingFee = 30000;

        function updateShipping() {
            const delivery = document.querySelector('input[name="delivery"]:checked').value;
            shippingFee = delivery === "delivery" ? 30000 : 0;

            // Active class
            document.getElementById("opt-delivery").classList.toggle("active", delivery === "delivery");
            document.getElementById("opt-pickup").classList.toggle("active", delivery === "pickup");

            updateSummary();
        }

        function updateSummary() {
            const cart = getCart();
            const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
            const total = subtotal + shippingFee;

            document.getElementById("subtotal").textContent = formatPrice(subtotal);
            document.getElementById("shipping").textContent = shippingFee === 0 ? "Miễn phí" : formatPrice(shippingFee);
            document.getElementById("total").textContent = formatPrice(total);

            // Disable nút thanh toán nếu giỏ trống
            document.getElementById("checkout-btn").disabled = cart.length === 0;
        }

        // Mã giảm giá (demo)
        function applyCoupon() {
            const code = document.getElementById("coupon-code").value.trim().toUpperCase();
            if (code === "MEMORI10") {
                alert("Áp dụng thành công mã giảm 10%!");
                // Bạn có thể mở rộng logic giảm giá ở đây
            } else if (code) {
                alert("Mã giảm giá không hợp lệ!");
            }
        }

        // Chuyển sang trang thanh toán
        function goCheckout() {
            const cart = getCart();
            if (cart.length === 0) return;

            // Lưu thêm ghi chú + phương thức nhận hàng
            const note = document.getElementById("shop-note").value;
            const delivery = document.querySelector('input[name="delivery"]:checked').value;

            localStorage.setItem("memoriCheckout", JSON.stringify({
                note,
                delivery,
                shippingFee
            }));

            window.location.href = "../checkout/checkout.html";
        }

        // ==================== HÀM DÙNG CHO TRANG SẢN PHẨM ====================
        // Gọi hàm này từ products.html khi bấm "Thêm vào giỏ"
        function addToCart(product) {
            /*
                product = {
                    id: số,
                    name: "Tên bánh",
                    detail: "Size: ... | Vị: ...",
                    price: 250000,
                    image: "đường dẫn ảnh (có thể để trống)"
                }
            */
            let cart = getCart();
            const existing = cart.find(p => p.id === product.id);

            if (existing) {
                existing.quantity += 1;
            } else {
                cart.push({ ...product, quantity: 1 });
            }

            saveCart(cart);
            // Nếu đang ở trang giỏ hàng thì render lại
            if (document.getElementById("cart-items")) {
                renderCart();
            }
        }

        // Khởi tạo khi load trang
        document.addEventListener("DOMContentLoaded", () => {
            renderCart();
        });