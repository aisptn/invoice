const TRANSLATIONS = {
    en: {
        openButton: 'open',
        openSuccess: 'opened!',
        openPrompt: 'overwrite?',
        saveButton: 'save',
        saveSuccess: 'saved!',
        clearButton: 'clear',
        clearPrompt: 'clear?',
        clearSuccess: 'cleared!',
        formatButton: 'format: ',
        formatJson: 'json',
        formatPng: 'png',
        copyButton: 'copy',
        copySuccess: 'copied!',
        copyUnavailable: 'unsupported',
        copyError: 'failed',
        copyDisabled: 'copy unavailable for ',
        languageButton: 'lang: ',
        languageAuto: 'auto',
        languageEn: 'en',
        languageId: 'id',
        themeButton: 'theme: ',
        themeAuto: 'auto',
        themeLight: 'light',
        themeDark: 'dark',

        documentTitle: 'Invoice',
        heading: 'Invoice',
        headingTooltip: '',
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
        openSuccess: 'terbuka!',
        openPrompt: 'timpa?',
        clearButton: 'hapus',
        clearPrompt: 'hapus?',
        clearSuccess: 'terhapus!',
        saveButton: 'simpan',
        saveSuccess: 'tersimpan!',
        formatButton: 'format: ',
        formatJson: 'json',
        formatPng: 'png',
        copyButton: 'salin',
        copySuccess: 'tersalin!',
        copyUnavailable: 'tidak didukung',
        copyError: 'gagal',
        copyDisabled: 'salin tidak tersedia untuk ',
        languageButton: 'bahasa: ',
        languageAuto: 'otomatis',
        languageEn: 'en',
        languageId: 'id',
        themeButton: 'tema: ',
        themeAuto: 'otomatis',
        themeLight: 'terang',
        themeDark: 'gelap',

        documentTitle: 'Invoice',
        heading: 'Invoice',
        headingTooltip: 'terjemahan: faktur',
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
const LANGUAGE_STORAGE_KEY = 'invoice-language';
const LANGUAGE_MODES = ['auto', 'en', 'id'];
const resolveLocale = (mode) => {
    if (mode === 'en' || mode === 'id') return mode;
    return browserLanguage in TRANSLATIONS ? browserLanguage : languageCode in TRANSLATIONS ? languageCode : 'en';
};
let locale = resolveLocale('auto');
let messages = TRANSLATIONS[locale];
let numberFormatter = new Intl.NumberFormat(locale);
const STORAGE_KEY = 'invoice-form-data';
const THEME_STORAGE_KEY = 'invoice-theme';
const COPY_FORMAT_STORAGE_KEY = 'invoice-copy-format';
const THEME_MODES = ['auto', 'light', 'dark'];
const THEME_META_CONTENT = {
    auto: 'dark light',
    light: 'light',
    dark: 'dark'
};
const COPY_FORMATS = ['png', 'json'];
const unsupportedCopyFormats = new Set();
const EMPTY_COPY_DEBUG = {
    getCause() {
        return null;
    },
    isUnsupported() {
        return false;
    }
};

// Debug copy behavior: removable test-only block for forcing specific copy outcomes.
globalThis.__INVOICE_COPY_DEBUG__ = (() => {
    const searchParams = new URLSearchParams(window.location.search);
    const causes = new Set(['unsupported', 'failed', 'render-failed']);
    const behavior = new Map(
        (searchParams.get('debugCopy') || searchParams.get('debugCopyUnsupported') || '')
            .split(',')
            .map((entry) => entry.trim().toLowerCase())
            .map((entry) => {
                const [format, cause = 'unsupported'] = entry.split(':');
                return [format, cause];
            })
            .filter(([format, cause]) => COPY_FORMATS.includes(format) && causes.has(cause))
    );

    return {
        getCause(format) {
            return behavior.get(format) || null;
        },
        isUnsupported(format) {
            return behavior.get(format) === 'unsupported';
        }
    };
})();

function shouldForceUnsupportedCopyFormat(format) {
    return (globalThis.__INVOICE_COPY_DEBUG__ || EMPTY_COPY_DEBUG).isUnsupported(format);
}

function getDebugCopyCause(format) {
    return (globalThis.__INVOICE_COPY_DEBUG__ || EMPTY_COPY_DEBUG).getCause(format);
}

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
            { id: 'open', translationKey: 'openButton' },
            { id: 'save', translationKey: 'saveButton' },
            { id: 'copy', translationKey: 'copyButton' }
        ],
        [
            { id: 'format', translationKey: 'formatButton' },
            { id: 'language', translationKey: 'languageButton' },
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
                        dataset: { i18n: 'heading', i18nTitle: 'headingTooltip' },
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
const openButton = document.getElementById('open');
const saveButton = document.getElementById('save');
const copyButton = document.getElementById('copy');
const formatButton = document.getElementById('format');
const languageButton = document.getElementById('language');
const themeButton = document.getElementById('theme');
const colorSchemeMeta = document.querySelector('meta[name="color-scheme"]');
let activeConfirmationButton = null;
const openFileInput = createElement('input', {
    attributes: {
        type: 'file',
        accept: 'application/json,.json'
    },
    properties: {
        hidden: true
    }
});

document.body.append(openFileInput);

function updateLanguageButton(mode) {
    if (!languageButton) return;

    const modeLabel = messages[`language${mode[0].toUpperCase()}${mode.slice(1)}`] ?? mode;
    languageButton.textContent = `${messages.languageButton}${modeLabel}`;
}

function applyTranslations() {
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

    document.querySelectorAll('[data-i18n-title]').forEach((element) => {
        const key = element.dataset.i18nTitle;
        const message = messages[key];

        if (!message) {
            element.removeAttribute('title');
            return;
        }

        element.title = message;
    });

    document.querySelectorAll('#invoice-table thead th[data-header-key]').forEach((element) => {
        const key = element.dataset.headerKey;
        const message = messages[key];
        if (message) {
            element.textContent = message;
        }
    });

    document.querySelectorAll('#invoice-table tbody tr td input[id^=\"item-\"]').forEach((element) => {
        element.placeholder = messages.itemNamePlaceholder;
    });

    const totalLabel = document.querySelector('#invoice-table tbody tr th[data-total-label]');
    if (totalLabel) {
        totalLabel.textContent = messages.totalLabel;
    }

    updateFormatButton(localStorage.getItem(COPY_FORMAT_STORAGE_KEY) || COPY_FORMATS[0]);
    updateLanguageButton(localStorage.getItem(LANGUAGE_STORAGE_KEY) || 'auto');
    updateThemeButton(localStorage.getItem(THEME_STORAGE_KEY) || 'auto');
}

applyTranslations();

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

function getButtonDefaultLabel(button) {
    if (!(button instanceof HTMLButtonElement)) return '';

    const translationKey = button.dataset.i18n;
    return translationKey ? messages[translationKey] ?? button.textContent : button.textContent;
}

function getCopyDisabledMessage(format) {
    const formatLabel = messages[`format${format[0].toUpperCase()}${format.slice(1)}`] ?? format;
    return `${messages.copyDisabled}${formatLabel}`;
}

function hasRememberedUnsupportedCopyFormat(format) {
    return unsupportedCopyFormats.has(format);
}

function syncCopyButtonAvailability() {
    if (!(copyButton instanceof HTMLButtonElement)) return;

    const format = localStorage.getItem(COPY_FORMAT_STORAGE_KEY) || COPY_FORMATS[0];
    const isUnsupported = hasRememberedUnsupportedCopyFormat(format);

    copyButton.title = isUnsupported ? getCopyDisabledMessage(format) : '';
    copyButton.disabled = isUnsupported;
}

function clearButtonState(button) {
    if (!(button instanceof HTMLButtonElement)) return;

    if (button._feedbackTimeoutId) {
        clearTimeout(button._feedbackTimeoutId);
        button._feedbackTimeoutId = null;
    }

    if (button._temporaryStateTimeoutId) {
        clearTimeout(button._temporaryStateTimeoutId);
        button._temporaryStateTimeoutId = null;
    }

    if (button._temporaryStateEnableTimeoutId) {
        clearTimeout(button._temporaryStateEnableTimeoutId);
        button._temporaryStateEnableTimeoutId = null;
    }

    button.dataset.confirming = 'false';
    button.textContent = getButtonDefaultLabel(button);
    button.disabled = false;

    if (button === copyButton) {
        syncCopyButtonAvailability();
    }

    if (button === activeConfirmationButton) {
        activeConfirmationButton = null;
    }
}

function setTemporaryButtonState(button, message, { duration = 3000, enableDelay = 0, confirming = false } = {}) {
    if (!(button instanceof HTMLButtonElement)) return;

    if (confirming && activeConfirmationButton && activeConfirmationButton !== button) {
        clearButtonState(activeConfirmationButton);
    }

    clearButtonState(button);
    button.dataset.confirming = confirming ? 'true' : 'false';
    if (confirming) {
        activeConfirmationButton = button;
    }
    button.disabled = true;
    button.textContent = message;

    if (enableDelay > 0) {
        button._temporaryStateEnableTimeoutId = window.setTimeout(() => {
            button.disabled = false;
            button._temporaryStateEnableTimeoutId = null;
        }, enableDelay);
    }

    button._temporaryStateTimeoutId = window.setTimeout(() => {
        clearButtonState(button);
    }, duration);
}

function hasUnsavedInvoiceData() {
    const formState = collectFormState();
    return (
        formState.customerName.trim() !== '' ||
        formState.rows.some(hasMeaningfulRowData)
    );
}

clearButton.addEventListener('click', () => {
    if (!(clearButton instanceof HTMLButtonElement) || clearButton.disabled) {
        return;
    }

    if (clearButton.dataset.confirming !== 'true') {
        setTemporaryButtonState(clearButton, messages.clearPrompt, {
            duration: 3000,
            enableDelay: 300,
            confirming: true
        });
        return;
    }

    localStorage.removeItem(STORAGE_KEY);
    restoreFormState(null);
    updateInvoiceTotal();
    setButtonFeedback(clearButton, messages.clearSuccess);
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

function refreshFormattedNumberInputs() {
    getItemRows().forEach((row) => {
        ['qty', 'price'].forEach((key) => {
            const input = getRowField(row, key);
            if (!(input instanceof HTMLInputElement)) return;

            input.value = formatNumberInputValue(input.value);
        });
    });
}

function setLanguage(mode) {
    const nextLanguage = LANGUAGE_MODES.includes(mode) ? mode : 'auto';
    localStorage.setItem(LANGUAGE_STORAGE_KEY, nextLanguage);
    locale = resolveLocale(nextLanguage);
    messages = TRANSLATIONS[locale];
    numberFormatter = new Intl.NumberFormat(locale);
    applyTranslations();
    refreshFormattedNumberInputs();
    updateInvoiceTotal();
}

function toggleLanguage() {
    const currentLanguage = localStorage.getItem(LANGUAGE_STORAGE_KEY) || 'auto';
    const currentIndex = LANGUAGE_MODES.indexOf(currentLanguage);
    const nextLanguage = LANGUAGE_MODES[(currentIndex + 1) % LANGUAGE_MODES.length];

    setLanguage(nextLanguage);
}

languageButton?.addEventListener('click', toggleLanguage);

function setCopyFormat(format) {
    const nextFormat = COPY_FORMATS.includes(format) ? format : COPY_FORMATS[0];
    localStorage.setItem(COPY_FORMAT_STORAGE_KEY, nextFormat);
    updateFormatButton(nextFormat);
    syncCopyButtonAvailability();
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
    link.download = `${buildInvoiceFileName()}.${extension}`;
    link.click();

    setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
}

function buildInvoiceFileName() {
    const formattedDate = (orderDate?.value || new Date().toISOString().split('T')[0]).trim();
    const sanitizedName = (customerNameInput?.value || '')
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');

    return sanitizedName ? `invoice_${formattedDate}_${sanitizedName}` : `invoice_${formattedDate}`;
}

function downloadText(content, extension, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    downloadBlob(blob, extension);
}

function setButtonFeedback(button, message, duration = 3000) {
    if (!(button instanceof HTMLButtonElement)) return;

    clearButtonState(button);
    button.disabled = true;
    button.textContent = message;
    button._feedbackTimeoutId = window.setTimeout(() => {
        clearButtonState(button);
    }, duration);
}

async function handleSaveAction() {
    const format = localStorage.getItem(COPY_FORMAT_STORAGE_KEY) || COPY_FORMATS[0];
    const button = saveButton;
    const successMessage = messages.saveSuccess;

    if (!(button instanceof HTMLButtonElement) || button.disabled) {
        return;
    }

    button.disabled = true;

    if (format === 'json') {
        downloadText(JSON.stringify(collectFormState(), null, 2), 'json', 'application/json');
        setButtonFeedback(button, successMessage);
        return;
    }

    const mimeType = `image/${format}`;
    const extension = format;

    let blob;

    try {
        blob = await renderSectionToBlob(mimeType);
        if (!blob) {
            console.error('Invoice render returned no blob for save.', { format, mimeType });
            button.disabled = false;
            return;
        }
    } catch (error) {
        console.error('Invoice render failed for save.', {
            error,
            format,
            mimeType,
            customerName: customerNameInput?.value ?? '',
            orderDate: orderDate?.value ?? '',
            rowCount: getItemRows().length
        });
        button.disabled = false;
        return;
    }

    downloadBlob(blob, extension);

    setButtonFeedback(button, successMessage);
}

async function handleCopyAction() {
    const format = localStorage.getItem(COPY_FORMAT_STORAGE_KEY) || COPY_FORMATS[0];
    const button = copyButton;
    const debugCause = getDebugCopyCause(format);

    if (!(button instanceof HTMLButtonElement) || button.disabled || hasRememberedUnsupportedCopyFormat(format)) {
        syncCopyButtonAvailability();
        return;
    }

    button.disabled = true;

    if (format === 'json') {
        const jsonContent = JSON.stringify(collectFormState(), null, 2);

        if (debugCause === 'failed') {
            console.error('Debug forced clipboard text copy failure.', { format, debugCause });
            downloadText(jsonContent, 'json', 'application/json');
            setButtonFeedback(button, messages.copyError);
            return;
        }

        if (shouldForceUnsupportedCopyFormat(format) || !navigator.clipboard?.writeText) {
            console.error('Clipboard text write unsupported, falling back to download.', { format });
            unsupportedCopyFormats.add(format);
            downloadText(jsonContent, 'json', 'application/json');
            setButtonFeedback(button, messages.copyUnavailable);
            return;
        }

        try {
            await navigator.clipboard.writeText(jsonContent);
        } catch (error) {
            console.error('Clipboard text write failed, falling back to download.', {
                error,
                format,
                clipboardWriteTextAvailable: !!navigator.clipboard?.writeText
            });
            downloadText(jsonContent, 'json', 'application/json');
            setButtonFeedback(button, messages.copyError);
            return;
        }

        setButtonFeedback(button, messages.copySuccess);
        return;
    }

    const mimeType = `image/${format}`;
    const extension = format;
    let blob;

    try {
        if (debugCause === 'render-failed') {
            throw new Error('Debug forced render failure.');
        }

        blob = await renderSectionToBlob(mimeType);
        if (!blob) {
            console.error('Invoice render returned no blob for copy.', { format, mimeType });
            setButtonFeedback(button, messages.copyError);
            return;
        }
    } catch (error) {
        console.error('Invoice render failed for copy.', {
            error,
            format,
            mimeType,
            customerName: customerNameInput?.value ?? '',
            orderDate: orderDate?.value ?? '',
            rowCount: getItemRows().length
        });
        setButtonFeedback(button, messages.copyError);
        return;
    }

    if (debugCause === 'failed') {
        console.error('Debug forced clipboard image copy failure.', { format, debugCause });
        downloadBlob(blob, extension);
        setButtonFeedback(button, messages.copyError);
        return;
    }

    if (shouldForceUnsupportedCopyFormat(format) || !navigator.clipboard?.write || typeof ClipboardItem === 'undefined') {
        console.error('Clipboard image write unsupported, falling back to download.', { format, mimeType });
        unsupportedCopyFormats.add(format);
        downloadBlob(blob, extension);
        setButtonFeedback(button, messages.copyUnavailable);
        return;
    }

    try {
        await navigator.clipboard.write([
            new ClipboardItem({ [mimeType]: blob })
        ]);
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
        setButtonFeedback(button, messages.copyError);
        return;
    }

    setButtonFeedback(button, messages.copySuccess);
}

function handleOpenAction() {
    if (!(openButton instanceof HTMLButtonElement) || openButton.disabled) {
        return;
    }

    if (openButton.dataset.confirming !== 'true' && hasUnsavedInvoiceData()) {
        setTemporaryButtonState(openButton, messages.openPrompt, {
            duration: 3000,
            enableDelay: 300,
            confirming: true
        });
        return;
    }

    openFileInput.value = '';
    openFileInput.click();
}

formatButton?.addEventListener('click', toggleCopyFormat);
openButton?.addEventListener('click', handleOpenAction);
saveButton?.addEventListener('click', () => {
    void handleSaveAction();
});
copyButton?.addEventListener('click', () => {
    void handleCopyAction();
});

openFileInput.addEventListener('change', async (event) => {
    const file = event.target instanceof HTMLInputElement ? event.target.files?.[0] : null;
    if (!file) return;

    try {
        const parsed = JSON.parse(await file.text());
        restoreFormState(parsed);
        updateInvoiceTotal();
        saveFormState();
        setButtonFeedback(openButton, messages.openSuccess);
    } catch (error) {
        console.error('Opening invoice JSON failed.', { error, fileName: file.name });
        clearButtonState(openButton);
    }
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
        required: true
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
const sanitizeCustomerName = (value, { lowercase = false, uppercase = false } = {}) => {
    const sanitizedValue = String(value ?? '').replace(/[^A-Za-z\s]/g, '');
    if (uppercase) return sanitizedValue.toUpperCase();
    return lowercase ? sanitizedValue.toLowerCase() : sanitizedValue;
};
const formatNumber = (value) => numberFormatter.format(Number(value) || 0);
const formatNumberInputValue = (value) => {
    const sanitizedValue = sanitizeNumberInput(value);
    return sanitizedValue === '' ? '' : formatNumber(sanitizedValue);
};
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
const focusInvalidInput = (input) => {
    if (!(input instanceof HTMLInputElement)) return false;

    const isValid = input.reportValidity();
    if (!isValid) {
        focusAndSelectInput(input);
    }

    return isValid;
};
const getItemRows = () =>
    invoiceTableBody
        ? [...invoiceTableBody.querySelectorAll('tr')].filter((row) => row.querySelector('td input'))
        : [];
const getFirstRowInput = (row) => row?.querySelector('td input');
const getRowField = (row, key, tagName = 'input') => row?.querySelector(`${tagName}[id^="${key}-"]`);
const getTotalOutput = () => document.getElementById('total');
const validateRequiredFields = (row) => {
    const requiredInputs = [...(row?.querySelectorAll('input[required]') ?? [])];
    const firstInvalidInput = requiredInputs.find((input) => !focusInvalidInput(input));
    return !firstInvalidInput;
};
const validatePreviousRequiredRows = (row) => {
    const itemRows = getItemRows();
    const rowIndex = itemRows.indexOf(row);
    if (rowIndex <= 0) return true;

    for (let index = 0; index < rowIndex; index += 1) {
        if (!validateRequiredFields(itemRows[index])) {
            return false;
        }
    }

    return true;
};
const hasMeaningfulRowData = (rowData) => {
    if (!rowData) return false;

    const item = String(rowData.item ?? '').trim();
    const qty = String(rowData.qty ?? '').trim();
    const price = String(rowData.price ?? '').trim();

    const isDefaultEmptyRow = item === '' && (qty === '' || qty === '1') && (price === '' || price === '0');
    return !isDefaultEmptyRow;
};
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
        cell.dataset.headerKey = field.key;
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
    labelCell.dataset.totalLabel = 'true';
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

function renumberItemRows() {
    getItemRows().forEach((row, rowIndex) => {
        const nextIndex = rowIndex + 1;

        row.querySelectorAll('input, output').forEach((element) => {
            const [key] = element.id.split('-');
            const nextId = `${key}-${nextIndex}`;

            element.id = nextId;
            element.name = key === 'item' ? 'item-name' : nextId;
        });
    });
}

function getRowData(row) {
    return {
        item: getRowField(row, 'item')?.value ?? '',
        qty: sanitizeNumberInput(getRowField(row, 'qty')?.value),
        price: sanitizeNumberInput(getRowField(row, 'price')?.value)
    };
}

function duplicateItemRow(row) {
    if (!row || !invoiceTableBody) return null;

    const duplicatedRow = appendItemRow(getRowData(row));
    row.after(duplicatedRow);
    renumberItemRows();
    updateInvoiceTotal();
    saveFormState();

    return duplicatedRow;
}

function deleteItemRow(row) {
    if (!row) return null;

    const itemRows = getItemRows();
    if (itemRows.length <= 1) {
        ['item', 'qty', 'price'].forEach((key) => {
            const input = getRowField(row, key);
            if (!(input instanceof HTMLInputElement)) return;

            input.value = key === 'qty' ? '1' : '';
        });
        updateInvoiceTotal();
        saveFormState();
        return row;
    }

    const rowIndex = itemRows.indexOf(row);
    const fallbackRow = itemRows[rowIndex + 1] ?? itemRows[rowIndex - 1] ?? null;
    row.remove();
    renumberItemRows();
    updateInvoiceTotal();
    saveFormState();

    return fallbackRow;
}

function collectFormState() {
    return {
        customerName: sanitizeCustomerName(customerNameInput?.value, { lowercase: true }),
        orderDate: orderDate?.value ?? '',
        rows: getItemRows()
            .map((row) => ({
                item: getRowField(row, 'item')?.value ?? '',
                qty: sanitizeNumberInput(getRowField(row, 'qty')?.value),
                price: sanitizeNumberInput(getRowField(row, 'price')?.value)
            }))
            .filter(hasMeaningfulRowData)
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
            savedState && typeof savedState.customerName === 'string'
                ? sanitizeCustomerName(savedState.customerName, { uppercase: true })
                : '';
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
    if (!validatePreviousRequiredRows(row) || !validateRequiredFields(row)) {
        return;
    }

    const itemRows = getItemRows();
    const rowIndex = itemRows.indexOf(row);
    const nextRow = itemRows[rowIndex + 1] ?? getOrAppendNextRow(row);
    if (!nextRow || nextRow === row) {
        return;
    }

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

    if (!validatePreviousRequiredRows(row)) {
        return;
    }

    if (input.required && !focusInvalidInput(input)) {
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

    if (!validateRequiredFields(row)) {
        return row;
    }

    return appendItemRow();
}

initializeInvoiceTable();
setLanguage(localStorage.getItem(LANGUAGE_STORAGE_KEY) || 'auto');
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

    if (event.target === customerNameInput) {
        event.target.value = sanitizeCustomerName(event.target.value, { uppercase: true });
    }

    saveFormState();
});

document.addEventListener('focusout', ({ target }) => {
    if (!isFormattedNumberInput(target)) return;

    target.value = formatNumberInputValue(target.value);
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

    if (event.ctrlKey && event.altKey && event.key.toLowerCase() === 'd') {
        const currentRow = event.target.closest('tr');
        if (!currentRow || !event.target.closest('td')) return;

        event.preventDefault();
        if (!validatePreviousRequiredRows(currentRow)) {
            return;
        }

        if (event.shiftKey) {
            const focusRow = deleteItemRow(currentRow);
            focusAndSelectInput(getFirstRowInput(focusRow));
            return;
        }

        if (!validateRequiredFields(currentRow)) {
            return;
        }

        const duplicatedRow = duplicateItemRow(currentRow);
        focusAndSelectInput(getFirstRowInput(duplicatedRow));
        return;
    }

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
