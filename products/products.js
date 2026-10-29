document.addEventListener("DOMContentLoaded", () => {
    const grid = document.querySelector(".products-grid");
    if (!grid) return;

    const cards = [...grid.querySelectorAll(".product-card")];
    const searchInput = document.getElementById("search");
    const sortSelect = document.getElementById("sort");
    const resultCount = document.querySelector(".result-count");
    const pagination = document.querySelector(".pagination");
    const pageSize = 9;
    let currentPage = 1;
    let visibleProducts = [...cards];

    const moneyValue = (text) => Number(String(text).replace(/[^\d]/g, "")) || 0;
    const slugify = (text) => text.trim().toLocaleLowerCase("vi-VN").replace(/\s+/g, "-");
    const getCardProduct = (card) => {
        const image = card.querySelector(".img-placeholder img");
        const name = card.querySelector("h3")?.textContent.trim() || "";
        const priceText = card.querySelector(".price-current")?.textContent || "";
        const price = moneyValue(priceText);
        const size = price >= 100000 && !/tart|cupcake|cookie|set/i.test(name)
            ? "Size S (16cm)"
            : "";

        return {
            id: `${slugify(name)}::${size.toLocaleLowerCase("vi-VN")}`,
            name,
            detail: size ? `Kích thước: ${size}` : "",
            size,
            price,
            quantity: 1,
            image: image ? new URL(image.getAttribute("src"), window.location.href).href : "",
            desc: card.querySelector(".desc")?.textContent.trim() || "",
            oldPrice: card.querySelector(".price-old")?.textContent.trim() || "",
            badge: card.querySelector(".badge")?.textContent.trim() || "",
            badgeClass: card.querySelector(".badge")?.className.replace("badge", "").trim() || "",
            stars: card.querySelector(".rating")?.childNodes[0]?.textContent.trim() || "",
            reviews: card.querySelector(".rating span")?.textContent.replace(/[()]/g, "") || "0",
        };
    };

    const categoryFor = (name, description) => {
        const text = `${name} ${description}`.toLocaleLowerCase("vi-VN");
        if (/cookie|biscuit|gift|quà/.test(text)) return "cookies";
        if (/bread|pastry|bánh mì|roll cake|roll/.test(text)) return "bread";
        if (/tart|cupcake/.test(text)) return "tart";
        if (/mousse|cheese|cheesecake/.test(text)) return "mousse";
        if (/moon|mooncake|trung thu|tết|season/.test(text)) return "seasonal";
        if (/slice|lát/.test(text)) return "slice";
        if (/mini|bento/.test(text)) return "mini";
        return "birthday";
    };

    cards.forEach((card) => {
        const product = getCardProduct(card);
        card.dataset.productName = product.name.toLocaleLowerCase("vi-VN");
        card.dataset.productPrice = String(product.price);
        card.dataset.productCategory = categoryFor(product.name, product.desc);
        card.dataset.supportsSizes = String(product.price >= 100000 && !/tart|cupcake|cookie|set/i.test(product.name));
        card.dataset.bestSeller = String(Boolean(card.querySelector(".best-seller")));

        const image = card.querySelector(".img-placeholder img");
        if (image) {
            image.tabIndex = 0;
            image.setAttribute("role", "link");
            image.setAttribute("aria-label", `Xem chi tiết ${product.name}`);
            image.style.cursor = "pointer";

            const openDetails = (event) => {
                if (event.type === "keydown" && event.key !== "Enter" && event.key !== " ") return;
                event.preventDefault();
                navigateToDetails(card, product);
            };
            image.addEventListener("click", openDetails);
            image.addEventListener("keydown", openDetails);
        }

        card.querySelector(".btn-detail")?.addEventListener("click", (event) => {
            event.preventDefault();
            navigateToDetails(card, product);
        });

        card.querySelector(".btn-add-cart")?.addEventListener("click", () => {
            addProductToCart(product);
        });

        const wishlistButton = card.querySelector(".btn-wishlist");
        if (wishlistButton) {
            wishlistButton.setAttribute("aria-pressed", "false");
            wishlistButton.addEventListener("click", () => {
                const isActive = wishlistButton.getAttribute("aria-pressed") !== "true";
                wishlistButton.setAttribute("aria-pressed", String(isActive));
                wishlistButton.classList.toggle("active", isActive);
            });
        }
    });

    function navigateToDetails(card, product) {
        try {
            localStorage.setItem("memoriProduct", JSON.stringify(product));
            const link = card.querySelector(".btn-detail");
            window.location.href = link?.href || "../product-detail/product-detail.html";
        } catch (error) {
            console.error("Could not save product details.", error);
            window.alert("Không thể mở chi tiết sản phẩm do trình duyệt không cho phép lưu dữ liệu.");
        }
    }

    function addProductToCart(product) {
        let cart;
        try {
            cart = JSON.parse(localStorage.getItem("memoriCart") || "[]");
            if (!Array.isArray(cart)) throw new TypeError("Cart data is not an array.");
        } catch (error) {
            console.error("Could not read the saved cart.", error);
            window.alert("Giỏ hàng đang bị lỗi dữ liệu. Vui lòng tải lại trang hoặc xóa dữ liệu giỏ hàng.");
            return;
        }

        const existing = cart.find((item) => item.id === product.id
            || item.name?.toLocaleLowerCase("vi-VN") === product.name.toLocaleLowerCase("vi-VN")
                && (item.size || "") === product.size);
        if (existing) {
            existing.quantity = Number(existing.quantity ?? existing.qty ?? 0) + 1;
            existing.id = product.id;
            existing.size = product.size;
            existing.detail = product.detail;
            existing.image = product.image;
            existing.price = product.price;
            delete existing.qty;
        } else {
            cart.push(product);
        }

        try {
            localStorage.setItem("memoriCart", JSON.stringify(cart));
            updateCartBadge(cart);
            showToast(`Đã thêm ${product.name} vào giỏ hàng.`);
        } catch (error) {
            console.error("Could not save the cart.", error);
            window.alert("Không thể lưu giỏ hàng. Hãy kiểm tra dung lượng lưu trữ của trình duyệt.");
        }
    }

    function updateCartBadge(cart) {
        const badge = document.querySelector(".cart-badge");
        if (badge) {
            badge.textContent = String(cart.reduce((sum, item) => sum + Number(item.quantity ?? item.qty ?? 0), 0));
        }
    }

    function showToast(message) {
        let toast = document.getElementById("product-toast");
        if (!toast) {
            toast = document.createElement("div");
            toast.id = "product-toast";
            toast.className = "product-toast";
            toast.setAttribute("role", "status");
            toast.setAttribute("aria-live", "polite");
            document.body.append(toast);
        }
        toast.textContent = message;
        toast.classList.add("is-visible");
        window.clearTimeout(showToast.timeoutId);
        showToast.timeoutId = window.setTimeout(() => toast.classList.remove("is-visible"), 2400);
    }

    const categoryInputs = [...document.querySelectorAll("[data-filter-group='categories'] input[type='checkbox']")];
    const allCategoriesInput = categoryInputs.find((input) => input.dataset.category === "all");
    const specificCategoryInputs = categoryInputs.filter((input) => input !== allCategoriesInput);
    const sizeInputs = [...document.querySelectorAll("[data-filter-group='sizes'] input[type='checkbox']")];

    allCategoriesInput?.addEventListener("change", () => {
        specificCategoryInputs.forEach((input) => {
            input.checked = false;
        });
        currentPage = 1;
        applyFilters();
    });
    specificCategoryInputs.forEach((input) => {
        input.addEventListener("change", () => {
            if (input.checked && allCategoriesInput) allCategoriesInput.checked = false;
            if (!specificCategoryInputs.some((filter) => filter.checked) && allCategoriesInput) {
                allCategoriesInput.checked = true;
            }
            currentPage = 1;
            applyFilters();
        });
    });
    sizeInputs.forEach((input) => {
        input.addEventListener("change", () => {
            currentPage = 1;
            applyFilters();
        });
    });

    document.querySelectorAll(".filter-group input[type='radio'][name='price']").forEach((input) => {
        input.addEventListener("change", () => {
            currentPage = 1;
            applyFilters();
        });
    });

    searchInput?.addEventListener("input", () => {
        currentPage = 1;
        applyFilters();
    });
    sortSelect?.addEventListener("change", applyFilters);

    function applyFilters() {
        const searchTerm = searchInput?.value.trim().toLocaleLowerCase("vi-VN") || "";
        const selectedCategories = specificCategoryInputs
            .filter((input) => input.checked)
            .map((input) => input.dataset.category);
        const selectedSizes = sizeInputs.filter((input) => input.checked);
        const priceInput = document.querySelector(".filter-group input[type='radio'][name='price']:checked");
        const priceLabel = priceInput?.closest("label")?.textContent || "";

        visibleProducts = cards.filter((card) => {
            const price = Number(card.dataset.productPrice);
            const categoryMatch = selectedCategories.length === 0 || selectedCategories.includes(card.dataset.productCategory);
            const sizeMatch = selectedSizes.length === 0 || card.dataset.supportsSizes === "true";
            const textMatch = `${card.dataset.productName} ${card.querySelector(".desc")?.textContent || ""}`
                .toLocaleLowerCase("vi-VN")
                .includes(searchTerm);
            const priceMatch = !priceLabel
                || priceLabel.includes("Dưới") && price < 100000
                || priceLabel.includes("100.000") && price >= 100000 && price < 300000
                || priceLabel.includes("300.000") && price >= 300000 && price <= 500000
                || priceLabel.includes("Trên") && price > 500000;
            return categoryMatch && sizeMatch && textMatch && priceMatch;
        });

        const sortLabel = sortSelect?.selectedOptions[0]?.textContent || "";
        if (sortLabel.includes("Thấp đến Cao")) {
            visibleProducts.sort((a, b) => Number(a.dataset.productPrice) - Number(b.dataset.productPrice));
        } else if (sortLabel.includes("Cao đến Thấp")) {
            visibleProducts.sort((a, b) => Number(b.dataset.productPrice) - Number(a.dataset.productPrice));
        } else if (sortLabel.includes("Bán chạy nhất")) {
            visibleProducts.sort((a, b) => Number(b.dataset.bestSeller === "true") - Number(a.dataset.bestSeller === "true"));
        }

        currentPage = Math.min(currentPage, Math.max(1, Math.ceil(visibleProducts.length / pageSize)));
        renderPage();
    }

    function renderPage() {
        const pageCount = Math.max(1, Math.ceil(visibleProducts.length / pageSize));
        const start = (currentPage - 1) * pageSize;
        const pageProducts = new Set(visibleProducts.slice(start, start + pageSize));
        cards.forEach((card) => {
            card.hidden = !pageProducts.has(card);
            card.style.display = card.hidden ? "none" : "flex";
        });

        if (resultCount) {
            resultCount.replaceChildren();
            const startText = document.createTextNode(visibleProducts.length ? `Hiển thị ${start + 1}–${Math.min(start + pageSize, visibleProducts.length)} trên ` : "Không tìm thấy sản phẩm trong ");
            const count = document.createElement("strong");
            count.textContent = String(visibleProducts.length);
            resultCount.append(startText, count, document.createTextNode(" sản phẩm"));
        }

        if (pagination) {
            const pageButtons = [...pagination.querySelectorAll("button")];
            pageButtons.forEach((button, index) => {
                if (index < 3) {
                    button.hidden = index >= pageCount;
                    button.textContent = String(index + 1);
                    button.classList.toggle("active", currentPage === index + 1);
                    button.setAttribute("aria-current", currentPage === index + 1 ? "page" : "false");
                } else {
                    button.hidden = pageCount <= 1;
                    button.disabled = currentPage >= pageCount;
                }
            });
        }
    }

    pagination?.addEventListener("click", (event) => {
        const button = event.target.closest("button");
        if (!button || button.disabled || button.hidden) return;

        const buttons = [...pagination.querySelectorAll("button")];
        const index = buttons.indexOf(button);
        currentPage = index === 3 ? Math.min(currentPage + 1, Math.ceil(visibleProducts.length / pageSize)) : index + 1;
        renderPage();
        document.querySelector(".toolbar")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });

    try {
        const cart = JSON.parse(localStorage.getItem("memoriCart") || "[]");
        if (Array.isArray(cart)) updateCartBadge(cart);
    } catch (error) {
        console.error("Could not update the cart badge.", error);
    }

    applyFilters();
});
