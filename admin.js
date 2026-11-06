(function () {
  const store = window.NriOrderSystem;
  const ordersElement = document.getElementById("adminOrders");
  const statusElement = document.getElementById("adminStatus");
  const filters = ["orderSearch", "serviceFilter", "statusFilter"]
    .map(id => document.getElementById(id));

  function makeElement(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  }

  function formatDate(value) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "Unknown date" : date.toLocaleString("en-NG");
  }

  function optionLabel(value) {
    return value.charAt(0).toUpperCase() + value.slice(1);
  }

  function createSelect(options, selected, label) {
    const select = document.createElement("select");
    select.setAttribute("aria-label", label);
    options.forEach(value => {
      const option = new Option(optionLabel(value), value);
      option.selected = value === selected;
      select.add(option);
    });
    return select;
  }

  function appendDefinition(list, label, value) {
    const row = makeElement("div", "admin-detail-row");
    row.append(makeElement("dt", "", label), makeElement("dd", "", value || "Not provided"));
    list.append(row);
  }

  function createOrderDetails(order) {
    const details = makeElement("details", "admin-order-details");
    const summary = makeElement("summary", "", "View full order details");
    const content = makeElement("div", "admin-detail-content");
    const customer = order.customer || {};
    const event = order.event || {};
    const delivery = order.delivery || {};
    const definitionList = makeElement("dl", "admin-definition-list");
    [
      ["Customer", customer.name],
      ["Phone", customer.phone],
      ["WhatsApp", customer.whatsapp || customer.phone],
      ["Email", customer.email],
      ["Event", event.type],
      ["Event date", [event.date, event.time].filter(Boolean).join(" ")],
      ["Guests", event.guests],
      ["Fulfilment", delivery.method],
      ["Address", [delivery.address, delivery.city, delivery.state].filter(Boolean).join(", ")],
      ["Directions", delivery.directions],
      ["Pickup instructions", delivery.pickupInstructions],
      ["Cooking location", delivery.cookingLocation],
      ["Serving arrangement", delivery.serving],
      ["Additional instructions", [event.notes, delivery.instructions].filter(Boolean).join("\n")]
    ].forEach(([label, value]) => appendDefinition(definitionList, label, value));

    const itemsHeading = makeElement("h4", "", "Items and prices");
    const itemsTable = makeElement("table", "admin-items-table");
    const tableHead = document.createElement("thead");
    const headingRow = document.createElement("tr");
    ["Food", "Quantity", "Unit price", "Line total"].forEach(label => headingRow.append(makeElement("th", "", label)));
    tableHead.append(headingRow);
    const tableBody = document.createElement("tbody");
    (Array.isArray(order.items) ? order.items : []).forEach(item => {
      const row = document.createElement("tr");
      row.append(
        makeElement("td", "", item.name || "Food item"),
        makeElement("td", "", [item.quantity, item.unit].filter(Boolean).join(" ") || "—"),
        makeElement("td", "", item.unitPrice === null || item.unitPrice === undefined ? "To be quoted" : store.formatMoney(item.unitPrice)),
        makeElement("td", "", item.lineTotal === null || item.lineTotal === undefined ? "To be quoted" : store.formatMoney(item.lineTotal))
      );
      if (item.details) {
        const detailRow = document.createElement("tr");
        const cell = makeElement("td", "admin-item-notes", item.details);
        cell.colSpan = 4;
        detailRow.append(cell);
        tableBody.append(row, detailRow);
      } else {
        tableBody.append(row);
      }
    });
    itemsTable.append(tableHead, tableBody);

    const total = makeElement("div", "admin-order-total");
    total.append(
      makeElement("span", "", "Known subtotal"),
      makeElement("strong", "", store.formatMoney(order.knownSubtotal))
    );
    if (order.totalAmount === null || order.totalAmount === undefined) {
      total.append(makeElement("span", "admin-quote-label", "Final total: To be quoted"));
    } else {
      total.append(makeElement("span", "admin-quote-label", `Order total: ${store.formatMoney(order.totalAmount)}`));
    }

    const notesLabel = makeElement("label", "admin-notes-label", "Internal admin notes");
    const notes = document.createElement("textarea");
    notes.rows = 3;
    notes.value = order.adminNotes || "";
    notes.setAttribute("aria-label", "Internal admin notes");
    const saveNotes = makeElement("button", "admin-secondary-button admin-save-notes", "Save notes");
    saveNotes.type = "button";
    saveNotes.addEventListener("click", () => updateOrder(order.id, { adminNotes: notes.value }));
    notesLabel.append(notes);

    content.append(definitionList, itemsHeading, itemsTable, total, notesLabel, saveNotes);
    details.append(summary, content);
    return details;
  }

  function createOrderCard(order) {
    const card = makeElement("article", "admin-order-card");
    const customer = order.customer || {};
    const header = makeElement("div", "admin-order-card-header");
    const identity = makeElement("div", "admin-order-identity");
    const heading = makeElement("h3", "", customer.name || "Customer");
    const meta = makeElement("p", "", `${order.id} · ${formatDate(order.createdAt)}`);
    const service = makeElement("span", "admin-service-badge", order.service === "cooking" ? "Cooking service" : "Prepared food order");
    identity.append(heading, meta, service);
    const total = makeElement("strong", "admin-card-total", store.formatOrderAmount(order));
    header.append(identity, total);

    const controls = makeElement("div", "admin-order-controls");
    const orderStatusLabel = makeElement("label", "", "Order status");
    const orderStatus = createSelect(store.orderStatuses, order.status || "new", `Order status for ${order.id}`);
    orderStatus.addEventListener("change", () => updateOrder(order.id, { status: orderStatus.value }));
    orderStatusLabel.append(orderStatus);

    const whatsapp = makeElement("a", "admin-whatsapp-button", "Open WhatsApp message");
    whatsapp.href = `https://wa.me/${store.whatsappNumber}?text=${encodeURIComponent(store.buildWhatsAppMessage(order))}`;
    whatsapp.target = "_blank";
    whatsapp.rel = "noopener noreferrer";
    controls.append(orderStatusLabel, whatsapp);

    const actions = makeElement("div", "admin-order-actions");
    const deleteButton = makeElement("button", "admin-delete-button", "Delete order");
    deleteButton.type = "button";
    deleteButton.addEventListener("click", () => {
      if (window.confirm(`Delete order ${order.id}? This cannot be undone.`)) {
        try {
          store.deleteOrder(order.id);
          statusElement.textContent = "Order deleted.";
        } catch (error) {
          showError(error);
        }
      }
    });
    actions.append(deleteButton);
    card.append(header, controls, createOrderDetails(order), actions);
    return card;
  }

  function getFilteredOrders(orders) {
    const query = filters[0].value.trim().toLocaleLowerCase();
    const service = filters[1].value;
    const status = filters[2].value;
    return orders.filter(order => {
      const searchable = JSON.stringify(order).toLocaleLowerCase();
      return (!query || searchable.includes(query)) &&
        (!service || order.service === service) &&
        (!status || (order.status || "new") === status);
    });
  }

  function render() {
    try {
      const orders = store.getOrders();
      const filtered = getFilteredOrders(orders);
      document.getElementById("statTotal").textContent = String(orders.length);
      document.getElementById("statOpen").textContent = String(orders.filter(order => !["completed", "cancelled"].includes(order.status || "new")).length);
      document.getElementById("ordersCount").textContent = `${filtered.length} of ${orders.length} order${orders.length === 1 ? "" : "s"}`;
      ordersElement.replaceChildren(...filtered.map(createOrderCard));
      document.getElementById("emptyOrders").hidden = filtered.length !== 0;
      statusElement.textContent = "";
    } catch (error) {
      ordersElement.replaceChildren();
      document.getElementById("emptyOrders").hidden = true;
      showError(error);
    }
  }

  function showError(error) {
    console.error("Could not update the local order dashboard.", error);
    statusElement.textContent = `Dashboard could not save or load orders: ${error.message}`;
  }

  function updateOrder(id, updates) {
    try {
      store.updateOrder(id, updates);
      statusElement.textContent = `Order ${id} updated.`;
    } catch (error) {
      showError(error);
    }
  }

  function downloadCsv() {
    try {
      const orders = store.getOrders();
      const columns = [
        "id", "createdAt", "service", "status", "name", "phone", "whatsapp",
        "email", "eventType", "eventDate", "eventTime", "guests", "deliveryMethod", "address",
        "city", "state", "items", "knownSubtotal", "totalAmount", "adminNotes"
      ];
      const escapeCsv = value => {
        const text = String(value ?? "");
        const safeText = /^[\s]*[=+\-@\t\r]/.test(text) ? `'${text}` : text;
        return `"${safeText.replace(/"/g, '""')}"`;
      };
      const rows = orders.map(order => {
        const customer = order.customer || {};
        const event = order.event || {};
        const delivery = order.delivery || {};
        const values = {
          ...order, name: customer.name, phone: customer.phone, whatsapp: customer.whatsapp,
          email: customer.email, eventType: event.type, eventDate: event.date,
          eventTime: event.time, guests: event.guests, deliveryMethod: delivery.method,
          address: delivery.address, city: delivery.city, state: delivery.state,
          items: (order.items || []).map(item => {
            const price = item.unitPrice === null || item.unitPrice === undefined
              ? "to be quoted"
              : `${store.formatMoney(item.unitPrice)} each`;
            const total = item.lineTotal === null || item.lineTotal === undefined
              ? "line total to be quoted"
              : store.formatMoney(item.lineTotal);
            return `${item.name} x ${item.quantity} ${item.unit || ""} @ ${price}; ${total}${item.details ? `; ${item.details}` : ""}`;
          }).join("; ")
        };
        return columns.map(column => escapeCsv(values[column])).join(",");
      });
      const blob = new Blob([[columns.join(","), ...rows].join("\r\n")], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `nri-kitchen-orders-${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      showError(error);
    }
  }

  filters.forEach(filter => filter.addEventListener("input", render));
  filters.slice(1).forEach(filter => filter.addEventListener("change", render));
  document.getElementById("refreshOrders").addEventListener("click", render);
  document.getElementById("exportOrders").addEventListener("click", downloadCsv);
  document.getElementById("clearOrders").addEventListener("click", () => {
    if (!window.confirm("Clear every order saved in this browser? This cannot be undone.")) return;
    try {
      store.clearOrders();
      statusElement.textContent = "All local demo orders cleared.";
    } catch (error) {
      showError(error);
    }
  });
  window.addEventListener("storage", event => {
    if (event.key === "nriKitchenOrders") render();
  });
  window.addEventListener("nriKitchen:orders-updated", render);
  render();
})();
