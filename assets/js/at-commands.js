document.addEventListener("DOMContentLoaded", function () {
    // --- TEMA ---
    const currentTheme = localStorage.getItem('appTheme') || 'light';
    document.body.className = currentTheme + '-theme';

    // --- ELEMENTI ---
    const tabButtons = document.querySelectorAll(".tab-button");
    const tabContents = document.querySelectorAll(".tab-content");
    const searchContainer = document.querySelector('.search-container');
    const searchInput = document.getElementById('searchInput');
    const clearSearchButton = document.getElementById('clearSearchButton');
    const noResultsMsg = document.getElementById('noResults');
    const tabSelect = document.getElementById('tabSelect');

    let debounceTimer;

    // ✅ Postavi General tab kao aktivan
    const initialTab = document.getElementById('general');
    if (initialTab) {
        initialTab.classList.add('active-tab');
        initialTab.style.display = "block";

        // Premesti search u tab-header inicijalnog taba
        const tabHeader = initialTab.querySelector('.tab-header');
        if (tabHeader && searchContainer) {
            tabHeader.appendChild(searchContainer);
        }
    }

    // --- TAB PROMENA ---
    tabButtons.forEach(button => {
        button.addEventListener("click", function () {
            // Ukloni sve aktivne
            tabButtons.forEach(btn => btn.classList.remove("active"));
            tabContents.forEach(content => {
                content.classList.remove("active-tab");
                content.style.display = "none";
            });

            // Aktiviraj kliknuti tab
            this.classList.add("active");
            const tabId = this.getAttribute("data-tab");
            const targetTab = document.getElementById(tabId);
            if (targetTab) {
                targetTab.style.display = "block";
                targetTab.classList.add("active-tab");

                // Premesti search pored naslova
                const tabHeader = targetTab.querySelector('.tab-header');
                if (tabHeader && searchContainer) {
                    tabHeader.appendChild(searchContainer);
                }
            }

            // Ponovo primeni pretragu ako postoji query
            const query = searchInput.value.toLowerCase();
            applySearch(query);
        });
    });

    // --- RESPONSIVE DROPDOWN ---
    if (tabSelect) {
        tabSelect.addEventListener('change', function () {
            const selectedTab = this.value;

            tabContents.forEach(content => {
                content.classList.remove("active-tab");
                content.style.display = "none";
            });

            const targetTab = document.getElementById(selectedTab);
            if (targetTab) {
                targetTab.style.display = "block";
                targetTab.classList.add("active-tab");

                // Premesti search pored naslova
                const tabHeader = targetTab.querySelector('.tab-header');
                if (tabHeader && searchContainer) {
                    tabHeader.appendChild(searchContainer);
                }
            }

            // Oznaci dugme na desktopu
            tabButtons.forEach(btn => btn.classList.remove("active"));
            const activeBtn = document.querySelector(`.tab-button[data-tab="${selectedTab}"]`);
            if (activeBtn) activeBtn.classList.add("active");

            // Ponovo primeni pretragu
            const query = searchInput.value.toLowerCase();
            applySearch(query);
        });
    }

    // --- FETCH KOMANDI ---
    fetch("../assets/json/at_commands.json")
        .then(response => response.json())
        .then(data => {
            for (const category in data) {
                const tabId = category.toLowerCase().replace(/[\s-]+/g, '');
                const container = document.querySelector(`#${tabId} .commands-grid`);

                if (container) {
                    data[category].forEach(cmd => {
                        const card = document.createElement("div");
                        card.className = "command-card";

                        card.innerHTML = `
                            <h3>${cmd.command}</h3>
                            <p><strong>Description:</strong> ${cmd.description}</p>
                            <p><strong>Example:</strong> ${cmd.example}</p>
                        `;

                        card.addEventListener("click", () => {
                            localStorage.setItem("selectedATCommand", cmd.command);
                            window.location.href = "../index.html";
                        });

                        container.appendChild(card);
                    });
                }
            }
        })
        .catch(error => console.error("Error loading AT commands:", error));

    // --- SEARCH FUNKCIJA ---
    searchInput.addEventListener('input', function () {
        clearTimeout(debounceTimer);
        clearSearchButton.style.display = this.value.trim().length > 0 ? 'inline' : 'none';

        debounceTimer = setTimeout(() => {
            const query = this.value.toLowerCase();
            applySearch(query);
        }, 300);
    });

    function applySearch(query) {
        const activeTab = document.querySelector('.tab-content.active-tab');
        const allCards = activeTab ? activeTab.querySelectorAll('.command-card') : [];
        let visibleCount = 0;

        allCards.forEach(card => {
            const originalText = card.getAttribute('data-original') || card.innerHTML;
            card.setAttribute('data-original', originalText);
            card.innerHTML = originalText;

            const text = card.textContent.toLowerCase();

            if (query && text.includes(query)) {
                card.classList.remove('hidden');
                visibleCount++;

                const regex = new RegExp(`(${query})`, 'gi');
                card.innerHTML = card.innerHTML.replace(regex, '<mark>$1</mark>');
            } else if (!query) {
                card.classList.remove('hidden');
            } else {
                card.classList.add('hidden');
            }
        });

        noResultsMsg.style.display = (query && visibleCount === 0) ? 'block' : 'none';
    }

    // --- CLEAR SEARCH ---
    clearSearchButton.addEventListener('click', function () {
        searchInput.value = '';
        clearSearchButton.style.display = 'none';
        noResultsMsg.style.display = 'none';
        applySearch('');
        searchInput.focus();
    });

    // --- ESC KEY ---
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && searchInput.value.trim() !== '') {
            searchInput.value = '';
            clearSearchButton.style.display = 'none';
            noResultsMsg.style.display = 'none';
            applySearch('');
            searchInput.focus();
        }
    });
});
