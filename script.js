const TRANSLATIONS = {
    en: {
        openButton: 'open',
        saveButton: 'save',
        clearButton: 'clear',
        clearConfirmation: 'Are you sure you want to clear the form? This action cannot be undone.',
        formatButton: 'format: ',
        formatPng: 'png',
        copyButton: 'copy',
        copySuccess: 'Copied as PNG.',
        copyUnsupported: 'Copy as PNG is not supported in this browser. Downloading instead.',
        copyFailed: 'Copy failed. Downloading instead.',
        copyRenderFailed: 'Could not render the invoice as a PNG image.',
        copyDownloadSuccess: 'Clipboard copy was unavailable, so the PNG was downloaded instead.',
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
        formatPng: 'png',
        copyButton: 'salin',
        copySuccess: 'Tersalin sebagai PNG.',
        copyUnsupported: 'Salin sebagai PNG tidak didukung di browser ini. Mengunduh sebagai gantinya.',
        copyFailed: 'Gagal menyalin. Mengunduh sebagai gantinya.',
        copyRenderFailed: 'Tidak dapat merender invoice sebagai gambar PNG.',
        copyDownloadSuccess: 'Salin ke clipboard tidak tersedia, jadi PNG diunduh sebagai gantinya.',
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
const COPY_FORMAT_STORAGE_KEY = 'invoice-copy-format';
const THEME_MODES = ['auto', 'light', 'dark'];
const THEME_META_CONTENT = {
    auto: 'dark light',
    light: 'light',
    dark: 'dark'
};
const COPY_FORMATS = ['png'];

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
            { id: 'copy', translationKey: 'copyButton' }
        ],
        [
            { id: 'format', translationKey: 'formatButton' },
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
const copyButton = document.getElementById('copy');
const formatButton = document.getElementById('format');
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

function updateFormatButton(format) {
    if (!formatButton) return;

    const formatLabel = messages[`format${format[0].toUpperCase()}${format.slice(1)}`] ?? format;
    formatButton.textContent = `${messages.formatButton}${formatLabel}`;
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

function setCopyFormat(format) {
    const nextFormat = COPY_FORMATS.includes(format) ? format : COPY_FORMATS[0];
    localStorage.setItem(COPY_FORMAT_STORAGE_KEY, nextFormat);
    updateFormatButton(nextFormat);
}

function toggleCopyFormat() {
    const currentFormat = localStorage.getItem(COPY_FORMAT_STORAGE_KEY) || COPY_FORMATS[0];
    const currentIndex = COPY_FORMATS.indexOf(currentFormat);
    const nextFormat = COPY_FORMATS[(currentIndex + 1) % COPY_FORMATS.length];

    setCopyFormat(nextFormat);
}

async function renderSectionToBlob(type) {
    const formState = collectFormState();
    const rows = formState.rows.filter(hasMeaningfulRowData);
    const section = document.querySelector('main section');
    const sectionStyles = section instanceof HTMLElement ? getComputedStyle(section) : null;
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) return null;

    const pageWidth = 794;
    const padding = 40;
    const rowHeight = 32;
    const headerHeight = 28;
    const titleHeight = 42;
    const metaHeight = 32;
    const totalHeight = 40;
    const contentRows = Math.max(rows.length, 1);
    const pageHeight =
        padding * 2 + titleHeight + metaHeight + headerHeight + contentRows * rowHeight + totalHeight;
    const columnWidths = [0.4, 0.1, 0.2, 0.3].map((fraction) => Math.round((pageWidth - padding * 2) * fraction));
    const columnOffsets = columnWidths.reduce((offsets, width, index) => {
        const previousOffset = offsets[index - 1] ?? padding;
        offsets.push(index === 0 ? padding : previousOffset + columnWidths[index - 1]);
        return offsets;
    }, []);
    const textColor = sectionStyles?.color || '#000000';
    const borderColor = sectionStyles?.borderColor || '#000000';
    const backgroundColor = sectionStyles?.backgroundColor || '#ffffff';
    const mutedColor = '#666666';

    canvas.width = pageWidth;
    canvas.height = pageHeight;

    console.log('Rendering invoice section to blob.', {
        type,
        width: pageWidth,
        height: pageHeight,
        rowCount: rows.length
    });

    context.fillStyle = backgroundColor;
    context.fillRect(0, 0, pageWidth, pageHeight);
    context.strokeStyle = borderColor;
    context.lineWidth = 1;
    context.strokeRect(0.5, 0.5, pageWidth - 1, pageHeight - 1);

    let y = padding;

    context.fillStyle = textColor;
    context.font = '700 24px Arial';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(messages.heading, pageWidth / 2, y + titleHeight / 2);
    y += titleHeight;

    context.font = '16px Arial';
    context.textAlign = 'left';
    context.fillText((formState.customerName || messages.customerNamePlaceholder).toUpperCase(), padding, y + metaHeight / 2);
    context.textAlign = 'right';
    context.fillText(formState.orderDate || '', pageWidth - padding, y + metaHeight / 2);
    y += metaHeight;

    context.beginPath();
    context.moveTo(padding, y);
    context.lineTo(pageWidth - padding, y);
    context.stroke();

    context.font = '700 14px Arial';
    context.fillStyle = textColor;
    context.textAlign = 'left';
    context.fillText(messages.itemLabel, columnOffsets[0] + 8, y + headerHeight / 2);
    context.textAlign = 'right';
    context.fillText(messages.qtyLabel, columnOffsets[1] + columnWidths[1] - 8, y + headerHeight / 2);
    context.fillText(messages.priceLabel, columnOffsets[2] + columnWidths[2] - 8, y + headerHeight / 2);
    context.fillText(messages.sumLabel, columnOffsets[3] + columnWidths[3] - 8, y + headerHeight / 2);
    y += headerHeight;

    context.beginPath();
    context.moveTo(padding, y);
    context.lineTo(pageWidth - padding, y);
    context.stroke();

    context.font = '14px Arial';
    rows.concat(rows.length ? [] : [{ item: '', qty: '1', price: '0' }]).forEach((row) => {
        const quantity = Number(row.qty || 0);
        const price = Number(row.price || 0);
        const subtotal = quantity * price;

        context.fillStyle = textColor;
        context.textAlign = 'left';
        context.fillText((row.item || '').toUpperCase(), columnOffsets[0] + 8, y + rowHeight / 2);
        context.textAlign = 'right';
        context.fillText(formatNumber(quantity), columnOffsets[1] + columnWidths[1] - 8, y + rowHeight / 2);
        context.fillText(formatNumber(price), columnOffsets[2] + columnWidths[2] - 8, y + rowHeight / 2);
        context.fillText(formatNumber(subtotal), columnOffsets[3] + columnWidths[3] - 8, y + rowHeight / 2);

        context.strokeStyle = mutedColor;
        context.beginPath();
        context.moveTo(padding, y + rowHeight);
        context.lineTo(pageWidth - padding, y + rowHeight);
        context.stroke();

        y += rowHeight;
    });

    const total = rows.reduce((sum, row) => sum + Number(row.qty || 0) * Number(row.price || 0), 0);
    context.font = '700 16px Arial';
    context.fillStyle = textColor;
    context.textAlign = 'right';
    context.fillText(messages.totalLabel, columnOffsets[2] + columnWidths[2] - 8, y + totalHeight / 2);
    context.fillText(formatNumber(total), columnOffsets[3] + columnWidths[3] - 8, y + totalHeight / 2);

    return await new Promise((resolve) => {
        canvas.toBlob(resolve, type, 0.95);
    });
}

function downloadBlob(blob, extension) {
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = objectUrl;
    link.download = `invoice.${extension}`;
    link.click();

    setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
}

async function copySectionAsImage() {
    const format = localStorage.getItem(COPY_FORMAT_STORAGE_KEY) || COPY_FORMATS[0];
    const mimeType = `image/${format}`;
    const extension = format;

    let blob;

    try {
        blob = await renderSectionToBlob(mimeType);
        if (!blob) {
            console.error('Invoice render returned no blob.', { format, mimeType });
            alert(messages.copyRenderFailed);
            return;
        }
        console.log('Invoice blob rendered successfully.', { format, mimeType, size: blob.size });
    } catch {
        console.error('Invoice render failed.', { format, mimeType });
        alert(messages.copyRenderFailed);
        return;
    }

    if (!navigator.clipboard?.write || typeof ClipboardItem === 'undefined') {
        console.warn('Clipboard image write unsupported, falling back to download.', { format, mimeType });
        downloadBlob(blob, extension);
        alert(messages.copyUnsupported);
        return;
    }

    try {
        console.log('Attempting clipboard image write.', { format, mimeType, size: blob.size });
        await navigator.clipboard.write([
            new ClipboardItem({ [mimeType]: blob })
        ]);

        console.log('Clipboard image write succeeded.', { format, mimeType });
        alert(messages.copySuccess);
    } catch {
        console.error('Clipboard image write failed, falling back to download.', { format, mimeType });
        downloadBlob(blob, extension);
        alert(`${messages.copyFailed}\n${messages.copyDownloadSuccess}`);
    }
}

formatButton?.addEventListener('click', toggleCopyFormat);
copyButton?.addEventListener('click', () => {
    void copySectionAsImage();
});

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
const stepNumberInput = (input, delta) => {
    if (!isFormattedNumberInput(input)) return;

    const nextValue = Math.max(0, getNumberValue(input) + delta);
    input.value = String(nextValue);
    updateInvoiceTotal();
    saveFormState();
};
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
setCopyFormat(localStorage.getItem(COPY_FORMAT_STORAGE_KEY) || COPY_FORMATS[0]);
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

document.addEventListener('wheel', (event) => {
    if (!isFormattedNumberInput(event.target)) return;
    if (document.activeElement !== event.target) return;

    event.preventDefault();
    stepNumberInput(event.target, event.deltaY < 0 ? 1 : -1);
}, { passive: false });

document.addEventListener('keydown', (event) => {
    if (!(event.target instanceof HTMLInputElement)) return;

    if (isFormattedNumberInput(event.target) && (event.key === 'ArrowUp' || event.key === 'ArrowDown')) {
        event.preventDefault();
        stepNumberInput(event.target, event.key === 'ArrowUp' ? 1 : -1);
        return;
    }

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
