/**
 * R S Dairy Farms - Invoicing & Billing System
 * Core Application Logic (With HSN & Tax)
 */

// Initialize default state
const DEFAULT_PRODUCTS = [
    { id: 'prod-1', name: 'DAHI', rate: 80.00, hsn: '0403', taxRate: 5 },
    { id: 'prod-2', name: 'CHEESE ANALOGUE', rate: 190.00, hsn: '2106', taxRate: 12 },
    { id: 'prod-3', name: 'KHAWA', rate: 320.00, hsn: '0405', taxRate: 5 }
];

const DEFAULT_SETTINGS = {
    companyName: 'R S Dairy Farms',
    address: 'G no-977 Manik Nagar Haveli pune Manjari Khurd-412307, Pune, Maharashtra, 412307',
    gstin: '27ABCFR3617H1Z8',
    phone1: '9527384430',
    phone2: '+91 99878 14451',
    email: 'rsdairyfarms21@gmail.com',
    stampImage: ''
};

let appState = {
    settings: { ...DEFAULT_SETTINGS },
    products: [ ...DEFAULT_PRODUCTS ],
    customers: [],
    invoices: [],
    currentInvoice: {
        invoiceNumber: '',
        invoiceDate: '',
        dueDate: '',
        placeOfSupply: 'Maharashtra',
        customer: { name: '', phone: '' },
        items: [],
        stampImage: ''
    },
    activeTab: 'create'
};

// --- Local Storage Management ---
function saveToLocalStorage() {
    localStorage.setItem('rs_dairy_settings_tax', JSON.stringify(appState.settings));
    localStorage.setItem('rs_dairy_products_tax', JSON.stringify(appState.products));
    localStorage.setItem('rs_dairy_customers_tax', JSON.stringify(appState.customers));
    localStorage.setItem('rs_dairy_invoices_tax', JSON.stringify(appState.invoices));
}

function loadFromLocalStorage() {
    const settings = localStorage.getItem('rs_dairy_settings_tax');
    const products = localStorage.getItem('rs_dairy_products_tax');
    const customers = localStorage.getItem('rs_dairy_customers_tax');
    const invoices = localStorage.getItem('rs_dairy_invoices_tax');

    if (settings) appState.settings = JSON.parse(settings);
    if (products) appState.products = JSON.parse(products);
    if (customers) appState.customers = JSON.parse(customers);
    if (invoices) appState.invoices = JSON.parse(invoices);
}

// --- Number to Words Conversion (Indian Numbering System) ---
function numberToWords(number) {
    const first = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    function convertAmount(num) {
        if (num === 0) return 'Zero';
        let word = '';
        let numStr = num.toString().padStart(9, '0');
        
        let crores = parseInt(numStr.substring(0, 2));
        let lakhs = parseInt(numStr.substring(2, 4));
        let thousands = parseInt(numStr.substring(4, 6));
        let hundreds = parseInt(numStr.substring(6, 7));
        let tensUnits = parseInt(numStr.substring(7, 9));

        if (crores > 0) {
            word += (crores < 20 ? first[crores] : tens[Math.floor(crores / 10)] + (crores % 10 !== 0 ? ' ' + first[crores % 10] : '')) + ' Crore ';
        }
        if (lakhs > 0) {
            word += (lakhs < 20 ? first[lakhs] : tens[Math.floor(lakhs / 10)] + (lakhs % 10 !== 0 ? ' ' + first[lakhs % 10] : '')) + ' Lakh ';
        }
        if (thousands > 0) {
            word += (thousands < 20 ? first[thousands] : tens[Math.floor(thousands / 10)] + (thousands % 10 !== 0 ? ' ' + first[thousands % 10] : '')) + ' Thousand ';
        }
        if (hundreds > 0) {
            word += first[hundreds] + ' Hundred ';
        }
        if (tensUnits > 0) {
            word += (tensUnits < 20 ? first[tensUnits] : tens[Math.floor(tensUnits / 10)] + (tensUnits % 10 !== 0 ? ' ' + first[tensUnits % 10] : ''));
        }
        return word.trim();
    }

    // Split major and paise
    let parts = parseFloat(number).toFixed(2).split('.');
    let rupees = parseInt(parts[0]);
    let paise = parseInt(parts[1]);

    let words = '';
    if (rupees > 0) {
        words += convertAmount(rupees) + ' Rupees';
    } else {
        words += 'Zero Rupees';
    }

    if (paise > 0) {
        words += ' And ' + convertAmount(paise) + ' Paise';
    }
    
    return words + ' Only';
}

// --- Invoice Calculations ---
function calculateInvoice() {
    let subtotal = 0;
    let totalWeight = 0;
    let totalQty = 0;
    let totalTax = 0;

    appState.currentInvoice.items.forEach(item => {
        const weight = parseFloat(item.weight) || 0;
        const rate = parseFloat(item.rate) || 0;
        const qty = parseInt(item.quantity) || 0;
        const taxRate = parseFloat(item.taxRate) || 0;
        
        // Item total = weight * rate
        const total = weight * rate;
        item.total = total;
        
        // Tax for this item = total * taxRate / 100
        const taxAmount = total * (taxRate / 100);
        item.taxAmount = taxAmount;

        subtotal += total;
        totalWeight += weight;
        totalQty += qty;
        totalTax += taxAmount;
    });

    const grandTotal = subtotal + totalTax;

    appState.currentInvoice.subtotal = subtotal;
    appState.currentInvoice.totalWeight = totalWeight;
    appState.currentInvoice.totalQty = totalQty;
    appState.currentInvoice.totalTax = totalTax;
    appState.currentInvoice.grandTotal = Math.round(grandTotal);
    appState.currentInvoice.amountInWords = numberToWords(Math.round(grandTotal));

    updateInvoiceView();
}

// --- UI Rendering & Handling ---
function setupEventListeners() {
    // Tab switching
    document.querySelectorAll('.nav-item button').forEach(button => {
        button.addEventListener('click', (e) => {
            const tab = e.currentTarget.closest('.nav-item').dataset.tab;
            switchTab(tab);
        });
    });

    // Theme Toggle Functionality (Desktop & Mobile)
    const themeCheckbox = document.getElementById('theme-checkbox');
    const mobileThemeBtn = document.getElementById('theme-toggle-btn');
    const sunIcon = document.querySelector('.sun-icon');
    const moonIcon = document.querySelector('.moon-icon');

    function applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('rs_dairy_theme_tax', theme);
        
        // Sync desktop checkbox
        if (themeCheckbox) {
            themeCheckbox.checked = (theme === 'dark');
        }
        
        // Sync mobile button icons
        if (sunIcon && moonIcon) {
            if (theme === 'dark') {
                sunIcon.style.display = 'block';
                moonIcon.style.display = 'none';
            } else {
                sunIcon.style.display = 'none';
                moonIcon.style.display = 'block';
            }
        }
    }

    if (themeCheckbox) {
        themeCheckbox.addEventListener('change', () => {
            const theme = themeCheckbox.checked ? 'dark' : 'light';
            applyTheme(theme);
        });
    }

    if (mobileThemeBtn) {
        mobileThemeBtn.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            applyTheme(newTheme);
        });
    }

    // Load saved theme
    const savedTheme = localStorage.getItem('rs_dairy_theme_tax') || 'light';
    applyTheme(savedTheme);

    // Auto-create date
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('inv-date').value = today;
    
    // Default due date: today + 30 days
    const nextMonth = new Date();
    nextMonth.setDate(nextMonth.getDate() + 30);
    const dueDateStr = nextMonth.toISOString().split('T')[0];
    document.getElementById('inv-due').value = dueDateStr;

    appState.currentInvoice.invoiceDate = today;
    appState.currentInvoice.dueDate = dueDateStr;

    // Field change handlers for Invoice Header
    document.getElementById('inv-number').addEventListener('input', (e) => {
        appState.currentInvoice.invoiceNumber = e.target.value;
        updatePreviewHeader();
    });
    document.getElementById('inv-date').addEventListener('change', (e) => {
        appState.currentInvoice.invoiceDate = e.target.value;
        updatePreviewHeader();
    });
    document.getElementById('inv-due').addEventListener('change', (e) => {
        appState.currentInvoice.dueDate = e.target.value;
        updatePreviewHeader();
    });
    document.getElementById('inv-pos').addEventListener('input', (e) => {
        appState.currentInvoice.placeOfSupply = e.target.value;
        updatePreviewHeader();
    });

    // Customer inputs with autocomplete
    const custNameInput = document.getElementById('cust-name');
    const custPhoneInput = document.getElementById('cust-phone');

    custNameInput.addEventListener('input', (e) => {
        const val = e.target.value;
        appState.currentInvoice.customer.name = val;
        updatePreviewCustomer();
        showCustomerSuggestions(val);
    });

    custPhoneInput.addEventListener('input', (e) => {
        appState.currentInvoice.customer.phone = e.target.value;
        updatePreviewCustomer();
    });

    // Add Item button
    document.getElementById('add-item-btn').addEventListener('click', () => {
        addInvoiceItem();
    });

    // Stamp upload listeners
    document.getElementById('inv-stamp').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(event) {
                appState.currentInvoice.stampImage = event.target.result;
                updatePreviewStamp();
            };
            reader.readAsDataURL(file);
        }
    });

    document.getElementById('remove-stamp-btn').addEventListener('click', () => {
        appState.currentInvoice.stampImage = '';
        document.getElementById('inv-stamp').value = '';
        updatePreviewStamp();
    });

    // Settings Form Save
    document.getElementById('settings-form').addEventListener('submit', (e) => {
        e.preventDefault();
        saveSettings();
    });

    // Settings stamp upload listeners
    document.getElementById('sett-stamp').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(event) {
                appState.settings.stampImage = event.target.result;
                saveToLocalStorage();
                showToast('Default stamp uploaded', 'success');
            };
            reader.readAsDataURL(file);
        }
    });

    document.getElementById('sett-remove-stamp-btn').addEventListener('click', () => {
        appState.settings.stampImage = '';
        document.getElementById('sett-stamp').value = '';
        saveToLocalStorage();
        showToast('Default stamp removed', 'info');
    });

    // Reset settings
    document.getElementById('reset-settings-btn').addEventListener('click', () => {
        if(confirm('Are you sure you want to reset to default settings?')) {
            appState.settings = { ...DEFAULT_SETTINGS };
            saveToLocalStorage();
            loadSettingsForm();
            showToast('Settings reset to default', 'info');
            updatePreviewHeader();
        }
    });

    // Save Invoice button
    document.getElementById('save-invoice-btn').addEventListener('click', () => {
        saveInvoiceToHistory();
    });

    // New Invoice button
    document.getElementById('new-invoice-btn').addEventListener('click', () => {
        resetCurrentInvoice();
    });

    // Print Invoice button
    document.getElementById('print-invoice-btn').addEventListener('click', () => {
        printInvoice();
    });

    // Product form & Customer form in DB tabs
    document.getElementById('add-db-product-btn').addEventListener('click', () => showProductModal());
    document.getElementById('add-db-customer-btn').addEventListener('click', () => showCustomerModal());

    // Search Invoices
    document.getElementById('search-invoice').addEventListener('input', (e) => {
        renderHistoryTable(e.target.value);
    });
}

function switchTab(tab) {
    appState.activeTab = tab;
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.toggle('active', item.dataset.tab === tab);
    });
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.toggle('active', content.id === `${tab}-tab`);
    });

    if (tab === 'history') {
        renderHistoryTable();
    } else if (tab === 'database') {
        renderDatabaseView();
    } else if (tab === 'settings') {
        loadSettingsForm();
    }
}

// --- Invoice Items ---
function addInvoiceItem(product = null) {
    const item = {
        id: 'item-' + Date.now() + Math.random().toString(36).substr(2, 5),
        name: product ? product.name : '',
        hsn: product ? (product.hsn || '-') : '-',
        taxRate: product ? product.taxRate : 5,
        weight: 0,
        quantity: 0,
        rate: product ? product.rate : 0,
        total: 0
    };
    appState.currentInvoice.items.push(item);
    renderInvoiceItems();
    calculateInvoice();
}

function deleteInvoiceItem(id) {
    appState.currentInvoice.items = appState.currentInvoice.items.filter(item => item.id !== id);
    renderInvoiceItems();
    calculateInvoice();
}

function renderInvoiceItems() {
    const tbody = document.getElementById('invoice-items-tbody');
    tbody.innerHTML = '';

    if (appState.currentInvoice.items.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: var(--text-muted);">No items added. Click "Add Line Item" to start.</td></tr>`;
        return;
    }

    appState.currentInvoice.items.forEach((item, index) => {
        const tr = document.createElement('tr');
        
        // Product Select Options
        let productOptions = `<option value="">-- Select Product --</option>`;
        appState.products.forEach(p => {
            productOptions += `<option value="${p.id}" ${item.name === p.name ? 'selected' : ''}>${p.name}</option>`;
        });
        productOptions += `<option value="custom" ${item.name && !appState.products.some(p => p.name === item.name) ? 'selected' : ''}>Custom Item...</option>`;

        tr.innerHTML = `
            <td class="col-no">${index + 1}</td>
            <td class="col-product">
                <select class="item-product-select" data-id="${item.id}">
                    ${productOptions}
                </select>
                <input type="text" class="item-name-input mt-1" style="display: ${item.name && !appState.products.some(p => p.name === item.name) || item.name === '' ? 'block' : 'none'}; margin-top: 5px;" placeholder="Enter Item Name" value="${item.name}" data-id="${item.id}">
            </td>
            <td>
                <input type="text" class="item-hsn-input" value="${item.hsn}" placeholder="HSN" data-id="${item.id}">
            </td>
            <td style="width: 90px;">
                <select class="item-tax-select" data-id="${item.id}">
                    <option value="0" ${item.taxRate == 0 ? 'selected' : ''}>0%</option>
                    <option value="5" ${item.taxRate == 5 ? 'selected' : ''}>5%</option>
                    <option value="12" ${item.taxRate == 12 ? 'selected' : ''}>12%</option>
                    <option value="18" ${item.taxRate == 18 ? 'selected' : ''}>18%</option>
                </select>
            </td>
            <td>
                <input type="number" step="0.01" class="item-weight-input" value="${item.weight || ''}" placeholder="0.00 kg" data-id="${item.id}">
            </td>
            <td>
                <input type="number" class="item-qty-input" value="${item.quantity || ''}" placeholder="pcs" data-id="${item.id}">
            </td>
            <td>
                <input type="number" step="0.01" class="item-rate-input" value="${item.rate || ''}" placeholder="0.00" data-id="${item.id}">
            </td>
            <td class="col-amount" style="text-align: right;">₹${item.total.toLocaleString('en-IN', {maximumFractionDigits: 0})}</td>
            <td class="col-action">
                <button class="btn btn-danger btn-icon-only delete-item-btn" data-id="${item.id}">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="width: 16px; height: 16px;">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                </button>
            </td>
        `;

        tbody.appendChild(tr);
    });

    // Attach row events
    tbody.querySelectorAll('.item-product-select').forEach(select => {
        select.addEventListener('change', (e) => {
            const id = e.target.dataset.id;
            const val = e.target.value;
            const nameInput = e.target.nextElementSibling;
            const item = appState.currentInvoice.items.find(i => i.id === id);

            if (val === 'custom') {
                nameInput.style.display = 'block';
                item.name = '';
                item.hsn = '-';
                item.rate = 0;
                item.taxRate = 5;
            } else if (val === '') {
                nameInput.style.display = 'none';
                item.name = '';
                item.hsn = '-';
                item.rate = 0;
            } else {
                nameInput.style.display = 'none';
                const prod = appState.products.find(p => p.id === val);
                if (prod) {
                    item.name = prod.name;
                    item.hsn = prod.hsn || '-';
                    item.rate = prod.rate;
                    item.taxRate = prod.taxRate;
                }
            }
            renderInvoiceItems();
            calculateInvoice();
        });
    });

    tbody.querySelectorAll('.item-name-input').forEach(input => {
        input.addEventListener('input', (e) => {
            const id = e.target.dataset.id;
            const item = appState.currentInvoice.items.find(i => i.id === id);
            item.name = e.target.value;
            calculateInvoice();
        });
    });

    tbody.querySelectorAll('.item-hsn-input').forEach(input => {
        input.addEventListener('input', (e) => {
            const id = e.target.dataset.id;
            const item = appState.currentInvoice.items.find(i => i.id === id);
            item.hsn = e.target.value;
            calculateInvoice();
        });
    });

    tbody.querySelectorAll('.item-tax-select').forEach(select => {
        select.addEventListener('change', (e) => {
            const id = e.target.dataset.id;
            const item = appState.currentInvoice.items.find(i => i.id === id);
            item.taxRate = parseFloat(e.target.value) || 0;
            calculateInvoice();
        });
    });

    tbody.querySelectorAll('.item-weight-input').forEach(input => {
        input.addEventListener('input', (e) => {
            const id = e.target.dataset.id;
            const item = appState.currentInvoice.items.find(i => i.id === id);
            item.weight = parseFloat(e.target.value) || 0;
            calculateInvoice();
        });
    });

    tbody.querySelectorAll('.item-qty-input').forEach(input => {
        input.addEventListener('input', (e) => {
            const id = e.target.dataset.id;
            const item = appState.currentInvoice.items.find(i => i.id === id);
            item.quantity = parseInt(e.target.value) || 0;
            calculateInvoice();
        });
    });

    tbody.querySelectorAll('.item-rate-input').forEach(input => {
        input.addEventListener('input', (e) => {
            const id = e.target.dataset.id;
            const item = appState.currentInvoice.items.find(i => i.id === id);
            item.rate = parseFloat(e.target.value) || 0;
            calculateInvoice();
        });
    });

    tbody.querySelectorAll('.delete-item-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.currentTarget.dataset.id;
            deleteInvoiceItem(id);
        });
    });
}

// --- Live Invoice Preview Generation ---
function updateInvoiceView() {
    updatePreviewHeader();
    updatePreviewCustomer();
    updatePreviewTable();
    updatePreviewSummary();
    updatePreviewStamp();
}

function updatePreviewStamp() {
    const container = document.getElementById('prev-stamp-container');
    if (!container) return;
    if (appState.currentInvoice.stampImage) {
        container.innerHTML = `<img src="${appState.currentInvoice.stampImage}" alt="Stamp" style="max-width: 150px; max-height: 100px; object-fit: contain;">`;
    } else {
        container.innerHTML = '';
    }
}

function updatePreviewHeader() {
    // Update company header info
    document.getElementById('prev-comp-name').innerText = appState.settings.companyName;
    document.getElementById('prev-comp-addr').innerText = appState.settings.address;
    document.getElementById('prev-comp-gstin').innerText = `GSTIN: ${appState.settings.gstin}`;
    document.getElementById('prev-comp-mobile').innerText = `Mobile: ${appState.settings.phone1}${appState.settings.phone2 ? ', ' + appState.settings.phone2 : ''}`;
    document.getElementById('prev-comp-email').innerText = `Email ${appState.settings.email}`;

    // Invoice Meta
    document.getElementById('prev-inv-num').innerText = appState.currentInvoice.invoiceNumber || '5';
    document.getElementById('prev-inv-date').innerText = formatDateSlash(appState.currentInvoice.invoiceDate);
    document.getElementById('prev-due-date').innerText = formatDateSlash(appState.currentInvoice.dueDate);
}

function updatePreviewCustomer() {
    document.getElementById('prev-cust-name').innerText = (appState.currentInvoice.customer.name || 'CUSTOMER NAME').toUpperCase();
    document.getElementById('prev-cust-pos').innerText = 'Place of Supply: ' + (appState.currentInvoice.placeOfSupply || 'Maharashtra');
    document.getElementById('prev-cust-phone').innerText = appState.currentInvoice.customer.phone ? 'Mobile: ' + appState.currentInvoice.customer.phone : 'Mobile: ';
}

function updatePreviewTable() {
    const tbody = document.getElementById('prev-table-tbody');
    tbody.innerHTML = '';

    if (appState.currentInvoice.items.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; height: 180px; color:#94a3b8;">No items added yet.</td></tr>`;
        return;
    }

    appState.currentInvoice.items.forEach((item, index) => {
        const tr = document.createElement('tr');
        const roundedTotal = Math.round(item.total);
        tr.innerHTML = `
            <td style="text-align: center; border-right: 1px solid #000; padding: 10px 4px;">${index + 1}</td>
            <td style="border-right: 1px solid #000; padding: 10px 8px;">${item.name || 'Unspecified Item'}</td>
            <td style="text-align: center; border-right: 1px solid #000; padding: 10px 4px;">${item.hsn || '-'}</td>
            <td style="text-align: center; border-right: 1px solid #000; padding: 10px 4px;">${item.taxRate}%</td>
            <td style="text-align: center; border-right: 1px solid #000; padding: 10px 4px;">${item.weight ? item.weight.toFixed(1) + ' kg' : ''}</td>
            <td style="text-align: center; border-right: 1px solid #000; padding: 10px 4px;">${item.quantity ? item.quantity + ' PCS' : ''}</td>
            <td style="text-align: center; border-right: 1px solid #000; padding: 10px 4px;">${item.rate ? Math.round(item.rate) : ''}</td>
            <td style="text-align: right; padding: 10px 8px; font-weight: 500;">${roundedTotal ? roundedTotal.toLocaleString('en-IN') : ''}</td>
        `;
        tbody.appendChild(tr);
    });

    // Add empty rows to keep the design aligned with the PDF style
    const minRows = 8;
    const currentRows = appState.currentInvoice.items.length;
    if (currentRows < minRows) {
        for (let i = currentRows; i < minRows; i++) {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td style="border-right: 1px solid #000; height: 35px;">&nbsp;</td>
                <td style="border-right: 1px solid #000;">&nbsp;</td>
                <td style="border-right: 1px solid #000;">&nbsp;</td>
                <td style="border-right: 1px solid #000;">&nbsp;</td>
                <td style="border-right: 1px solid #000;">&nbsp;</td>
                <td style="border-right: 1px solid #000;">&nbsp;</td>
                <td style="border-right: 1px solid #000;">&nbsp;</td>
                <td>&nbsp;</td>
            `;
            tbody.appendChild(tr);
        }
    }
}

function updatePreviewSummary() {
    const subtotal = appState.currentInvoice.subtotal || 0;
    const totalTax = appState.currentInvoice.totalTax || 0;
    const grandTotal = appState.currentInvoice.grandTotal || 0;

    // Update bottom total bar
    document.getElementById('prev-total-val').innerText = `₹ ${grandTotal.toLocaleString('en-IN')}`;

    // Update amount payable final value in breakdown
    const prevPayableFinal = document.getElementById('prev-payable-final');
    if (prevPayableFinal) {
        prevPayableFinal.innerText = `₹ ${grandTotal.toLocaleString('en-IN')}`;
    }

    // Update bottom In-Words box
    document.getElementById('prev-amount-words').innerText = appState.currentInvoice.amountInWords || 'Zero Rupees Only';

    // Show CGST/SGST or IGST depending on Place of Supply
    const isInterState = !appState.currentInvoice.placeOfSupply.toLowerCase().includes('maharashtra');
    const cgstHtml = document.getElementById('prev-tax-cgst-sgst');
    const igstHtml = document.getElementById('prev-tax-igst');

    if (totalTax > 0) {
        if (isInterState) {
            cgstHtml.style.display = 'none';
            igstHtml.style.display = 'table-row';
            document.getElementById('prev-igst-val').innerText = `₹ ${Math.round(totalTax).toLocaleString('en-IN')}`;
        } else {
            cgstHtml.style.display = 'table-row';
            igstHtml.style.display = 'none';
            const halfTax = Math.round(totalTax / 2);
            document.getElementById('prev-cgst-val').innerText = `₹ ${halfTax.toLocaleString('en-IN')}`;
            document.getElementById('prev-sgst-val').innerText = `₹ ${halfTax.toLocaleString('en-IN')}`;
        }
        document.getElementById('prev-subtotal-row').style.display = 'table-row';
        document.getElementById('prev-subtotal-val').innerText = `₹ ${Math.round(subtotal).toLocaleString('en-IN')}`;
    } else {
        cgstHtml.style.display = 'none';
        igstHtml.style.display = 'none';
        document.getElementById('prev-subtotal-row').style.display = 'none';
    }
}

// --- Customer Suggestions / Autocomplete ---
function showCustomerSuggestions(query) {
    const container = document.getElementById('cust-suggestions');
    container.innerHTML = '';
    
    if (!query) {
        container.style.display = 'none';
        return;
    }

    const matches = appState.customers.filter(c => 
        c.name.toLowerCase().includes(query.toLowerCase()) || 
        c.phone.includes(query)
    );

    if (matches.length === 0) {
        container.style.display = 'none';
        return;
    }

    matches.forEach(cust => {
        const div = document.createElement('div');
        div.className = 'suggestion-item';
        div.innerHTML = `
            <span>${cust.name}</span>
            <span class="suggestion-phone">${cust.phone}</span>
        `;
        div.addEventListener('click', () => {
            document.getElementById('cust-name').value = cust.name;
            document.getElementById('cust-phone').value = cust.phone;
            appState.currentInvoice.customer = { name: cust.name, phone: cust.phone };
            container.style.display = 'none';
            updatePreviewCustomer();
        });
        container.appendChild(div);
    });

    container.style.display = 'block';
}

// Close autocomplete on click outside
document.addEventListener('click', (e) => {
    if (e.target.id !== 'cust-name') {
        const container = document.getElementById('cust-suggestions');
        if (container) container.style.display = 'none';
    }
});

// --- Invoice Management (Save / Reset) ---
function resetCurrentInvoice() {
    let nextNum = 1;
    if (appState.invoices.length > 0) {
        const numbers = appState.invoices
            .map(inv => {
                const parsed = parseInt(inv.invoiceNumber);
                return isNaN(parsed) ? 0 : parsed;
            })
            .filter(n => n > 0);
        if (numbers.length > 0) {
            nextNum = Math.max(...numbers) + 1;
        }
    }

    appState.currentInvoice = {
        invoiceNumber: String(nextNum),
        invoiceDate: new Date().toISOString().split('T')[0],
        dueDate: (() => {
            const d = new Date();
            d.setDate(d.getDate() + 30);
            return d.toISOString().split('T')[0];
        })(),
        placeOfSupply: 'Maharashtra',
        customer: { name: '', phone: '' },
        items: [],
        stampImage: appState.settings.stampImage || ''
    };

    // Reset UI Inputs
    document.getElementById('inv-number').value = appState.currentInvoice.invoiceNumber;
    document.getElementById('inv-date').value = appState.currentInvoice.invoiceDate;
    document.getElementById('inv-due').value = appState.currentInvoice.dueDate;
    document.getElementById('inv-pos').value = appState.currentInvoice.placeOfSupply;
    document.getElementById('cust-name').value = '';
    document.getElementById('cust-phone').value = '';
    document.getElementById('inv-stamp').value = '';

    // Add default items
    const dahi = appState.products.find(p => p.name === 'DAHI');
    const cheese = appState.products.find(p => p.name === 'CHEESE ANALOGUE');
    const khawa = appState.products.find(p => p.name === 'KHAWA');

    if (dahi) addInvoiceItem(dahi);
    if (cheese) addInvoiceItem(cheese);
    if (khawa) addInvoiceItem(khawa);

    showToast('New invoice template created', 'success');
}

function saveInvoiceToHistory() {
    const inv = appState.currentInvoice;
    if (!inv.invoiceNumber) {
        showToast('Please enter an Invoice Number', 'error');
        return;
    }
    if (!inv.customer.name) {
        showToast('Please enter Customer Name', 'error');
        return;
    }
    if (inv.items.length === 0 || inv.items.every(i => !i.name || i.weight <= 0)) {
        showToast('Please add at least one item with weight > 0', 'error');
        return;
    }

    // Filter out empty items
    inv.items = inv.items.filter(i => i.name && i.weight > 0);

    // Save Customer if new
    const custExists = appState.customers.some(c => c.name.toLowerCase() === inv.customer.name.toLowerCase());
    if (!custExists) {
        appState.customers.push({
            id: 'cust-' + Date.now(),
            name: inv.customer.name,
            phone: inv.customer.phone || '-'
        });
    } else if (inv.customer.phone) {
        const idx = appState.customers.findIndex(c => c.name.toLowerCase() === inv.customer.name.toLowerCase());
        if (idx !== -1) appState.customers[idx].phone = inv.customer.phone;
    }

    // Check if invoice already exists
    const existingIndex = appState.invoices.findIndex(i => i.invoiceNumber === inv.invoiceNumber);
    if (existingIndex !== -1) {
        if (confirm('An invoice with this number already exists. Overwrite?')) {
            appState.invoices[existingIndex] = { ...inv };
            showToast('Invoice updated successfully', 'success');
        } else {
            return;
        }
    } else {
        appState.invoices.push({ ...inv });
        showToast('Invoice saved successfully to history', 'success');
    }

    saveToLocalStorage();
}

// --- History View ---
function renderHistoryTable(searchQuery = '') {
    const tbody = document.getElementById('history-tbody');
    tbody.innerHTML = '';

    let filtered = appState.invoices;
    if (searchQuery) {
        const q = searchQuery.toLowerCase();
        filtered = appState.invoices.filter(i => 
            i.invoiceNumber.toLowerCase().includes(q) || 
            i.customer.name.toLowerCase().includes(q) ||
            i.invoiceDate.includes(q)
        );
    }

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted);">No invoices found.</td></tr>`;
        return;
    }

    // Sort by number descending
    filtered.sort((a, b) => parseInt(b.invoiceNumber) - parseInt(a.invoiceNumber));

    filtered.forEach((inv) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${inv.invoiceNumber}</td>
            <td><strong>${inv.customer.name}</strong></td>
            <td>${formatDateSlash(inv.invoiceDate)}</td>
            <td style="font-family: var(--font-mono);">₹${(inv.grandTotal || 0).toLocaleString('en-IN')}</td>
            <td><span class="badge badge-paid">Saved</span></td>
            <td>
                <div style="display: flex; gap: 8px;">
                    <button class="btn btn-secondary btn-sm edit-inv-btn" data-no="${inv.invoiceNumber}">View/Edit</button>
                    <button class="btn btn-danger btn-sm delete-inv-btn" data-no="${inv.invoiceNumber}">Delete</button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });

    tbody.querySelectorAll('.edit-inv-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const no = e.target.dataset.no;
            const inv = appState.invoices.find(i => i.invoiceNumber === no);
            if (inv) {
                appState.currentInvoice = JSON.parse(JSON.stringify(inv)); // deep copy
                
                document.getElementById('inv-number').value = appState.currentInvoice.invoiceNumber;
                document.getElementById('inv-date').value = appState.currentInvoice.invoiceDate;
                document.getElementById('inv-due').value = appState.currentInvoice.dueDate;
                document.getElementById('inv-pos').value = appState.currentInvoice.placeOfSupply;
                document.getElementById('cust-name').value = appState.currentInvoice.customer.name;
                document.getElementById('cust-phone').value = appState.currentInvoice.customer.phone;

                renderInvoiceItems();
                calculateInvoice();
                switchTab('create');
                showToast('Invoice loaded for editing', 'info');
            }
        });
    });

    tbody.querySelectorAll('.delete-inv-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const no = e.target.dataset.no;
            if (confirm(`Are you sure you want to delete invoice ${no}?`)) {
                appState.invoices = appState.invoices.filter(i => i.invoiceNumber !== no);
                saveToLocalStorage();
                renderHistoryTable(searchQuery);
                showToast('Invoice deleted', 'info');
            }
        });
    });
}

// --- Database Tab Rendering (Customers & Products) ---
function renderDatabaseView() {
    // Render Products Table
    const prodTbody = document.getElementById('db-products-tbody');
    prodTbody.innerHTML = '';
    appState.products.forEach(p => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${p.name}</strong></td>
            <td>${p.hsn || '-'}</td>
            <td style="font-family: var(--font-mono);">₹${p.rate.toFixed(2)} per KG</td>
            <td>${p.taxRate || 0}%</td>
            <td>
                <div style="display: flex; gap: 8px;">
                    <button class="btn btn-secondary btn-sm edit-prod-btn" data-id="${p.id}">Edit</button>
                    <button class="btn btn-danger btn-sm delete-prod-btn" data-id="${p.id}">Delete</button>
                </div>
            </td>
        `;
        prodTbody.appendChild(tr);
    });

    // Render Customers Table
    const custTbody = document.getElementById('db-customers-tbody');
    custTbody.innerHTML = '';
    
    if(appState.customers.length === 0) {
        custTbody.innerHTML = `<tr><td colspan="3" style="text-align: center; color: var(--text-muted);">No customers saved yet.</td></tr>`;
    } else {
        appState.customers.forEach(c => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${c.name}</strong></td>
                <td>${c.phone}</td>
                <td>
                    <div style="display: flex; gap: 8px;">
                        <button class="btn btn-secondary btn-sm edit-cust-btn" data-id="${c.id}">Edit</button>
                        <button class="btn btn-danger btn-sm delete-cust-btn" data-id="${c.id}">Delete</button>
                    </div>
                </td>
            `;
            custTbody.appendChild(tr);
        });
    }

    attachDbEventListeners();
}

function attachDbEventListeners() {
    // Edit Product
    document.querySelectorAll('.edit-prod-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.target.dataset.id;
            const prod = appState.products.find(p => p.id === id);
            showProductModal(prod);
        });
    });

    // Delete Product
    document.querySelectorAll('.delete-prod-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.target.dataset.id;
            if (confirm('Delete this product?')) {
                appState.products = appState.products.filter(p => p.id !== id);
                saveToLocalStorage();
                renderDatabaseView();
                showToast('Product removed', 'info');
            }
        });
    });

    // Edit Customer
    document.querySelectorAll('.edit-cust-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.target.dataset.id;
            const cust = appState.customers.find(c => c.id === id);
            showCustomerModal(cust);
        });
    });

    // Delete Customer
    document.querySelectorAll('.delete-cust-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.target.dataset.id;
            if (confirm('Delete this customer profile?')) {
                appState.customers = appState.customers.filter(c => c.id !== id);
                saveToLocalStorage();
                renderDatabaseView();
                showToast('Customer profile removed', 'info');
            }
        });
    });
}

// --- Product/Customer Modal ---
function showProductModal(product = null) {
    const modal = document.getElementById('db-modal');
    const title = document.getElementById('db-modal-title');
    const content = document.getElementById('db-modal-body');
    
    title.innerText = product ? 'Edit Product Rate' : 'Add New Product';
    
    content.innerHTML = `
        <form id="modal-product-form">
            <input type="hidden" id="modal-prod-id" value="${product ? product.id : ''}">
            <div class="form-group mb-4">
                <label>Product Name</label>
                <input type="text" id="modal-prod-name" value="${product ? product.name : ''}" required ${product && ['DAHI', 'CHEESE ANALOGUE', 'KHAWA'].includes(product.name) ? 'readonly style="background-color:rgba(0,0,0,0.05);"' : ''}>
            </div>
            <div class="form-group mb-4">
                <label>HSN Code</label>
                <input type="text" id="modal-prod-hsn" value="${product ? product.hsn : ''}" placeholder="e.g. 0403">
            </div>
            <div class="form-group mb-4">
                <label>Default Rate (per KG)</label>
                <input type="number" step="0.01" id="modal-prod-rate" value="${product ? product.rate : ''}" required placeholder="0.00">
            </div>
            <div class="form-group mb-4">
                <label>Tax Rate (%)</label>
                <select id="modal-prod-tax">
                    <option value="0" ${product && product.taxRate == 0 ? 'selected' : ''}>0%</option>
                    <option value="5" ${product && product.taxRate == 5 ? 'selected' : ''}>5%</option>
                    <option value="12" ${product && product.taxRate == 12 ? 'selected' : ''}>12%</option>
                    <option value="18" ${product && product.taxRate == 18 ? 'selected' : ''}>18%</option>
                </select>
            </div>
        </form>
    `;

    openModal(modal, () => {
        const id = document.getElementById('modal-prod-id').value;
        const name = document.getElementById('modal-prod-name').value.trim();
        const hsn = document.getElementById('modal-prod-hsn').value.trim() || '-';
        const rate = parseFloat(document.getElementById('modal-prod-rate').value) || 0;
        const taxRate = parseFloat(document.getElementById('modal-prod-tax').value) || 0;

        if (!name || rate <= 0) {
            showToast('Invalid inputs', 'error');
            return false;
        }

        if (id) { // Edit
            const idx = appState.products.findIndex(p => p.id === id);
            if (idx !== -1) {
                appState.products[idx] = { id, name, hsn, rate, taxRate };
                showToast('Product updated', 'success');
            }
        } else { // New
            appState.products.push({
                id: 'prod-' + Date.now(),
                name, hsn, rate, taxRate
            });
            showToast('Product added', 'success');
        }

        saveToLocalStorage();
        renderDatabaseView();
        return true;
    });
}

function showCustomerModal(customer = null) {
    const modal = document.getElementById('db-modal');
    const title = document.getElementById('db-modal-title');
    const content = document.getElementById('db-modal-body');

    title.innerText = customer ? 'Edit Customer Profile' : 'Add New Customer';

    content.innerHTML = `
        <form id="modal-customer-form">
            <input type="hidden" id="modal-cust-id" value="${customer ? customer.id : ''}">
            <div class="form-group mb-4">
                <label>Customer Name</label>
                <input type="text" id="modal-cust-name" value="${customer ? customer.name : ''}" required>
            </div>
            <div class="form-group mb-4">
                <label>Phone / Contact Number</label>
                <input type="tel" id="modal-cust-phone" value="${customer ? customer.phone : ''}" placeholder="e.g. +91 9999988888">
            </div>
        </form>
    `;

    openModal(modal, () => {
        const id = document.getElementById('modal-cust-id').value;
        const name = document.getElementById('modal-cust-name').value.trim();
        const phone = document.getElementById('modal-cust-phone').value.trim();

        if (!name) {
            showToast('Name is required', 'error');
            return false;
        }

        if (id) { // Edit
            const idx = appState.customers.findIndex(c => c.id === id);
            if (idx !== -1) {
                appState.customers[idx] = { id, name, phone };
                showToast('Customer profile updated', 'success');
            }
        } else { // New
            appState.customers.push({
                id: 'cust-' + Date.now(),
                name, phone
            });
            showToast('Customer profile added', 'success');
        }

        saveToLocalStorage();
        renderDatabaseView();
        return true;
    });
}

function openModal(modalEl, onSaveCallback) {
    modalEl.classList.add('active');
    
    const saveBtn = modalEl.querySelector('.save-modal-btn');
    const cancelBtn = modalEl.querySelector('.close-modal-btn');
    const closeBtn = modalEl.querySelector('.close-modal');

    const newSaveBtn = saveBtn.cloneNode(true);
    saveBtn.parentNode.replaceChild(newSaveBtn, saveBtn);

    const closeHandler = () => {
        modalEl.classList.remove('active');
    };

    cancelBtn.onclick = closeHandler;
    closeBtn.onclick = closeHandler;

    newSaveBtn.onclick = () => {
        if(onSaveCallback()) {
            closeHandler();
        }
    };
}

// --- Settings Form ---
function loadSettingsForm() {
    document.getElementById('sett-comp-name').value = appState.settings.companyName;
    document.getElementById('sett-comp-addr').value = appState.settings.address;
    document.getElementById('sett-gstin').value = appState.settings.gstin;
    document.getElementById('sett-phone1').value = appState.settings.phone1;
    document.getElementById('sett-phone2').value = appState.settings.phone2;
    document.getElementById('sett-email').value = appState.settings.email;
    document.getElementById('sett-stamp').value = '';
}

function saveSettings() {
    appState.settings = {
        companyName: document.getElementById('sett-comp-name').value.trim(),
        address: document.getElementById('sett-comp-addr').value.trim(),
        gstin: document.getElementById('sett-gstin').value.trim(),
        phone1: document.getElementById('sett-phone1').value.trim(),
        phone2: document.getElementById('sett-phone2').value.trim(),
        email: document.getElementById('sett-email').value.trim(),
        stampImage: appState.settings.stampImage || ''
    };

    saveToLocalStorage();
    showToast('Company settings saved successfully', 'success');
    updateInvoiceView();
}

// --- Printing ---
function printInvoice() {
    const originalTitle = document.title;
    const invNumClean = (appState.currentInvoice.invoiceNumber || 'INVOICE').replace(/[^a-zA-Z0-9]/g, '_');
    document.title = `${invNumClean}_${appState.currentInvoice.customer.name.replace(/\s+/g, '_')}`;

    window.print();
    document.title = originalTitle;
}

// --- Helper Functions ---
function formatDateSlash(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

function showToast(message, type = 'info') {
    const container = document.getElementById('toast-box');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let icon = '';
    if(type === 'success') {
        icon = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" style="width:20px;height:20px;"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>`;
    } else if (type === 'error') {
        icon = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" style="width:20px;height:20px;"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>`;
    } else {
        icon = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" style="width:20px;height:20px;"><path stroke-linecap="round" stroke-linejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 111.063.852l-.708 2.836a.75.75 0 001.063.852l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`;
    }

    toast.innerHTML = `
        ${icon}
        <span>${message}</span>
    `;

    container.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('show');
    }, 100);

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 400);
    }, 3500);
}

// --- App Bootstrap ---
document.addEventListener('DOMContentLoaded', () => {
    loadFromLocalStorage();
    setupEventListeners();
    resetCurrentInvoice();
});
