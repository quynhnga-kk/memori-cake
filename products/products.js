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

// Bấm "Chi tiết" -> lưu dữ liệu card -> sang trang chi tiết
document.querySelectorAll('.product-card').forEach(function (card) {
    var link = card.querySelector('.btn-detail');
    if (!link) return;

    link.addEventListener('click', function (e) {
        e.preventDefault();

        var img = card.querySelector('.img-placeholder img');
        var oldPrice = card.querySelector('.price-old');
        var badge = card.querySelector('.badge');
        var ratingEl = card.querySelector('.rating');
        var reviews = ratingEl.querySelector('span');

        var product = {
            name: card.querySelector('h3').textContent.trim(),
            image: img.getAttribute('src').trim(),
            desc: card.querySelector('.desc').textContent.replace(/[“”"]/g, '').trim(),
            price: card.querySelector('.price-current').textContent.trim(),
            oldPrice: oldPrice ? oldPrice.textContent.trim() : '',
            badge: badge ? badge.textContent.trim() : '',
            badgeClass: badge ? badge.className.replace('badge', '').trim() : '',
            stars: ratingEl.childNodes[0].textContent.trim(),
            reviews: reviews ? reviews.textContent.replace(/[()]/g, '') : '0'
        };

        localStorage.setItem('memoriProduct', JSON.stringify(product));
        window.location.href = link.getAttribute('href');
    });
});