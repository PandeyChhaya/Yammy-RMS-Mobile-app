INSERT INTO restaurants (restaurant_name, slug) VALUES ('Yammy Fresh', 'yammy-fresh');
UPDATE users SET restaurant_id = 1 WHERE user_role IN ('Admin','Waiter','Cashier','Kitchen Staff');
UPDATE categories SET restaurant_id = 1;
UPDATE menu_items SET restaurant_id = 1;
UPDATE tables SET restaurant_id = 1;
UPDATE orders SET restaurant_id = 1;
UPDATE minis SET restaurant_id = 1;