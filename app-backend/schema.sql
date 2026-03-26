DROP TABLE IF EXISTS audit_logs, shifts, kitchen_display, discounts, inventory, reservations, payments, order_items, orders, menu_item_modifiers, menu_items, tables, categories, customers, users CASCADE;
DROP TABLE IF EXISTS "User", "Product", "Restaurant", "Video", "Order", "OrderItem", "Table" CASCADE;

CREATE TABLE users (
    user_id         SERIAL          PRIMARY KEY,
    user_name       VARCHAR(200)    NOT NULL,
    user_password   VARCHAR(200)    NOT NULL,
    user_email      VARCHAR(260)    UNIQUE NOT NULL,
    user_role       VARCHAR(50)     NOT NULL CHECK (user_role IN ('Admin', 'Cashier', 'Waiter', 'Kitchen')),
    is_active       BOOLEAN         DEFAULT TRUE,
    last_login      TIMESTAMP,
    refresh_token   TEXT,
    created_at      TIMESTAMP       DEFAULT NOW(),
    updated_at      TIMESTAMP       DEFAULT NOW()
);

CREATE TABLE customers (
    customer_id     SERIAL          PRIMARY KEY,
    customer_name   VARCHAR(200)    NOT NULL,
    phone_number    VARCHAR(20)     NOT NULL,
    user_email      VARCHAR(200)    UNIQUE,
    user_address    TEXT,
    loyalty_points  INT             DEFAULT 0,
    is_active       BOOLEAN         DEFAULT TRUE,
    created_at      TIMESTAMP       DEFAULT NOW(),
    updated_at      TIMESTAMP       DEFAULT NOW()
);

CREATE TABLE categories (
    category_id         SERIAL          PRIMARY KEY,
    category_name       VARCHAR(299)    NOT NULL,
    slug                VARCHAR(299)    UNIQUE NOT NULL,
    category_description TEXT,
    parent_id           INT             REFERENCES categories(category_id) ON DELETE SET NULL,
    display_order       INT             DEFAULT 0,
    image_url           VARCHAR(500),
    is_active           BOOLEAN         DEFAULT TRUE,
    created_at          TIMESTAMP       DEFAULT NOW(),
    updated_at          TIMESTAMP       DEFAULT NOW()
);

CREATE TABLE menu_items (
    menu_items_id           SERIAL          PRIMARY KEY,
    menu_items_category_id  INT             REFERENCES categories(category_id) ON DELETE SET NULL,
    menu_items_name         VARCHAR(200)    NOT NULL,
    slug                    VARCHAR(200)    UNIQUE NOT NULL,
    menu_items_description  TEXT,
    price                   DECIMAL(10,2)   NOT NULL CHECK (price >= 0),
    cost_price              DECIMAL(10,2),
    image_url               VARCHAR(500),
    is_available            BOOLEAN         DEFAULT TRUE,
    prep_time               INT,
    calories                INT,
    display_order           INT             DEFAULT 0,
    created_at              TIMESTAMP       DEFAULT NOW(),
    updated_at              TIMESTAMP       DEFAULT NOW()
);

CREATE TABLE menu_item_modifiers (
    id              SERIAL          PRIMARY KEY,
    menu_item_id    INT             REFERENCES menu_items(menu_items_id) ON DELETE CASCADE,
    modifier_name   VARCHAR(300)    NOT NULL,
    extra_charge    DECIMAL(10,2)   DEFAULT 0.00,
    is_available    BOOLEAN         DEFAULT TRUE,
    created_at      TIMESTAMP       DEFAULT NOW(),
    updated_at      TIMESTAMP       DEFAULT NOW()
);

CREATE TABLE tables (
    table_id        SERIAL          PRIMARY KEY,
    table_number    VARCHAR(20)     UNIQUE NOT NULL,
    floor           VARCHAR(20)     DEFAULT 'Ground Floor',
    capacity        INT             NOT NULL DEFAULT 1,
    table_status    VARCHAR(20)     DEFAULT 'Available' CHECK (table_status IN ('Available', 'Occupied', 'Reserved', 'Maintenance')),
    is_active       BOOLEAN         DEFAULT TRUE,
    created_at      TIMESTAMP       DEFAULT NOW(),
    updated_at      TIMESTAMP       DEFAULT NOW()
);

CREATE TABLE orders (
    order_id        SERIAL          PRIMARY KEY,
    table_id        INT             REFERENCES tables(table_id) ON DELETE SET NULL,
    user_id         INT             REFERENCES users(user_id) ON DELETE SET NULL,
    customer_id     INT             REFERENCES customers(customer_id) ON DELETE SET NULL,
    order_type      VARCHAR(20)     NOT NULL CHECK (order_type IN ('dine_in', 'takeaway', 'delivery')),
    order_status    VARCHAR(20)     DEFAULT 'pending' CHECK (order_status IN ('pending', 'confirmed', 'preparing', 'ready', 'served', 'cancelled')),
    special_notes   TEXT,
    subtotal        DECIMAL(10,2)   DEFAULT 0.00,
    discount        DECIMAL(10,2)   DEFAULT 0.00,
    tax             DECIMAL(10,2)   DEFAULT 0.00,
    total_amount    DECIMAL(10,2)   DEFAULT 0.00,
    created_at      TIMESTAMP       DEFAULT NOW(),
    updated_at      TIMESTAMP       DEFAULT NOW()
);

CREATE TABLE order_items (
    order_item_id       SERIAL          PRIMARY KEY,
    order_id            INT             NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
    menu_item_id        INT             NOT NULL REFERENCES menu_items(menu_items_id) ON DELETE RESTRICT,
    quantity            INT             NOT NULL DEFAULT 1,
    unit_price          DECIMAL(10,2)   NOT NULL,
    subtotal            DECIMAL(10,2)   NOT NULL,
    special_request     TEXT,
    order_item_status   VARCHAR(20)     DEFAULT 'pending' CHECK (order_item_status IN ('pending', 'preparing', 'ready', 'served', 'cancelled')),
    created_at          TIMESTAMP       DEFAULT NOW(),
    updated_at          TIMESTAMP       DEFAULT NOW()
);

CREATE TABLE payments (
    payment_id      SERIAL          PRIMARY KEY,
    order_id        INT             NOT NULL REFERENCES orders(order_id) ON DELETE RESTRICT,
    payment_method  VARCHAR(30)     NOT NULL CHECK (payment_method IN ('cash', 'card', 'online')),
    amount_paid     DECIMAL(10,2)   NOT NULL,
    change_given    DECIMAL(10,2)   DEFAULT 0.00,
    payment_status  VARCHAR(20)     DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
    transaction_ref VARCHAR(100),
    created_at      TIMESTAMP       DEFAULT NOW(),
    updated_at      TIMESTAMP       DEFAULT NOW()
);

CREATE TABLE reservations (
    reservation_id      SERIAL          PRIMARY KEY,
    customer_id         INT             REFERENCES customers(customer_id) ON DELETE SET NULL,
    table_id            INT             REFERENCES tables(table_id) ON DELETE SET NULL,
    party_size          INT             NOT NULL DEFAULT 1,
    reserved_at         TIMESTAMP       NOT NULL,
    reservation_status  VARCHAR(20)     DEFAULT 'pending' CHECK (reservation_status IN ('pending', 'confirmed', 'seated', 'cancelled', 'no_show')),
    reservation_notes   TEXT,
    created_at          TIMESTAMP       DEFAULT NOW(),
    updated_at          TIMESTAMP       DEFAULT NOW()
);

CREATE TABLE inventory (
    inventory_id    SERIAL          PRIMARY KEY,
    item_name       VARCHAR(200)    NOT NULL,
    unit            VARCHAR(50)     NOT NULL,
    quantity        DECIMAL(10,2)   DEFAULT 0,
    reorder_level   DECIMAL(10,2)   DEFAULT 0,
    cost_per_unit   DECIMAL(10,2)   DEFAULT 0.00,
    supplier        VARCHAR(300),
    is_active       BOOLEAN         DEFAULT TRUE,
    created_at      TIMESTAMP       DEFAULT NOW(),
    updated_at      TIMESTAMP       DEFAULT NOW()
);

CREATE TABLE discounts (
    discount_id         SERIAL          PRIMARY KEY,
    discount_code       VARCHAR(50)     UNIQUE NOT NULL,
    discount_name       VARCHAR(200)    NOT NULL,
    discount_type       VARCHAR(20)     DEFAULT 'fixed' CHECK (discount_type IN ('fixed', 'percentage')),
    discount_value      DECIMAL(10,2)   DEFAULT 0.00,
    min_order_amount    DECIMAL(10,2)   DEFAULT 0.00,
    max_uses            INT             DEFAULT 1,
    used_count          INT             DEFAULT 0,
    valid_from          TIMESTAMP       DEFAULT NOW(),
    valid_until         TIMESTAMP       NOT NULL,
    is_active           BOOLEAN         DEFAULT TRUE,
    created_at          TIMESTAMP       DEFAULT NOW(),
    updated_at          TIMESTAMP       DEFAULT NOW()
);

CREATE TABLE kitchen_display (
    kitchen_display_id  SERIAL          PRIMARY KEY,
    order_id            INT             NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
    order_item_id       INT             NOT NULL REFERENCES order_items(order_item_id) ON DELETE CASCADE,
    order_status        VARCHAR(20)     DEFAULT 'received' CHECK (order_status IN ('received', 'started', 'in_progress', 'completed', 'delivered')),
    order_priority      VARCHAR(20)     DEFAULT 'in_queue' CHECK (order_priority IN ('urgent', 'in_queue')),
    received_at         TIMESTAMP       DEFAULT NOW(),
    prepared_at         TIMESTAMP,
    completed_at        TIMESTAMP
);

CREATE TABLE shifts (
    shift_id        SERIAL          PRIMARY KEY,
    user_id         INT             NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    start_time      TIMESTAMP       NOT NULL,
    end_time        TIMESTAMP,
    break_minutes   INT             DEFAULT 0,
    total_hours     DECIMAL(5,2),
    notes           TEXT,
    created_at      TIMESTAMP       DEFAULT NOW()
);

CREATE TABLE audit_logs (
    audit_id        SERIAL          PRIMARY KEY,
    user_id         INT             REFERENCES users(user_id) ON DELETE SET NULL,
    user_action     VARCHAR(100)    NOT NULL,
    table_name      VARCHAR(100)    NOT NULL,
    record_id       INT             NOT NULL,
    old_value       JSONB,
    new_value       JSONB,
    ip_address      VARCHAR(45)     NOT NULL,
    created_at      TIMESTAMP       DEFAULT NOW()
);
