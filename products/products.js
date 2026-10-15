const products = document.querySelectorAll(".product-card");
const productsPerPage = 9;
let currentPage = 1;

function showPage(page) {
    currentPage = page;

    const start = (page - 1) * productsPerPage;
    const end = start + productsPerPage;

    products.forEach((product, index) => {
        const resultCount = document.querySelector(".result-count");

const total = products.length;
const from = start + 1;
const to = Math.min(end, total);

resultCount.innerHTML =
    `Hiển thị <strong>${from}–${to}</strong> trên <strong>${total}</strong> sản phẩm`;
        product.style.display =
            index >= start && index < end ? "flex" : "none";
    });
}

showPage(1);
const pageButtons = document.querySelectorAll(".pagination button");

pageButtons.forEach((button, index) => {
    button.addEventListener("click", () => {
        let page;

        if (index === 3) {
            page = currentPage < 3 ? currentPage + 1 : 3;
        } else {
            page = index + 1;
        }

        showPage(page);

        pageButtons.forEach(btn => btn.classList.remove("active"));
        pageButtons[page - 1].classList.add("active");

        window.scrollTo({ top: 0, behavior: "smooth" });
    });
});
// Tự động liên kết sản phẩm với trang chi tiết
const detailProducts = {
    "strawberry cloud": 2,
    "bánh trung thu 2026": 3,
    "bánh trung thu đậu đỏ trứng muối": 4
};

document.querySelectorAll(".product-card").forEach(card => {
    const name = card.querySelector("h3")?.textContent.trim().toLowerCase();
    const detailButton = card.querySelector(".btn-detail");

    if (!detailButton) return;

    if (detailProducts[name]) {
        detailButton.href =
            `../product-detail/product-detail.html?id=${detailProducts[name]}`;
    } else {
        detailButton.addEventListener("click", event => {
            event.preventDefault();
            alert("Sản phẩm này chưa có trang chi tiết.");
        });
    }
});