# 🤖 Live Trader AI

A real-time AI-powered trading dashboard for monitoring and managing automated trading operations. Built with React, TypeScript, and Vite.

## ✨ Features

- **Real-time Trading Dashboard** - Monitor live trading activity and positions
- **AI Model Management** - View and control AI trading model states
- **Performance Analytics** - Track trading performance with detailed metrics
- **Portfolio Management** - Real-time portfolio summary and position tracking
- **Trade History** - Comprehensive trade execution history
- **Manual Predictions** - Trigger manual AI predictions on demand
- **Interactive Charts** - Visualize price movements and trading signals
- **Configuration Panel** - Adjust trading parameters and settings

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/ahjavid/live-trader-ai.git
cd live-trader-ai
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
   - Create a `.env.local` file in the root directory
   - Add your API configuration (see `.env.example` if available)

4. Start the development server:
```bash
npm run dev
```

5. Open your browser and navigate to `http://localhost:5173`

## 🏗️ Project Structure

```
live-trader-ai/
├── components/          # React components
│   ├── ActivitySummary.tsx
│   ├── ConfigModal.tsx
│   ├── ControlPanel.tsx
│   ├── Header.tsx
│   ├── PerformanceDashboard.tsx
│   ├── PortfolioSummary.tsx
│   ├── PositionsTable.tsx
│   ├── PriceChart.tsx
│   ├── TradeHistoryTable.tsx
│   └── ...
├── hooks/               # Custom React hooks
│   └── useTrader.ts
├── services/            # API services
│   └── tradingService.ts
├── App.tsx             # Main application component
├── types.ts            # TypeScript type definitions
└── vite.config.ts      # Vite configuration
```

## 🛠️ Built With

- **React** - Frontend framework
- **TypeScript** - Type-safe JavaScript
- **Vite** - Fast build tool and dev server
- **Recharts** - Chart library for data visualization
- **TailwindCSS** - Utility-first CSS framework (if applicable)

## 📊 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run lint` - Run linter

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👤 Author

**ahjavid**
- GitHub: [@ahjavid](https://github.com/ahjavid)

## ⚠️ Disclaimer

This software is for educational purposes only. Trading cryptocurrencies and other financial instruments carries risk. Use at your own risk.
