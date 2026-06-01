# 📦 Stockflow — Inventory & Order Management System

A production-ready, full-stack Inventory & Order Management System built with **FastAPI**, **React**, and **PostgreSQL** — fully containerized with Docker.

---

## 🚀 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite, React Query, React Hook Form, Recharts |
| Backend | Python 3.12, FastAPI, SQLAlchemy 2, Pydantic v2 |
| Database | PostgreSQL 16 |
| Containerization | Docker, Docker Compose |
| Frontend Deploy | Vercel / Netlify |
| Backend Deploy | Render / Railway |

---

## 📁 Project Structure

```
inventory-system/
├── backend/
│   ├── main.py            # FastAPI app entry point
│   ├── database.py        # SQLAlchemy engine & session
│   ├── models.py          # ORM models
│   ├── schemas.py         # Pydantic schemas
│   ├── routers/
│   │   ├── products.py
│   │   ├── customers.py
│   │   ├── orders.py
│   │   └── dashboard.py
│   ├── requirements.txt
│   ├── Dockerfile
│   ├── render.yaml        # Render deployment config
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/    # Sidebar, Header, Layout
│   │   │   └── ui/        # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── lib/
│   │   │   └── api.js     # Axios API client
│   │   └── styles/        # Global CSS
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── vercel.json
│   └── .env.example
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## ⚡ Quick Start with Docker

### 1. Clone the repository
```bash
git clone https://github.com/your-username/stockflow.git
cd stockflow
```

### 2. Configure environment
```bash
cp .env.example .env
# Edit .env with your desired passwords
```

### 3. Build and run
```bash
docker compose up --build
```

### 4. Access the app
| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000 |
| API Docs | http://localhost:8000/docs |

---

## 🛠️ Local Development (without Docker)

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt

# Set env variables
cp .env.example .env
# Edit .env to point to your local PostgreSQL

uvicorn main:app --reload
```

### Frontend

```bash
cd frontend
npm install

# Create .env.local
echo "VITE_API_URL=http://localhost:8000" > .env.local

npm run dev
```

---

## 🌐 API Reference

### Products
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/products/` | List all products |
| POST | `/products/` | Create a product |
| GET | `/products/{id}` | Get product by ID |
| PUT | `/products/{id}` | Update a product |
| DELETE | `/products/{id}` | Delete a product |

### Customers
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/customers/` | List all customers |
| POST | `/customers/` | Create a customer |
| GET | `/customers/{id}` | Get customer by ID |
| DELETE | `/customers/{id}` | Delete a customer |

### Orders
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/orders/` | List all orders |
| POST | `/orders/` | Create an order |
| GET | `/orders/{id}` | Get order by ID |
| DELETE | `/orders/{id}` | Cancel an order |

### Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/dashboard/` | Get summary stats |

Full interactive docs available at `/docs` (Swagger UI).

---

## ☁️ Deployment

### Backend → Render

1. Push code to GitHub
2. Create a new **Web Service** on [Render](https://render.com)
3. Connect your GitHub repo, set root directory to `backend/`
4. Use the `render.yaml` config or set manually:
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Add a **PostgreSQL** database on Render and link via `DATABASE_URL`
6. Set `ALLOWED_ORIGINS` to your Vercel frontend URL

### Frontend → Vercel

1. Install Vercel CLI: `npm i -g vercel`
2. From the `frontend/` directory: `vercel`
3. Set environment variable:
   - `VITE_API_URL` → your Render backend URL (e.g., `https://stockflow-api.onrender.com`)
4. Redeploy: `vercel --prod`

---

### Docker Hub (Backend Image)

```bash
docker build -t your-dockerhub-username/stockflow-backend ./backend
docker push your-dockerhub-username/stockflow-backend
```

---

## ✅ Business Logic

- ✅ Product SKU must be unique
- ✅ Customer email must be unique  
- ✅ Product quantity cannot be negative
- ✅ Orders rejected if stock is insufficient
- ✅ Creating an order automatically reduces stock
- ✅ Cancelling an order restores stock
- ✅ Order total calculated automatically by backend
- ✅ Proper HTTP status codes (201, 204, 404, 409, etc.)
- ✅ Full request validation with Pydantic v2

---

## 🎨 Features

- **Dashboard** — stats overview, low stock alerts, recent orders
- **Products** — CRUD with search, stock status badges
- **Customers** — CRUD with search
- **Orders** — multi-item order creation with live total preview
- **Order Detail** — full breakdown view
- **Responsive Design** — works on mobile and desktop
- **Toast Notifications** — success/error feedback
- **API Documentation** — auto-generated Swagger UI at `/docs`
