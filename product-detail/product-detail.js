
const params = new URLSearchParams(window.location.search);
const productId = params.get("id");

const products = document.querySelectorAll(".product");

products.forEach((product, index) => {
    if (productId) {
        product.style.display =
            index + 1 === Number(productId) ? "grid" : "none";
    } else {
        product.style.display = index === 0 ? "grid" : "none";
    }
});
(function () {
    var box = document.getElementById('detail');

    // ---- Lấy sản phẩm đã lưu khi bấm "Chi tiết" ----
    var product = null;
    try { product = JSON.parse(localStorage.getItem('memoriProduct')); } catch (e) {}

    if (!product) {
        box.innerHTML =
            '<div class="detail-empty">' +
            '<h3>Không tìm thấy sản phẩm</h3>' +
            '<p>Vui lòng quay lại danh sách và chọn lại bánh bạn muốn xem.</p>' +
            '<a href="../products/products.html" class="btn-add-cart detail-btn">Về trang sản phẩm</a>' +
            '</div>';
        return;
    }

    document.title = product.name + ' | Memori Cake';

    // ---- Thông tin thêm cho từng bánh (tùy chọn) ----
    // Khóa = tên bánh viết thường. Bánh nào không có sẽ dùng thông tin mặc định.
    var EXTRA = {
        'strawberry cloud': {
            ingredients: 'Bột mì, trứng gà, sữa tươi, kem tươi, dâu tây Đà Lạt, đường',
            storage: 'Bảo quản ngăn mát 2–6°C, dùng ngon nhất trong 2 ngày.'
        },
        'chocolate dream': {
            ingredients: 'Chocolate Bỉ, bột mì, trứng gà, bơ, kem tươi, cacao',
            storage: 'Bảo quản ngăn mát 2–6°C, dùng trong 3 ngày.'
        },
        'tiramisu classic': {
            ingredients: 'Mascarpone, cà phê Espresso, bánh Ladyfinger, trứng, bột cacao',
            storage: 'Bảo quản ngăn mát, dùng trong 2 ngày.'
        }
    };

    var DEFAULT_INFO = {
        ingredients: 'Bột mì, trứng gà, sữa tươi, bơ, đường và các nguyên liệu tươi chọn lọc.',
        storage: 'Bảo quản ngăn mát 2–6°C, nên dùng trong 1–3 ngày.'
    };
    var info = EXTRA[product.name.toLowerCase()] || DEFAULT_INFO;

    // ---- Xử lý giá & kích thước ----
    function toNumber(str) { return parseInt(String(str).replace(/\D/g, ''), 10) || 0; }
    function toMoney(n) { return n.toLocaleString('vi-VN') + 'đ'; }

    var basePrice = toNumber(product.price);
    var baseOld = toNumber(product.oldPrice);

    // Chỉ bánh từ 100.000đ trở lên mới có chọn size (mini/cupcake/tart thì không)
    var hasSize = basePrice >= 100000;
    var SIZES = [
        { label: 'Mini (10cm)', rate: 0.5 },
        { label: 'Size S (16cm)', rate: 1 },
        { label: 'Size M (20cm)', rate: 1.4 },
        { label: 'Size L (24cm)', rate: 1.8 }
    ];
    var sizeIndex = 1;
    var qty = 1;

    // ---- Dựng giao diện ----
    function render() {
        var rate = hasSize ? SIZES[sizeIndex].rate : 1;
        var price = Math.round(basePrice * rate / 1000) * 1000;
        var old = baseOld ? Math.round(baseOld * rate / 1000) * 1000 : 0;

        var sizeHTML = '';
        if (hasSize) {
            sizeHTML = '<div class="option-group"><div class="filter-title">Kích thước</div><div class="size-list">';
            SIZES.forEach(function (s, i) {
                sizeHTML += '<button type="button" class="size-btn' + (i === sizeIndex ? ' active' : '') +
                    '" data-size="' + i + '">' + s.label + '</button>';
            });
            sizeHTML += '</div></div>';
        }

        box.innerHTML =
            '<article class="detail-card">' +
                '<div class="detail-image">' +
                    (product.badge ? '<span class="badge ' + product.badgeClass + '">' + product.badge + '</span>' : '') +
                    '<img src="' + product.image + '" alt="' + product.name + '">' +
                '</div>' +
                '<div class="detail-info">' +
                    '<h1>' + product.name + '</h1>' +
                    '<div class="rating">' + product.stars + ' <span>(' + product.reviews + ' đánh giá)</span></div>' +
                    '<div class="price-box">' +
                        '<span class="price-current detail-price">' + toMoney(price * 1) + '</span>' +
                        (old ? '<span class="price-old">' + toMoney(old) + '</span>' : '') +
                    '</div>' +
                    '<p class="detail-desc">' + product.desc + '</p>' +
                    sizeHTML +
                    '<div class="option-group">' +
                        '<div class="filter-title">Số lượng</div>' +
                        '<div class="qty-box">' +
                            '<button type="button" id="qtyMinus" aria-label="Giảm">−</button>' +
                            '<input type="number" id="qty" value="' + qty + '" min="1" max="99">' +
                            '<button type="button" id="qtyPlus" aria-label="Tăng">+</button>' +
                        '</div>' +
                    '</div>' +
                    '<p class="detail-total">Tạm tính: <strong>' + toMoney(price * qty) + '</strong></p>' +
                    '<div class="card-actions detail-actions">' +
                        '<button type="button" class="btn-detail detail-btn" id="btnBuy">Mua ngay</button>' +
                        '<button type="button" class="btn-add-cart detail-btn" id="btnAdd">Thêm vào giỏ</button>' +
                    '</div>' +
                    '<ul class="detail-meta">' +
                        '<li><strong>Thành phần:</strong> ' + info.ingredients + '</li>' +
                        '<li><strong>Bảo quản:</strong> ' + info.storage + '</li>' +
                        '<li><strong>Giao hàng:</strong> Nội thành Hà Nội trong ngày, đặt trước 1 ngày với bánh sinh nhật.</li>' +
                    '</ul>' +
                '</div>' +
            '</article>';

        bindEvents(price);
    }

    function bindEvents(price) {
        document.querySelectorAll('.size-btn').forEach(function (b) {
            b.addEventListener('click', function () {
                sizeIndex = parseInt(b.dataset.size, 10);
                render();
            });
        });

        var qtyInput = document.getElementById('qty');
        function setQty(v) {
            qty = Math.min(99, Math.max(1, v || 1));
            render();
        }
        document.getElementById('qtyMinus').addEventListener('click', function () { setQty(qty - 1); });
        document.getElementById('qtyPlus').addEventListener('click', function () { setQty(qty + 1); });
        qtyInput.addEventListener('change', function () { setQty(parseInt(qtyInput.value, 10)); });

        document.getElementById('btnAdd').addEventListener('click', function () {
            addToCart(price);
            alert('Đã thêm "' + product.name + '" vào giỏ hàng!');
        });
        document.getElementById('btnBuy').addEventListener('click', function () {
            addToCart(price);
            window.location.href = '../cart/cart.html';
        });
    }

    // ---- Giỏ hàng (localStorage) ----
    function getCart() {
        try { return JSON.parse(localStorage.getItem('memoriCart')) || []; } catch (e) { return []; }
    }

    function addToCart(price) {
        var cart = getCart();
        var size = hasSize ? SIZES[sizeIndex].label : '';
        var found = cart.find(function (i) { return i.name === product.name && i.size === size; });

        if (found) {
            found.qty += qty;
        } else {
            cart.push({ name: product.name, image: product.image, size: size, price: price, qty: qty });
        }
        localStorage.setItem('memoriCart', JSON.stringify(cart));
        updateBadge();
    }

    function updateBadge() {
        var total = getCart().reduce(function (s, i) { return s + i.qty; }, 0);
        document.getElementById('cartBadge').textContent = total;
    }

    updateBadge();
    render();
})();