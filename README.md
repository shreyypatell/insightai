# InsightAI — Intelligent Data Analytics & ML Platform

> **"Turn your data into insights."**

InsightAI is a full-stack AI/ML platform that lets users upload datasets, run automatic EDA, train and compare machine learning models, and receive plain-English insights — all through a modern SaaS-style dashboard.

Built as a portfolio project demonstrating the **complete ML engineering lifecycle** from data ingestion to model deployment.

---

## ✨ Features

| Feature | Details |
|---|---|
| **Authentication** | JWT-based register / login / logout |
| **Dataset Management** | Upload CSV/Excel, view metadata, search, delete |
| **Automatic Cleaning** | Duplicate removal, missing value imputation, dtype correction |
| **EDA Dashboard** | Summary stats, histograms, bar charts, correlation heatmap |
| **Model Training** | Classification & Regression — Logistic Regression, Random Forest, XGBoost |
| **Model Comparison** | Side-by-side metric table + bar chart, best model highlighted |
| **Model Download** | Download trained `.pkl` pipelines (includes preprocessing) |
| **AI Insights** | Rule-based plain-English analysis (no paid API needed) |
| **Reports History** | View and delete previous analysis reports |
| **Dark Mode** | System-aware, toggle-able |

---

## 🛠 Tech Stack

**Frontend**
- React (Vite) · Tailwind CSS · Framer Motion · Recharts · React Router · React Hook Form · Lucide React

**Backend**
- Python · FastAPI · SQLAlchemy · Pydantic · JWT (python-jose) · Passlib

**Machine Learning**
- scikit-learn · XGBoost · Pandas · NumPy · Joblib

**Database**
- SQLite (development, zero-setup) → swappable to PostgreSQL/Supabase for production

**DevOps**
- Docker · Docker Compose · GitHub Actions CI/CD

---

## 🏗 System Architecture

```
┌─────────────────────────────────────────────────────┐
│                   React Frontend                    │
│  Landing · Dashboard · Datasets · Train · Compare   │
└──────────────────────┬──────────────────────────────┘
                       │  REST API (JSON)
┌──────────────────────▼──────────────────────────────┐
│                  FastAPI Backend                    │
│                                                     │
│  /api/auth   → auth_service                         │
│  /api/datasets → dataset_service                    │
│  /api/clean  → cleaning_service                     │
│  /api/eda    → eda_service                          │
│  /api/models → ml/trainer → joblib .pkl             │
│  /api/reports → report aggregation                  │
└──────────────────────┬──────────────────────────────┘
                       │
              ┌────────▼────────┐
              │  SQLite / Postgres│
              │  users · datasets │
              │  ml_models · reports│
              └─────────────────┘
```

---

## 🚀 Local Setup (Step-by-Step)

### Prerequisites
- **Git** — [git-scm.com](https://git-scm.com)
- **Node.js 20+** — [nodejs.org](https://nodejs.org)
- **Python 3.11+** — [python.org](https://python.org)
- **Docker Desktop** (optional, for containerised run) — [docker.com](https://docker.com)

---

### 1. Clone the repository

```bash
git clone https://github.com/<your-username>/insightai.git
cd insightai
```

---

### 2. Backend setup

```bash
cd backend

# Copy env file
cp .env.example .env
# (Optional) edit .env to change SECRET_KEY

# Create virtual environment
python -m venv venv

# Activate it
# Windows:
venv\Scripts\activate
# macOS / Linux:
source venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt

# Create storage directories
mkdir -p storage/uploads storage/models

# Start the API server
uvicorn main:app --reload --port 8000
```

API docs available at: **http://localhost:8000/docs**

---

### 3. Frontend setup

```bash
# Open a new terminal, go to the frontend folder
cd frontend

# Copy env file
cp .env.example .env
# Leave VITE_API_BASE_URL blank for local dev (Vite proxy handles it)

# Install Node dependencies
npm install

# Start the dev server
npm run dev
```

App available at: **http://localhost:5173**

---

### 4. Run tests

```bash
cd backend
pytest tests/ -v
```

---

### 5. Run with Docker (single command)

```bash
# From the project root
docker compose up --build
```

- Frontend → **http://localhost**
- Backend API → **http://localhost:8000**
- API docs → **http://localhost:8000/docs**

---

## 📡 API Reference

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Create account |
| `POST` | `/api/auth/login` | Login, returns JWT |

### Datasets

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/datasets/upload` | Upload CSV/Excel |
| `GET`  | `/api/datasets` | List user's datasets |
| `GET`  | `/api/datasets/{id}` | Get dataset metadata |
| `DELETE` | `/api/datasets/{id}` | Delete dataset |

### Analysis

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/clean/{id}` | Run data cleaning |
| `GET`  | `/api/eda/{id}` | Run EDA (optional `?target_column=`) |

### Models

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/models/train` | Train models (body: `dataset_id, target_column, problem_type, algorithms`) |
| `GET`  | `/api/models/dataset/{id}` | All models for a dataset |
| `GET`  | `/api/models/{id}/results` | Single model metrics |
| `GET`  | `/api/models/{id}/download` | Download `.pkl` pipeline |

---

## 🤖 ML Workflow

```
CSV Upload
    │
    ▼
Metadata Extraction (shape, dtypes, missing counts)
    │
    ▼
Data Cleaning (duplicates, missing fill, dtype fix)
    │
    ▼
EDA (distributions, correlations, target analysis)
    │
    ▼
Preprocessing Pipeline (ColumnTransformer)
  ├─ Numeric: median impute → StandardScaler
  └─ Categorical: mode impute → OneHotEncoder
    │
    ▼
Model Training (inside sklearn Pipeline)
  ├─ Logistic Regression / Linear Regression
  ├─ Random Forest (Classifier / Regressor)
  └─ XGBoost (Classifier / Regressor)
    │
    ▼
Evaluation + Insight Generation
    │
    ▼
Joblib serialisation → downloadable .pkl
```

The downloaded `.pkl` contains the **complete preprocessing + model pipeline**, so it can be used for inference on raw data without any additional preprocessing code.

---

## ☁️ Free Deployment Guide

### Database — Supabase (Free)

1. Create account at [supabase.com](https://supabase.com)
2. Create a new project
3. Copy the **Connection string** from `Settings → Database`
4. Use it as `DATABASE_URL` in your backend env

### Backend — Render (Free)

1. Push code to GitHub
2. Create a new **Web Service** on [render.com](https://render.com)
3. Connect your GitHub repo, select the `backend/` folder
4. Set:
   - **Build command**: `pip install -r requirements.txt`
   - **Start command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Add environment variables: `SECRET_KEY`, `DATABASE_URL`, `ALLOWED_ORIGINS`
6. Copy the Render public URL (e.g. `https://insightai-api.onrender.com`)

### Frontend — Netlify (Free)

1. Create account at [netlify.com](https://netlify.com)
2. Click **Add new site → Import from Git**
3. Select your repo
4. Set:
   - **Base directory**: `frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `frontend/dist`
5. Add environment variable: `VITE_API_BASE_URL=https://insightai-api.onrender.com`
6. Deploy!

**CORS**: Make sure `ALLOWED_ORIGINS` on Render includes your Netlify URL, e.g.:
```
ALLOWED_ORIGINS=https://insightai.netlify.app
```

---

## 🔁 CI/CD Pipeline

GitHub Actions runs on every push to `main` and `develop`:

```
Push to GitHub
    │
    ├── Backend job: pip install → pytest
    ├── Frontend job: npm ci → npm run build
    └── Docker job: docker compose build (smoke test)
```

See `.github/workflows/ci.yml` for the full configuration.

---

## 📁 Project Structure

```
insightai/
├── backend/
│   ├── app/
│   │   ├── api/          # FastAPI route handlers
│   │   ├── database/     # SQLAlchemy models & engine
│   │   ├── ml/           # Preprocessing & trainer
│   │   ├── schemas/      # Pydantic request/response models
│   │   ├── services/     # Business logic (auth, dataset, EDA…)
│   │   └── utils/        # Security, deps, file helpers
│   ├── tests/            # pytest integration tests
│   ├── main.py           # FastAPI app entry point
│   └── requirements.txt
│
├── frontend/
│   └── src/
│       ├── components/   # Navbar, Sidebar, Charts, Cards…
│       ├── context/      # Auth, Theme, Toast
│       ├── pages/        # Dashboard, Datasets, Train, Compare…
│       └── services/     # Axios API wrappers
│
├── .github/workflows/    # CI/CD
├── docker-compose.yml
└── README.md
```

---

## 🔮 Future Improvements

- Real-time training progress with WebSockets
- Support for larger files via chunked uploads
- Feature importance visualisation (SHAP values)
- Hyperparameter tuning with Optuna
- PostgreSQL migration for multi-user production scale
- Export full analysis report as PDF
- Time-series forecasting support

---

## 📄 License

MIT — free to use, fork, and include on your resume.

---

*Built with ❤️ as a CSE fresher portfolio project.*
