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
  applyCatalogFilters();
}));

const applyCatalogFilters = () => {
  const activeFilter = document.querySelector(".filter.active")?.dataset.filter || "all";
  const search = (document.querySelector("#product-search")?.value || "").trim().toLowerCase();
  document.querySelectorAll(".product-card").forEach((product) => {
    const matchesCategory = activeFilter === "all" || product.dataset.category === activeFilter;
    const matchesSearch = !search || product.dataset.name.toLowerCase().includes(search) || product.textContent.toLowerCase().includes(search);
    product.hidden = !matchesCategory || !matchesSearch;
  });
};
document.querySelector("#product-search")?.addEventListener("input", applyCatalogFilters);
document.querySelector("#product-sort")?.addEventListener("change", (event) => {
  const grid = document.querySelector(".product-grid");
  if (!grid) return;
  const cards = [...grid.querySelectorAll(".product-card")];
  const sort = event.target.value;
  cards.sort((a, b) => sort === "price-low" ? Number(a.dataset.price) - Number(b.dataset.price) : sort === "price-high" ? Number(b.dataset.price) - Number(a.dataset.price) : sort === "name" ? a.dataset.name.localeCompare(b.dataset.name) : 0);
  cards.forEach((card) => grid.append(card));
});

const wishlist = readStorage("strived-wishlist", []);
document.querySelectorAll("[data-wishlist]").forEach((button) => {
  const name = button.dataset.wishlist;
  const update = () => {
    const saved = wishlist.includes(name);
    button.classList.toggle("saved", saved);
    button.textContent = saved ? "♥" : "♡";
    button.setAttribute("aria-label", `${saved ? "Remove" : "Save"} ${name}`);
  };
  update();
  button.addEventListener("click", () => {
    const index = wishlist.indexOf(name);
    if (index >= 0) wishlist.splice(index, 1);
    else wishlist.push(name);
    writeStorage("strived-wishlist", wishlist);
    update();
  });
});

const compare = [];
const compareCount = document.querySelector("#compare-count");
document.querySelectorAll("[data-compare]").forEach((button) => button.addEventListener("click", () => {
  const name = button.dataset.compare;
  const index = compare.indexOf(name);
  if (index >= 0) compare.splice(index, 1);
  else if (compare.length < 3) compare.push(name);
  button.classList.toggle("selected", compare.includes(name));
  button.textContent = compare.includes(name) ? "Added" : "Compare";
  if (compareCount) compareCount.textContent = compare.length;
}));
document.querySelector("#compare-toggle")?.addEventListener("click", () => {
  const status = document.querySelector("#compare-count");
  if (status) status.textContent = compare.length ? `${compare.length}` : "0";
  document.querySelector(".product-grid")?.scrollIntoView({ behavior: "smooth", block: "start" });
});

const modal = document.querySelector("#order-modal");
const orderForm = document.querySelector(".order-form");
const sizeModal = document.querySelector("#size-modal");
const reviewModal = document.querySelector("#review-modal");
const cart = readStorage("strived-cart-v2", []);
if (!Array.isArray(cart)) cart.length = 0;
cart.forEach((item) => {
  item.quantity = Number.isFinite(item.quantity) && item.quantity > 0 ? item.quantity : 1;
  item.value = Number(item.value) || 0;
});
const cartDrawer = document.querySelector(".cart-drawer");
const cartItems = document.querySelector(".cart-items");
const cartCount = document.querySelector(".cart-count");
const cartTotal = document.querySelector(".cart-total strong");
const cartSubtotal = document.querySelector(".cart-subtotal");
const cartShipping = document.querySelector(".cart-shipping");
const checkoutSummary = document.querySelector(".checkout-summary");

const getCartTotal = () => cart.reduce((sum, item) => sum + item.value * item.quantity, 0);

const renderCart = () => {
  if (!cartItems) return;
  cartItems.innerHTML = "";
  if (!cart.length) {
    cartItems.innerHTML = '<div class="cart-empty">Your bag is ready for its first move.</div>';
  } else {
    cart.forEach((item, index) => {
      const row = document.createElement("div");
      row.className = "cart-item";
      row.innerHTML = `<div><strong>${item.name}</strong><small>${item.price} each</small></div><div class="quantity-control"><button type="button" aria-label="Decrease ${item.name} quantity" data-quantity="${index}" data-change="-1"><svg class="ui-icon" aria-hidden="true" viewBox="0 0 24 24"><path d="M5 12h14"/></svg></button><span>${item.quantity}</span><button type="button" aria-label="Increase ${item.name} quantity" data-quantity="${index}" data-change="1"><svg class="ui-icon" aria-hidden="true" viewBox="0 0 24 24"><path d="M12 5v14m-7-7h14"/></svg></button></div><button class="cart-remove" type="button" aria-label="Remove ${item.name}" data-remove="${index}"><svg class="ui-icon" aria-hidden="true" viewBox="0 0 24 24"><path d="m6 6 12 12M18 6 6 18"/></svg></button>`;
      cartItems.append(row);
    });
  }
  const count = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = getCartTotal();
  const shipping = subtotal >= 100 || subtotal === 0 ? 0 : 8;
  const total = subtotal + shipping;
  if (cartCount) cartCount.textContent = count;
  if (cartTotal) cartTotal.textContent = `$${total}`;
  if (cartSubtotal) cartSubtotal.textContent = `$${subtotal}`;
  if (cartShipping) cartShipping.textContent = shipping ? "$8" : "Free";
  if (checkoutSummary) checkoutSummary.textContent = cart.length ? `${count} item${count === 1 ? "" : "s"} · $${subtotal} subtotal` : "Your bag is empty.";
  writeStorage("strived-cart-v2", cart);
};
renderCart();

document.querySelectorAll(".order-button").forEach((button) => button.addEventListener("click", () => {
  const card = button.closest(".product-card");
  const name = button.dataset.product;
  const rawPrice = card?.querySelector(".product-meta b, .price")?.textContent || "$0";
  const value = Number(rawPrice.replace(/[^0-9.]/g, "")) || 0;
  const existing = cart.find((item) => item.name === name);
  if (existing) existing.quantity += 1;
  else cart.push({ name, price: `$${value}`, value, quantity: 1 });
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
document.querySelector("[data-checkout]")?.addEventListener("click", () => {
  if (!cart.length) {
    return;
  }
  if (cartDrawer) cartDrawer.hidden = true;
  if (modal) {
    modal.hidden = false;
    orderForm?.elements.name.focus();
  }
});
document.querySelectorAll("[data-cart-close]").forEach((button) => button.addEventListener("click", () => {
  if (cartDrawer) cartDrawer.hidden = true;
}));
cartItems?.addEventListener("click", (event) => {
  const target = event.target.closest("button");
  if (!target) return;
  const index = target.dataset.remove;
  if (index !== undefined) {
    cart.splice(Number(index), 1);
    renderCart();
  }
  const quantityIndex = target.dataset.quantity;
  if (quantityIndex !== undefined) {
    const item = cart[Number(quantityIndex)];
    item.quantity = Math.max(0, item.quantity + Number(target.dataset.change));
    if (!item.quantity) cart.splice(Number(quantityIndex), 1);
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

const recentSection = document.querySelector("#recently-viewed");
const recentGrid = document.querySelector("#recent-grid");
if (recentSection && recentGrid) {
  const recent = readStorage("strived-recent", []);
  if (recent.length) {
    recentSection.hidden = false;
    recentGrid.innerHTML = recent.map((item) => `<article class="recent-card"><p class="eyebrow">${item.type}</p><h3>${item.name}</h3><p>$${item.price}</p><a href="product.html?product=${encodeURIComponent(item.key)}">View product ↗</a></article>`).join("");
  }
}

document.querySelector("#team-form")?.addEventListener("submit", (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  form.querySelector(".form-status").textContent = "Team brief received — we’ll reply with a quote and production timeline.";
  form.reset();
});

const products = {
  "first-string-jersey": { name: "First String Jersey", type: "Jerseys · Custom ready", price: 68, image: "https://images.unsplash.com/photo-1526232761682-d26e03ac148e?auto=format&fit=crop&w=1200&q=85", description: "A lightweight game-day layer built for sharp cuts, hard screens, and full-court confidence." },
  "motion-tee-white": { name: "Motion Tee / White", type: "T-shirts · Heavyweight cotton", price: 42, image: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=1200&q=85", description: "A clean everyday tee with a structured feel that works from warm-up to wind-down." },
  "full-court-set": { name: "Full Court Set", type: "Basketball sets · Team ready", price: 110, image: "https://images.unsplash.com/photo-1518407613690-d9fc990e795f?auto=format&fit=crop&w=1200&q=85", description: "A two-piece uniform system designed for coordinated squads and serious game-day presence." }
};
if (document.body.dataset.productPage !== undefined) {
  const key = new URLSearchParams(location.search).get("product") || "first-string-jersey";
  const product = products[key] || products["first-string-jersey"];
  const recent = readStorage("strived-recent", []).filter((item) => item.key !== key);
  recent.unshift({ key, ...product });
  writeStorage("strived-recent", recent.slice(0, 3));
  document.title = `${product.name} — Strived Sportswear`;
  document.querySelector("#detail-image").src = product.image;
  document.querySelector("#detail-image").alt = product.name;
  document.querySelector("#detail-type").textContent = product.type;
  document.querySelector("#detail-name").textContent = product.name;
  document.querySelector("#detail-price").textContent = `$${product.price}`;
  document.querySelector("#detail-description").textContent = product.description;
  document.querySelector("#detail-order")?.addEventListener("click", () => {
    const size = document.querySelector("#detail-size").value;
    const status = document.querySelector("#detail-status");
    if (!size) {
      status.textContent = "Choose a size before adding this item to your bag.";
      document.querySelector("#detail-size").focus();
      return;
    }
    const saved = readStorage("strived-cart-v2", []);
    const existing = saved.find((item) => item.name === product.name && item.size === size);
    if (existing) existing.quantity += 1;
    else saved.push({ name: product.name, price: `$${product.price}`, value: product.price, size, quantity: 1 });
    writeStorage("strived-cart-v2", saved);
    status.textContent = `${product.name}, size ${size}, added to your bag.`;
  });
  document.querySelector("#detail-wishlist")?.addEventListener("click", (event) => {
    const list = readStorage("strived-wishlist", []);
    const index = list.indexOf(product.name);
    if (index >= 0) list.splice(index, 1);
    else list.push(product.name);
    writeStorage("strived-wishlist", list);
    event.currentTarget.textContent = list.includes(product.name) ? "♥ Saved" : "♡ Save item";
  });
}
