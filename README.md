# Mila ERP System

A modern ERP system for warehouse management with an elegant light design, built on Next.js 15, React 19, TypeScript, and PostgreSQL.

## Features

- 📦 Box Management

  - Create and manage boxes
  - Track contents
  - Generate barcodes for boxes
  - Scan for quick access

- 🏷️ Product Management

  - Add and edit products
  - Generate barcodes for products
  - Track quantities
  - Categorize products
  - Attach photos

- 📱 Barcode Scanning

  - Real-time barcode scanning
  - EAN-13 format support
  - Prefix validation (200 for boxes, 300 for products)
  - Manual barcode entry
  - Scan history

- 🔍 Search and Filtering

  - Search products by name or barcode
  - Filter products by category
  - Advanced search parameters

- 📊 Reports
  - Box content reports
  - Product inventory reports
  - Export functionality

## Technology Stack

- **Frontend:**

  - Next.js 15 (App Router)
  - React 19
  - TypeScript
  - Tailwind CSS with modern light theme
  - HeadlessUI for UI components
  - Framer Motion for animations
  - React Hot Toast for notifications
  - Recharts for data visualization
  - QuaggaJS for barcode scanning
  - Heroicons for icons

- **Backend:**

  - Next.js API Routes
  - PostgreSQL
  - TypeScript

- **Development Tools:**
  - ESLint
  - Prettier
  - TypeScript

## Design

The system uses a modern light design with a focus on usability:

- Unified light theme for better readability and stylish appearance
- Carefully thought-out spacing and typography
- Soft shadows and modern rounded corners
- Semantic color scheme:
  - Primary: blue shades for main actions
  - Accent: green shades for confirmation and success
  - Warning: orange shades for warnings
  - Danger: red shades for errors and deletion

## Running with Docker

The easiest way to run the application is using Docker and Docker Compose:

1. Clone the repository:

   ```bash
   git clone https://github.com/butovx/MILA_ERP.git
   cd MILA_ERP
   ```

2. Configure environment variables:

   ```bash
   cp .env.example .env
   ```

   Edit `.env` with your database credentials and other settings if needed.

3. Start the Docker containers:

   ```bash
   docker-compose up -d
   ```

4. Access the application:
   - Web interface: https://localhost
   - API: https://localhost/api/\*
   - Database: localhost:5432 (accessible from host machine for debugging)

## Manual Setup (Development)

If you prefer to run the application without Docker:

1. Prerequisites:

   - Node.js 18 or higher
   - PostgreSQL 14 or higher
   - npm or yarn

2. Install dependencies:

   ```bash
   npm install
   # or
   yarn install
   ```

3. Configure environment variables:

   ```bash
   cp .env.example .env
   ```

   Edit `.env` with your database credentials.

4. Set up SSL certificates for local HTTPS:

   ```bash
   cp .env.local.example .env.local
   ```

   Generate SSL certificates or use the provided ones in the /certificates directory.

5. Run the development server:

   ```bash
   npm run dev
   # or
   yarn dev
   ```

6. Open [https://localhost:443](https://localhost:443) in your browser.

## Project Structure

```
src/
├── app/                    # Next.js app directory
│   ├── api/                # API routes
│   ├── boxes/              # Box management pages
│   ├── products/           # Product management pages
│   └── scan/               # Barcode scanning page
├── components/             # Reusable components
├── lib/                    # Utilities and configurations
├── utils/                  # Helper utilities
├── hooks/                  # Custom React hooks
└── types/                  # TypeScript type definitions
```

## API Documentation

### Products

- `GET /api/products` - Get all products
- `GET /api/products/[id]` - Get product by ID
- `GET /api/products/barcode/[code]` - Get product by barcode
- `POST /api/products` - Create a new product
- `PUT /api/products/[id]` - Update a product
- `DELETE /api/products/[id]` - Delete a product

### Boxes

- `GET /api/boxes` - Get all boxes
- `GET /api/boxes/[id]` - Get box by ID
- `GET /api/boxes/barcode/[code]` - Get box by barcode
- `POST /api/boxes` - Create a new box
- `PUT /api/boxes/[id]` - Update a box
- `DELETE /api/boxes/[id]` - Delete a box

### Box Items

- `GET /api/box-items` - Get all box items
- `POST /api/box-items` - Add an item to a box
- `DELETE /api/box-items/[boxId]/[productId]` - Remove an item from a box

## Docker Architecture

The application consists of three main services:

1. **Web (Next.js)**: The application server running Next.js
2. **Database (PostgreSQL)**: The database server
3. **Nginx**: Reverse proxy that handles SSL termination and static file serving

Database data is persisted through Docker volumes.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, please open an issue in the GitHub repository or contact the development team.
