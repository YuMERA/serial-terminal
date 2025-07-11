/*! 
* Web Serial Terminal v1.0
* (c) 2025 Mera System - All rights reserved
* https://mera-system.com
*/
document.addEventListener('DOMContentLoaded', () => {
    const connectDisconnectButton = document.getElementById('connectDisconnectButton');
    const baudRateSelect = document.getElementById('baudRate');
    const receivedDataOutput = document.getElementById('receivedDataOutput');
    const showTimestampCheckbox = document.getElementById('showTimestamp');
    const autoScrollCheckbox = document.getElementById('autoScroll');
    const autoScrollLabel = document.querySelector('label[for="autoScroll"]');
    const lineCountDisplay = document.getElementById('lineCountDisplay');
    const clearOutputButton = document.getElementById('clearOutputButton');
    const saveOutputButton = document.getElementById('saveOutputButton');
    const copyOutputButton = document.getElementById('copyOutputButton');
    const sendInput = document.getElementById('sendInput');
    const sendButton = document.getElementById('sendButton');
    const lineEndingSelect = document.getElementById('lineEnding');

    // Settings modal
    const modalDefaultBaudRate = document.getElementById('modalDefaultBaudRate');
    const modalDefaultTimestamp = document.getElementById('modalDefaultTimestamp');

    let currentDisplayFormat = 'normal'; // podrazumevano za format prikaza <Normal Hex Json>

    // Modal elementi
    const settingsIcon = document.getElementById('settingsIcon');
    const settingsModal = document.getElementById('settingsModal');
    const closeModal = document.getElementById('closeModal');
    const modalMaxLines = document.getElementById('modalMaxLines');
    const saveSettingsButton = document.getElementById('saveSettings');

    // Za prikaz broja linija i veličine buffera
    const lineCountSpan = document.getElementById('lineCount');
    const bufferSizeDisplay = document.getElementById('bufferSize');
    
    // Modal AutoClear
    const modalAutoClear = document.getElementById('modalAutoClear');

    const pauseOutputCheckbox = document.getElementById('pauseOutput');
    pauseOutputCheckbox.addEventListener('change', () => {
        updateOutputDisplay();
        updateSearchInputAvailability();
    });
    

    // Inicijalna vrednost
    let maxLinesToDisplay = parseInt(modalMaxLines.value) || 2000;
    let scrollLocked = !autoScrollCheckbox.checked;
    
    autoScrollCheckbox.addEventListener('change', () => {
        scrollLocked = !autoScrollCheckbox.checked;
        updateSearchInputAvailability();
    });
    
    // Tooltip tekst
    const AUTO_SCROLL_ENABLED_TOOLTIP  = "Enable or disable automatic scrolling of incoming data.";
    const AUTO_SCROLL_DISABLED_TOOLTIP = "Auto scroll works only until buffer limit is reached. After that, scrolling is always automatic.";

    autoScrollCheckbox.title = AUTO_SCROLL_ENABLED_TOOLTIP;
    if (autoScrollLabel) {
        autoScrollLabel.title = AUTO_SCROLL_ENABLED_TOOLTIP;
    }

    const searchInput = document.getElementById('searchInput');
    const clearSearchButton = document.getElementById('clearSearchButton');
    const searchIcon = document.querySelector('.search-icon');
    const searchCountSpan = document.getElementById('searchCountSpan');
    
    searchInput.addEventListener('input', () => {
        clearSearchButton.style.display = searchInput.value.trim().length > 0 ? 'inline' : 'none';
        filterSearchResults();
    });

    clearSearchButton.addEventListener('click', () => {
        searchInput.value = '';
        clearSearchButton.style.display = 'none';
        const lines = receivedDataOutput.querySelectorAll('.log-line');
        lines.forEach(line => line.style.display = '');
        filterSearchResults();
    });

    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') performSearch();
    });

    function clearSearchUI() {
        if (searchInput) searchInput.value = '';
        if (searchCountSpan) {
            searchCountSpan.textContent = '';
            searchCountSpan.style.display = 'none';
        }
        if (clearSearchButton) clearSearchButton.style.display = 'none';
    }
    

    searchIcon.addEventListener('click', performSearch);

    function performSearch() {
        const term = searchInput.value.toLowerCase().trim();
        const lines = receivedDataOutput.querySelectorAll('.log-line');
        lines.forEach(line => {
            const text = line.innerText.toLowerCase();
            line.style.display = (!term || text.includes(term)) ? '' : 'none';
        });
    }

    function escapeHtml(str) {
        return str.replace(/[&<>"']/g, function (m) {
            switch (m) {
                case '&': return '&amp;';
                case '<': return '&lt;';
                case '>': return '&gt;';
                case '"': return '&quot;';
                case "'": return '&#039;';
            }
        });
    }

    function updateAutoScrollAvailability() {
        const atLimit = displayedLines.length >= maxLinesToDisplay;

        autoScrollCheckbox.disabled = atLimit;

        if (autoScrollLabel) {
            autoScrollLabel.classList.toggle('checkbox-disabled', atLimit);
        }

        const tooltip = atLimit ? AUTO_SCROLL_DISABLED_TOOLTIP : AUTO_SCROLL_ENABLED_TOOLTIP;
        autoScrollCheckbox.title = tooltip;
        if (autoScrollLabel) {
            autoScrollLabel.title = tooltip;
        }
    }

    let autoClearInterval = null;
    let port = null;
    let reader = null;
    let inputDone = null;
    let keepReading = false;
    let pendingLines = [];
    let displayedLines = [];
    let rawLines = [];
    let totalLinesReceived = 0;
    let updateTimer = null;
    const UPDATE_INTERVAL_MS = 100;

    // Deo koji obradjuje options setovanje i default vrednosti
    const DEFAULT_SETTINGS = {
        maxLines: 2000,
        baudRate: 115200,
        showTimestamp: false,
        lineEnding: 'lf',
        use12h: false,
        autoClearMinutes: 0
    };
    let use12hFormat = DEFAULT_SETTINGS.use12h;

    const displayFormatSelect = document.getElementById('displayFormat');
    displayFormatSelect.addEventListener('change', () => {
        currentDisplayFormat = displayFormatSelect.value;
        updateOutputDisplay(); // da odmah primeni na prikaz
    });

    // Funkcija za učitavanje podešavanja iz localStorage
    function loadSettings() {
        const settings = JSON.parse(localStorage.getItem('serialSettings')) || {};
        use12hFormat = settings.use12h ?? DEFAULT_SETTINGS.use12h;
    
        // Učitaj max lines
        if (settings.maxLines) {
            maxLinesToDisplay = settings.maxLines;
            modalMaxLines.value = settings.maxLines;
            bufferSizeDisplay.textContent = settings.maxLines;
        }
    
        // Učitaj default baud rate
        if (settings.baudRate && baudRateSelect) {
            baudRateSelect.value = settings.baudRate.toString();
            const modalBaud = document.getElementById('modalDefaultBaudRate');
            if (modalBaud) {
                modalBaud.value = settings.baudRate.toString();
            }
        }
    
        // Učitaj default za timestamp checkbox
        if (typeof settings.showTimestamp === 'boolean') {
            showTimestampCheckbox.checked = settings.showTimestamp;
            const modalTimestamp = document.getElementById('modalDefaultTimestamp');
            if (modalTimestamp) {
                modalTimestamp.checked = settings.showTimestamp;
            }
        }

        // Line Ending
        if (settings.lineEnding && document.getElementById('modalLineEnding')) {
            document.getElementById('modalLineEnding').value = settings.lineEnding;
            lineEndingSelect.value = settings.lineEnding;
        }

        // Timestamp format
        if (typeof settings.use12h === 'boolean') {
            document.getElementById('modalUse12h').checked = settings.use12h;
        }

        // AutoClear
        if (settings.autoClearMinutes !== undefined) {
            modalAutoClear.value = settings.autoClearMinutes;
            setupAutoClear(settings.autoClearMinutes);
        }

    }
    
    // Funkcija za čuvanje podešavanja
    function saveSettings() {
        const newMax = parseInt(modalMaxLines.value);
        if (isNaN(newMax) || newMax < 100) {
            alert("Max Buffer Lines must be at least 100.");
            return;
        }
    
        const baudSelect = document.getElementById('modalDefaultBaudRate');
        const tsCheckbox = document.getElementById('modalDefaultTimestamp');
        const lineEndingSelectModal = document.getElementById('modalLineEnding');
        const use12hCheckbox = document.getElementById('modalUse12h');
    
        const newSettings = {
            maxLines: newMax,
            baudRate: baudSelect ? parseInt(baudSelect.value) : 115200,
            showTimestamp: tsCheckbox ? tsCheckbox.checked : false,
            lineEnding: lineEndingSelectModal ? lineEndingSelectModal.value : 'lf',
            use12h: use12hCheckbox ? use12hCheckbox.checked : false,
            autoClearMinutes: parseInt(modalAutoClear.value)
        };
    
        localStorage.setItem('serialSettings', JSON.stringify(newSettings));
    
        // Primeni podešavanja odmah
        maxLinesToDisplay = newSettings.maxLines;
        baudRateSelect.value = newSettings.baudRate.toString();
        showTimestampCheckbox.checked = newSettings.showTimestamp;
        lineEndingSelect.value = newSettings.lineEnding;
        use12hFormat = newSettings.use12h;
    
        applyMaxLinesLimit();
        updateOutputDisplay();

        copyOutputButton.title = `Only the most recent ${maxLinesToDisplay} lines will be copied. Older lines are discarded from memory.`;
        saveOutputButton.title = `Only the most recent ${maxLinesToDisplay} lines will be saved. Older lines are discarded from memory.`;
        
        settingsModal.style.display = 'none';
    }
    

    // Resetovanje na podrazumevana podešavanja
    function resetToDefaults() {
        localStorage.removeItem('serialSettings');
        modalMaxLines.value = DEFAULT_SETTINGS.maxLines;
        document.getElementById('modalDefaultBaudRate').value = DEFAULT_SETTINGS.baudRate;
        document.getElementById('modalDefaultTimestamp').checked = DEFAULT_SETTINGS.showTimestamp;
        document.getElementById('modalLineEnding').value = DEFAULT_SETTINGS.lineEnding;
        document.getElementById('modalUse12h').checked = DEFAULT_SETTINGS.use12h;
        document.getElementById('modalAutoClear').value = DEFAULT_SETTINGS.autoClearMinutes;
        
        // Primeni vrednosti odmah i na aplikaciju
        maxLinesToDisplay = DEFAULT_SETTINGS.maxLines;
        baudRateSelect.value = DEFAULT_SETTINGS.baudRate.toString();
        showTimestampCheckbox.checked = DEFAULT_SETTINGS.showTimestamp;
        lineEndingSelect.value = DEFAULT_SETTINGS.lineEnding;

        // Osveži prikaz ako treba
        updateOutputDisplay();
        updateAutoScrollAvailability();
    }
    
    function applyMaxLinesLimit() {
        while (displayedLines.length > maxLinesToDisplay) {
            displayedLines.shift();
        }
        updateAutoScrollAvailability();
    }

    function updateOutputDisplay() {
        let previousScrollTop = receivedDataOutput.scrollTop;
    
        // Umesto <br>, sada svaka linija ide kao <div class="log-line">
        receivedDataOutput.innerHTML = displayedLines
            .map(line => `<div class="log-line">${line}</div>`)
            .join('');
    
        // Ažuriraj prikaz AutoClear statusa
        const storedSettings = JSON.parse(localStorage.getItem('serialSettings')) || {};
        const autoClearMin = storedSettings.autoClearMinutes || 0;
    
        const autoClearStatus = document.getElementById('autoClearStatus');
        let autoClearText = '';
    
        if (autoClearMin > 0) {
            if (keepReading && !document.getElementById('pauseOutput').checked) {
                autoClearText = `AutoClear: ${autoClearMin} min`;
            } else if (!keepReading) {
                autoClearText = `AutoClear: inactive`;
            } else {
                autoClearText = `AutoClear: paused`;
            }
        } else {
            autoClearText = `AutoClear: OFF`;
        }
    
        autoClearStatus.innerHTML = `<span class="autoclear-label">${autoClearText}</span>`;
    
        // Linije i buffer info
        document.getElementById('lineCount').textContent = totalLinesReceived;
        document.getElementById('bufferSize').textContent = maxLinesToDisplay;
    
        // Scroll behavior
        if (!scrollLocked) {
            receivedDataOutput.scrollTop = receivedDataOutput.scrollHeight;
        } else {
            receivedDataOutput.scrollTop = previousScrollTop;
        }
    
        updateAutoScrollAvailability();
    }
    
    function filterSearchResults() {
        const query = searchInput.value.trim().toLowerCase();
        let matchCount = 0;
    
        const filteredLines = rawLines
            .filter(line => {
                if (!query) return true;
                return line.toLowerCase().includes(query);
            })
            .map(line => {
                if (!query) return wrapLine(escapeHtml(line));
                const regex = new RegExp(`(${query})`, 'gi');
                const highlighted = escapeHtml(line).replace(regex, '<mark>$1</mark>');
                matchCount++;
                return wrapLine(highlighted);
            });
    
        receivedDataOutput.innerHTML = filteredLines.join('');
    
        if (query && matchCount > 0) {
            searchCountSpan.textContent = `(${matchCount})`;
            searchCountSpan.style.display = 'inline-block';
        } else {
            searchCountSpan.style.display = 'none';
        }
    
        if (!scrollLocked) {
            receivedDataOutput.scrollTop = receivedDataOutput.scrollHeight;
        }
    }
    
    
       

    function addSystemMessage(message, isError = false) {
        rawLines.push(message); // Sačuvaj sirovi tekst

        const timestamp = new Date().toLocaleTimeString('sr-RS', { hour12: use12hFormat });
        const tsSpan = showTimestampCheckbox.checked ? `<span class="timestamp">[${timestamp}]</span> ` : '';
    
        let msg;
        if (message.startsWith("<system message>")) {
            const content = message.slice(17);
            msg = `<span class="system-message">&lt;system message&gt;</span>${escapeHtml(content)}`;
        } else {
            msg = escapeHtml(message);
        }
    
        const fullLine = `${tsSpan}${msg}`;
        displayedLines.push(fullLine);
        totalLinesReceived++;
        applyMaxLinesLimit();
        updateOutputDisplay();
        if (isError) console.error(message); else console.log(message);
    }
    
        

    function formatLine(line) {
        const format = document.getElementById('displayFormat').value;
    
        switch (format) {
            case 'hex':
                return Array.from(line).map(c => c.charCodeAt(0).toString(16).padStart(2, '0')).join(' ');
            case 'json':
                try {
                    const obj = JSON.parse(line);
                    return JSON.stringify(obj, null, 2);
                } catch (e) {
                    return line; // fallback ako nije validan JSON
                }
            case 'normal':
            default:
                return line;
        }
    }

    /// Ovo ako zelim da mi se ispred hex broja ispisuje "0x"
    /*function formatLine(line) {
        switch (currentDisplayFormat) {
            case 'hex':
                return Array.from(line)
                    .map(c => '0x' + c.charCodeAt(0).toString(16).padStart(2, '0'))
                    .join(' ');
            case 'json':
                try {
                    const obj = JSON.parse(line);
                    return JSON.stringify(obj, null, 2);
                } catch (e) {
                    return line; // fallback ako nije validan JSON
                }
            case 'normal':
            default:
                return line;
        }
    }*/

    function updateOutput() {
        if (pendingLines.length === 0) return;
        for (const line of pendingLines) {
            rawLines.push(line); // Sačuvaj sirov tekst

            let formatted = formatLine(line); // Poštuje normal/hex/json
        
            if (showTimestampCheckbox.checked) {
                const timestamp = new Date().toLocaleTimeString('sr-RS', { hour12: use12hFormat });
                formatted = `<span class="timestamp">[${timestamp}]</span> ${formatted}`;
            }
        
            displayedLines.push(formatted);
            totalLinesReceived++;
        }
        
        pendingLines = [];
        applyMaxLinesLimit();
        updateOutputDisplay();
    }

    async function readSerialPort() {
        const decoder = new TextDecoderStream();
        inputDone = port.readable.pipeTo(decoder.writable);
        const inputStream = decoder.readable;
        reader = inputStream.getReader();

        let buffer = '';

        try {
            while (keepReading) {
                const { value, done } = await reader.read();
                if (done) break;
                if (!value) continue;

                buffer += value;
                let lines = buffer.split(/\r?\n/);
                buffer = lines.pop();

                for (const line of lines) {
                    if (line.trim() !== '' && !document.getElementById('pauseOutput').checked) {
                        pendingLines.push(line.trim());
                    }
                }
            }
        } catch (e) {
            addSystemMessage(`<system message> - Error reading stream: ${e.message}`, true);
            portDisconnect();
        } finally {
            try { reader.releaseLock(); } catch (e) {}
            try { await inputDone; } catch (e) {}
            inputDone = null;
        }
    }

    async function clearBuffer() {
        receivedDataOutput.value = '';
        pendingLines = [];
        displayedLines = [];
        totalLinesReceived = 0;
        
        const storedSettings = JSON.parse(localStorage.getItem('serialSettings')) || {};
        const autoClearMin = storedSettings.autoClearMinutes || 0;

        let statusText = '';
        if (autoClearMin > 0 && keepReading && !document.getElementById('pauseOutput').checked) {
            statusText = `AutoClear: ${autoClearMin}min  |  `;
        }
        if (lineCountDisplay) {
            lineCountDisplay.innerHTML = `${statusText}Lines: <span id="lineCount">${totalLinesReceived}</span>  |  Buffer: <span id="bufferSize">${maxLinesToDisplay}</span>`;
        }
        updateAutoScrollAvailability();
        clearSearchUI();
    }

    async function portDisconnect() {
        keepReading = false;
        receivedDataOutput.scrollTop = receivedDataOutput.scrollHeight;
        connectDisconnectButton.textContent = 'Connect';
        connectDisconnectButton.classList.remove('disconnect');
        connectDisconnectButton.classList.add('connect');
        connectDisconnectButton.title = 'Click to select and connect to a serial port.';
        baudRateSelect.disabled = false;
        autoScrollCheckbox.checked = true;
        scrollLocked = false;
        
        if (autoClearInterval) {
            clearInterval(autoClearInterval);
            autoClearInterval = null;
        }
        
        addSystemMessage("<system message> - Disconnected successfully.");
    }

    loadSettings(); // poziv funkcije koj vraca snimljene podatke za seting
    updateAutoScrollAvailability();

    connectDisconnectButton.addEventListener('click', async () => {
        if (port && port.readable) {
            addSystemMessage("<system message> - Disconnecting...");
            keepReading = false;

            if (updateTimer) {
                clearInterval(updateTimer);
                updateTimer = null;
            }

            try {
                if (reader) {
                    try { await reader.cancel(); } catch (e) {}
                    try { reader.releaseLock(); } catch (e) {}
                    reader = null;
                }

                if (inputDone) {
                    try { await inputDone; } catch (e) {}
                    inputDone = null;
                }

                await port.close();
                port = null;

                portDisconnect();
                updateSearchInputAvailability();
            } catch (e) {
                addSystemMessage(`<system message> - Error disconnecting: ${e.message}`, true);
            }

        } else {
            try {
                clearBuffer();

                port = await navigator.serial.requestPort();
                const storedSettings = JSON.parse(localStorage.getItem('serialSettings')) || {};
                const baudRate = storedSettings.baudRate || parseInt(baudRateSelect.value);

                await port.open({
                    baudRate,
                    dataBits: 8,
                    stopBits: 1,
                    parity: 'none',
                    flowControl: 'none',
                });

                addSystemMessage("<system message> - Port opened");

                keepReading = true;
                autoScrollCheckbox.checked = true;
                scrollLocked = false;
                updateSearchInputAvailability();

                connectDisconnectButton.textContent = 'Disconnect';
                connectDisconnectButton.classList.remove('connect');
                connectDisconnectButton.classList.add('disconnect');
                connectDisconnectButton.title = 'Click to disconnect from serial port.';
                baudRateSelect.disabled = true;

                if (!updateTimer) {
                    updateTimer = setInterval(updateOutput, UPDATE_INTERVAL_MS);
                }

                const autoClearSetting = parseInt(localStorage.getItem('serialSettings') ? JSON.parse(localStorage.getItem('serialSettings')).autoClearMinutes || 0 : 0);
                setupAutoClear(autoClearSetting);

                readSerialPort();

            } catch (e) {
                addSystemMessage(`<system message> - Error connecting: ${e.message}`, true);
                port = null;
            }
        }
    });

    clearOutputButton.addEventListener('click', () => {
        receivedDataOutput.innerHTML = '';
        displayedLines = [];
        pendingLines = [];
        totalLinesReceived = 0;
        
        autoClearInterval = null;
        
        lineCountSpan.textContent = totalLinesReceived;
        bufferSizeDisplay.textContent = maxLinesToDisplay;
        clearSearchUI();
    });

    saveOutputButton.addEventListener('click', () => {
        if (rawLines.length === 0) {
            alert('Nothing to save.');
            return;
        }
    
        const formatted = rawLines.map(line => formatLine(line)).join('\n');
        const now = new Date();
        const fileName = `serial_log_${now.toISOString().replace(/[:.]/g, '-')}.txt`;
        const blob = new Blob([formatted], { type: 'text/plain;charset=utf-8' });
    
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        a.remove();
    });
    

    copyOutputButton.addEventListener('click', async () => {
        if (rawLines.length === 0) {
            alert('Nothing to copy.');
            return;
        }
    
        const formatted = rawLines.map(line => formatLine(line)).join('\n');
    
        try {
            await navigator.clipboard.writeText(formatted);
    
            const popup = window.open('', '_blank', 'width=800,height=600,left=200,top=100,resizable=yes,scrollbars=yes');
            popup.document.write(`
                <html>
                    <head><title>Copied Data</title>
                        <style>
                            body { font-family: monospace; padding: 20px; }
                            pre { white-space: pre-wrap; word-wrap: break-word; background: #f4f4f4; padding: 10px; }
                        </style>
                    </head>
                    <body><h2>Copied to Clipboard:</h2><pre>${escapeHtml(formatted)}</pre></body>
                </html>
            `);
            popup.document.close();
        } catch (err) {
            alert('Clipboard copy failed.');
        }
    });
    

    sendButton.addEventListener('click', sendSerialData);
    sendInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') sendSerialData();
    });

    async function sendSerialData() {
        let dataToSend = sendInput.value;
        const lineEnding = lineEndingSelect.value;
        if (!dataToSend.trim()) return;

        switch (lineEnding) {
            case 'lf': dataToSend += '\n'; break;
            case 'cr': dataToSend += '\r'; break;
            case 'crlf': dataToSend += '\r\n'; break;
        }

        if (port && port.writable) {
            try {
                const writer = port.writable.getWriter();
                const encoder = new TextEncoder();
                await writer.write(encoder.encode(dataToSend));
                writer.releaseLock();
                addSystemMessage(`[Sent]: ${sendInput.value} [${lineEnding.toUpperCase()}]`);
                sendInput.value = '';
            } catch (err) {
                addSystemMessage(`<system message> - Send error: ${err.message}`, true);
            }
        }
        clearSearchUI();
    }

    // Modal logika
    settingsIcon.addEventListener('click', () => {
        settingsModal.style.display = 'block';
        modalMaxLines.value = maxLinesToDisplay;
    });

    closeModal.addEventListener('click', () => {
        settingsModal.style.display = 'none';
    });

    saveSettingsButton.addEventListener('click', () => {
        const newMax = parseInt(modalMaxLines.value);
        if (!isNaN(newMax) && newMax >= 100) {
            maxLinesToDisplay = newMax;
            applyMaxLinesLimit();
            updateOutputDisplay();
            saveSettings(); // <-- dodato
            setupAutoClear(parseInt(modalAutoClear.value));
            settingsModal.style.display = 'none';
        } else {
            alert("Max Lines must be at least 100.");
        }
    });

    document.getElementById('resetSettingsButton').addEventListener('click', () => {
        resetToDefaults();
    });
    
    window.addEventListener('click', (e) => {
        if (e.target === settingsModal) {
            settingsModal.style.display = 'none';
        }
    });

    // AT Commands modal
    const atCommandsIcon = document.getElementById('atCommandsIcon');
    const atCommandsModal = document.getElementById('atCommandsModal');
    const closeAtModal = document.getElementById('closeAtModal');
    const atCommandList = document.getElementById('atCommandList');

    atCommandsIcon.addEventListener('click', () => {
        atCommandsModal.style.display = 'block';
    });

    closeAtModal.addEventListener('click', () => {
        atCommandsModal.style.display = 'none';
    });

    window.addEventListener('click', (e) => {
        if (e.target === atCommandsModal) {
            atCommandsModal.style.display = 'none';
        }
    });

    // ⬇️ Učitaj AT komande iz JSON fajla
    fetch('at_commands.json')
        .then(res => res.json())
        .then(commands => {
            commands.forEach(cmdObj => {
                const li = document.createElement('li');
                li.className = 'at-command-item';
                li.dataset.cmd = cmdObj.cmd;
                li.title = cmdObj.description; // Tooltip
                li.textContent = cmdObj.cmd;
                atCommandList.appendChild(li);
            });
        })
        .catch(err => {
            console.error('Failed to load AT commands:', err);
        });

    // Klik na AT komandu ubacuje u textbox
    atCommandList.addEventListener('click', (e) => {
        if (e.target.classList.contains('at-command-item')) {
            const cmd = e.target.dataset.cmd;
            document.getElementById('sendInput').value = cmd;
            atCommandsModal.style.display = 'none';

            // 🟢 Prikaži X dugme jer je polje sada popunjeno
            if (cmd.trim() !== '') {
                clearInputButton.style.display = 'inline';
            }
        }
    });

    const clearInputButton = document.getElementById('clearInputButton');

    sendInput.addEventListener('input', () => {
        clearInputButton.style.display = sendInput.value.trim().length > 0 ? 'inline' : 'none';
    });

    clearInputButton.addEventListener('click', () => {
        sendInput.value = '';
        clearInputButton.style.display = 'none';
        sendInput.focus();
    });

    // Hamburger meni toggle logika
    const menuToggle = document.getElementById('menuToggle');
    const dropdownMenu = document.getElementById('dropdownMenu');

    menuToggle.addEventListener('click', () => {
        dropdownMenu.style.display = dropdownMenu.style.display === 'block' ? 'none' : 'block';
    });

    window.addEventListener('click', (e) => {
        if (!menuToggle.contains(e.target) && !dropdownMenu.contains(e.target)) {
            dropdownMenu.style.display = 'none';
        }
    });

    // 🎯 ABOUT MODAL
    const aboutLink = document.getElementById('aboutLink');
    const aboutModal = document.getElementById('aboutModal');
    const closeAboutModal = document.getElementById('closeAboutModal');

    aboutLink.addEventListener('click', (e) => {
        e.preventDefault();
        aboutModal.style.display = 'block';
    });

    closeAboutModal.addEventListener('click', () => {
        aboutModal.style.display = 'none';
    });

    window.addEventListener('click', (e) => {
        if (e.target === aboutModal) {
            aboutModal.style.display = 'none';
        }
    });

    // 🎯 CONTACT US MODAL
    const contactLink = document.getElementById('contactLink');
    const contactModal = document.getElementById('contactModal');
    const closeContactModal = document.getElementById('closeContactModal');

    contactLink.addEventListener('click', (e) => {
        e.preventDefault();
        contactModal.style.display = 'block';
    });

    closeContactModal.addEventListener('click', () => {
        contactModal.style.display = 'none';
    });

    window.addEventListener('click', (e) => {
        if (e.target === contactModal) {
            contactModal.style.display = 'none';
        }
    });

    // HELP US MODAL
    const helpLink = document.getElementById('helpLink');
    const helpModal = document.getElementById('helpModal');
    const closeHelpModal = document.getElementById('closeHelpModal');

    helpLink.addEventListener('click', (e) => {
        e.preventDefault();
        helpModal.style.display = 'block';
    });

    closeHelpModal.addEventListener('click', () => {
        helpModal.style.display = 'none';
    });

    window.addEventListener('click', (e) => {
        if (e.target === helpModal) {
            helpModal.style.display = 'none';
        }
    });

    // INFO MODAL
    const infoLink = document.getElementById('infoLink');
    const infoModal = document.getElementById('infoModal');
    const closeInfoModal = document.getElementById('closeInfoModal');
    const infoContainer = document.getElementById('infoContainer');

    infoLink.addEventListener('click', (e) => {
        e.preventDefault();
        infoModal.style.display = 'block';
        loadInfoData();
    });

    closeInfoModal.addEventListener('click', () => {
        infoModal.style.display = 'none';
    });

    window.addEventListener('click', (e) => {
        if (e.target === infoModal) {
            infoModal.style.display = 'none';
        }
    });

    function loadInfoData() {
        fetch('info.json')
            .then(res => res.json())
            .then(data => {
                infoContainer.innerHTML = '';
                data.forEach(entry => {
                    const div = document.createElement('div');
                    div.className = 'info-entry';
                    div.innerHTML = `
                        <div class="title">${entry.title}</div>
                        <div class="timestamp">📅 ${entry.timestamp}</div>
                        <div class="description">${entry.description}</div>
                    `;
                    infoContainer.appendChild(div);
                });
            })
            .catch(err => {
                infoContainer.innerHTML = '<p style="color:red;">Failed to load info content.</p>';
                console.error('Error loading info.json:', err);
            });
    }

    // Modal za Features & Notes
    const featuresLink = document.getElementById('featuresLink');
    const featuresModal = document.getElementById('featuresModal');
    const closeFeaturesModal = document.getElementById('closeFeaturesModal');

    featuresLink.addEventListener('click', (e) => {
        e.preventDefault();
        featuresModal.style.display = 'block';
    });

    closeFeaturesModal.addEventListener('click', () => {
        featuresModal.style.display = 'none';
    });

    window.addEventListener('click', (e) => {
        if (e.target === featuresModal) {
            featuresModal.style.display = 'none';
        }
    });

    function setupAutoClear(minutes) {
        if (autoClearInterval) {
            clearInterval(autoClearInterval);
            autoClearInterval = null;
        }
    
        if (minutes > 0 && keepReading && !document.getElementById('pauseOutput').checked) {
            autoClearInterval = setInterval(() => {
                // Ako je u međuvremenu pauzirano ili diskonektovano, nemoj ništa
                if (!keepReading || document.getElementById('pauseOutput').checked) return;
    
                clearBuffer();
                addSystemMessage(`<system message> - Auto-clear executed after ${minutes} minute(s).`);
            }, minutes * 60 * 1000);
        }
        updateOutputDisplay(); // da osveži prikaz statusa "AutoClear: Xmin"
    }
    
    document.getElementById('pauseOutput').addEventListener('change', () => {
        const pauseChecked = document.getElementById('pauseOutput').checked;
        if (pauseChecked && autoClearInterval) {
            clearInterval(autoClearInterval);
            autoClearInterval = null;
        } else if (!pauseChecked && keepReading) {
            const stored = JSON.parse(localStorage.getItem('serialSettings')) || {};
            const minutes = stored.autoClearMinutes || 0;
            setupAutoClear(minutes);
        }
    });
    
    // Tooltip za Copy i Save dugmad
    copyOutputButton.title = `Only the most recent ${maxLinesToDisplay} lines will be copied. Older lines are discarded from memory.`;
    saveOutputButton.title = `Only the most recent ${maxLinesToDisplay} lines will be saved. Older lines are discarded from memory.`;

    // 🌗 Toggle tema (Light/Dark)
    const themeToggle = document.getElementById('themeToggle');
    const themeIcon = themeToggle.querySelector('.icon');
    const themeLabel = themeToggle.querySelector('.icon-label');

    function applyThemeFromStorage() {
        const savedTheme = localStorage.getItem('appTheme') || 'light';
        document.body.classList.toggle('theme-dark', savedTheme === 'dark');
        updateThemeIcon(savedTheme);
    }

    function updateThemeIcon(theme) {
        if (theme === 'dark') {
            themeIcon.textContent = '☀️';
            themeLabel.textContent = 'Light theme';
        } else {
            themeIcon.textContent = '🌙';
            themeLabel.textContent = 'Dark theme';
        }
    }

    themeToggle.addEventListener('click', () => {
        const isDark = document.body.classList.toggle('theme-dark');
        const newTheme = isDark ? 'dark' : 'light';
        localStorage.setItem('appTheme', newTheme);
        updateThemeIcon(newTheme);
    });

    function updateSearchInputAvailability() {
        const pauseOutputOn = pauseOutputCheckbox.checked;
        const isDisconnected = !keepReading;
    
        if (pauseOutputOn || isDisconnected) {
            searchInput.disabled = false;
            searchInput.placeholder = "Search output...";
        } else {
            searchInput.disabled = true;
            searchInput.placeholder = "Pause output or disconnect to search";
            clearSearchUI(); // poništi rezultat pretrage ako više nije validan
        }
    }

    function wrapLine(content) {
        const timestamp = new Date().toLocaleTimeString('sr-RS', { hour12: use12hFormat });
        const tsSpan = showTimestampCheckbox.checked ? `<span class="timestamp">[${timestamp}]</span> ` : '';
        return `<div class="log-line">${tsSpan}${content}</div>`;
    }
    
    

    applyThemeFromStorage(); // ✅ Pozovi odmah da se tema učita


    // Init
    connectDisconnectButton.disabled = false;
    baudRateSelect.disabled = false;
    autoScrollCheckbox.checked = true;
    //showTimestampCheckbox.checked = false;
    scrollLocked = !autoScrollCheckbox.checked;
    lineCountSpan.textContent = totalLinesReceived;
    bufferSizeDisplay.textContent = maxLinesToDisplay;
    
    updateOutputDisplay();
    updateSearchInputAvailability();
});
