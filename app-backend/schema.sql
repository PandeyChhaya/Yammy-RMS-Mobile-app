CREATE TABLE users(
    id SERIAL PRIMARY KEY,
    user_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    user_password VARCHAR(255),
    user_role VARCHAR(20) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    last_login TIMESTAMP,
    refresh_token TEXT

);
CREATE TABLE categories (
    id              SERIAL PRIMARY KEY,
    category_name   VARCHAR(250)  UNIQUE NOT NULL,
    slug            VARCHAR(250)  UNIQUE NOT NULL,
    categories_description     TEXT,
    parent_id       INT           REFERENCES categories(id) ON DELETE SET NULL,
    display_order   INT           DEFAULT 0,
    image_url       VARCHAR(500),
    is_available    BOOLEAN       DEFAULT true,  
    is_active       BOOLEAN       DEFAULT true,
    created_at      TIMESTAMP     DEFAULT NOW(),
    updated_at      TIMESTAMP     DEFAULT NOW()
);

CREATE TABLE tables (
    id              SERIAL PRIMARY KEY,
    table_number    VARCHAR(20)   UNIQUE NOT NULL,
    floor           VARCHAR(50),                  
    capacity        INT           NOT NULL,
    status          VARCHAR(20)   DEFAULT 'available'
                                  CHECK (status IN ('available', 'occupied', 'reserved', 'maintenance')),
    is_active       BOOLEAN       DEFAULT true,
    created_at      TIMESTAMP     DEFAULT NOW(),
    updated_at      TIMESTAMP     DEFAULT NOW()
);