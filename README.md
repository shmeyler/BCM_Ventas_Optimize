# BCM VentasAI Optimize

A comprehensive geo-incrementality testing platform that empowers brands to launch regional holdout tests and measure the true causal impact of their marketing efforts.

![BCM VentasAI Optimize](https://img.shields.io/badge/BCM-VentasAI%20Optimize-orange)
![React](https://img.shields.io/badge/React-18.2.0-blue)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.3.0-blue)

## 🚀 Features

### 🔐 Authentication System
- **Login Modal**: Secure login interface (demo accepts any credentials)
- **Session Management**: Conditional navigation based on login status
- **User Experience**: Seamless transition from marketing site to platform

### 📊 Interactive Geo-Testing Dashboard
- **Region Selection**: Click-to-select US states for test vs control groups
- **Real-time Preview**: Live configuration preview with statistical power estimation
- **Test Configuration**: Comprehensive setup wizard with 4-step process

### 📈 Live Analytics Engine
- **Real-time Metrics**: Live dashboard showing incrementality lift (+28.6%)
- **Performance Tracking**: Test vs control group comparison charts
- **Statistical Confidence**: 95% confidence level with ROAS calculations
- **Time Range Selection**: Flexible date range analysis

### 🎯 Attribution Analysis
- **Smart Attribution**: Compare last-click vs incrementality-based attribution
- **Channel Breakdown**: Performance analysis across Meta, Google, TikTok, YouTube
- **Visual Charts**: Interactive bar charts and data visualizations
- **ROI Impact**: Dollar-based impact analysis ($124K incremental revenue)

### 📚 Knowledge Base
- **Incrementality Testing**: Comprehensive FAQ on geo-testing methodology
- **Data-Driven Attribution (DDA)**: Deep dive into algorithmic attribution
- **Multi-Touch Attribution (MTA)**: Understanding touchpoint credit distribution
- **Best Practices**: Digital measurement strategy recommendations

### 🛠️ Test Setup Wizard
- **4-Step Process**: Configuration → Channels → Budget → Review & Launch
- **Channel Selection**: Support for major advertising platforms
- **Budget Allocation**: Smart distribution across selected channels
- **Review Interface**: Complete configuration summary before launch

## 🎨 Design & Branding

- **BCM Corporate Identity**: Official BCM logo and orange color scheme (rgb(227, 128, 68))
- **Responsive Design**: Mobile-first approach with TailwindCSS
- **Modern UI**: Clean, professional interface with smooth animations
- **Accessibility**: WCAG compliant with proper focus states and keyboard navigation

## 🛠️ Technology Stack

### Frontend
- **React 18.2.0**: Modern component-based architecture
- **TailwindCSS**: Utility-first CSS framework
- **Framer Motion**: Smooth animations and transitions
- **Recharts**: Interactive data visualization
- **Heroicons**: Professional SVG icon library

### Development Tools
- **Create React App**: Standard React development environment
- **Yarn**: Package management
- **PostCSS**: CSS processing
- **Autoprefixer**: Cross-browser compatibility

## 🚀 Getting Started

### Prerequisites
- Node.js 14+ 
- Yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd bcm-ventasai-optimize
   ```

2. **Install dependencies**
   ```bash
   cd frontend
   yarn install
   ```

3. **Start development server**
   ```bash
   yarn start
   ```

4. **Open your browser**
   ```
   http://localhost:3000
   ```

### Production Build

```bash
cd frontend
yarn build
```

## 📱 Usage Guide

### Getting Started
1. **Visit the platform** at the deployed URL
2. **Click "Login"** in the header (use any email/password for demo)
3. **Navigate to Platform** to start configuring tests

### Running a Geo-Incrementality Test
1. **Select Regions**: Choose states for test and control groups
2. **Configure Test**: Use the 4-step wizard to set parameters
3. **Monitor Results**: View live analytics and performance metrics
4. **Analyze Attribution**: Compare different attribution models
5. **Generate Reports**: Export insights and recommendations

### Exploring the Knowledge Base
1. **Click "Resources"** in navigation
2. **Browse Categories**: Incrementality, DDA, MTA, Best Practices
3. **Expand Questions**: Click to reveal detailed answers
4. **Learn Best Practices**: Comprehensive measurement guidance

## 🔧 Configuration

### Environment Variables
```env
REACT_APP_BACKEND_URL=your-backend-url
```

### Customization
- **Colors**: Update CSS variables in `/src/App.css`
- **Branding**: Replace logo URL in Header component
- **Content**: Modify FAQ data in `/src/components.js`

## 📊 Features Breakdown

### Dashboard Capabilities
- Interactive US map for region selection
- Real-time statistical power calculation
- Live test configuration preview
- Seamless navigation between views

### Analytics Features
- Incrementality lift tracking (+28.6%)
- ROAS calculation (4.2x return)
- Statistical confidence monitoring (95%)
- Revenue impact measurement ($124K)

### Knowledge Base Topics
- **Incrementality Testing**: Methodology, benefits, duration guidelines
- **Data-Driven Attribution**: Machine learning attribution models
- **Multi-Touch Attribution**: Touchpoint credit distribution methods
- **Measurement Strategy**: Combining multiple measurement approaches

## 🏢 About BCM

This platform is developed for Beeby Clark+Meyler (BCM), a leading marketing analytics consultancy. The VentasAI Optimize platform represents BCM's commitment to providing cutting-edge measurement solutions for modern marketers.

## 📝 License

This project is proprietary software developed for BCM. All rights reserved.

## 🤝 Contributing

This is a private BCM project. For internal contributions, please follow the standard Git workflow:

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## 📞 Support

For technical support or questions about the platform:
- **Internal Team**: Contact the development team
- **BCM Clients**: Reach out through your account manager

---

**Built with ❤️ for BCM by the VentasAI team**
