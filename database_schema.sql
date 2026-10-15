-- ====================================================================
-- Laam Luxury Atelier eCommerce - Complete MySQL / MariaDB Database Dump
-- Compatible with Hostinger MySQL, phpMyAdmin, MySQL 5.7/8.0+, MariaDB 10.3+
-- ====================================================================

SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

-- --------------------------------------------------------------------
-- Table structure for `User`
-- --------------------------------------------------------------------
DROP TABLE IF EXISTS `User`;
CREATE TABLE `User` (
  `id` VARCHAR(191) NOT NULL,
  `email` VARCHAR(191) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `passwordHash` VARCHAR(191) NOT NULL,
  `role` ENUM('SUPER_ADMIN', 'STAFF', 'CUSTOMER') NOT NULL DEFAULT 'CUSTOMER',
  `isActive` TINYINT(1) NOT NULL DEFAULT 1,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `User_email_key` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------
-- Table structure for `UserProfile`
-- --------------------------------------------------------------------
DROP TABLE IF EXISTS `UserProfile`;
CREATE TABLE `UserProfile` (
  `id` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `phone` VARCHAR(191) DEFAULT NULL,
  `marketingOptIn` TINYINT(1) NOT NULL DEFAULT 0,
  `notes` TEXT DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UserProfile_userId_key` (`userId`),
  CONSTRAINT `UserProfile_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------
-- Table structure for `Address`
-- --------------------------------------------------------------------
DROP TABLE IF EXISTS `Address`;
CREATE TABLE `Address` (
  `id` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `recipientName` VARCHAR(191) NOT NULL,
  `street` VARCHAR(191) NOT NULL,
  `city` VARCHAR(191) NOT NULL,
  `state` VARCHAR(191) DEFAULT NULL,
  `postalCode` VARCHAR(191) NOT NULL,
  `country` VARCHAR(191) NOT NULL,
  `type` ENUM('SHIPPING', 'BILLING') NOT NULL DEFAULT 'SHIPPING',
  `isDefault` TINYINT(1) NOT NULL DEFAULT 0,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `Address_userId_idx` (`userId`),
  CONSTRAINT `Address_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------
-- Table structure for `Session`
-- --------------------------------------------------------------------
DROP TABLE IF EXISTS `Session`;
CREATE TABLE `Session` (
  `id` VARCHAR(191) NOT NULL,
  `token` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `expiresAt` DATETIME(3) NOT NULL,
  `ipAddress` VARCHAR(191) DEFAULT NULL,
  `userAgent` VARCHAR(191) DEFAULT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `Session_token_key` (`token`),
  KEY `Session_userId_idx` (`userId`),
  CONSTRAINT `Session_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------
-- Table structure for `PasswordResetToken`
-- --------------------------------------------------------------------
DROP TABLE IF EXISTS `PasswordResetToken`;
CREATE TABLE `PasswordResetToken` (
  `id` VARCHAR(191) NOT NULL,
  `token` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `expiresAt` DATETIME(3) NOT NULL,
  `usedAt` DATETIME(3) DEFAULT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `PasswordResetToken_token_key` (`token`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------
-- Table structure for `Category`
-- --------------------------------------------------------------------
DROP TABLE IF EXISTS `Category`;
CREATE TABLE `Category` (
  `id` VARCHAR(191) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `slug` VARCHAR(191) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `imageUrl` VARCHAR(191) DEFAULT NULL,
  `sortOrder` INT NOT NULL DEFAULT 0,
  `isActive` TINYINT(1) NOT NULL DEFAULT 1,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `Category_slug_key` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------
-- Table structure for `Product`
-- --------------------------------------------------------------------
DROP TABLE IF EXISTS `Product`;
CREATE TABLE `Product` (
  `id` VARCHAR(191) NOT NULL,
  `title` VARCHAR(191) NOT NULL,
  `slug` VARCHAR(191) NOT NULL,
  `description` TEXT NOT NULL,
  `details` TEXT DEFAULT NULL,
  `categoryId` VARCHAR(191) NOT NULL,
  `regularPrice` DOUBLE NOT NULL,
  `salePrice` DOUBLE DEFAULT NULL,
  `status` ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT',
  `isFeatured` TINYINT(1) NOT NULL DEFAULT 0,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `Product_slug_key` (`slug`),
  KEY `Product_categoryId_idx` (`categoryId`),
  CONSTRAINT `Product_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `Category` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------
-- Table structure for `ProductVariant`
-- --------------------------------------------------------------------
DROP TABLE IF EXISTS `ProductVariant`;
CREATE TABLE `ProductVariant` (
  `id` VARCHAR(191) NOT NULL,
  `productId` VARCHAR(191) NOT NULL,
  `sku` VARCHAR(191) NOT NULL,
  `title` VARCHAR(191) NOT NULL,
  `size` VARCHAR(191) DEFAULT NULL,
  `color` VARCHAR(191) DEFAULT NULL,
  `priceOverride` DOUBLE DEFAULT NULL,
  `inventoryCount` INT NOT NULL DEFAULT 0,
  `isAvailable` TINYINT(1) NOT NULL DEFAULT 1,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `ProductVariant_sku_key` (`sku`),
  KEY `ProductVariant_productId_idx` (`productId`),
  CONSTRAINT `ProductVariant_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------
-- Table structure for `ProductImage`
-- --------------------------------------------------------------------
DROP TABLE IF EXISTS `ProductImage`;
CREATE TABLE `ProductImage` (
  `id` VARCHAR(191) NOT NULL,
  `productId` VARCHAR(191) NOT NULL,
  `url` VARCHAR(191) NOT NULL,
  `altText` VARCHAR(191) DEFAULT NULL,
  `displayOrder` INT NOT NULL DEFAULT 0,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `ProductImage_productId_idx` (`productId`),
  CONSTRAINT `ProductImage_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------
-- Table structure for `InventoryLog`
-- --------------------------------------------------------------------
DROP TABLE IF EXISTS `InventoryLog`;
CREATE TABLE `InventoryLog` (
  `id` VARCHAR(191) NOT NULL,
  `variantId` VARCHAR(191) NOT NULL,
  `changeAmount` INT NOT NULL,
  `newBalance` INT NOT NULL,
  `reason` VARCHAR(191) NOT NULL,
  `actorId` VARCHAR(191) DEFAULT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `InventoryLog_variantId_idx` (`variantId`),
  CONSTRAINT `InventoryLog_variantId_fkey` FOREIGN KEY (`variantId`) REFERENCES `ProductVariant` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------
-- Table structure for `Coupon`
-- --------------------------------------------------------------------
DROP TABLE IF EXISTS `Coupon`;
CREATE TABLE `Coupon` (
  `id` VARCHAR(191) NOT NULL,
  `code` VARCHAR(191) NOT NULL,
  `discountType` ENUM('PERCENTAGE', 'FIXED_AMOUNT') NOT NULL DEFAULT 'PERCENTAGE',
  `discountValue` DOUBLE NOT NULL,
  `minOrderValue` DOUBLE DEFAULT NULL,
  `maxUses` INT DEFAULT NULL,
  `usedCount` INT NOT NULL DEFAULT 0,
  `startsAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `expiresAt` DATETIME(3) DEFAULT NULL,
  `isActive` TINYINT(1) NOT NULL DEFAULT 1,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `Coupon_code_key` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------
-- Table structure for `ShippingMethod`
-- --------------------------------------------------------------------
DROP TABLE IF EXISTS `ShippingMethod`;
CREATE TABLE `ShippingMethod` (
  `id` VARCHAR(191) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `code` VARCHAR(191) NOT NULL,
  `rate` DOUBLE NOT NULL,
  `estimatedDays` VARCHAR(191) NOT NULL,
  `isActive` TINYINT(1) NOT NULL DEFAULT 1,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `ShippingMethod_code_key` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------
-- Table structure for `Order`
-- --------------------------------------------------------------------
DROP TABLE IF EXISTS `Order`;
CREATE TABLE `Order` (
  `id` VARCHAR(191) NOT NULL,
  `orderNumber` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) DEFAULT NULL,
  `customerEmail` VARCHAR(191) NOT NULL,
  `customerPhone` VARCHAR(191) DEFAULT NULL,
  `shippingAddressJson` TEXT NOT NULL,
  `billingAddressJson` TEXT DEFAULT NULL,
  `subtotal` DOUBLE NOT NULL,
  `discountTotal` DOUBLE NOT NULL DEFAULT 0,
  `shippingTotal` DOUBLE NOT NULL DEFAULT 0,
  `grandTotal` DOUBLE NOT NULL,
  `paymentStatus` ENUM('PENDING', 'PAID', 'FAILED', 'REFUNDED') NOT NULL DEFAULT 'PENDING',
  `fulfillmentStatus` ENUM('UNFULFILLED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED') NOT NULL DEFAULT 'UNFULFILLED',
  `paymentMethod` VARCHAR(191) NOT NULL,
  `shippingMethodId` VARCHAR(191) DEFAULT NULL,
  `couponId` VARCHAR(191) DEFAULT NULL,
  `notes` TEXT DEFAULT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `Order_orderNumber_key` (`orderNumber`),
  KEY `Order_userId_idx` (`userId`),
  KEY `Order_couponId_idx` (`couponId`),
  KEY `Order_shippingMethodId_idx` (`shippingMethodId`),
  CONSTRAINT `Order_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `Order_couponId_fkey` FOREIGN KEY (`couponId`) REFERENCES `Coupon` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `Order_shippingMethodId_fkey` FOREIGN KEY (`shippingMethodId`) REFERENCES `ShippingMethod` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------
-- Table structure for `OrderItem`
-- --------------------------------------------------------------------
DROP TABLE IF EXISTS `OrderItem`;
CREATE TABLE `OrderItem` (
  `id` VARCHAR(191) NOT NULL,
  `orderId` VARCHAR(191) NOT NULL,
  `variantId` VARCHAR(191) NOT NULL,
  `productTitle` VARCHAR(191) NOT NULL,
  `variantTitle` VARCHAR(191) NOT NULL,
  `sku` VARCHAR(191) NOT NULL,
  `unitPrice` DOUBLE NOT NULL,
  `quantity` INT NOT NULL,
  `total` DOUBLE NOT NULL,
  PRIMARY KEY (`id`),
  KEY `OrderItem_orderId_idx` (`orderId`),
  KEY `OrderItem_variantId_idx` (`variantId`),
  CONSTRAINT `OrderItem_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `Order` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `OrderItem_variantId_fkey` FOREIGN KEY (`variantId`) REFERENCES `ProductVariant` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------
-- Table structure for `Payment`
-- --------------------------------------------------------------------
DROP TABLE IF EXISTS `Payment`;
CREATE TABLE `Payment` (
  `id` VARCHAR(191) NOT NULL,
  `orderId` VARCHAR(191) NOT NULL,
  `amount` DOUBLE NOT NULL,
  `currency` VARCHAR(191) NOT NULL DEFAULT 'PKR',
  `provider` VARCHAR(191) NOT NULL,
  `status` VARCHAR(191) NOT NULL,
  `rawResponseJson` TEXT DEFAULT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `Payment_orderId_idx` (`orderId`),
  CONSTRAINT `Payment_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `Order` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------
-- Table structure for `StoreSetting`
-- --------------------------------------------------------------------
DROP TABLE IF EXISTS `StoreSetting`;
CREATE TABLE `StoreSetting` (
  `id` VARCHAR(191) NOT NULL,
  `key` VARCHAR(191) NOT NULL,
  `value` TEXT NOT NULL,
  `description` VARCHAR(191) DEFAULT NULL,
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `StoreSetting_key_key` (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------
-- Table structure for `AuditLog`
-- --------------------------------------------------------------------
DROP TABLE IF EXISTS `AuditLog`;
CREATE TABLE `AuditLog` (
  `id` VARCHAR(191) NOT NULL,
  `actorId` VARCHAR(191) DEFAULT NULL,
  `action` VARCHAR(191) NOT NULL,
  `entityType` VARCHAR(191) NOT NULL,
  `entityId` VARCHAR(191) NOT NULL,
  `payloadJson` TEXT DEFAULT NULL,
  `ipAddress` VARCHAR(191) DEFAULT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `AuditLog_actorId_idx` (`actorId`),
  CONSTRAINT `AuditLog_actorId_fkey` FOREIGN KEY (`actorId`) REFERENCES `User` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------
-- Table structure for `Cart`
-- --------------------------------------------------------------------
DROP TABLE IF EXISTS `Cart`;
CREATE TABLE `Cart` (
  `id` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) DEFAULT NULL,
  `sessionToken` VARCHAR(191) DEFAULT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------
-- Table structure for `CartItem`
-- --------------------------------------------------------------------
DROP TABLE IF EXISTS `CartItem`;
CREATE TABLE `CartItem` (
  `id` VARCHAR(191) NOT NULL,
  `cartId` VARCHAR(191) NOT NULL,
  `variantId` VARCHAR(191) NOT NULL,
  `quantity` INT NOT NULL DEFAULT 1,
  `unitPrice` DOUBLE DEFAULT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `CartItem_cartId_variantId_key` (`cartId`, `variantId`),
  KEY `CartItem_cartId_idx` (`cartId`),
  KEY `CartItem_variantId_idx` (`variantId`),
  CONSTRAINT `CartItem_cartId_fkey` FOREIGN KEY (`cartId`) REFERENCES `Cart` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `CartItem_variantId_fkey` FOREIGN KEY (`variantId`) REFERENCES `ProductVariant` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------
-- Table structure for `Wishlist`
-- --------------------------------------------------------------------
DROP TABLE IF EXISTS `Wishlist`;
CREATE TABLE `Wishlist` (
  `id` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `Wishlist_userId_key` (`userId`),
  CONSTRAINT `Wishlist_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------
-- Table structure for `WishlistItem`
-- --------------------------------------------------------------------
DROP TABLE IF EXISTS `WishlistItem`;
CREATE TABLE `WishlistItem` (
  `id` VARCHAR(191) NOT NULL,
  `wishlistId` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) DEFAULT NULL,
  `productId` VARCHAR(191) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `WishlistItem_wishlistId_productId_key` (`wishlistId`, `productId`),
  KEY `WishlistItem_wishlistId_idx` (`wishlistId`),
  KEY `WishlistItem_productId_idx` (`productId`),
  CONSTRAINT `WishlistItem_wishlistId_fkey` FOREIGN KEY (`wishlistId`) REFERENCES `Wishlist` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `WishlistItem_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------
-- Table structure for `Review`
-- --------------------------------------------------------------------
DROP TABLE IF EXISTS `Review`;
CREATE TABLE `Review` (
  `id` VARCHAR(191) NOT NULL,
  `productId` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `rating` INT NOT NULL,
  `reviewText` TEXT DEFAULT NULL,
  `isVerifiedPurchase` TINYINT(1) NOT NULL DEFAULT 0,
  `isApproved` TINYINT(1) NOT NULL DEFAULT 0,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `Review_productId_idx` (`productId`),
  KEY `Review_userId_idx` (`userId`),
  CONSTRAINT `Review_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `Review_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================================================
-- SEED DATA INSERTS
-- ====================================================================

-- 1. Seed Categories
INSERT INTO `Category` (`id`, `name`, `slug`, `description`, `imageUrl`, `sortOrder`, `isActive`, `createdAt`) VALUES
('cat_pret_1', 'Pret Ready-to-Wear', 'pret', 'Stitched contemporary kurtas, coordinates, and 2-piece ensembles.', 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=800&auto=format&fit=crop', 1, 1, '2026-01-01 00:00:00.000'),
('cat_festive_2', 'Luxury Festive', 'festive', 'Opulent wedding and evening wear embellished with dabka and zari work.', 'https://images.unsplash.com/photo-1596783074918-c84cb06531ca?q=80&w=800&auto=format&fit=crop', 2, 1, '2026-01-01 00:00:00.000');

-- 2. Seed Products
INSERT INTO `Product` (`id`, `title`, `slug`, `description`, `details`, `categoryId`, `regularPrice`, `salePrice`, `status`, `isFeatured`, `createdAt`, `updatedAt`) VALUES
('prod_1', 'Zari Embroidered Raw Silk Ensemble', 'zari-embroidered-raw-silk-ensemble', 'A regal silhouette crafted in pure raw silk featuring fine tilla and antique gold zari hand-embroidery.', 'Fabric: 100% Pure Raw Silk\nCare: Professional Dry Clean Only', 'cat_pret_1', 22000, 16500, 'PUBLISHED', 1, '2026-01-01 00:00:00.000', '2026-01-01 00:00:00.000'),
('prod_2', 'Pastel Organza Festive Kurta Set', 'pastel-organza-festive-kurta-set', 'Luminous powder-blue Korean organza layered over tonal butter-crepe lining with gota patti.', 'Fabric: Korean Organza\nCare: Dry clean recommended', 'cat_festive_2', 28500, 22800, 'PUBLISHED', 1, '2026-01-01 00:00:00.000', '2026-01-01 00:00:00.000'),
('prod_3', 'Heavy Hand-Embellished Velvet Peshwas', 'heavy-hand-embellished-velvet-peshwas', 'An architectural 16-kali peshwas cut from micro-velvet, lavished with silver kora dabka.', 'Fabric: Pure Micro-Velvet 9000', 'cat_festive_2', 85000, NULL, 'PUBLISHED', 1, '2026-01-01 00:00:00.000', '2026-01-01 00:00:00.000');

-- 3. Seed Product Variants
INSERT INTO `ProductVariant` (`id`, `productId`, `sku`, `title`, `size`, `color`, `priceOverride`, `inventoryCount`, `isAvailable`, `createdAt`, `updatedAt`) VALUES
('var_1', 'prod_1', 'ZSE-CRIMSON-S', 'Crimson / Small', 'Small', 'Crimson', NULL, 15, 1, '2026-01-01 00:00:00.000', '2026-01-01 00:00:00.000'),
('var_2', 'prod_1', 'ZSE-CRIMSON-M', 'Crimson / Medium', 'Medium', 'Crimson', NULL, 20, 1, '2026-01-01 00:00:00.000', '2026-01-01 00:00:00.000'),
('var_3', 'prod_2', 'POF-BLUE-S', 'Powder Blue / Small', 'Small', 'Powder Blue', NULL, 10, 1, '2026-01-01 00:00:00.000', '2026-01-01 00:00:00.000'),
('var_4', 'prod_3', 'HVP-MAROON-S', 'Deep Maroon / Small', 'Small', 'Deep Maroon', NULL, 5, 1, '2026-01-01 00:00:00.000', '2026-01-01 00:00:00.000');

-- 4. Seed Product Images
INSERT INTO `ProductImage` (`id`, `productId`, `url`, `altText`, `displayOrder`, `createdAt`) VALUES
('img_1', 'prod_1', 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=800&auto=format&fit=crop', 'Zari Embroidered Raw Silk Ensemble', 0, '2026-01-01 00:00:00.000'),
('img_2', 'prod_2', 'https://images.unsplash.com/photo-1596783074918-c84cb06531ca?q=80&w=800&auto=format&fit=crop', 'Pastel Organza Festive Kurta Set', 0, '2026-01-01 00:00:00.000'),
('img_3', 'prod_3', 'https://images.unsplash.com/photo-1518049362265-d5b2a6467637?q=80&w=800&auto=format&fit=crop', 'Heavy Velvet Peshwas', 0, '2026-01-01 00:00:00.000');

-- 5. Seed Shipping Methods
INSERT INTO `ShippingMethod` (`id`, `name`, `code`, `rate`, `estimatedDays`, `isActive`, `createdAt`) VALUES
('ship_1', 'Standard Nationwide Delivery', 'STANDARD', 250, '3-5 business days', 1, '2026-01-01 00:00:00.000'),
('ship_2', 'Express Priority Courier', 'EXPRESS', 650, '1-2 business days', 1, '2026-01-01 00:00:00.000');

-- 6. Seed Coupons
INSERT INTO `Coupon` (`id`, `code`, `discountType`, `discountValue`, `minOrderValue`, `maxUses`, `usedCount`, `startsAt`, `expiresAt`, `isActive`, `createdAt`, `updatedAt`) VALUES
('coup_1', 'WELCOME10', 'PERCENTAGE', 10, 5000, 500, 0, '2026-01-01 00:00:00.000', NULL, 1, '2026-01-01 00:00:00.000', '2026-01-01 00:00:00.000');

-- 7. Seed Store Settings
INSERT INTO `StoreSetting` (`id`, `key`, `value`, `description`, `updatedAt`) VALUES
('set_1', 'store_name', 'Laam Luxury Atelier', 'Store Display Name', '2026-01-01 00:00:00.000'),
('set_2', 'store_email', 'support@laamstore.com', 'Customer Support Email', '2026-01-01 00:00:00.000'),
('set_3', 'store_currency', 'PKR', 'Primary Store Currency', '2026-01-01 00:00:00.000'),
('set_4', 'low_stock_threshold', '5', 'Low Stock Alert Inventory Threshold', '2026-01-01 00:00:00.000'),
('set_5', 'payment_cod_enabled', 'true', 'Cash on Delivery Enable Flag', '2026-01-01 00:00:00.000');

SET FOREIGN_KEY_CHECKS = 1;
COMMIT;
