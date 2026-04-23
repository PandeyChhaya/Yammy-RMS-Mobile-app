-- CreateTable
CREATE TABLE "audit_logs" (
    "audit_id" SERIAL NOT NULL,
    "user_id" INTEGER,
    "user_action" VARCHAR(100) NOT NULL,
    "table_name" VARCHAR(100) NOT NULL,
    "record_id" INTEGER NOT NULL,
    "old_value" JSONB,
    "new_value" JSONB,
    "ip_address" VARCHAR(45) NOT NULL,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("audit_id")
);

-- CreateTable
CREATE TABLE "categories" (
    "category_id" SERIAL NOT NULL,
    "category_name" VARCHAR(299) NOT NULL,
    "slug" VARCHAR(299) NOT NULL,
    "category_description" TEXT,
    "parent_id" INTEGER,
    "display_order" INTEGER DEFAULT 0,
    "image_url" VARCHAR(500),
    "is_active" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("category_id")
);

-- CreateTable
CREATE TABLE "customers" (
    "customer_id" SERIAL NOT NULL,
    "customer_name" VARCHAR(200) NOT NULL,
    "phone_number" VARCHAR(20) NOT NULL,
    "user_email" VARCHAR(200),
    "user_address" TEXT,
    "loyalty_points" INTEGER DEFAULT 0,
    "is_active" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "user_password" VARCHAR(200),
    "refresh_token" TEXT,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("customer_id")
);

-- CreateTable
CREATE TABLE "discounts" (
    "discount_id" SERIAL NOT NULL,
    "discount_code" VARCHAR(50) NOT NULL,
    "discount_name" VARCHAR(200) NOT NULL,
    "discount_type" VARCHAR(20) DEFAULT 'fixed',
    "discount_value" DECIMAL(10,2) DEFAULT 0.00,
    "min_order_amount" DECIMAL(10,2) DEFAULT 0.00,
    "max_uses" INTEGER DEFAULT 1,
    "used_count" INTEGER DEFAULT 0,
    "valid_from" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "valid_until" TIMESTAMP(6) NOT NULL,
    "is_active" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "discounts_pkey" PRIMARY KEY ("discount_id")
);

-- CreateTable
CREATE TABLE "inventory" (
    "inventory_id" SERIAL NOT NULL,
    "item_name" VARCHAR(200) NOT NULL,
    "unit" VARCHAR(50) NOT NULL,
    "quantity" DECIMAL(10,2) DEFAULT 0,
    "reorder_level" DECIMAL(10,2) DEFAULT 0,
    "cost_per_unit" DECIMAL(10,2) DEFAULT 0.00,
    "supplier" VARCHAR(300),
    "is_active" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inventory_pkey" PRIMARY KEY ("inventory_id")
);

-- CreateTable
CREATE TABLE "kitchen_display" (
    "kitchen_display_id" SERIAL NOT NULL,
    "order_id" INTEGER NOT NULL,
    "order_item_id" INTEGER NOT NULL,
    "order_status" VARCHAR(20) DEFAULT 'received',
    "order_priority" VARCHAR(20) DEFAULT 'in_queue',
    "received_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "prepared_at" TIMESTAMP(6),
    "completed_at" TIMESTAMP(6),

    CONSTRAINT "kitchen_display_pkey" PRIMARY KEY ("kitchen_display_id")
);

-- CreateTable
CREATE TABLE "menu_item_modifiers" (
    "id" SERIAL NOT NULL,
    "menu_item_id" INTEGER,
    "modifier_name" VARCHAR(300) NOT NULL,
    "extra_charge" DECIMAL(10,2) DEFAULT 0.00,
    "is_available" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "menu_item_modifiers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "menu_items" (
    "menu_items_id" SERIAL NOT NULL,
    "menu_items_category_id" INTEGER,
    "menu_items_name" VARCHAR(200) NOT NULL,
    "slug" VARCHAR(200) NOT NULL,
    "menu_items_description" TEXT,
    "price" DECIMAL(10,2) NOT NULL,
    "cost_price" DECIMAL(10,2),
    "image_url" VARCHAR(500),
    "is_available" BOOLEAN DEFAULT true,
    "prep_time" INTEGER,
    "calories" INTEGER,
    "display_order" INTEGER DEFAULT 0,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "menu_items_pkey" PRIMARY KEY ("menu_items_id")
);

-- CreateTable
CREATE TABLE "order_items" (
    "order_item_id" SERIAL NOT NULL,
    "order_id" INTEGER NOT NULL,
    "menu_item_id" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unit_price" DECIMAL(10,2) NOT NULL,
    "subtotal" DECIMAL(10,2) NOT NULL,
    "special_request" TEXT,
    "order_item_status" VARCHAR(20) DEFAULT 'pending',
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("order_item_id")
);

-- CreateTable
CREATE TABLE "orders" (
    "order_id" SERIAL NOT NULL,
    "table_id" INTEGER,
    "user_id" INTEGER,
    "customer_id" INTEGER,
    "order_type" VARCHAR(20) NOT NULL,
    "order_status" VARCHAR(20) DEFAULT 'pending',
    "special_notes" TEXT,
    "subtotal" DECIMAL(10,2) DEFAULT 0.00,
    "discount" DECIMAL(10,2) DEFAULT 0.00,
    "tax" DECIMAL(10,2) DEFAULT 0.00,
    "total_amount" DECIMAL(10,2) DEFAULT 0.00,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("order_id")
);

-- CreateTable
CREATE TABLE "payments" (
    "payment_id" SERIAL NOT NULL,
    "order_id" INTEGER NOT NULL,
    "payment_method" VARCHAR(30) NOT NULL,
    "amount_paid" DECIMAL(10,2) NOT NULL,
    "change_given" DECIMAL(10,2) DEFAULT 0.00,
    "payment_status" VARCHAR(20) DEFAULT 'pending',
    "transaction_ref" VARCHAR(100),
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("payment_id")
);

-- CreateTable
CREATE TABLE "reservations" (
    "reservation_id" SERIAL NOT NULL,
    "customer_id" INTEGER,
    "table_id" INTEGER,
    "party_size" INTEGER NOT NULL DEFAULT 1,
    "reserved_at" TIMESTAMP(6) NOT NULL,
    "reservation_status" VARCHAR(20) DEFAULT 'pending',
    "reservation_notes" TEXT,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reservations_pkey" PRIMARY KEY ("reservation_id")
);

-- CreateTable
CREATE TABLE "minis" (
    "mini_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "video_url" VARCHAR(500) NOT NULL,
    "thumbnail_url" VARCHAR(500),
    "status" VARCHAR(20) DEFAULT 'pending',
    "rejection_reason" TEXT,
    "view_count" INTEGER DEFAULT 0,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "minis_pkey" PRIMARY KEY ("mini_id")
);

-- CreateTable
CREATE TABLE "shifts" (
    "shift_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "start_time" TIMESTAMP(6) NOT NULL,
    "end_time" TIMESTAMP(6),
    "break_minutes" INTEGER DEFAULT 0,
    "total_hours" DECIMAL(5,2),
    "notes" TEXT,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shifts_pkey" PRIMARY KEY ("shift_id")
);

-- CreateTable
CREATE TABLE "tables" (
    "table_id" SERIAL NOT NULL,
    "table_number" VARCHAR(20) NOT NULL,
    "floor" VARCHAR(20) DEFAULT 'Ground Floor',
    "capacity" INTEGER NOT NULL DEFAULT 1,
    "table_status" VARCHAR(20) DEFAULT 'Available',
    "is_active" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tables_pkey" PRIMARY KEY ("table_id")
);

-- CreateTable
CREATE TABLE "users" (
    "user_id" SERIAL NOT NULL,
    "user_name" VARCHAR(200) NOT NULL,
    "user_password" VARCHAR(200) NOT NULL,
    "user_email" VARCHAR(260) NOT NULL,
    "user_role" VARCHAR(50) NOT NULL,
    "is_active" BOOLEAN DEFAULT true,
    "last_login" TIMESTAMP(6),
    "refresh_token" TEXT,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "loyalty_transactions" (
    "transaction_id" SERIAL NOT NULL,
    "customer_id" INTEGER NOT NULL,
    "order_id" INTEGER,
    "points" INTEGER NOT NULL,
    "transaction_type" VARCHAR(20) NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "loyalty_transactions_pkey" PRIMARY KEY ("transaction_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "categories_slug_key" ON "categories"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "customers_user_email_key" ON "customers"("user_email");

-- CreateIndex
CREATE UNIQUE INDEX "discounts_discount_code_key" ON "discounts"("discount_code");

-- CreateIndex
CREATE UNIQUE INDEX "menu_items_slug_key" ON "menu_items"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "tables_table_number_key" ON "tables"("table_number");

-- CreateIndex
CREATE UNIQUE INDEX "users_user_email_key" ON "users"("user_email");

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "categories"("category_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "kitchen_display" ADD CONSTRAINT "kitchen_display_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("order_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "kitchen_display" ADD CONSTRAINT "kitchen_display_order_item_id_fkey" FOREIGN KEY ("order_item_id") REFERENCES "order_items"("order_item_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "menu_item_modifiers" ADD CONSTRAINT "menu_item_modifiers_menu_item_id_fkey" FOREIGN KEY ("menu_item_id") REFERENCES "menu_items"("menu_items_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "menu_items" ADD CONSTRAINT "menu_items_menu_items_category_id_fkey" FOREIGN KEY ("menu_items_category_id") REFERENCES "categories"("category_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_menu_item_id_fkey" FOREIGN KEY ("menu_item_id") REFERENCES "menu_items"("menu_items_id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("order_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("customer_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_table_id_fkey" FOREIGN KEY ("table_id") REFERENCES "tables"("table_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("order_id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("customer_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_table_id_fkey" FOREIGN KEY ("table_id") REFERENCES "tables"("table_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "minis" ADD CONSTRAINT "minis_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "shifts" ADD CONSTRAINT "shifts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "loyalty_transactions" ADD CONSTRAINT "loyalty_transactions_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("customer_id") ON DELETE CASCADE ON UPDATE NO ACTION;
