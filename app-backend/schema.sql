CREATE TABLE users(
    user_id SERIAL PRIMARY KEY,
    user_name VARCHAR(200) NOT NULL,
    user_password CHAR(50) UNIQUE NOT NULL,
    user_role VARCHAR(50) NOT NULL,
    is_active BOOLEAN DEFAULT VALUE TRUE,
    last_login DATETIME ,
    refresh_token,
    created_at TIMESTAMP DEFAULT VALUE NOW(),
    updted_at TIMESTAMP DEFAULT VALUE NOW()
);

CREATE TABLE customers(
    customer_id SERIAL PRIMARY KEY AUTO_INCREMENT,
    customer_name VARCHAR(200) DEFAULT VALUE CUSTOMER, 
    phone_number INT DEFAULT VALUE XXXXXXXXXX,
    user_email VARCHAR(200) NULL,
    user_address VARCHAR(200) NULL,
    loyalty_points INT NULL,
    is_active BOOLEAN DEFAULT VALUE TRUE, --TRUE OR FALSE
    created_at TIMESTAMP DEFAULT VALUE NOW(),
    updated_at TIMESTAMP DEFAULT VALUE NOW()
);
CREATE TABLE categories(
    category_id SERIAL PRIMARY KEY AUTO_INCREMENT,
    category_name VARCHAR(299) NOT NULL,
    slug,
    category_description TEXT,
    parent_id SERIAL NOT NULL AUTO_INCREMENT,
    display_order TEXT UNIQUE,
    image_url,
    is_active BOOLEAN DEFAULT VALUE TRUE, -- TRUE /FALSE
    created_at TIMESTAMP DEFAULT VALUE NOW(),
    updated_at TIMESTAMP DEFAULT VALUE NOW()
);
CREATE TABLE menu_items(
    menu_items_id SERIAL PRIMARY KEY AUTO_INCREMENT,
    menu_items_category_id FOREIGN KEY,
    menu_items_name VARCHAR(200) NOT NULL,
    slug,
    menu_items_description TEXT NULL,
    price INT,
    cost_price INT,
    image_url TEXT DEFAULT VALUE NULL,
    is_available BOOLEAN DEFAULT VALUE TRUE,
    prep_time TIME NULL,
    calories VARCHAR(199),
    display_order BLOB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE menu_items_modifiers(
    id SERIAL PRIMARY KEY AUTO_INCREMENT,
    menu_item_id SERIAL FOREIGN KEY,
    modifier_name VARCHAR(300),
    extra_charge DECIMAL(p,s) DEFAULT VALUE 0.00,
    is_availabe BOOLEAN DEFAULT VALUE TRUE,
    created_at TIMESTAMP DEFAULT VALUE TRUE,
    updated_at TIMESTAMP DEFAULT VALUE TRUE
);
CREATE TABLE tables(
    table_id SERIAL PRIMARY KEY AUTO_INCREMENT,
    table_number INT NOT NULL,
    floor INT DEFAULT VALUE FLOOR1,
    capacity INT DEFAULT VALUE 1,
    table_status ENUM('Occupied', 'Not occupied') DEFAULT VALUE Occupied,
    is_active BOOLEAN DEFAULT VALUE YES,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
CREATE TABLE orders(
    order_id SERIAL PRIMARY KEY,
    table_id SERIAL FOREIGN KEY,
    user_id SERIAL FOREIGN KEY,
    customer_id SERIAL FOREIGN KEY,
    order_type ,
    order_status ENUM('Started',  'In progress', 'Completed') NOT NULL,
    special_notes TEXT NULL,
    subtotal DECIMAL(p,s) NOT NULL,
    discount DECIMAL(p,s) DEFAULT VALUE 0.00,
    tax DECIMAL(p,s) DEFAULT VALUE 13%,
    total_amount DECIMAL(p,s) DEFAULT VALUE 0.00,
    created_at TIMESTAMP DEFAULT VALUE NOW(),
    updated_at TIMESTAMP DEFAULT VALUE NOW()
);

CREATE TABLE order_items(
    order_item_id SERIAL PRIMARY KEY AUTO_INCREMENT,
    order_id SERIAL FOREIGN KEY,
    menu_item_id SERIAL FOREIGN KEY,
    quanity INT DEFAULT VALUE 0,
    unit_price DECIMAL(p,s) DEFAULT VALUE 0.00,
    subtotal DECIMAL(p,s) DEFAULT VALUE 0.00,
    special_request TEXT NULL,
    order_item_status ENUM('Started', 'In Progress', 'Completed'),
    created_at TIMESTAMP DEFAULT VALUE NOW(),
    updated_at TIMESTAMP DEFAULT VALUE NOW()
);
CREATE TABLE payments(
    payment_id SERIAL PRIMARY KEY AUTO_INCREMENT,
    order_id SERIAL FOREIGN KEY,
    payment_method ENUM('Cash', 'Card', 'Online payment') DEFAULT VALUE CASH,
    amount_paid DECIMAL(p,s) DEFAULT VALUE 0.00,
    change_given DECIMAL(p,s) DEFAULT VALUE 0.00,
    payment_status ENUM('Done', 'Not Done') DEFAULT VALUE NOT_DONE,
    transaction_ref,
    paid_at TIMESTAMP DEFAULT VALUE NOW() NOT NULL,
    created_at TIMESTAMP DEFAULT VALUE NOW(),
    updated_at TIMESTAMP DEFAULT VALUE NOW()
);
CREATE TABLE reservations(
    reservation_id SERIAL PRIMARY KEY AUTO_INCREMENT,
    customer_id SERIAL FOREIGN KEY,
    table_id SERIAL FOREIGN KEY,
    party_size INT NOT NULL DEFAULT VALUE 1,
    reserved_at DATETIME NOT NULL,
    reservation_status ENUM('Done', 'Pending', 'No show') DEFAULT VALUE PENDING,
    reservation_notes TEXT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
CREATE TABLE inventory(
    inventory_id SERIAL PRIMARY KEY,
    item_name VARCHAR(200) NOT NULL,
    unit INT DEFAULT VALUE 0,
    quantity INT DEFAULT VALUE 0,
    reorder_level,
    cost_per_unit DECIMAL(p,s) DEFAULT VALUE 0.00,
    supplier VARCHAR(300) NOT NULL,
    is_active BOOLEAN DEFAULT VALUE YES,
    created_at TIMESTAMP DEFAULT VALUE NOW(),
    updated_at TIMESTAMP DEFAULT VALUE NOW()
);
CREATE TABLE discounts(
    discount_id SERIAL PRIMARY KEY AUTO_INCREMENT,
    discount_code SERIAL,
    discount_name ,
    discount_type ENUM('Fixed', 'Can vary') DEFAULT VALUE FIXED,
    discount_value DECIMAL(p,s) DEFAULT VALUE 0.00,
    minimum_order_amount DECIMAL(p,s) DEFAULT VALUE 0.00,
    max_uses INT  DEFAULT VALUE 0,
    used_count INT DEFAULT VALUE 0 AUTO_INCREMENT,
    valid_from TIMESTAMP DEFAULT VALUE NOW(),
    valid_until TIMESTAMP DEFAULT VALUE NOW(),
    is_active BOOLEAN DEFAULT VALUE YES,
    created_at TIMESTAMP DEFAULT VALUE YES,
    updated_at TIMESTAMP DEFAULT VALUE YES
);

CREATE TABLE kitchen_display(
    kitchen_display_id SERIAL PRIMARY KEY AUTO_INCREMENT,
    order_id SERIAL FOREIGN KEY,
    order_item_id SERIAL FOREIGN KEY,
    order_status ENUM('Recieved', 'Started', 'In Progress','Completed','Delivered') NOT NULL DEFAULT VALUE Recieved,
    order_priority ENUM('Urgent', 'In queue') DEFAULT VALUE IN_QUEUE,
    recieved_at DATETIME DEFAULT VALUE NOW(),
    prepared_at DATETIME DEFAULT VALUE NOW(),
    completed_at DATETIME DEFAULT VALUE NOW()
);

CREATE TABLE shifts(
    shift_id SERIAL PRIMARY KEY,
    user_id SERIAL FOREIGN KEY,
    start_time TIMESTAMP DEFAULT VALUE NOW(),
    end_time TIMESTAMP DEFAULT VALUE NOW().
    break_minutes TIMESTAMP DEFAULT VALUE NOW(),
    total_hours TIMESTAMP DEFAULT VALUE NOW(),
    notes TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT VALUE NOW(),
    updated_at TIMESTAMP DEFAULT VALUE NOW()
);
CREATE TABLE audit_logs(
    audit_id SERIAL PRIMARY KEY,
    user_id SERIAL FOREIGN KEY,
    user_action TEXT ,
    table_name VARCHAR(50),
    record_id SERIAL AUTO_INCREMENT,
    old_value INT,
    new_value INT,
    ip_adress SERIAL,
    created_at TIMESTAMP DEFAULT VALUE NOW(),
    updated_at TIMESTAMP DEFAULT VALUE NOW()
)