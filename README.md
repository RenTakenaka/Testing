# Strived Sportswear

Static, responsive sportswear storefront ready for GitHub and Vercel.

## Pages

- `index.html` — home, news, and contact
- `collections.html` — searchable collection, filters, sorting, wishlist, compare mode, cart, reviews, team quotes, and sustainability
- `product.html` — product detail, fit/material information, size selection, wishlist, and add-to-bag flow
- `about.html` — founder story

## Structure

```text
.
├── index.html
├── collections.html
├── product.html
├── about.html
├── css/
│   └── styles.css
├── js/
│   └── app.js
└── vercel.json
```

## Local preview

Open `index.html` directly, or serve the folder with any static server:

```bash
python -m http.server 8000
```

Then visit `http://localhost:8000`.

## Static feature notes

The storefront includes client-side search, sorting, wishlist, recently viewed products, comparison selection, team-order lead capture, newsletter signup, fit guidance, reviews, and cart persistence. Payment processing, inventory synchronization, email delivery, order tracking, chat, and customer authentication require a backend or provider such as Stripe/PayMongo, a database, and an email service before production launch.

## Deploy to Vercel

Import the GitHub repository into Vercel with the framework preset set to **Other**. No build command or output directory is required.
