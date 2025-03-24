# Mila ERP System

A modern ERP system for warehouse management, built with Next.js 15, React 19, TypeScript, and PostgreSQL.

## Features

- 📦 Box Management

  - Create and manage boxes
  - Track box contents
  - Generate box barcodes
  - Scan boxes for quick access

- 🏷️ Product Management

  - Add and edit products
  - Generate product barcodes
  - Track product quantities
  - Product categorization
  - Photo attachments

- 📱 Barcode Scanning

  - Real-time barcode scanning
  - Support for EAN-13 format
  - Prefix validation (200 for boxes, 300 for products)
  - Manual barcode entry
  - Scan history

- 🔍 Search and Filter

  - Search products by name or barcode
  - Filter products by category
  - Advanced search options

- 📊 Reports
  - Box contents reports
  - Product inventory reports
  - Export functionality

## Tech Stack

- **Frontend:**

  - Next.js 15 (App Router)
  - React 19
  - TypeScript
  - Tailwind CSS
  - QuaggaJS (barcode scanning)
  - Heroicons (UI icons)
  - BWIP-JS (barcode generation)

- **Backend:**

  - Next.js API Routes
  - PostgreSQL
  - Prisma ORM
  - TypeScript

- **Development Tools:**
  - ESLint
  - Prettier
  - TypeScript
  - Prisma Studio

## Prerequisites

- Node.js 18 or higher
- PostgreSQL 14 or higher
- npm or yarn

## Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/mila_erp.git
   cd mila_erp
   ```

2. Install dependencies:

   ```bash
   npm install
   # or
   yarn install
   ```

3. Set up environment variables:

   ```bash
   cp .env.example .env
   ```

   Edit `.env` with your database credentials and other settings.

4. Set up the database:

   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. Run the development server:

   ```bash
   npm run dev
   # or
   yarn dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── boxes/             # Box management pages
│   ├── products/          # Product management pages
│   └── scan/              # Barcode scanning page
├── components/            # Reusable components
├── lib/                   # Utility functions and configurations
├── prisma/               # Database schema and migrations
└── types/                # TypeScript type definitions
```

## API Documentation

### Products

- `GET /api/products` - Get all products
- `GET /api/products/[id]` - Get product by ID
- `GET /api/products/barcode/[code]` - Get product by barcode
- `POST /api/products` - Create new product
- `PUT /api/products/[id]` - Update product
- `DELETE /api/products/[id]` - Delete product

### Boxes

- `GET /api/boxes` - Get all boxes
- `GET /api/boxes/[id]` - Get box by ID
- `GET /api/boxes/barcode/[code]` - Get box by barcode
- `POST /api/boxes` - Create new box
- `PUT /api/boxes/[id]` - Update box
- `DELETE /api/boxes/[id]` - Delete box

### Box Items

- `GET /api/box-items` - Get all box items
- `POST /api/box-items` - Add item to box
- `DELETE /api/box-items/[boxId]/[productId]` - Remove item from box

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
