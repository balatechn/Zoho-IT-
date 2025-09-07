# National Group India - IT Asset Tracker

A modern, elegant IT asset inventory and request management system built for National Group India, featuring SvelteKit and Node.js with a design inspired by Crextio's sophisticated dashboard interface.

## Features

### 🏠 Dashboard
- Real-time statistics and metrics
- Recent assets and requests overview
- Asset status distribution charts
- Clean, intuitive interface with Crextio-inspired design

### 💻 Asset Management
- Complete asset lifecycle tracking
- Asset categories, brands, models, and specifications
- Status management (Available, Assigned, Maintenance, Retired)
- Warranty tracking and expiration alerts
- Location and assignment tracking
- Advanced search and filtering

### 📝 Request Management
- Employee request submission form
- Priority-based request handling
- Department-wise request tracking
- Request approval workflow
- Status updates and notifications

### 📊 Reports & Analytics
- Asset distribution by category and status
- Request analytics by department
- Warranty expiration tracking
- Unassigned assets reports
- CSV export functionality

## Tech Stack

- **Frontend**: SvelteKit with TypeScript
- **Backend**: Node.js with Express
- **Database**: SQLite (easily replaceable with PostgreSQL/MySQL)
- **Styling**: Custom CSS with modern design patterns
- **Icons**: Unicode emojis for simplicity

## Design Philosophy

The application features an elegant, modern design inspired by the Crextio dashboard, including:
- Clean card-based layouts
- Subtle gradients and shadows
- Consistent color scheme and typography
- Responsive design for all screen sizes
- Intuitive navigation and user experience

## Installation & Setup

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Quick Start

1. **Navigate to the project directory**
   ```bash
   cd d:\DATA\it-inten
   ```

2. **Install dependencies** (already installed)
   ```bash
   npm install
   ```

3. **Start the application**
   ```bash
   npm start
   ```
   This command starts both the backend API server (port 3001) and the frontend development server (port 5173) simultaneously.

4. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3001

### Individual Services

To run services separately:

```bash
# Backend only
npm run server

# Frontend only
npm run dev
```

## Project Structure

```
├── src/
│   ├── routes/
│   │   ├── +layout.svelte          # Main layout with navigation
│   │   ├── +page.svelte             # Dashboard page
│   │   ├── assets/
│   │   │   ├── +page.svelte         # Assets list
│   │   │   └── new/
│   │   │       └── +page.svelte     # Add new asset
│   │   ├── requests/
│   │   │   ├── +page.svelte         # Requests list
│   │   │   └── new/
│   │   │       └── +page.svelte     # New request form
│   │   └── reports/
│   │       └── +page.svelte         # Reports & analytics
│   ├── app.css                      # Global styles (Crextio-inspired)
│   └── app.html                     # Main HTML template
├── server.js                       # Backend API server
├── database.db                     # SQLite database (auto-created)
└── package.json
```

## Key Features

### Asset Management
- **Comprehensive Tracking**: Track all asset details from purchase to retirement
- **Smart Asset Tags**: Auto-generation of asset tags based on category
- **Status Management**: Available, Assigned, Maintenance, Retired
- **Warranty Alerts**: Automatic tracking of warranty expiration dates
- **Advanced Search**: Filter by category, status, brand, model, etc.

### Request System
- **Employee Self-Service**: Easy request submission form
- **Priority Management**: High, Medium, Low priority levels
- **Approval Workflow**: Pending → Approved/Rejected → Completed
- **Department Tracking**: Organize requests by department

### Reports & Analytics
- **Visual Charts**: Asset and request distribution charts
- **Warranty Monitoring**: Track assets with expiring warranties
- **Utilization Reports**: Identify unassigned or underutilized assets
- **Export Functionality**: CSV export for external analysis

## API Endpoints

### Assets
- `GET /api/assets` - List all assets
- `POST /api/assets` - Create new asset
- `PUT /api/assets/:id` - Update asset
- `DELETE /api/assets/:id` - Delete asset

### Requests
- `GET /api/requests` - List all requests
- `POST /api/requests` - Create new request
- `PUT /api/requests/:id` - Update request status

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics
- `GET /api/categories` - Get asset categories

## Development

To create a production version of your app:

```sh
npm run build
```

You can preview the production build with `npm run preview`.

## Support

For issues or questions:
1. Check the console for error messages
2. Verify that both frontend and backend servers are running
3. Ensure database permissions are correct
4. Check browser network tab for API call failures

Built with ❤️ using SvelteKit and Node.js, featuring a design inspired by modern dashboard interfaces.
