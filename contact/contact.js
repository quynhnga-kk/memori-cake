const form = document.getElementById("contact-form");
const formMessage = document.getElementById("form-message");

form.addEventListener("submit", (event) => {
    event.preventDefault();
    formMessage.textContent = "Cảm ơn bạn! Memori sẽ phản hồi sớm nhất.";
    form.reset();
});

document.querySelectorAll(".faq-question").forEach((question) => {
    question.addEventListener("click", () => {
        const item = question.closest(".faq-item");
        const wasActive = item.classList.contains("active");
        document.querySelectorAll(".faq-item.active").forEach((activeItem) => activeItem.classList.remove("active"));
        item.classList.toggle("active", !wasActive);
    });
});

let storedCart = [];
try {
    storedCart = JSON.parse(localStorage.getItem("memoriCart") || "[]");
} catch (error) {
    console.error("Không thể đọc số lượng giỏ hàng:", error);
}
document.getElementById("cart-count").textContent = Array.isArray(storedCart)
    ? storedCart.reduce((total, item) => total + Number(item.quantity || 0), 0)
    : 0;
