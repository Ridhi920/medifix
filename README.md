# Medifix

A production-ready healthcare platform with multi-service booking capabilities.

## Tech Stack

### Backend
- **Framework**: FastAPI (Python 3.10+)
- **Database**: SQLModel with SQLite (production: PostgreSQL recommended)
- **Testing**: pytest with FastAPI TestClient

### Web Application
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **UI Library**: Material-UI (MUI)
- **Routing**: React Router v6

### Mobile Application
- **Framework**: React Native via Expo SDK 54
- **Language**: TypeScript
- **Platform Support**: iOS and Android

## Project Structure

```
medifix/
├── backend/           # FastAPI backend service
│   ├── app/
│   │   ├── main.py       # Application entry point
│   │   ├── models.py     # Database models
│   │   ├── routes.py     # API endpoints
│   │   ├── schemas.py    # Pydantic schemas
│   │   ├── db.py         # Database configuration
│   │   └── seed.py       # Database seeding
│   ├── tests/            # Backend tests
│   └── requirements.txt  # Python dependencies
│
├── web/               # React web application
│   ├── src/
│   │   ├── pages/        # Page components
│   │   ├── components/   # Reusable components
│   │   └── App.tsx       # Root component
│   └── package.json      # Node dependencies
│
├── mobile/            # React Native mobile app
│   ├── src/
│   │   ├── screens/      # Screen components
│   │   ├── components/   # Reusable components
│   │   └── data/         # Static data
│   ├── ios/              # iOS native code
│   └── App.tsx           # Root component
│
├── docs/              # Documentation
│   └── ROADMAP.md        # Product roadmap
│
└── assets/            # Shared assets
```

## Services Offered

- 💊 **Medicine Delivery** - Prescription upload and doorstep delivery
- 🏥 **Clinic Appointments** - Doctor visits by specialty
- 🔬 **Lab Tests** - Home sample collection and diagnostics
- 🦷 **Dental Care** - Dental consultation and treatment
- 🚑 **Ambulance Booking** - On-demand dispatch
- 🏃 **Physiotherapy** - In-home sessions
- 👴 **Nursing & Elderly Care** - Post-surgery and skilled nursing
- 🩺 **Medical Equipment** - Sales and rentals

## Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+
- npm or yarn

### Backend Setup

1. **Create a virtual environment**
   ```bash
   cd backend
   python -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   ```

2. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Start the API server**
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```

4. **Run tests**
   ```bash
   pytest
   ```

The API will be available at `http://localhost:8000`
- Swagger docs: `http://localhost:8000/docs`
- Health check: `http://localhost:8000/health`

### Web Application Setup

1. **Install dependencies**
   ```bash
   cd web
   npm install
   ```

2. **Start development server**
   ```bash
   npm run dev
   ```

3. **Build for production**
   ```bash
   npm run build
   ```

The web app will be available at `http://localhost:5173`

### Mobile Application Setup

1. **Install dependencies**
   ```bash
   cd mobile
   npm install
   ```

2. **Start Expo development server**
   ```bash
   npm start
   ```

3. **Run on specific platform**
   ```bash
   npm run ios      # iOS simulator
   npm run android  # Android emulator
   ```

## API Endpoints

### Health Check
- `GET /health` - Returns API status

### Services
- `GET /services` - List all available services

### Bookings
- `GET /bookings` - List all bookings
- `POST /bookings` - Create a new booking

## Development

### Backend Testing
```bash
cd backend
pytest                    # Run all tests
pytest tests/test_*.py    # Run specific test file
pytest -v                 # Verbose output
pytest --cov=app          # With coverage
```

### Code Quality
- Backend follows PEP 8 style guidelines
- Frontend uses TypeScript for type safety
- All components are strongly typed

## Roadmap

See [docs/ROADMAP.md](docs/ROADMAP.md) for detailed product roadmap including:
- Phase 1: MVP (Revenue-first features)
- Phase 2: UI/UX Design
- Phase 3: Growth & Advanced Features

## License

Private - All rights reserved