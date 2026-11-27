const productCards = Array.from(document.querySelectorAll(".product-card"));
const productsPerPage = 9;
let currentPage = 1;
let visibleCards = [...productCards];

function getCart() {
    try {
        const cart = JSON.parse(localStorage.getItem("memoriCart") || "[]");
        return Array.isArray(cart) ? cart : [];
    } catch (error) {
        console.error("Không thể đọc giỏ hàng:", error);
        return [];
    }
}

function saveCart(cart) {
    localStorage.setItem("memoriCart", JSON.stringify(cart));
}

function getCartQuantity(cart) {
    return cart.reduce((total, item) => total + Number(item.quantity ?? item.qty ?? 0), 0);
}

function updateCartBadge() {
    document.querySelectorAll(".cart-badge").forEach((badge) => {
        badge.textContent = getCartQuantity(getCart());
    });
}

function toNumber(price) {
    return Number(String(price).replace(/\D/g, "")) || 0;
}

function getCardText(card) {
    return card.textContent.toLowerCase();
}

function getCategory(card) {
    const text = getCardText(card);
    if (/(bento|mini)/.test(text)) return "Bánh Mini / Bento";
    if (/(cupcake|tart)/.test(text)) return "Cupcake & Tart";
    if (/(mousse|cheesecake)/.test(text)) return "Bánh Mousse & Cheesecakes";
    if (/(trung thu|tết|tet)/.test(text)) return "Bánh Theo Mùa / Tết";
    if (/(cookie|gift)/.test(text)) return "Cookies & Gift";
    if (/(slice)/.test(text)) return "Slice Cake";
    if (/(bread|croissant|pastry|bánh mì)/.test(text)) return "Bread & Pastry";
    return "Bánh sinh nhật";
}

function getSelectedCategoryValues() {
    const inputs = Array.from(document.querySelectorAll(".filter-group:nth-of-type(2) input[type=\"checkbox\"]"));
    const selected = inputs.filter((input) => input.checked).map((input) => input.parentElement.textContent.trim());
    if (selected.length === 0 || selected.some((value) => value.startsWith("Tất cả"))) return null;
    return selected.map((value) => value.replace(/\s*\(\d+\)\s*$/, "").trim());
}

function getPriceRange(card) {
    const price = toNumber(card.querySelector(".price-current")?.textContent);
    const selected = document.querySelector(".filter-group:nth-of-type(3) input[type=\"radio\"]:checked");
    if (!selected) return true;
    const label = selected.parentElement.textContent.trim();
    if (label.includes("Dưới")) return price < 100000;
    if (label.includes("100.000đ - 300.000đ")) return price >= 100000 && price <= 300000;
    if (label.includes("300.000đ - 500.000đ")) return price > 300000 && price <= 500000;
    if (label.includes("Trên")) return price > 500000;
    return true;
}

function getSelectedSizes() {
    return Array.from(document.querySelectorAll(".filter-group:nth-of-type(4) input[type=\"checkbox\"]:checked"))
        .map((input) => input.parentElement.textContent.trim());
}

function matchesSize(card, selectedSizes) {
    if (!selectedSizes.length) return true;
    const text = getCardText(card);
    return selectedSizes.some((size) => {
        if (size.startsWith("Mini")) return text.includes("mini") || text.includes("tart") || text.includes("cupcake");
        if (size.startsWith("Size S")) return toNumber(card.querySelector(".price-current")?.textContent) >= 100000;
        if (size.startsWith("Size M")) return toNumber(card.querySelector(".price-current")?.textContent) >= 250000;
        if (size.startsWith("Size L")) return toNumber(card.querySelector(".price-current")?.textContent) >= 300000;
        return true;
    });
}

function applyFilters() {
    const search = document.querySelector("#search")?.value.trim().toLowerCase() || "";
    const categories = getSelectedCategoryValues();
    const selectedSizes = getSelectedSizes();

    visibleCards = productCards.filter((card) => {
        const name = card.querySelector("h3")?.textContent.toLowerCase() || "";
        const desc = card.querySelector(".desc")?.textContent.toLowerCase() || "";
        const matchesSearch = !search || name.includes(search) || desc.includes(search);
        const matchesCategory = !categories || categories.some((category) => getCategory(card) === category);
        return matchesSearch && matchesCategory && getPriceRange(card) && matchesSize(card, selectedSizes);
    });

    applySorting();
    currentPage = 1;
    renderPage();
}

function applySorting() {
    const sortValue = document.querySelector("#sort")?.value;
    visibleCards.sort((a, b) => {
        const priceA = toNumber(a.querySelector(".price-current")?.textContent);
        const priceB = toNumber(b.querySelector(".price-current")?.textContent);
        if (sortValue === "Giá: Thấp đến Cao") return priceA - priceB;
        if (sortValue === "Giá: Cao đến Thấp") return priceB - priceA;
        if (sortValue === "Bán chạy nhất") {
            const soldA = Number(a.querySelector(".rating span")?.textContent.replace(/\D/g, "") || 0);
            const soldB = Number(b.querySelector(".rating span")?.textContent.replace(/\D/g, "") || 0);
            return soldB - soldA;
        }
        return productCards.indexOf(a) - productCards.indexOf(b);
    });
}

function renderPage() {
    const totalPages = Math.max(1, Math.ceil(visibleCards.length / productsPerPage));
    currentPage = Math.min(currentPage, totalPages);
    const start = (currentPage - 1) * productsPerPage;
    const end = start + productsPerPage;

    productCards.forEach((card) => { card.style.display = "none"; });
    visibleCards.slice(start, end).forEach((card) => { card.style.display = "flex"; });

    const resultCount = document.querySelector(".result-count");
    if (resultCount) {
        if (!visibleCards.length) {
            resultCount.innerHTML = "Không tìm thấy <strong>0</strong> sản phẩm";
        } else {
            resultCount.innerHTML = `Hiển thị <strong>${start + 1}–${Math.min(end, visibleCards.length)}</strong> trên <strong>${visibleCards.length}</strong> sản phẩm`;
        }
    }

    const pagination = document.querySelector(".pagination");
    if (!pagination) return;
    pagination.innerHTML = "";
    for (let page = 1; page <= totalPages; page += 1) {
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = page;
        button.classList.toggle("active", page === currentPage);
        button.addEventListener("click", () => {
            currentPage = page;
            renderPage();
            window.scrollTo({ top: 0, behavior: "smooth" });
        });
        pagination.appendChild(button);
    }
}

document.querySelector("#search")?.addEventListener("input", applyFilters);
document.querySelectorAll(".filter-options input").forEach((input) => {
    input.addEventListener("change", () => {
        if (input.type === "checkbox" && input.closest(".filter-group")?.querySelector(".filter-title")?.textContent === "Danh mục bánh") {
            const allCheckbox = input.closest(".filter-options")?.querySelector("input");
            if (allCheckbox && input !== allCheckbox && input.checked) allCheckbox.checked = false;
            if (allCheckbox && input === allCheckbox && allCheckbox.checked) {
                allCheckbox.closest(".filter-options").querySelectorAll("input").forEach((item) => {
                    if (item !== allCheckbox) item.checked = false;
                });
            }
        }
        applyFilters();
    });
});
document.querySelector("#sort")?.addEventListener("change", applyFilters);

function createProductId(card) {
    const name = card.querySelector("h3")?.textContent.trim() || "san-pham";
    return name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function updateWishlistState() {
    let wishlist = [];
    try { wishlist = JSON.parse(localStorage.getItem("memoriWishlist") || "[]"); } catch (error) { wishlist = []; }
    productCards.forEach((card) => {
        const button = card.querySelector(".btn-wishlist");
        if (!button) return;
        const active = wishlist.includes(createProductId(card));
        button.classList.toggle("active", active);
        button.setAttribute("aria-pressed", String(active));
    });
}

productCards.forEach((card) => {
    const wishlistButton = card.querySelector(".btn-wishlist");
    wishlistButton?.addEventListener("click", () => {
        const id = createProductId(card);
        let wishlist = [];
        try { wishlist = JSON.parse(localStorage.getItem("memoriWishlist") || "[]"); } catch (error) { wishlist = []; }
        wishlist = wishlist.includes(id) ? wishlist.filter((item) => item !== id) : [...wishlist, id];
        localStorage.setItem("memoriWishlist", JSON.stringify(wishlist));
        updateWishlistState();
    });

    card.querySelector(".btn-add-cart")?.addEventListener("click", () => {
        const cart = getCart();
        const id = createProductId(card);
        const existing = cart.find((item) => (item.id || item.name) === id);
        if (existing) {
            existing.quantity = Number(existing.quantity ?? existing.qty ?? 0) + 1;
            delete existing.qty;
        } else {
            cart.push({
                id,
                name: card.querySelector("h3")?.textContent.trim() || "",
                detail: "",
                image: card.querySelector(".img-placeholder img")?.getAttribute("src") || "",
                price: toNumber(card.querySelector(".price-current")?.textContent),
                quantity: 1
            });
        }
        saveCart(cart);
        updateCartBadge();
        const button = card.querySelector(".btn-add-cart");
        const originalText = button.textContent;
        button.textContent = "Đã thêm ✓";
        button.disabled = true;
        window.setTimeout(() => {
            button.textContent = originalText;
            button.disabled = false;
        }, 900);
    });
});

document.querySelectorAll(".product-card").forEach((card) => {
    const link = card.querySelector(".btn-detail");
    link?.addEventListener("click", (event) => {
        event.preventDefault();

        const img = card.querySelector(".img-placeholder img");
        const rating = card.querySelector(".rating");
        const badge = card.querySelector(".badge");
        const product = {
            name: card.querySelector("h3")?.textContent.trim() || "",
            image: img?.getAttribute("src") || "",
            desc: card.querySelector(".desc")?.textContent.replace(/[“”"]/g, "").trim() || "",
            price: card.querySelector(".price-current")?.textContent.trim() || "0đ",
            oldPrice: card.querySelector(".price-old")?.textContent.trim() || "",
            badge: badge?.textContent.trim() || "",
            badgeClass: badge ? badge.className.replace("badge", "").trim() : "",
            stars: rating?.childNodes[0]?.textContent.trim() || "★★★★★",
            reviews: rating?.querySelector("span")?.textContent.replace(/\D/g, "") || "0"
        };
        localStorage.setItem("memoriProduct", JSON.stringify(product));
    });
});

updateWishlistState();
updateCartBadge();
renderPage();
