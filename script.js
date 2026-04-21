const TRANSLATIONS = {
    en: {
        openButton: 'open',
        saveButton: 'save',
        clearButton: 'clear',
        clearConfirmation: 'Are you sure you want to clear the form? This action cannot be undone.',
        formatButton: 'format: ',
        copyButton: 'copy',
        themeButton: 'theme: ',
        themeAuto: 'auto',
        themeLight: 'light',
        themeDark: 'dark',

        documentTitle: 'Invoice',
        heading: 'Invoice',
        customerNamePlaceholder: 'Name',
        itemLabel: 'Item',
        qtyLabel: 'Qty',
        priceLabel: 'Price',
        sumLabel: 'Subtotal',
        itemNamePlaceholder: 'Item name',
        totalLabel: 'Total'
    },
    id: {
        openButton: 'buka',
        clearButton: 'hapus',
        clearConfirmation: 'Yakin ingin menghapus formulir? Tindakan ini tidak dapat dibatalkan.',
        saveButton: 'simpan',
        formatButton: 'format: ',
        copyButton: 'salin',
        themeButton: 'tema: ',
        themeAuto: 'otomatis',
        themeLight: 'terang',
        themeDark: 'gelap',

        documentTitle: 'Invoice',
        heading: 'Invoice',
        customerNamePlaceholder: 'Nama',
        itemLabel: 'Barang',
        qtyLabel: 'Jumlah',
        priceLabel: 'Harga',
        sumLabel: 'Subtotal',
        itemNamePlaceholder: 'Nama barang',
        totalLabel: 'Total'
    }
};

const browserLanguage = navigator.language.toLowerCase();
const languageCode = browserLanguage.split('-')[0];
const locale = browserLanguage in TRANSLATIONS ? browserLanguage : languageCode in TRANSLATIONS ? languageCode : 'en';
const messages = TRANSLATIONS[locale];
const numberFormatter = new Intl.NumberFormat(locale);
const STORAGE_KEY = 'invoice-form-data';
const THEME_STORAGE_KEY = 'invoice-theme';
const THEME_MODES = ['auto', 'light', 'dark'];
const THEME_META_CONTENT = {
    auto: 'dark light',
    light: 'light',
    dark: 'dark'
};

function createElement(tagName, options = {}) {
    const element = document.createElement(tagName);
    const {
        className,
        dataset,
        textContent,
        attributes,
        properties,
        children
    } = options;

    if (className) element.className = className;
    if (textContent !== undefined) element.textContent = textContent;

    if (dataset) {
        Object.entries(dataset).forEach(([key, value]) => {
            element.dataset[key] = value;
        });
    }

    if (attributes) {
        Object.entries(attributes).forEach(([key, value]) => {
            if (value !== undefined) element.setAttribute(key, value);
        });
    }

    if (properties) {
        Object.entries(properties).forEach(([key, value]) => {
            element[key] = value;
        });
    }

    if (children?.length) element.append(...children);

    return element;
}

function createToolbarButton(id, translationKey, { disabled = false } = {}) {
    return createElement('button', {
        dataset: { i18n: translationKey },
        textContent: TRANSLATIONS.en[translationKey],
        properties: { id, disabled }
    });
}

function createToolbarFieldset(buttonConfigs) {
    return createElement('fieldset', {
        children: buttonConfigs.map(({ id, translationKey, disabled }) =>
            createToolbarButton(id, translationKey, { disabled })
        )
    });
}

function createAppShell() {
    const toolbarGroups = [
        [
            { id: 'clear', translationKey: 'clearButton' },
            { id: 'open', translationKey: 'openButton', disabled: true },
            { id: 'save', translationKey: 'saveButton', disabled: true },
            { id: 'copy', translationKey: 'copyButton', disabled: true }
        ],
        [
            { id: 'format', translationKey: 'formatButton', disabled: true },
            { id: 'theme', translationKey: 'themeButton' }
        ]
    ];

    const customerFieldset = createElement('fieldset', {
        children: [
            createElement('input', {
                dataset: { i18nPlaceholder: 'customerNamePlaceholder' },
                attributes: {
                    type: 'text',
                    name: 'customer-name',
                    id: 'customer-name',
                    placeholder: TRANSLATIONS.en.customerNamePlaceholder,
                    autocomplete: 'name',
                    maxlength: '64',
                    autofocus: ''
                }
            }),
            createElement('input', {
                attributes: {
                    type: 'date',
                    name: 'order-date',
                    id: 'order-date'
                }
            })
        ]
    });

    const app = createElement('main', {
        children: [
            createElement('section', {
                children: [
                    createElement('h1', {
                        dataset: { i18n: 'heading' },
                        textContent: TRANSLATIONS.en.heading
                    }),
                    createElement('form', {
                        attributes: { autocomplete: 'on' },
                        children: [
                            customerFieldset,
                            createElement('table', {
                                properties: { id: 'invoice-table' }
                            })
                        ]
                    })
                ]
            })
        ]
    });

    const header = createElement('header', {
        children: [
            createElement('nav', {
                children: toolbarGroups.map((group) => createToolbarFieldset(group))
            })
        ]
    });

    document.body.replaceChildren(header, app);
}

createAppShell();

const clearButton = document.getElementById('clear');
const themeButton = document.getElementById('theme');
const colorSchemeMeta = document.querySelector('meta[name="color-scheme"]');

document.documentElement.lang = locale;

document.querySelectorAll('[data-i18n]').forEach((element) => {
    const key = element.dataset.i18n;
    const message = messages[key];
    if (!message) return;

    element.textContent = message;

    if (element.tagName === 'TITLE') {
        document.title = message;
    }
});

document.querySelectorAll('[data-i18n-placeholder]').forEach((element) => {
    const key = element.dataset.i18nPlaceholder;
    const message = messages[key];
    if (!message) return;

    element.placeholder = message;
});

function updateThemeButton(mode) {
    if (!themeButton) return;

    const modeLabel = messages[`theme${mode[0].toUpperCase()}${mode.slice(1)}`] ?? mode;
    themeButton.textContent = `${messages.themeButton}${modeLabel}`;
}

clearButton.addEventListener('click', () => {
    if (!confirm(messages.clearConfirmation)) {
        return;
    }

    localStorage.removeItem(STORAGE_KEY);
    restoreFormState(null);
    updateInvoiceTotal();
});

function setTheme(mode) {
    const nextTheme = THEME_MODES.includes(mode) ? mode : 'auto';
    const metaContent = THEME_META_CONTENT[nextTheme];

    if (colorSchemeMeta) {
        colorSchemeMeta.setAttribute('content', metaContent);
    }

    document.documentElement.style.colorScheme = metaContent;
    localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    updateThemeButton(nextTheme);
}

function toggleTheme() {
    const currentTheme = localStorage.getItem(THEME_STORAGE_KEY) || 'auto';
    const currentIndex = THEME_MODES.indexOf(currentTheme);
    const nextTheme = THEME_MODES[(currentIndex + 1) % THEME_MODES.length];

    setTheme(nextTheme);
}

themeButton?.addEventListener('click', toggleTheme);

const orderDate = document.getElementById('order-date');
if (orderDate) {
    orderDate.value = new Date().toISOString().split('T')[0];
}

const invoiceTable = document.getElementById('invoice-table');
const customerNameInput = document.getElementById('customer-name');
const ITEM_ROW_FIELDS = [
    {
        kind: 'input',
        key: 'item',
        name: 'item-name',
        type: 'text',
        maxLength: 32,
        className: 'data-text',
        autocomplete: 'on',
        placeholder: messages.itemNamePlaceholder,
        required: true
    },
    {
        kind: 'input',
        key: 'qty',
        type: 'text',
        className: 'data-number',
        placeholder: '0',
        inputMode: 'numeric',
        value: '1'
    },
    {
        kind: 'input',
        key: 'price',
        type: 'text',
        className: 'data-number',
        placeholder: '0',
        inputMode: 'numeric',
        value: '0'
    },
    {
        kind: 'output',
        key: 'sum',
        className: 'data-number',
        value: '0'
    }
];
const TABLE_HEADER_FIELDS = [
    { key: 'itemLabel', className: 'four-tenths data-text' },
    { key: 'qtyLabel', className: 'one-tenth data-number' },
    { key: 'priceLabel', className: 'two-tenths data-number' },
    { key: 'sumLabel', className: 'three-tenths data-number' }
];

let invoiceTableBody = null;

let lastFocusedInputId = null;
const getActiveInput = () => document.getElementById(lastFocusedInputId);
const sanitizeNumberInput = (value) => String(value ?? '').replace(/[^\d]/g, '');
const formatNumber = (value) => numberFormatter.format(Number(value) || 0);
const isFormattedNumberInput = (input) =>
    input instanceof HTMLInputElement && /^(qty|price)-/.test(input.id);
const getNumberValue = (input) => Number(sanitizeNumberInput(input?.value)) || 0;
const isTrackedInput = (target) => target instanceof HTMLInputElement && !!target.closest('form');
const isInteractiveControl = (target) =>
    target instanceof HTMLElement && !!target.closest('button, a, select, textarea, label');
const refocusActiveInput = () => getActiveInput()?.focus();
const focusAndSelectInput = (input) => {
    if (!(input instanceof HTMLInputElement)) return;

    input.focus();
    requestAnimationFrame(() => input.select());
};
const getItemRows = () =>
    invoiceTableBody
        ? [...invoiceTableBody.querySelectorAll('tr')].filter((row) => row.querySelector('td input'))
        : [];
const getFirstRowInput = (row) => row?.querySelector('td input');
const getRowField = (row, key, tagName = 'input') => row?.querySelector(`${tagName}[id^="${key}-"]`);
const getTotalOutput = () => document.getElementById('total');
const hasMeaningfulRowData = (rowData) =>
    !!rowData && [rowData.item, rowData.qty, rowData.price].some((value) => String(value ?? '').trim() !== '');
const createTextCell = (tagName, text, className) => {
    const cell = document.createElement(tagName);
    cell.textContent = text;
    if (className) cell.className = className;
    return cell;
};

function createCell(field, index) {
    const cell = document.createElement('td');
    const element = document.createElement(field.kind === 'output' ? 'output' : 'input');
    const cellId = `${field.key}-${index}`;

    element.name = field.name ?? cellId;
    element.id = cellId;
    element.className = field.className;

    if (field.kind === 'output') {
        element.textContent = field.value;
    } else {
        element.type = field.type;
        element.placeholder = field.placeholder;
        if (field.autocomplete !== undefined) element.autocomplete = field.autocomplete;
        element.required = !!field.required;
        if (field.maxLength !== undefined) element.maxLength = field.maxLength;
        if (field.inputMode !== undefined) element.inputMode = field.inputMode;
        if (field.min !== undefined) element.min = field.min;
        if (field.step !== undefined) element.step = field.step;
        if (field.value !== undefined) {
            element.value = isFormattedNumberInput(element) ? formatNumber(field.value) : field.value;
        }
    }

    cell.append(element);

    return cell;
}

function createHeaderRow() {
    const row = document.createElement('tr');

    TABLE_HEADER_FIELDS.forEach((field) => {
        const cell = createTextCell('th', messages[field.key], field.className);
        cell.scope = 'col';
        row.append(cell);
    });

    return row;
}

function createTotalRow() {
    const row = document.createElement('tr');
    const labelCell = createTextCell('th', messages.totalLabel, 'data-number');
    const valueCell = document.createElement('td');
    const totalOutput = document.createElement('output');

    labelCell.colSpan = 3;
    totalOutput.name = 'total';
    totalOutput.id = 'total';
    totalOutput.className = 'data-number';
    totalOutput.textContent = '0';

    valueCell.append(totalOutput);
    row.append(labelCell, valueCell);

    return row;
}

function initializeInvoiceTable() {
    if (!invoiceTable) return;

    const header = document.createElement('thead');
    const body = document.createElement('tbody');

    header.append(createHeaderRow());
    body.append(createTotalRow());
    invoiceTable.replaceChildren(header, body);
    invoiceTableBody = body;
    appendItemRow();
}

function appendItemRow(rowData = {}) {
    const nextIndex = getItemRows().length + 1;
    const row = document.createElement('tr');

    row.append(
        ...ITEM_ROW_FIELDS.map((field) =>
            createCell(
                field.kind === 'input' && rowData[field.key] !== undefined
                    ? { ...field, value: rowData[field.key] }
                    : field,
                nextIndex
            )
        )
    );

    invoiceTableBody?.lastElementChild?.before(row);

    return row;
}

function collectFormState() {
    return {
        customerName: customerNameInput?.value ?? '',
        orderDate: orderDate?.value ?? '',
        rows: getItemRows().map((row) => ({
            item: getRowField(row, 'item')?.value ?? '',
            qty: sanitizeNumberInput(getRowField(row, 'qty')?.value),
            price: sanitizeNumberInput(getRowField(row, 'price')?.value)
        }))
    };
}

function saveFormState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(collectFormState()));
}

function loadFormState() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null');
    } catch {
        return null;
    }
}

function restoreFormState(savedState) {
    if (!invoiceTableBody) return;

    if (customerNameInput) {
        customerNameInput.value =
            savedState && typeof savedState.customerName === 'string' ? savedState.customerName : '';
    }

    if (orderDate) {
        orderDate.value =
            savedState && typeof savedState.orderDate === 'string' && savedState.orderDate
                ? savedState.orderDate
                : new Date().toISOString().split('T')[0];
    }

    const savedRows =
        savedState && Array.isArray(savedState.rows) ? savedState.rows.filter(hasMeaningfulRowData) : [];

    getItemRows().forEach((row) => row.remove());

    if (!savedRows.length) {
        const firstRow = appendItemRow();
        const firstInput = customerNameInput ?? getFirstRowInput(firstRow);

        if (firstInput) {
            lastFocusedInputId = firstInput.id;
            requestAnimationFrame(() => focusAndSelectInput(firstInput));
        }

        return;
    }

    savedRows.forEach((rowData) => appendItemRow(rowData));
}

function updateRowSubtotal(row) {
    const quantity = getNumberValue(getRowField(row, 'qty'));
    const price = getNumberValue(getRowField(row, 'price'));
    const subtotal = quantity * price;
    const subtotalOutput = getRowField(row, 'sum', 'output');

    if (subtotalOutput) subtotalOutput.textContent = formatNumber(subtotal);

    return subtotal;
}

function updateInvoiceTotal() {
    const total = getItemRows().reduce((sum, row) => sum + updateRowSubtotal(row), 0);
    const totalOutput = getTotalOutput();

    if (totalOutput) totalOutput.textContent = formatNumber(total);
}

function focusNextRowInput(input) {
    const row = input.closest('tr');
    if (!row) return;

    const itemRows = getItemRows();
    const rowIndex = itemRows.indexOf(row);
    const nextRow = itemRows[rowIndex + 1] ?? getOrAppendNextRow(row);
    focusAndSelectInput(getFirstRowInput(nextRow));
}

function focusPreviousRowInput(input) {
    const row = input.closest('tr');
    if (!row) return;

    const itemRows = getItemRows();
    const rowIndex = itemRows.indexOf(row);
    const previousRow = itemRows[rowIndex - 1];
    if (!previousRow) return;

    focusAndSelectInput(getFirstRowInput(previousRow));
}

function focusNextField(input) {
    const row = input.closest('tr');
    if (!row) return;

    const itemNameInput = getRowField(row, 'item');
    if (input === itemNameInput && !itemNameInput.reportValidity()) {
        return;
    }

    const inputs = [...row.querySelectorAll('input')];
    const inputIndex = inputs.indexOf(input);
    const nextInput = inputs[inputIndex + 1];

    if (nextInput) {
        focusAndSelectInput(nextInput);
        return;
    }

    focusNextRowInput(input);
}

function getOrAppendNextRow(row) {
    const itemRows = getItemRows();
    const rowIndex = itemRows.indexOf(row);
    const existingNextRow = itemRows[rowIndex + 1];
    if (existingNextRow) return existingNextRow;

    const itemNameInput = getRowField(row, 'item');
    if (!itemNameInput?.reportValidity()) {
        return row;
    }

    return appendItemRow();
}

initializeInvoiceTable();
setTheme(localStorage.getItem(THEME_STORAGE_KEY) || 'auto');
restoreFormState(loadFormState());
updateInvoiceTotal();
saveFormState();

document.addEventListener('focusin', ({ target }) => {
    if (isTrackedInput(target)) lastFocusedInputId = target.id;

    if (isFormattedNumberInput(target)) {
        target.value = sanitizeNumberInput(target.value);
    }
});

document.addEventListener('pointerdown', (event) => {
    if (!lastFocusedInputId || isTrackedInput(event.target) || isInteractiveControl(event.target)) return;

    event.preventDefault();
    refocusActiveInput();
}, true);

document.addEventListener('focusout', (event) => {
    if (!isTrackedInput(event.target)) return;
    if (!lastFocusedInputId || isTrackedInput(event.relatedTarget)) return;

    requestAnimationFrame(refocusActiveInput);
});

window.addEventListener('focus', () => {
    if (!lastFocusedInputId) return;

    requestAnimationFrame(refocusActiveInput);
});

document.addEventListener('input', (event) => {
    if (!(event.target instanceof HTMLInputElement)) return;
    if (!event.target.closest('td')) return;

    if (isFormattedNumberInput(event.target)) {
        event.target.value = sanitizeNumberInput(event.target.value);
    }

    updateInvoiceTotal();
    saveFormState();
});

document.addEventListener('input', (event) => {
    if (!(event.target instanceof HTMLInputElement)) return;
    if (!event.target.closest('form')) return;

    if (event.target.closest('td')) return;

    saveFormState();
});

document.addEventListener('focusout', ({ target }) => {
    if (!isFormattedNumberInput(target)) return;

    target.value = formatNumber(target.value);
    saveFormState();
});

document.addEventListener('keydown', (event) => {
    if (!(event.target instanceof HTMLInputElement)) return;

    if (event.key === 'Enter') {
        event.preventDefault();

        if (event.target.closest('td')) {
            if (event.shiftKey) {
                focusPreviousRowInput(event.target);
                return;
            }

            focusNextRowInput(event.target);
            return;
        }

        const firstItemInput = getFirstRowInput(getItemRows()[0]) ?? getFirstRowInput(appendItemRow());
        focusAndSelectInput(firstItemInput);
    }

    if (event.key === 'Tab' && !event.shiftKey && event.target.closest('td')) {
        event.preventDefault();
        focusNextField(event.target);
    }
});
