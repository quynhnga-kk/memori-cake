document.addEventListener("DOMContentLoaded", () => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const faqItems = [...document.querySelectorAll(".faq-item")];

    faqItems.forEach((item, index) => {
        const question = item.querySelector(".faq-question");
        const answer = item.querySelector(".faq-answer");
        if (!question || !answer) return;

        const answerId = answer.id || `faq-answer-${index + 1}`;
        answer.id = answerId;
        answer.setAttribute("aria-hidden", "true");
        question.setAttribute("role", "button");
        question.setAttribute("tabindex", "0");
        question.setAttribute("aria-controls", answerId);
        question.setAttribute("aria-expanded", "false");

        const toggleItem = () => {
            const willOpen = !item.classList.contains("active");

            faqItems.forEach((otherItem) => {
                const otherQuestion = otherItem.querySelector(".faq-question");
                const otherAnswer = otherItem.querySelector(".faq-answer");
                if (!otherQuestion || !otherAnswer) return;

                otherItem.classList.toggle("active", otherItem === item && willOpen);
                otherQuestion.setAttribute("aria-expanded", String(otherItem === item && willOpen));
                otherAnswer.setAttribute("aria-hidden", String(otherItem !== item || !willOpen));
            });
        };

        question.addEventListener("click", toggleItem);
        question.addEventListener("keydown", (event) => {
            if (event.key !== "Enter" && event.key !== " ") return;
            event.preventDefault();
            toggleItem();
        });
    });

    const form = document.querySelector("main form");
    const submitButton = form?.querySelector('button[type="submit"]');

    if (form && submitButton) {
        form.addEventListener("pointerdown", (event) => {
            if (!(event.target instanceof Element)) return;
            const button = event.target.closest('button[type="submit"]');
            if (!button || prefersReducedMotion) return;

            const bounds = button.getBoundingClientRect();
            const diameter = Math.max(bounds.width, bounds.height);
            const ripple = document.createElement("span");
            ripple.className = "ripple";
            ripple.style.width = `${diameter}px`;
            ripple.style.height = `${diameter}px`;
            ripple.style.left = `${event.clientX - bounds.left - diameter / 2}px`;
            ripple.style.top = `${event.clientY - bounds.top - diameter / 2}px`;

            button.querySelector(".ripple")?.remove();
            button.append(ripple);
        });

        form.addEventListener("submit", (event) => {
            event.preventDefault();

            let status = form.querySelector(".form-status");
            if (!status) {
                status = document.createElement("p");
                status.className = "form-status";
                status.setAttribute("role", "status");
                status.setAttribute("aria-live", "polite");
                submitButton.insertAdjacentElement("afterend", status);
            }

            status.textContent = "Biểu mẫu chưa kết nối hệ thống nhận tin. Vui lòng liên hệ cửa hàng qua hotline hoặc email trên trang.";
        });
    }

    if (!prefersReducedMotion && "IntersectionObserver" in window) {
        const revealObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                entry.target.classList.add("is-visible");
                observer.unobserve(entry.target);
            });
        }, {
            threshold: 0.12,
            rootMargin: "0px 0px -32px 0px",
        });

        document.querySelectorAll("main > section, .subtitle").forEach((element) => {
            element.classList.add("js-reveal");
            revealObserver.observe(element);
        });
    }

});
