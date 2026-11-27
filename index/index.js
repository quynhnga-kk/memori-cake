const header = document.querySelector("header");

// Ẩn menu ở đầu trang, hiện menu khi cuộn.
window.addEventListener("scroll", () => {
    header.classList.toggle("show-header", window.scrollY !== 0);
});

// Dùng cùng dữ liệu sản phẩm với trang chi tiết.
document.querySelectorAll(".product-card").forEach((card) => {
    const link = card.querySelector(".product-body a");

    link.addEventListener("click", () => {
        const product = {
            name: card.querySelector("h3").textContent.trim(),
            image: card.querySelector("img").src,
            desc: card.querySelector(".desc").textContent.trim(),
            price: card.querySelector(".price-tag").textContent.trim(),
            oldPrice: "",
            badge: "",
            badgeClass: "",
            stars: "",
            reviews: "0"
        };

        localStorage.setItem("memoriProduct", JSON.stringify(product));
    });
});

// Xem lớn ảnh trong mục Khoảnh khắc cùng Memori.
const momentDialog = document.querySelector(".moment-dialog");
const momentDialogImage = momentDialog.querySelector(".moment-dialog-image");
const momentDialogTitle = document.getElementById("moment-dialog-title");
const momentDialogDescription = document.getElementById("moment-dialog-description");

document.querySelectorAll("[data-moment-open]").forEach((button) => {
    button.addEventListener("click", () => {
        const card = button.closest(".moment-card");
        const image = button.querySelector("img");

        momentDialogImage.src = image.currentSrc || image.src;
        momentDialogImage.alt = image.alt;
        momentDialogTitle.textContent = card.querySelector("h3").textContent;
        momentDialogDescription.textContent = card.querySelector(".moment-description").textContent;

        momentDialog.showModal();
        document.body.classList.add("moment-lightbox-open");
    });
});

momentDialog.querySelector(".moment-dialog-close").addEventListener("click", () => {
    momentDialog.close();
});

momentDialog.addEventListener("keydown", (event) => {
    if (event.key !== "Tab") return;

    const controls = momentDialog.querySelectorAll("button:not([disabled]), a[href], [tabindex='0']");
    const first = controls[0];
    const last = controls[controls.length - 1];
    const active = document.activeElement;

    if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
    } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
    }
});

momentDialog.addEventListener("click", (event) => {
    if (event.target !== momentDialog) return;

    const bounds = momentDialog.getBoundingClientRect();
    const outside = event.clientX < bounds.left || event.clientX > bounds.right
        || event.clientY < bounds.top || event.clientY > bounds.bottom;

    if (outside) momentDialog.close();
});

momentDialog.addEventListener("close", () => {
    document.body.classList.remove("moment-lightbox-open");
});
