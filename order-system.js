(function () {
  const ORDERS_KEY = "nriKitchenOrders";
  const BUSINESS_WHATSAPP = "2348162050512";
  const ORDER_STATUSES = ["new", "confirmed", "preparing", "ready", "completed", "cancelled"];

  function getOrders() {
    const stored = localStorage.getItem(ORDERS_KEY);
    if (!stored) return [];
    const orders = JSON.parse(stored);
    if (!Array.isArray(orders)) throw new TypeError("Saved orders must be a list.");
    return orders;
  }

  function getOrder(id) {
    return getOrders().find(order => order.id === id) || null;
  }

  function saveOrder(order) {
    if (!order || typeof order.id !== "string" || !order.id || !Array.isArray(order.items)) {
      throw new TypeError("A valid order with an ID and item list is required.");
    }
    const orders = getOrders();
    const existingIndex = orders.findIndex(item => item.id === order.id);
    if (existingIndex < 0) orders.unshift(order);
    else orders[existingIndex] = order;
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
    window.dispatchEvent(new CustomEvent("nriKitchen:orders-updated"));
    return order;
  }

  function updateOrder(id, updates) {
    const orders = getOrders();
    const order = orders.find(item => item.id === id);
    if (!order) throw new Error("This order is no longer in the dashboard.");
    if (updates.status !== undefined) {
      if (!ORDER_STATUSES.includes(updates.status)) throw new TypeError("Invalid order status.");
      order.status = updates.status;
    }
    if (updates.adminNotes !== undefined) order.adminNotes = String(updates.adminNotes);
    order.updatedAt = new Date().toISOString();
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
    window.dispatchEvent(new CustomEvent("nriKitchen:orders-updated"));
    return order;
  }

  function deleteOrder(id) {
    const remaining = getOrders().filter(order => order.id !== id);
    localStorage.setItem(ORDERS_KEY, JSON.stringify(remaining));
    window.dispatchEvent(new CustomEvent("nriKitchen:orders-updated"));
  }

  function clearOrders() {
    localStorage.removeItem(ORDERS_KEY);
    window.dispatchEvent(new CustomEvent("nriKitchen:orders-updated"));
  }

  function createOrderId() {
    const suffix = Math.random().toString(36).slice(2, 8).toUpperCase();
    return `NRI-${Date.now().toString(36).toUpperCase()}-${suffix}`;
  }

  function formatMoney(amount) {
    return `₦${Number(amount || 0).toLocaleString("en-NG")}`;
  }

  function formatOrderAmount(order) {
    if (order.totalAmount === null || order.totalAmount === undefined) {
      return `${order.knownSubtotal ? `Known subtotal: ${formatMoney(order.knownSubtotal)}. ` : ""}To be quoted`;
    }
    return formatMoney(order.totalAmount);
  }

  function buildWhatsAppMessage(order) {
    const customer = order.customer || {};
    const event = order.event || {};
    const delivery = order.delivery || {};
    const lines = [
      `NRI MAMA'S KITCHEN — NEW ${String(order.service || "FOOD").toUpperCase()} ORDER`,
      `Order ID: ${order.id}`,
      `Order created: ${new Date(order.createdAt).toLocaleString("en-NG")}`,
      "",
      "CUSTOMER",
      `Name: ${customer.name || "Not provided"}`,
      `Phone: ${customer.phone || "Not provided"}`,
      `WhatsApp: ${customer.whatsapp || customer.phone || "Not provided"}`,
      `Email: ${customer.email || "Not provided"}`,
      "",
      "EVENT",
      `Type: ${event.type || "Not provided"}`,
      `Date and time: ${[event.date, event.time].filter(Boolean).join(" ") || "Not provided"}`,
      `Guests: ${event.guests || "Not provided"}`,
      `Notes: ${event.notes || "None"}`,
      "",
      "DELIVERY / SERVICE",
      `Method: ${delivery.method || "Not provided"}`,
      `Address: ${[delivery.address, delivery.city, delivery.state].filter(Boolean).join(", ") || "Pickup / not provided"}`,
      `Directions: ${delivery.directions || "None"}`,
      `Pickup instructions: ${delivery.pickupInstructions || "None"}`,
      `Cooking location: ${delivery.cookingLocation || "Not applicable"}`,
      `Serving: ${delivery.serving || "Not applicable"}`,
      `Delivery instructions: ${delivery.instructions || "None"}`,
      "",
      "ORDER ITEMS"
    ];

    if (order.items.length) {
      order.items.forEach((item, index) => {
        const quantity = [item.quantity, item.unit].filter(Boolean).join(" ");
        const amount = item.lineTotal === null || item.lineTotal === undefined
          ? "Price to be quoted"
          : formatMoney(item.lineTotal);
        lines.push(`${index + 1}. ${item.name} — ${quantity || "quantity not specified"} — ${amount}`);
        if (item.details) lines.push(`   Details: ${item.details}`);
        if (item.unitPrice !== null && item.unitPrice !== undefined) {
          lines.push(`   Unit price: ${formatMoney(item.unitPrice)}`);
        }
      });
    } else {
      lines.push("No items were added.");
    }

    lines.push(
      "",
      `Known subtotal: ${formatMoney(order.knownSubtotal)}`,
      `TOTAL: ${formatOrderAmount(order)}`,
      "",
      "Please reply to confirm availability, final quotation, delivery fees and next steps."
    );
    return lines.join("\n");
  }

  window.NriOrderSystem = Object.freeze({
    orderStatuses: ORDER_STATUSES,
    whatsappNumber: BUSINESS_WHATSAPP,
    getOrders,
    getOrder,
    saveOrder,
    updateOrder,
    deleteOrder,
    clearOrders,
    createOrderId,
    formatMoney,
    formatOrderAmount,
    buildWhatsAppMessage
  });
})();
