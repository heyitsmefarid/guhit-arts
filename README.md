# Guhit Arts Center — Web Prototype

Front-end prototype for **Guhit Arts Center** (Leuterio, San Vicente South, Calapan City, Oriental Mindoro), prepared for an academic business proposal. It has three parts:

1. **Public landing page**: services, featured products, the proposed Student Digital Help Hub, the shop's history, and contact details.
2. **Customer platform** (after login): dashboard, shop with cart and checkout, digital service requests, order and project tracking, notifications, and profile.
3. **Admin panel** (staff login at `/admin`): dashboard with sales charts, order and digital-request management, products and stock, customers, and team. Two roles: **administrator** (the owner, full access) and **staff** (orders, requests, and stock).

There is no backend. Accounts, orders, projects, notifications, and stock are stored in the browser's `localStorage`, and every "server" call is simulated. The app ships with a month of sample shop activity: eight sample customers plus the two customer logins, 28 orders, and 17 digital requests.

## Run it

Requires Node.js 20.19 or newer (Vite 8).

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build in dist/
npm run preview    # serve the production build
```

## Login accounts

These accounts are hard-coded in `src/data/credentials.js`. They always work, even after **Reset demo data**, in a new browser, or with cleared storage.

| Email | Password | Starts with |
| --- | --- | --- |
| `demo@guhitarts.ph` | `guhit1979` | Customer with 4 orders, 4 digital requests, and notifications |
| `student@guhitarts.ph` | `student123` | Student customer with 2 orders and 2 digital requests |
| `admin@guhitarts.ph` | `admin1979` | Administrator (owner): full admin panel, including sales, prices, customers, and team |
| `staff@guhitarts.ph` | `staff1979` | Staff: orders, digital requests, and stock; no prices, revenue, customers, or team |

The customer login page (`/login`) lists the two customer accounts and the staff login page (`/admin/login`, also linked in the footer) lists the administrator and staff accounts, with a **Use** button that fills in the form. To change a login or add another, edit `src/data/credentials.js` (the profile details are in `src/data/seed.js`). Accounts created through **Sign up** are also saved, but only in that browser.

## Suggested presentation walkthrough

1. **Landing page**: hero, the four divisions, featured products, the Digital Help Hub price list, "47 Years of Creativity and Service", and contact.
2. **Sign up** with a new account, or log in with one of the customer accounts. You land on the dashboard.
3. **Shop → product → cart → checkout**: add a regular item, then a customized item (for example the Custom Mug) with a design note. Choose delivery and GCash, and place the order.
4. **Track the order**: open it from My Orders. The shop moves it along from the admin panel (step 7), or use **Prototype control → Move to …** on the tracking page for a quick demo.
5. **Digital Services → Request Service**: fill in the commission form, attach a file, tick Rush order, review the summary, and submit. The first new request gets reference **GAC-DIG-00125** with status **Pending Review**.
6. **My Projects / Notifications / Profile**: show the new project, mark notifications as read, and upload a profile picture.
7. **Admin panel**: open a second tab at `/admin/login` and log in as staff. Approve the order you just placed, quote and approve the digital request, then send a draft file. The customer tab updates on its own: new status, notification, and the draft to download.
8. **Products & Stock**: change a price or hide a product, then refresh the customer shop to show the change.

To start fresh before a presentation, go to **Profile → Reset demo data** (in the customer platform). This clears everything saved in the browser and restores the sample data.

## Admin panel

Staff log in at `/admin/login`. There are two roles:

| Task | Administrator | Staff |
| --- | --- | --- |
| Approve orders, send proofs, mark orders done | Yes | Yes |
| Move digital requests along and send files | Yes | Yes |
| Adjust stock counts | Yes | Yes |
| Set product prices and digital quotations | Yes | No |
| Add products, or hide them from the shop | Yes | No |
| See revenue and sales reports | Yes | No |
| See customers and their spending | Yes | No |
| Add team members, change roles, deactivate accounts | Yes | No |

The panel has:

- **Dashboard** with a 7-day or 30-day range. The administrator sees revenue (with trend lines), orders, average order, digital requests, active customers, and low stock; daily revenue split into shop and digital; a "Needs attention" queue; work in each stage; busiest days of the week; payment methods and pickup or delivery; sales by category; best sellers; requests by service; deadlines this week; a stock watch; recent activity (with who made each change); top customers; and latest orders. Staff see the same dashboard without revenue figures.
- **Orders**: every customer's orders with search and filters. Each order has a status panel: approve it, send a proof, mark it completed, or set any status, with an optional note to the customer.
- **Digital Requests**: set a price (quotation-based requests need one before approval), move the request along, and send draft or final files. Customers see the files on their tracking page.
- **Products & Stock**: edit prices and stock, hide products from the shop, and add new products. Placing an order takes items off the shelf.
- **Customers** (administrator only): spending and activity per customer, with their orders and requests.
- **Team** (administrator only): everyone who can use the panel, their role and last sign-in. Add team members with a temporary password, switch roles, or deactivate an account so it can no longer log in. The shop always keeps at least one active administrator.

Every status change creates a notification for that customer and is recorded with the name of the staff member who made it. Each browser tab keeps its own login, so the admin panel and a customer account can run side by side in one browser; changes in one tab appear in the other without a reload.

## Motion and interactions

The animations follow one idea: things arrive the way a print does, with the cyan, magenta, and yellow plates sliding into alignment.

- **Hero**: the headline prints into register, the pencil line draws, and the photos drop onto the table and drift with the mouse. Move the cursor over the hero to **doodle** with a fading pencil line (mouse and pen only).
- **Scrolling**: service photos print over their ink plate, product cards are dealt in, the price list fills row by row, "47 Years" counts up, and the history line draws itself. A CMYK bar at the top shows scroll progress (in Chromium browsers).
- **Customer platform**: pages ease in, dashboard numbers count up, progress rails fill with a moving "printing" stripe on the current step, items fly into the cart, and order or request confirmations end in CMYK confetti.

Everything is in `src/styles/motion.css` and `src/components/fx/`. Visitors with **Reduce motion** turned on in their system settings get the same pages without animation.

## Project structure

```
src/
├── App.jsx                 routes (public, guest-only, and signed-in areas)
├── main.jsx
├── assets/
│   ├── products/           product photos (720 × 720)
│   ├── photos/             section photos
│   └── CREDITS.json        source and license of every photo
├── components/
│   ├── brand/              logo, registration mark, color bar, hero stroke, crop marks
│   ├── landing/            landing page sections
│   ├── layout/             public header/footer, customer app layout, route guards
│   ├── shop/               product card and product image
│   ├── digital/            service icons and CSS-drawn sample outputs
│   └── ui/                 status badge, status timeline, stepper, file drop, etc.
├── context/                auth, account data, cart, and toast state
├── data/                   mock data: products, digital services, business info, seed data, statuses
├── pages/
│   ├── public/             landing page
│   ├── auth/               login, sign up, forgot password
│   ├── app/                dashboard, shop, cart, checkout, services, request form,
│   │                       orders, projects, tracking, notifications, profile
│   └── admin/              admin dashboard, orders, digital requests, products, customers
├── services/               mock API layer (see below), including adminService and inventoryStore
├── styles/                 base tokens, brand pieces, landing, auth, and app styles
└── utils/                  formatting, shop hours, image lookup
```

## Connecting a real backend later

All data access goes through `src/services/`. The pages and contexts never touch `localStorage` directly, so replacing the mock layer does not require UI changes. Keep each function's signature and return shape and swap its body for an API call:

| Mock function | Suggested endpoint |
| --- | --- |
| `authService.login / signup / logout` | `POST /api/auth/login`, `/signup`, `/logout` |
| `authService.updateProfile` | `PATCH /api/me` |
| `authService.requestPasswordReset` | `POST /api/auth/password-reset` |
| `catalogService.getProducts / getProduct` | `GET /api/products`, `GET /api/products/:id` |
| `accountService.getAccount` | `GET /api/me/orders`, `/projects`, `/notifications` |
| `accountService.placeOrder` | `POST /api/orders` |
| `accountService.submitProject` | `POST /api/projects` (with file upload) |
| `accountService.advanceStatus` | customer-side demo control (remove in production) |
| `adminService.getAdminData` | `GET /api/admin/orders`, `/projects`, `/customers`, `/products` |
| `adminService.updateOrderStatus / updateProject` | `PATCH /api/admin/orders/:ref`, `/projects/:ref` |
| `adminService.updateProduct / addProduct` | `PATCH /api/admin/products/:id`, `POST /api/admin/products` |
| `accountService.markNotificationsRead` | `PATCH /api/notifications` |

The status pipeline and its labels live in `src/data/statuses.js`.

## Placeholders to replace

- **Contact details**: phone numbers, email, and social links in `src/data/business.js`.
- **Business hours**: sample schedule in `src/data/business.js` and `src/utils/hours.js`.
- **History**: only 1979 and the present are dated. Add real milestone years in `src/data/business.js`.
- **Product photos**: stock photos stand in for the shop's own products. Ten products (canvas, illustration board, envelope, bond paper (long and A4), ink, laminating film, shuttlecocks, jersey, tarpaulin) show a halftone placeholder tile until a photo named after their `image` key is added to `src/assets/products/`.
- **Prices**: sample retail prices in Philippine pesos.
- **Map**: a drawn placeholder with a working "Open in Google Maps" link.

## Deploying

This is a single-page app using browser routing. On static hosts, rewrite all paths to `index.html` (Netlify `_redirects`: `/* /index.html 200`; Vercel: a rewrite to `/index.html`).

## Image credits

Every photo is public domain (CC0 or Public Domain Mark), found through [Openverse](https://openverse.org) from StockSnap, Flickr, and the WordPress Photo Directory. No attribution is required, but the source of each file is listed in `src/assets/CREDITS.json`. The Digital Help Hub sample outputs are drawn in CSS.
