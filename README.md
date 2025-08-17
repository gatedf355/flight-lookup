# FlightLookup

A real-time flight tracking application with a modern web interface and robust backend API.

## 🚀 Quick Start

### Option 1: Use the startup script (Recommended)
```bash
./start-dev.sh
```

### Option 2: Manual startup
```bash
# Terminal 1: Start backend
cd server && npm start

# Terminal 2: Start frontend  
cd web && npm run dev
```

## 🌐 Access Points

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:4000
- **Health Check**: http://localhost:3000/health

## 🏗️ Architecture

### Frontend (`/web`)
- **Next.js 15** with React 19 and TypeScript
- **Tailwind CSS** with custom color schemes
- **Radix UI** components for accessibility
- **Real-time flight tracking** with live position data
- **Raw JSON viewer** for debugging and development
- **Theme support** (light/dark mode)

### Backend (`/server`)
- **Node.js** with TypeScript
- **Express.js** REST API
- **FlightRadar24 API** integration
- **Caching layer** with configurable TTL
- **Rate limiting** and request throttling
- **Health monitoring** endpoints

## 🔌 API Endpoints

### Flight Lookup
```
GET /api/flight?number={callsign}&full=true
```

### Health Check
```
GET /api/health
```

## 🛠️ Development

### Prerequisites
- Node.js 18+
- npm or yarn
- FlightRadar24 API key (for backend)

### Environment Setup
1. Copy `.env.example` to `.env` in the server directory
2. Add your `FR24_API_KEY` to the `.env` file
3. Install dependencies in both `server/` and `web/` directories

### Dependencies
```bash
# Backend
cd server && npm install

# Frontend
cd web && npm install
```

## 🎨 Features

- **Real-time Flight Tracking**: Search by callsign, flight number, or registration
- **Live Position Data**: Coordinates, altitude, speed, track, and vertical speed
- **Smart Caching**: Configurable TTL with negative caching for missing flights
- **Rate Limiting**: Built-in throttling to respect API limits
- **Responsive Design**: Works seamlessly on all devices
- **Developer Tools**: Raw JSON viewer and health monitoring
- **Customizable UI**: Multiple color schemes and theme support

## 📁 Project Structure

```
FlightLookup/
├── server/                 # Backend API server
│   ├── index.ts           # Main server file
│   ├── routes/            # API route handlers
│   ├── utils/             # Utility functions
│   └── data/              # Airline data and mappings
├── web/                   # Frontend application
│   ├── app/               # Next.js App Router
│   ├── components/        # React components
│   └── lib/               # Utility functions
├── start-dev.sh           # Development startup script
└── README.md              # This file
```

## 🔧 Configuration

### Backend Environment Variables
```env
FR24_API_KEY=your_api_key_here
FR24_LIVE_TTL_MS=30000
FR24_NEG_TTL_MS=60000
PORT=4000
```

### Frontend Configuration
- API proxy configuration in `web/next.config.mjs`
- Theme and color scheme customization in `web/app/page.tsx`

## 🚀 Deployment

### Backend
```bash
cd server
npm run build
npm start
```

### Frontend
```bash
cd web
npm run build
npm start
```

## 🐛 Troubleshooting

### Common Issues
1. **API Connection Failed**: Ensure backend is running on port 4000
2. **Flight Not Found**: Check flight number format and API key validity
3. **Rate Limiting**: Wait before refreshing (20s cooldown per flight)

### Debug Mode
- Use the Raw JSON viewer in the frontend to see complete API responses
- Check the health endpoint for backend status
- Monitor server logs for detailed error information

## 📚 Documentation

- [Frontend Documentation](web/README.md)
- [Backend API Reference](server/README.md)
- [Implementation Summary](IMPLEMENTATION_SUMMARY.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is part of the FlightLookup application suite.
