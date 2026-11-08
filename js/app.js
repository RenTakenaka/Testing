const root = document.documentElement;
const themeToggle = document.querySelector(".theme-toggle");
const readStorage = (key, fallback) => {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
};
const writeStorage = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // The UI remains usable when storage is disabled or full.
  }
};
const savedTheme = readStorage("strived-theme", "");
if (savedTheme === "dark" || (!savedTheme && matchMedia("(prefers-color-scheme: dark)").matches)) root.dataset.theme = "dark";
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
    writeStorage("strived-theme", dark ? "dark" : "light");
    updateThemeButton();
  });
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
const sizeModal = document.querySelector("#size-modal");
const reviewModal = document.querySelector("#review-modal");
const cart = readStorage("strived-cart", []);
if (!Array.isArray(cart)) cart.length = 0;
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
  writeStorage("strived-cart", cart);
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

const dialogs = [modal, sizeModal, reviewModal].filter(Boolean);
const closeDialogs = () => dialogs.forEach((dialog) => { dialog.hidden = true; });
dialogs.forEach((dialog) => {
  dialog.addEventListener("click", (event) => { if (event.target === dialog) dialog.hidden = true; });
  dialog.querySelectorAll(".modal-close").forEach((button) => button.addEventListener("click", () => { dialog.hidden = true; }));
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeDialogs();
    if (cartDrawer) cartDrawer.hidden = true;
  }
});

document.querySelectorAll("form:not(#size-form):not(#review-form)").forEach((form) => form.addEventListener("submit", (event) => {
  event.preventDefault();
  const status = form.querySelector(".form-status");
  if (status) status.textContent = "Thanks — we’ll be in touch shortly.";
  if (form.classList.contains("order-form")) cart.splice(0, cart.length);
  form.reset();
  renderCart();
}));

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
