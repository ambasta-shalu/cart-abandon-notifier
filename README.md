# 🛒 Abandoned Checkout Recovery Plugin

A significant percentage of e-commerce customers add products to their cart and proceed to checkout, but many do not complete the purchase. This tool is designed to bring back these customers.

## 🚀 Overview

The **Abandoned Checkout Recovery Plugin** is a powerful tool that helps e-commerce businesses recover lost sales by reaching out to customers who abandon their carts. By integrating seamlessly with popular platforms like Shopify and WooCommerce, this plugin leverages webhook events to monitor customer actions and send out timely reminders to encourage purchase completion.

### Key Features:

- **Webhook Integration:** Supports webhook events, like `checkout abandonment` and `order placed`.
- **Customizable Message Schedule:** Define and customize the schedule for sending out reminder messages.
- **Order Detection:** Automatically stops scheduled messages if the customer places an order.

## ⚙️ How It Works

1. **Webhook Registration:**
   - The plugin listens for specific webhook events from e-commerce platforms such as Shopify and WooCommerce.
   - Two critical events are monitored:
     - **Checkout Abandonment**: Triggered when a customer abandons the checkout process.
     - **Order Placed**: Triggered when a customer completes a purchase.

2. **Scheduled Messaging:**
   - Once a `checkout abandonment` event is detected, the plugin initiates a sequence of scheduled messages.
   - Messages are sent to the customer based on a predefined schedule, which is fully customizable to meet the needs of the business.
   - The messaging sequence is halted immediately if an `order placed` event is detected, ensuring that customers aren't spammed after completing a purchase.

## 🛠️ Installation

To install and set up the plugin, follow these steps:

1. Clone the repository:
   ```bash
   git clone https://github.com/ambasta-shalu/cart-abandon-notifier.git
