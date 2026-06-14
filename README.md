# R S Dairy Farms - Invoicing & Billing Software

A modern, responsive, and feature-rich billing and invoicing application designed for **R S Dairy Farms**.

## Features

1. **Dynamic Invoice Generator**: Easily add items, edit quantity in KGs, set custom rates, and select dates.
2. **Preset Product Database**: Prepopulated with default rates for **DAHI**, **CHEESE ANALOGUE**, and **KHAWA**.
3. **Automatic Calculations**: Real-time updates of subtotal, tax breakdown (CGST & SGST for Maharashtra / IGST for other states), and grand totals.
4. **Number-to-Words Conversion**: Auto-generates the total amount in words (Indian Rupees and Paise format).
5. **UPI QR Code Generator**: Generates a dynamic QR code for easy mobile payments (scannable with PhonePe, Google Pay, Paytm, etc.).
6. **A4 Print Layout**: Designed to print a pixel-perfect, clean, professional invoice directly to physical paper or to save as a PDF.
7. **Database Manager**: Save and edit regular customers and default product prices.
8. **History Log**: Keeps track of all invoices created, with options to reload or delete records.
9. **Dark Mode & Light Mode**: Easily switch views based on preferences.
10. **Zero Setup / Local Storage**: Completely browser-based, saving all data locally so that nothing is uploaded to external servers.

## How to Run the Application

Since the software is built using vanilla web technologies, there is no need for any installation.

1. Navigate to the project directory: `C:\Users\Anish\.gemini\antigravity\scratch\rs_dairy_billing\`
2. Double-click the [`index.html`](index.html) file to open it in your preferred web browser (e.g. Google Chrome, Microsoft Edge, Firefox, or Safari).
3. (Optional) For a full experience with an address bar-free window, you can run a local web server (like Live Server in VS Code or python http.server).

## How to Export to PDF or Print

1. Fill out the customer details and line items in the form.
2. Review the **Live Invoice Document Preview** at the bottom of the page to ensure all information is correct.
3. Click the **Print / Save PDF** button.
4. In the print dialog that opens:
   - To save as a file: Set the Destination to **Save as PDF** or **Microsoft Print to PDF**.
   - To print physically: Select your printer.
   - (Recommended) Under **More Settings**, ensure **Background Graphics** is checked, and **Headers and footers** is unchecked to remove the browser-generated date and page URL.
   - Click **Save** or **Print**.
