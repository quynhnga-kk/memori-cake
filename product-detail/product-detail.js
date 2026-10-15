
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