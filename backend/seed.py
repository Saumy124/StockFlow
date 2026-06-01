"""
Seeds the database with realistic sample data on first startup.
Only runs if the products table is empty, so it never duplicates data
or overwrites anything a user has entered.

All prices are stored in USD (the canonical currency); the frontend
converts to INR for display when the user picks rupees.
"""
from sqlalchemy.orm import Session

from database import SessionLocal
from models import Product, Customer, Order, OrderItem


SAMPLE_PRODUCTS = [
    {"name": "Wireless Mechanical Keyboard", "sku": "KB-1001", "price": 89.99, "quantity": 45, "description": "Hot-swappable RGB mechanical keyboard with brown switches."},
    {"name": "USB-C Hub 7-in-1", "sku": "HUB-2002", "price": 34.50, "quantity": 8, "description": "Multiport adapter with HDMI, USB 3.0, SD card reader."},
    {"name": "Ergonomic Office Chair", "sku": "CHR-3003", "price": 249.00, "quantity": 12, "description": "Mesh-back chair with lumbar support and adjustable armrests."},
    {"name": "27\" 4K Monitor", "sku": "MON-4004", "price": 379.99, "quantity": 5, "description": "IPS panel, 99% sRGB, USB-C 90W power delivery."},
    {"name": "Noise-Cancelling Headphones", "sku": "AUD-5005", "price": 199.00, "quantity": 0, "description": "Over-ear ANC headphones with 30-hour battery."},
    {"name": "Webcam 1080p", "sku": "CAM-6006", "price": 59.99, "quantity": 30, "description": "Full HD webcam with auto-focus and dual mics."},
    {"name": "Standing Desk Converter", "sku": "DSK-7007", "price": 159.95, "quantity": 3, "description": "Height-adjustable desktop riser, 35-inch wide."},
    {"name": "Laptop Stand Aluminium", "sku": "STD-8008", "price": 42.00, "quantity": 60, "description": "Ventilated aluminium stand, foldable and portable."},
    {"name": "Wireless Mouse", "sku": "MSE-9009", "price": 29.99, "quantity": 9, "description": "Silent-click ergonomic mouse, 2.4GHz + Bluetooth."},
    {"name": "Desk Lamp LED", "sku": "LMP-1010", "price": 38.50, "quantity": 22, "description": "Dimmable LED lamp with wireless charging base."},
]

SAMPLE_CUSTOMERS = [
    {"full_name": "Aarav Sharma", "email": "aarav.sharma@example.com", "phone": "+91 98765 43210"},
    {"full_name": "Priya Patel", "email": "priya.patel@example.com", "phone": "+91 91234 56789"},
    {"full_name": "John Carter", "email": "john.carter@example.com", "phone": "+1 (415) 555-0142"},
    {"full_name": "Emma Wilson", "email": "emma.wilson@example.com", "phone": "+1 (212) 555-0199"},
    {"full_name": "Rohan Mehta", "email": "rohan.mehta@example.com", "phone": "+91 99887 76655"},
]

# Each tuple: (customer_index, [(product_index, qty), ...])
SAMPLE_ORDERS = [
    (0, [(0, 2), (8, 1)]),
    (1, [(2, 1)]),
    (2, [(5, 3), (7, 2)]),
    (3, [(9, 1), (1, 1)]),
    (4, [(0, 1), (5, 1), (8, 2)]),
]


def seed_database():
    db: Session = SessionLocal()
    try:
        # Skip if data already exists
        if db.query(Product).first() is not None:
            return

        # Products
        products = []
        for p in SAMPLE_PRODUCTS:
            product = Product(**p)
            db.add(product)
            products.append(product)
        db.flush()

        # Customers
        customers = []
        for c in SAMPLE_CUSTOMERS:
            customer = Customer(**c)
            db.add(customer)
            customers.append(customer)
        db.flush()

        # Orders (with stock deduction, matching real business logic)
        for cust_idx, items in SAMPLE_ORDERS:
            total = 0.0
            order = Order(customer_id=customers[cust_idx].id, total_amount=0.0, status="confirmed")
            db.add(order)
            db.flush()

            for prod_idx, qty in items:
                product = products[prod_idx]
                # Only fulfill what stock allows
                if product.quantity < qty:
                    continue
                line = OrderItem(
                    order_id=order.id,
                    product_id=product.id,
                    quantity=qty,
                    unit_price=product.price,
                )
                db.add(line)
                product.quantity -= qty
                total += product.price * qty

            order.total_amount = round(total, 2)

        db.commit()
        print("✅ Database seeded with sample data.")
    except Exception as e:
        db.rollback()
        print(f"⚠️  Seeding skipped due to error: {e}")
    finally:
        db.close()
