const root = document.documentElement;
const themeToggle = document.querySelector(".theme-toggle");
const savedTheme = localStorage.getItem("strived-theme");
if (savedTheme === "dark") root.dataset.theme = "dark";
if (themeToggle) {
  const updateThemeButton = () => {
    const dark = root.dataset.theme === "dark";
    themeToggle.setAttribute("aria-pressed", dark);
    themeToggle.setAttribute("aria-label", dark ? "Switch to light mode" : "Switch to dark mode");
    const label = themeToggle.querySelector("span");
    if (label) label.textContent = dark ? "Light" : "Dark";
  };
  updateThemeButton();
  themeToggle.addEventListener("click", () => {
    const dark = root.dataset.theme !== "dark";
    root.dataset.theme = dark ? "dark" : "light";
    localStorage.setItem("strived-theme", dark ? "dark" : "light");
    updateThemeButton();
  });
}

const menuToggle = document.querySelector(".menu-toggle");
const mainNav = document.querySelector(".main-nav");
if (menuToggle && mainNav) {
  menuToggle.addEventListener("click", () => {
    const open = mainNav.classList.toggle("open");
    menuToggle.setAttribute("aria-expanded", open);
  });
  mainNav.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => {
    mainNav.classList.remove("open");
    menuToggle.setAttribute("aria-expanded", "false");
  }));
}

const progress = document.createElement("div");
progress.className = "scroll-progress";
document.body.prepend(progress);
window.addEventListener("scroll", () => {
  const height = document.documentElement.scrollHeight - window.innerHeight;
  progress.style.width = `${height > 0 ? (window.scrollY / height) * 100 : 0}%`;
}, { passive: true });

document.querySelectorAll(".filter").forEach((filter) => filter.addEventListener("click", () => {
  document.querySelectorAll(".filter").forEach((item) => item.classList.remove("active"));
  filter.classList.add("active");
  document.querySelectorAll(".product-card").forEach((product) => {
    product.hidden = filter.dataset.filter !== "all" && product.dataset.category !== filter.dataset.filter;
  });
}));

const modal = document.querySelector("#order-modal");
const orderForm = document.querySelector(".order-form");
const cart = JSON.parse(localStorage.getItem("strived-cart") || "[]");
const cartDrawer = document.querySelector(".cart-drawer");
const cartItems = document.querySelector(".cart-items");
const cartCount = document.querySelector(".cart-count");
const cartTotal = document.querySelector(".cart-total strong");

const renderCart = () => {
  if (!cartItems) return;
  cartItems.innerHTML = "";
  if (!cart.length) {
    cartItems.innerHTML = '<div class="cart-empty">Your bag is ready for its first move.</div>';
  } else {
    cart.forEach((item, index) => {
      const row = document.createElement("div");
      row.className = "cart-item";
      row.innerHTML = `<span>${item.name}</span><strong>${item.price}</strong><button type="button" aria-label="Remove ${item.name}" data-remove="${index}">×</button>`;
      cartItems.append(row);
    });
  }
  const count = cart.length;
  if (cartCount) cartCount.textContent = count;
  if (cartTotal) cartTotal.textContent = `$${cart.reduce((sum, item) => sum + item.value, 0)}`;
  localStorage.setItem("strived-cart", JSON.stringify(cart));
};
renderCart();

document.querySelectorAll(".order-button").forEach((button) => button.addEventListener("click", () => {
  const card = button.closest(".product-card");
  const name = button.dataset.product;
  const rawPrice = card?.querySelector(".product-meta b, .price")?.textContent || "$0";
  const value = Number(rawPrice.replace(/[^0-9.]/g, "")) || 0;
  cart.push({ name, price: `$${value}`, value });
  renderCart();
  if (orderForm) {
    orderForm.elements.product.value = name;
    orderForm.querySelector(".form-status").textContent = "";
  }
  if (modal) {
    modal.hidden = false;
    orderForm?.elements.name.focus();
  }
}));

document.querySelectorAll("[data-cart-open]").forEach((button) => button.addEventListener("click", () => {
  if (cartDrawer) cartDrawer.hidden = false;
}));
document.querySelectorAll("[data-cart-close]").forEach((button) => button.addEventListener("click", () => {
  if (cartDrawer) cartDrawer.hidden = true;
}));
cartItems?.addEventListener("click", (event) => {
  const index = event.target.dataset.remove;
  if (index !== undefined) {
    cart.splice(Number(index), 1);
    renderCart();
  }
});

if (modal && orderForm) {
  const close = () => { modal.hidden = true; };
  document.querySelector(".modal-close")?.addEventListener("click", close);
  modal.addEventListener("click", (event) => { if (event.target === modal) close(); });
  document.addEventListener("keydown", (event) => { if (event.key === "Escape") { close(); if (cartDrawer) cartDrawer.hidden = true; } });
}

document.querySelectorAll("form:not(#size-form):not(#review-form)").forEach((form) => form.addEventListener("submit", (event) => {
  event.preventDefault();
  const status = form.querySelector(".form-status");
  if (status) status.textContent = "Thanks — we’ll be in touch shortly.";
  if (form.classList.contains("order-form")) cart.splice(0, cart.length);
  form.reset();
  renderCart();
}));

const sizeModal = document.querySelector("#size-modal");
const reviewModal = document.querySelector("#review-modal");
document.querySelector("#size-open")?.addEventListener("click", () => { sizeModal.hidden = false; });
document.querySelector("#review-open")?.addEventListener("click", () => { reviewModal.hidden = false; });
document.querySelector("[data-close-size]")?.addEventListener("click", () => { sizeModal.hidden = true; });
document.querySelector("[data-close-review]")?.addEventListener("click", () => { reviewModal.hidden = true; });
document.querySelector("#size-form")?.addEventListener("submit", (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const height = Number(form.elements.height.value);
  const weight = Number(form.elements.weight.value);
  const fit = form.elements.fit.value;
  let size = height < 165 ? "S" : height < 178 ? "M" : height < 190 ? "L" : "XL";
  if (weight > 85 && size !== "XL") size = size === "S" ? "M" : size === "M" ? "L" : "XL";
  if (fit === "relaxed" && size !== "XL") size = size === "S" ? "M" : size === "M" ? "L" : "XL";
  form.querySelector(".form-status").textContent = `Your recommended size is ${size}. Built for a ${fit} fit.`;
});
document.querySelector("#review-form")?.addEventListener("submit", (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const photo = form.elements.photo.files[0];
  form.querySelector(".form-status").textContent = photo ? `Review saved with ${photo.name}. Thanks for showing the gear in motion.` : "Review saved. Thanks for showing the gear in motion.";
});
