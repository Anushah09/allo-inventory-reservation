# Allo Inventory Reservation System

A full-stack inventory reservation system built using Next.js, Prisma, PostgreSQL, and Supabase.

This application allows users to temporarily reserve inventory during checkout, confirm purchases, or release stock if the checkout is cancelled or expires.

---

# Features

## Inventory Management
- Products stored with warehouse-level inventory
- Real-time stock availability tracking
- Reserved inventory handling

## Reservation System
- Reserve stock during checkout
- Confirm completed purchases
- Release cancelled reservations
- Automatic expiry cleanup for abandoned reservations

## Concurrency-Safe Reservations
Implemented atomic database-level reservation updates to prevent overselling during simultaneous reservation requests.

## Frontend Features
- Product inventory dashboard
- Live stock availability
- Reservation timer countdown
- Confirm and cancel actions
- Responsive UI with Tailwind CSS

---

# Tech Stack

## Frontend
- Next.js 16
- React
- TypeScript
- Tailwind CSS

## Backend
- Next.js Route Handlers
- Prisma ORM
- PostgreSQL
- Supabase

---

# Database Schema

## Product
Stores product details.

## Warehouse
Stores warehouse information.

## Stock
Tracks inventory for each product in each warehouse.

## Reservation
Tracks temporary inventory holds during checkout.

---

# Concurrency Handling

The reservation API uses atomic SQL updates inside database transactions:

```sql
UPDATE "Stock"
SET "reservedUnits" = "reservedUnits" + quantity
WHERE "id" = stockId
AND ("totalUnits" - "reservedUnits") >= quantity