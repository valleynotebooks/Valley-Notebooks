/* =========================
   Valley Notebooks - script.js
   FRONTEND LOGIC (Production)
   ========================= */

(() => {
  const MIN_QTY = 500;
  const MAX_QTY = 500000;

  const PRODUCTS = {
    copy: {
      title: "Copy Notebook",
      image: "images/copy.jpg",
      items: [
        { price: 10, pages: 24 }, { price: 20, pages: 48 }, { price: 30, pages: 72 },
        { price: 40, pages: 96 }, { price: 50, pages: 120 }, { price: 60, pages: 144 },
        { price: 70, pages: 168 }, { price: 80, pages: 192 }, { price: 90, pages: 216 },
        { price: 100, pages: 240 }, { price: 120, pages: 288 }, { price: 150, pages: 360 },
        { price: 180, pages: 432 }, { price: 200, pages: 480 }, { price: 230, pages: 552 },
        { price: 250, pages: 600 }, { price: 280, pages: 672 }, { price: 300, pages: 720 }
      ]
    },
    jumbo: {
      title: "Jumbo Notebook",
      image: "images/jumbo.jpg",
      items: [
        { price: 30, pages: 72 }, { price: 40, pages: 96 }, { price: 50, pages: 120 },
        { price: 60, pages: 144 }, { price: 70, pages: 168 }, { price: 80, pages: 192 },
        { price: 90, pages: 216 }, { price: 100, pages: 240 }, { price: 120, pages: 288 },
        { price: 150, pages: 360 }, { price: 180, pages: 432 }, { price: 200, pages: 480 },
        { price: 230, pages: 552 }, { price: 250, pages: 600 }, { price: 280, pages: 672 },
        { price: 300, pages: 720 }
      ]
    },
    a4: {
      title: "A4 Notebook",
      image: "images/a4.jpg",
      items: [
        { price: 30, pages: 72 }, { price: 40, pages: 96 }, { price: 50, pages: 120 },
        { price: 60, pages: 144 }, { price: 70, pages: 168 }, { price: 80, pages: 192 },
        { price: 90, pages: 216 }, { price: 100, pages: 240 }, { price: 120, pages: 288 },
        { price: 150, pages: 360 }, { price: 180, pages: 432 }, { price: 200, pages: 480 },
        { price: 230, pages: 552 }, { price: 250, pages: 600 }, { price: 280, pages: 672 },
        { price: 300, pages: 720 }
      ]
    },
    spiral: {
      title: "Spiral Notebook",
      image: "images/spiral.jpg",
      items: [
        { price: 100, pages: 240 }, { price: 120, pages: 288 }, { price: 150, pages: 360 },
        { price: 180, pages: 432 }, { price: 200, pages: 480 }, { price: 230, pages: 552 },
        { price: 250, pages: 600 }, { price: 280, pages: 672 }, { price: 300, pages: 720 }
      ]
    }
  };

  const qs = s => document.querySelector(s);
  const qsa = s => [...document.querySelectorAll(s)];
  const grid = qs("#product-grid");
  const cartBtn = qs("#cart-btn");
  const cartDrawer = qs("#cart-drawer");
  const closeCart = qs("#close-cart");
  const cartItemsEl = qs("#cart-items");
  const cartTotalEl = qs("#cart-total");
  const cartCountEl = qs("#cart-count");
  const checkoutBtn = qs("#checkout-btn");
  const checkoutSection = qs("#checkout-section");
  const checkoutForm = qs("#checkout-form");
  const thankyouSection = qs("#thankyou-section");
  const orderIdEl = qs("#order-id");
  const downloadInvoiceBtn = qs("#download-invoice");
  const finalAmountEl = qs("#final-amount");
  const deliveryDateEl = qs("#delivery-date");
  const loader = qs("#page-loader");
  const offlineBanner = qs("#offline-banner");
  const scrollTopBtn = qs("#scroll-top");

  let activeCategory = "copy";
  let cart = JSON.parse(localStorage.getItem("vn_cart") || "[]");

  const uid = () => "VN" + Date.now().toString(36).toUpperCase();

  const saveCart = () => localStorage.setItem("vn_cart", JSON.stringify(cart));

  const totalQty = () => cart.reduce((a, c) => a + c.qty, 0);
  const totalAmount = () => cart.reduce((a, c) => a + c.qty * c.price, 0);

  function renderProducts() {
    grid.innerHTML = "";
    const cat = PRODUCTS[activeCategory];
    cat.items.forEach(it => {
      const card = document.createElement("div");
      card.className = "product-card";
      card.innerHTML = `
        <img src="${cat.image}" alt="${cat.title}">
        <div class="product-body">
          <div class="product-title">${cat.title}</div>
          <div class="product-meta">${it.pages} pages</div>
          <div class="product-price">₹${it.price}</div>
        </div>
        <div class="product-actions">
          <button class="primary">Add to Cart</button>
        </div>
      `;
      card.querySelector("button").onclick = () => addToCart(activeCategory, it.price, it.pages, cat.image, cat.title);
      grid.appendChild(card);
    });
  }

  function addToCart(category, price, pages, image, title) {
    const key = `${category}-${price}-${pages}`;
    const found = cart.find(i => i.key === key);
    if (found) {
      found.qty = Math.min(found.qty + MIN_QTY, MAX_QTY);
    } else {
      cart.push({
        key, category, price, pages, image, title,
        qty: MIN_QTY
      });
    }
    saveCart();
    renderCart();
    openCart();
  }

  function renderCart() {
    cartItemsEl.innerHTML = "";
    cart.forEach((it, idx) => {
      const row = document.createElement("div");
      row.className = "cart-item";
      row.innerHTML = `
        <img src="${it.image}">
        <div>
          <strong>${it.title}</strong>
          <div>${it.pages} pages</div>
          <div>₹${it.price}</div>
        </div>
        <div class="qty">
          <input type="number" min="${MIN_QTY}" max="${MAX_QTY}" step="${MIN_QTY}" value="${it.qty}">
          <button data-i="${idx}">✕</button>
        </div>
      `;
      const input = row.querySelector("input");
      input.onchange = () => {
        let v = parseInt(input.value || MIN_QTY, 10);
        if (v < MIN_QTY) v = MIN_QTY;
        if (v > MAX_QTY) v = MAX_QTY;
        it.qty = v;
        saveCart();
        updateTotals();
      };
      row.querySelector("button").onclick = () => {
        cart.splice(idx, 1);
        saveCart();
        renderCart();
      };
      cartItemsEl.appendChild(row);
    });
    updateTotals();
  }

  function updateTotals() {
    cartTotalEl.textContent = totalAmount();
    cartCountEl.textContent = totalQty();
    checkoutBtn.disabled = totalQty() < MIN_QTY;
    finalAmountEl.textContent = totalAmount();
  }

  function openCart() {
    cartDrawer.classList.add("open");
  }
  function closeCartFn() {
    cartDrawer.classList.remove("open");
  }

  qsa(".tab").forEach(t => {
    t.onclick = () => {
      qsa(".tab").forEach(x => x.classList.remove("active"));
      t.classList.add("active");
      activeCategory = t.dataset.category;
      renderProducts();
    };
  });

  cartBtn.onclick = openCart;
  closeCart.onclick = closeCartFn;

  checkoutBtn.onclick = () => {
    closeCartFn();
    checkoutSection.classList.remove("hidden");
    window.scrollTo({ top: checkoutSection.offsetTop - 60, behavior: "smooth" });
  };

  checkoutForm.onsubmit = e => {
    e.preventDefault();
    const phone = qs("#phone").value.trim();
    const pin = qs("#pincode").value.trim();
    if (!/^[6-9]\d{9}$/.test(phone)) return alert("Invalid phone number");
    if (!/^\d{6}$/.test(pin)) return alert("Invalid pincode");
    const orderId = uid();
    orderIdEl.textContent = orderId;
    checkoutSection.classList.add("hidden");
    thankyouSection.classList.remove("hidden");
    localStorage.removeItem("vn_cart");
    cart = [];
    renderCart();
  };

  downloadInvoiceBtn.onclick = () => {
    const w = window.open("", "_blank");
    w.document.write(`<h1>Valley Notebooks Invoice</h1><p>Order ID: ${orderIdEl.textContent}</p><p>Amount: ₹${finalAmountEl.textContent}</p>`);
    w.print();
  };

  window.addEventListener("online", () => offlineBanner.style.display = "none");
  window.addEventListener("offline", () => offlineBanner.style.display = "block");

  window.addEventListener("scroll", () => {
    scrollTopBtn.style.display = window.scrollY > 400 ? "block" : "none";
  });
  scrollTopBtn.onclick = () => window.scrollTo({ top: 0, behavior: "smooth" });

  const delivery = new Date(Date.now() + 7 * 86400000);
  deliveryDateEl.textContent = delivery.toDateString();

  renderProducts();
  renderCart();

  window.addEventListener("load", () => loader.style.display = "none");
})();
