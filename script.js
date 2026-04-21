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

function resolveThemeColors() {
    const probe = document.createElement('div');
    probe.style.backgroundColor = 'canvas';
    probe.style.color = 'canvasText';
    probe.style.border = '1px solid canvasText';
    probe.style.position = 'fixed';
    probe.style.pointerEvents = 'none';
    probe.style.opacity = '0';
    document.body.append(probe);

    const styles = getComputedStyle(probe);
    const colors = {
        backgroundColor: styles.backgroundColor,
        textColor: styles.color,
        borderColor: styles.borderTopColor
    };

    probe.remove();

    return colors;
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
    const heading = section?.querySelector('h1');
    const form = section?.querySelector('form');
    const customerFieldset = form?.querySelector('fieldset');
    const table = form?.querySelector('table');
    const firstHeaderCell = table?.querySelector('th');
    const firstItemRow = getItemRows()[0];
    const firstItemInput = getRowField(firstItemRow, 'item');
    const firstQtyInput = getRowField(firstItemRow, 'qty');
    const firstPriceInput = getRowField(firstItemRow, 'price');
    const totalOutput = getTotalOutput();
    const rootStyles = getComputedStyle(document.body);
    const headingStyles = heading ? getComputedStyle(heading) : rootStyles;
    const fieldsetStyles = customerFieldset ? getComputedStyle(customerFieldset) : rootStyles;
    const tableStyles = table ? getComputedStyle(table) : rootStyles;
    const headerCellStyles = firstHeaderCell ? getComputedStyle(firstHeaderCell) : tableStyles;
    const itemInputStyles = firstItemInput ? getComputedStyle(firstItemInput) : rootStyles;
    const qtyInputStyles = firstQtyInput ? getComputedStyle(firstQtyInput) : rootStyles;
    const priceInputStyles = firstPriceInput ? getComputedStyle(firstPriceInput) : rootStyles;
    const totalOutputStyles = totalOutput ? getComputedStyle(totalOutput) : rootStyles;
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) return null;
    const parsePixels = (value, fallback = 0) => Number.parseFloat(value) || fallback;
    const buildFont = (styles, fallbackWeight = '400') => {
        const fontStyle = styles?.fontStyle || 'normal';
        const fontVariant = styles?.fontVariant || 'normal';
        const fontWeight = styles?.fontWeight || fallbackWeight;
        const fontSize = styles?.fontSize || '16px';
        const lineHeight = styles?.lineHeight && styles.lineHeight !== 'normal'
            ? `/${styles.lineHeight}`
            : '';
        const fontFamily = styles?.fontFamily || 'monospace';

        return `${fontStyle} ${fontVariant} ${fontWeight} ${fontSize}${lineHeight} ${fontFamily}`;
    };
    const pageWidth = section instanceof HTMLElement ? section.offsetWidth : 794;
    const sectionPadding = parsePixels(sectionStyles?.paddingTop, 40);
    const sectionGap = parsePixels(sectionStyles?.gap, 24);
    const fieldHorizontalPadding = parsePixels(itemInputStyles.paddingLeft, 8);
    const titleHeight = parsePixels(headingStyles.lineHeight, parsePixels(headingStyles.fontSize, 24) * 1.2);
    const metaHeight = Math.max(
        parsePixels(itemInputStyles.lineHeight, parsePixels(itemInputStyles.fontSize, 16) * 1.2) +
            parsePixels(itemInputStyles.paddingTop, 8) +
            parsePixels(itemInputStyles.paddingBottom, 8),
        parsePixels(fieldsetStyles.lineHeight, 32)
    );
    const headerHeight =
        parsePixels(headerCellStyles.lineHeight, parsePixels(headerCellStyles.fontSize, 14) * 1.2) +
        parsePixels(headerCellStyles.paddingTop, 8) +
        parsePixels(headerCellStyles.paddingBottom, 8);
    const rowHeight = Math.max(
        parsePixels(itemInputStyles.lineHeight, parsePixels(itemInputStyles.fontSize, 14) * 1.2) +
            parsePixels(itemInputStyles.paddingTop, 8) +
            parsePixels(itemInputStyles.paddingBottom, 8),
        34
    );
    const totalHeight = Math.max(
        parsePixels(totalOutputStyles.lineHeight, parsePixels(totalOutputStyles.fontSize, 16) * 1.2) +
            parsePixels(totalOutputStyles.paddingTop, 8) +
            parsePixels(totalOutputStyles.paddingBottom, 8),
        40
    );
    const horizontalPadding = parsePixels(sectionStyles?.paddingLeft, sectionPadding);
    const bottomPadding = parsePixels(sectionStyles?.paddingBottom, sectionPadding);
    const headerHorizontalPadding = parsePixels(headerCellStyles.paddingLeft, 16);
    const bodyHorizontalPadding = 8;
    const renderRows = rows.length ? rows : [];
    const contentRows = renderRows.length;
    const pageHeight =
        sectionPadding +
        titleHeight +
        sectionGap +
        metaHeight +
        sectionGap +
        headerHeight +
        contentRows * rowHeight +
        (contentRows ? 1 : 0) +
        totalHeight +
        bottomPadding;
    const tableWidth = pageWidth - horizontalPadding * 2;
    const columnWidths = [0.4, 0.1, 0.2, 0.3].map((fraction) => tableWidth * fraction);
    const columnLefts = columnWidths.reduce((positions, width, index) => {
        positions.push(index === 0 ? horizontalPadding : positions[index - 1] + columnWidths[index - 1]);
        return positions;
    }, []);
    const tableRight = pageWidth - horizontalPadding;
    const themeColors = resolveThemeColors();
    const backgroundColor = themeColors.backgroundColor || '#ffffff';
    const textColor = themeColors.textColor || '#000000';
    const borderColor = themeColors.borderColor || textColor;
    const gridColor = textColor;
    const fieldBackgroundColor = itemInputStyles.backgroundColor || backgroundColor;
    const pixelRatio = window.devicePixelRatio || 1;
    canvas.width = Math.round(pageWidth * pixelRatio);
    canvas.height = Math.round(pageHeight * pixelRatio);
    context.scale(pixelRatio, pixelRatio);

    const snapEdge = (value) => Math.round(value * pixelRatio) / pixelRatio;
    const devicePixel = 1 / pixelRatio;
    const drawFieldBackground = (x, top, width, height) => {
        const left = snapEdge(x);
        const right = snapEdge(x + width);
        const snappedTop = snapEdge(top);
        const bottom = snapEdge(top + height);

        context.fillStyle = fieldBackgroundColor;
        context.fillRect(left, snappedTop, right - left, bottom - snappedTop);
    };
    const drawHorizontalLine = (yPosition, startX = horizontalPadding, endX = tableRight) => {
        const left = snapEdge(startX);
        const right = snapEdge(endX);
        const top = snapEdge(yPosition);

        context.fillStyle = gridColor;
        context.fillRect(left, top, right - left, devicePixel);
    };
    const drawVerticalLines = (top, height, boundaries = [horizontalPadding, ...columnLefts.slice(1), tableRight]) => {
        const snappedTop = snapEdge(top);
        const snappedBottom = snapEdge(top + height);

        boundaries.forEach((x) => {
            const left = snapEdge(x);
            context.fillStyle = gridColor;
            context.fillRect(left, snappedTop, devicePixel, snappedBottom - snappedTop);
        });
    };

    context.fillStyle = backgroundColor;
    context.fillRect(0, 0, pageWidth, pageHeight);
    context.fillStyle = borderColor;
    context.fillRect(0, 0, snapEdge(pageWidth), devicePixel);
    context.fillRect(0, snapEdge(pageHeight) - devicePixel, snapEdge(pageWidth), devicePixel);
    context.fillRect(0, 0, devicePixel, snapEdge(pageHeight));
    context.fillRect(snapEdge(pageWidth) - devicePixel, 0, devicePixel, snapEdge(pageHeight));

    let y = sectionPadding;
    const customerName = formState.customerName.trim();

    context.fillStyle = textColor;
    context.textBaseline = 'middle';
    context.textAlign = 'center';
    context.font = buildFont(headingStyles, '700');
    context.fillText(messages.heading, pageWidth / 2, y + titleHeight / 2);
    y += titleHeight + sectionGap;

    context.font = buildFont(itemInputStyles);
    context.textAlign = 'left';
    if (customerName) {
        context.fillText(
            customerName.toUpperCase(),
            horizontalPadding + fieldHorizontalPadding,
            y + metaHeight / 2
        );
    }
    context.textAlign = 'right';
    context.fillText(formatDate(formState.orderDate), tableRight - fieldHorizontalPadding, y + metaHeight / 2);
    y += metaHeight + sectionGap;

    context.font = buildFont(headerCellStyles, '700');
    context.fillStyle = textColor;
    context.textAlign = 'left';
    context.fillText(messages.itemLabel, columnLefts[0] + headerHorizontalPadding, y + headerHeight / 2);
    context.textAlign = 'right';
    context.fillText(messages.qtyLabel, columnLefts[1] + columnWidths[1] - headerHorizontalPadding, y + headerHeight / 2);
    context.fillText(messages.priceLabel, columnLefts[2] + columnWidths[2] - headerHorizontalPadding, y + headerHeight / 2);
    context.fillText(messages.sumLabel, columnLefts[3] + columnWidths[3] - headerHorizontalPadding, y + headerHeight / 2);
    y = snapEdge(y + headerHeight);
    const tableBodyTop = y;

    context.font = buildFont(itemInputStyles);

    renderRows.forEach((row) => {
        const quantity = Number(row.qty || 0);
        const price = Number(row.price || 0);
        const subtotal = quantity * price;
        const cellTop = snapEdge(y);
        const cellBottom = snapEdge(y + rowHeight);
        const snappedRowHeight = cellBottom - cellTop;
        const cellMiddle = cellTop + snappedRowHeight / 2;

        columnWidths.forEach((width, index) => {
            drawFieldBackground(columnLefts[index], cellTop, width, snappedRowHeight);
        });

        drawVerticalLines(cellTop, snappedRowHeight);

        context.fillStyle = textColor;
        context.textAlign = 'left';
        context.fillText((row.item || '').toUpperCase(), columnLefts[0] + bodyHorizontalPadding, cellMiddle);

        context.textAlign = 'right';
        context.fillText(formatNumber(quantity), columnLefts[1] + columnWidths[1] - bodyHorizontalPadding, cellMiddle);
        context.fillText(formatNumber(price), columnLefts[2] + columnWidths[2] - bodyHorizontalPadding, cellMiddle);
        context.fillText(formatNumber(subtotal), columnLefts[3] + columnWidths[3] - bodyHorizontalPadding, cellMiddle);

        drawHorizontalLine(cellBottom);

        y = cellBottom;
    });

    const total = rows.reduce((sum, row) => sum + Number(row.qty || 0) * Number(row.price || 0), 0);
    const totalTop = snapEdge(y);
    const totalBottom = snapEdge(y + totalHeight);
    const snappedTotalHeight = totalBottom - totalTop;
    const totalMiddle = totalTop + snappedTotalHeight / 2;
    context.font = buildFont(totalOutputStyles, '700');
    context.fillStyle = textColor;
    context.textAlign = 'right';
    context.fillText(messages.totalLabel, columnLefts[3] - bodyHorizontalPadding, totalMiddle);
    drawFieldBackground(columnLefts[3], totalTop, columnWidths[3], snappedTotalHeight);
    context.fillStyle = textColor;
    context.fillText(formatNumber(total), columnLefts[3] + columnWidths[3] - bodyHorizontalPadding, totalMiddle);

    drawHorizontalLine(tableBodyTop);
    renderRows.forEach((_, index) => {
        const rowBottom = snapEdge(tableBodyTop + rowHeight * (index + 1));
        drawHorizontalLine(rowBottom);
    });
    drawVerticalLines(totalTop, snappedTotalHeight, [columnLefts[3], tableRight]);
    drawHorizontalLine(totalBottom, columnLefts[3], tableRight);

    return await new Promise((resolve, reject) => {
        try {
            canvas.toBlob((blob) => {
                if (!blob) {
                    reject(new Error(`Canvas blob generation returned null for ${type}.`));
                    return;
                }
                resolve(blob);
            }, type);
        } catch (error) {
            reject(error);
        }
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
    } catch (error) {
        console.error('Invoice render failed.', {
            error,
            format,
            mimeType,
            customerName: customerNameInput?.value ?? '',
            orderDate: orderDate?.value ?? '',
            rowCount: getItemRows().length
        });
        alert(messages.copyRenderFailed);
        return;
    }

    if (!navigator.clipboard?.write || typeof ClipboardItem === 'undefined') {
        console.error('Clipboard image write unsupported, falling back to download.', { format, mimeType });
        downloadBlob(blob, extension);
        alert(messages.copyUnsupported);
        return;
    }

    try {
        await navigator.clipboard.write([
            new ClipboardItem({ [mimeType]: blob })
        ]);

        alert(messages.copySuccess);
    } catch (error) {
        console.error('Clipboard image write failed, falling back to download.', {
            error,
            format,
            mimeType,
            blobSize: blob.size,
            clipboardWriteAvailable: !!navigator.clipboard?.write,
            clipboardItemAvailable: typeof ClipboardItem !== 'undefined'
        });
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
const formatDate = (value) => {
    if (!value) return '';

    const [year, month, day] = String(value).split('-');
    if (!year || !month || !day) return value;

    return `${day}/${month}/${year}`;
};
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
