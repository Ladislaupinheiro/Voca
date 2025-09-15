document.addEventListener('DOMContentLoaded', () => {

    // =================================================================================
    // ESTADO DA APLICAÇÃO
    // =================================================================================
    
    let wordsList = [];
    let vocabulary = safeParse('vocabulary', []);
    let gameState = safeParse('gameState', {
        lastActiveDate: null,
        streak: 0,
        unlockedAchievements: [],
        isFirstVisit: true
    });
    let vocaEvents = safeParse('voca_events', []);
    let userProfile = safeParse('userProfile', {
        nickname: 'WordMaster',
        avatar: 'avatar_1.png'
    });
    let currentWordObject = {};
    let isModalTransitioning = false;
    let dailyChartInstance = null;
    let categoryChartInstance = null;
    let modalOrigin = null;
    let geminiResponseCache = {};

    // =================================================================================
    // DADOS CONSTANTES
    // =================================================================================

    const levels = [
        { name: 'Explorador Iniciante 🧭', threshold: 0 },
        { name: 'Trilheiro de Frases 🗺️', threshold: 50 },
        { name: 'Navegador de Conversas ⛵️', threshold: 150 },
        { name: 'Arquiteto de Ideias 🏗️', threshold: 300 },
        { name: 'Mestre de Diálogos 🏛️', threshold: 500 },
        { name: 'Orador Eloquente 🎙️', threshold: 1000 },
        { name: 'Erudito Cultural 🌍', threshold: 1500 },
        { name: 'Estrategista de Debates ⚖️', threshold: 2000 },
        { name: 'Virtuoso Verbal ✒️', threshold: 2500 },
        { name: 'Titã do Vocabulário ✨', threshold: 3000 },
        { name: 'Oráculo da Linguagem 🔮', threshold: 3500 },
        { name: 'Lenda Viva 🏆', threshold: 4000 }
    ];

    const stories = [
        { id: 'story_1', title: 'A Quick Meal 🥪', unlockThreshold: 10, text: "A **man** is hungry. He wants to **eat** some **food**. He has **bread** and drinks **water**. It is a **good** and simple meal." },
        { id: 'story_2', title: 'A Trip to the City 🚗', unlockThreshold: 25, text: "We **go** to the **city** in a **car**. We **see** many **people**. It is a busy **day**." },
        { id: 'story_3', title: 'At Work 💻', unlockThreshold: 50, text: "It is **time** to **work**. I sit at my **computer** and read an **email**. I **think** about a **new** idea for a long **time**." }
    ];
    const avatars = [ 'avatar_1.png', 'avatar_2.png', 'avatar_3.png', 'avatar_4.png', 'avatar_5.png', 'avatar_6.png' ];
    let selectedAvatar = userProfile.avatar;
    
    // =================================================================================
    // ELEMENTOS DO DOM
    // =================================================================================

    const elements = {
        themeToggle: $('theme-toggle'), themeIconLight: $('theme-icon-light'), themeIconDark: $('theme-icon-dark'),
        wordCountEl: $('word-count'), levelTitleEl: $('level-title'), streakCountEl: $('streak-count'),
        xpBarFill: $('xp-bar-fill'), xpBarText: $('xp-bar-text'),
        challengeCard: $('challenge-card'),
        challengeWordContainer: $('challenge-word-container'), challengeWordEl: $('challenge-word'),
        challengeButtonsContainer: $('challenge-buttons'), 
        showListBtn: $('show-list-btn'), showStatsBtn: $('show-stats-btn'), showStoriesBtn: $('show-stories-btn'),
        settingsBtn: $('settings-btn'), shareProgressBtn: $('share-progress-btn'),
        levelUpModal: $('level-up-modal'), myListModal: $('my-list-modal'),
        wordDetailsModal: $('word-details-modal'), confirmModal: $('confirm-modal'), achievementModal: $('achievement-modal'),
        statsModal: $('stats-modal'), storiesModal: $('stories-modal'), settingsModal: $('settings-modal'),
        geminiInteractionModal: $('gemini-interaction-modal'),
        geminiDetailModal: $('gemini-detail-modal'),
        closeLevelUpModalBtn: $('close-level-up-modal-btn'),
        closeMyListModalBtn: $('close-my-list-modal-btn'), closeModalBtn: $('close-modal-btn'),
        confirmCancelBtn: $('confirm-cancel-btn'), confirmDeleteBtn: $('confirm-delete-btn'),
        closeAchievementModalBtn: $('close-achievement-modal-btn'), closeStatsModalBtn: $('close-stats-modal-btn'),
        closeStoriesModalBtn: $('close-stories-modal-btn'), closeSettingsModalBtn: $('close-settings-modal-btn'),
        saveSettingsBtn: $('save-settings-btn'),
        closeGeminiDetailModalBtn: $('close-gemini-detail-modal-btn'),
        levelUpModalTitle: $('level-up-modal-title'), levelUpIcon: $('level-up-icon'),
        wordListInModal: $('word-list-in-modal'), emptyListMsgInModal: $('empty-list-msg-in-modal'),
        clearListBtnInModal: $('clear-list-btn-in-modal'), modalSpinner: $('modal-spinner'), modalContent: $('modal-content'),
        modalWord: $('modal-word'), modalDefinition: $('modal-definition'), modalExample: $('modal-example'),
        achievementModalText: $('achievement-modal-text'), achievementIcon: $('achievement-icon'),
        storiesContainer: $('stories-container'),
        statsPeriodSelector: $('stats-period-selector'), statsLoadingMsg: $('stats-loading-msg'),
        dailyLearnedChartCanvas: $('daily-learned-chart'), categoryChartCanvas: $('category-chart'),
        categoryStatsLoadingMsg: $('category-stats-loading-msg'),
        shareCardContainer: $('share-card-container'), shareCard: $('share-card'), shareAvatar: $('share-avatar'),
        shareNickname: $('share-nickname'), shareWordCount: $('share-word-count'),
        shareStreakCount: $('share-streak-count'), shareLevel: $('share-level'),
        nicknameInput: $('nickname-input'), avatarSelectionGrid: $('avatar-selection-grid'),
        geminiInteractionLoading: $('gemini-interaction-loading'),
        geminiInteractionContent: $('gemini-interaction-content'),
        geminiInteractionWord: $('gemini-interaction-word'),
        geminiInteractionList: $('gemini-interaction-list'),
        geminiInteractionButtons: $('gemini-interaction-buttons'),
        geminiDetailTitle: $('gemini-detail-title'),
        geminiDetailContent: $('gemini-detail-content'),
    };

    // =================================================================================
    // FUNÇÕES DE SEGURANÇA E HELPERS
    // =================================================================================

    function $(id) { return document.getElementById(id); }

    function safeOn(el, ev, fn) { if (el) el.addEventListener(ev, fn); }

    function safeParse(key, fallback) {
        try {
            const raw = localStorage.getItem(key);
            return raw ? JSON.parse(raw) : fallback;
        } catch (err) {
            console.warn(`Falha ao analisar a chave do localStorage "${key}"`, err);
            localStorage.removeItem(key);
            return fallback;
        }
    }

    // =================================================================================
    // LÓGICA PRINCIPAL DA APLICAÇÃO
    // =================================================================================

    function saveData() {
        localStorage.setItem('vocabulary', JSON.stringify(vocabulary));
        localStorage.setItem('gameState', JSON.stringify(gameState));
        localStorage.setItem('voca_events', JSON.stringify(vocaEvents));
        localStorage.setItem('userProfile', JSON.stringify(userProfile));
    }

    function recordEvent(type, word, category) {
        const event = {
            type: type,
            word: word,
            category: category || 'Geral',
            timestamp: new Date().toISOString(),
        };
        vocaEvents.push(event);
    }

    function updateUI() {
        const count = vocabulary.length;
        if (elements.wordCountEl) elements.wordCountEl.textContent = count;

        const lastLevel = levels.slice().reverse().find(l => (count - 1) >= l.threshold) || levels[0];
        let currentLevelIndex = levels.length - 1;
        while (currentLevelIndex > 0 && count < levels[currentLevelIndex].threshold) {
            currentLevelIndex--;
        }
        const currentLevel = levels[currentLevelIndex];
        const nextLevel = levels[currentLevelIndex + 1];

        if (elements.levelTitleEl) elements.levelTitleEl.textContent = currentLevel.name;
        
        if (nextLevel) {
            const prevLevelThreshold = currentLevel.threshold;
            const nextLevelThreshold = nextLevel.threshold;
            const progressInLevel = count - prevLevelThreshold;
            const levelRange = nextLevelThreshold - prevLevelThreshold;
            const xpPercentage = (progressInLevel / levelRange) * 100;
            if (elements.xpBarFill) elements.xpBarFill.style.width = `${xpPercentage}%`;
            if (elements.xpBarText) elements.xpBarText.textContent = `${progressInLevel} / ${levelRange} palavras`;
        } else {
            if (elements.xpBarFill) elements.xpBarFill.style.width = '100%';
            if (elements.xpBarText) elements.xpBarText.textContent = "Jornada Concluída! Lenda!";
        }
        
        if(elements.streakCountEl) elements.streakCountEl.textContent = `↑ ${gameState.streak} dia(s) de streak`;

        if (currentLevel.name !== lastLevel.name && count > 0) {
            showLevelUpModal(currentLevel.name, "🏆"); // Usando um emoji simples por agora
        }
    }
    
    function startChallenge() {
        const availableWords = wordsList.filter(wordObj => !vocabulary.includes(wordObj.word.toLowerCase()));
        if (availableWords.length === 0) {
            elements.challengeWordContainer.innerHTML = `<p class="text-center text-lg font-semibold">Uau! Você explorou todas as palavras do nosso tesouro!</p>`;
            elements.challengeButtonsContainer.innerHTML = '';
            return;
        }
        currentWordObject = availableWords[Math.floor(Math.random() * availableWords.length)];
        elements.challengeWordContainer.innerHTML = `<p id="challenge-word" class="text-2xl font-bold text-indigo-500 dark:text-indigo-400">${currentWordObject.word}</p>`;
        elements.challengeWordEl = $('challenge-word');
        elements.challengeButtonsContainer.innerHTML = `
            <button id="yes-btn" class="flex-1 bg-green-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-green-600 transition-colors btn-scale">Já a conheço! 👍</button>
            <button id="no-btn" class="flex-1 bg-sky-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-sky-600 transition-colors btn-scale">O que significa? 🤔</button>
        `;
        safeOn($('yes-btn'), 'click', handleYes);
        safeOn($('no-btn'), 'click', handleNo);
    }
    
    function handleYes() {
        const word = currentWordObject.word;
        const category = currentWordObject.category;
        if (word && !vocabulary.includes(word.toLowerCase())) {
            vocabulary.push(word.toLowerCase());
            vocabulary.sort();
            recordEvent('word_known', word, category);
            updateStreak();
            saveData();
            updateUI();
        }
        startChallenge();
    }

    async function handleNo() {
        const word = currentWordObject.word;
        if (!word) return;
        openModal(elements.geminiInteractionModal);
        elements.geminiInteractionContent.classList.add('hidden');
        elements.geminiInteractionLoading.classList.remove('hidden');
        elements.geminiInteractionWord.textContent = word;
        try {
            const explanation = await getGeminiExplanation(word);
            parseAndDisplayGeminiInteraction(explanation, word);
        } catch (error) {
            console.error("Erro ao obter explicação da Gemini:", error);
            elements.geminiInteractionLoading.classList.add('hidden');
            elements.geminiInteractionContent.classList.remove('hidden');
            elements.geminiInteractionList.innerHTML = `<p class="text-center text-red-500">Não foi possível carregar a explicação. Verifique a sua chave de API e tente novamente.</p>`;
            elements.geminiInteractionButtons.innerHTML = `<button id="close-gemini-error-btn" class="w-full bg-slate-200 dark:bg-slate-700 py-2 rounded-lg">Fechar</button>`;
            safeOn($('close-gemini-error-btn'), 'click', () => closeModal(elements.geminiInteractionModal));
        }
    }

    function updateStreak() {
        const today = new Date().toDateString();
        if (gameState.lastActiveDate !== today) {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            if (gameState.lastActiveDate === yesterday.toDateString()) {
                gameState.streak++;
            } else {
                gameState.streak = 1;
            }
            gameState.lastActiveDate = today;
            saveData();
        }
    }
    
    async function getGeminiExplanation(word) {
        const apiKey = "AIzaSyAKpm4N8yVqHwjhwdP9AKMJ9U1s2P3cKA8"; // <-- INSIRA A SUA CHAVE DE API DA GOOGLE AI STUDIO AQUI
        if (!apiKey) {
            throw new Error("API Key for Gemini is not set.");
        }
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;
        const prompt = `Como um tutor de inglês amigável, explique a palavra "${word}" para um aprendiz de nível intermédio. A sua resposta deve ser em português. Siga EXATAMENTE esta estrutura de formatação, usando os títulos entre asteriscos e separando cada secção com "---": *Introdução da Palavra* [Uma introdução curta e amigável sobre a palavra.] --- *Definição Simples* [Uma definição clara e concisa em uma frase.] --- *Dica para Memorizar* [Uma dica mnemónica ou uma associação divertida para ajudar a lembrar.] --- *Exemplos de Uso* - [Frase de exemplo em INGLÊS] (Tradução da frase em português) - [Outra frase de exemplo em INGLÊS] (Tradução da frase em português) - [Mais uma frase de exemplo em INGLÊS] (Tradução da frase em português)`;
        const payload = { contents: [{ parts: [{ text: prompt }] }] };
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!response.ok) throw new Error(`API da Gemini respondeu com o status: ${response.status}`);
        const data = await response.json();
        if (!data.candidates || !data.candidates[0].content.parts[0].text) throw new Error('Resposta da API da Gemini em formato inesperado.');
        return data.candidates[0].content.parts[0].text;
    }

    function parseAndDisplayGeminiInteraction(text, word) {
        elements.geminiInteractionLoading.classList.add('hidden');
        elements.geminiInteractionContent.classList.remove('hidden');
        elements.geminiInteractionWord.textContent = word;
        geminiResponseCache = {}; 
        const sections = text.split('---');
        let interactionHtml = '';
        sections.forEach(section => {
            const match = section.match(/\*(.*?)\*/);
            if (match && match[1]) {
                const title = match[1].trim();
                const content = section.replace(`*${title}*`, '').trim();
                geminiResponseCache[title] = content; 
                interactionHtml += `<button class="gemini-interaction-item" data-title="${title}"><span>${title}</span><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg></button>`;
            }
        });
        elements.geminiInteractionList.innerHTML = interactionHtml;
        elements.geminiInteractionButtons.innerHTML = `
            <button id="add-from-gemini-btn" class="flex-1 bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors btn-scale">Adicionar à Lista</button>
            <button id="next-from-gemini-btn" class="flex-1 bg-slate-200 dark:bg-slate-700 py-2 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors btn-scale">Próxima Palavra</button>
        `;
        safeOn($('add-from-gemini-btn'), 'click', () => {
            handleYes();
            closeModal(elements.geminiInteractionModal);
        });
        safeOn($('next-from-gemini-btn'), 'click', () => {
            closeModal(elements.geminiInteractionModal);
            setTimeout(startChallenge, 450);
        });
    }

    function showGeminiDetail(title) {
        const content = geminiResponseCache[title];
        if (!content) return;
        elements.geminiDetailTitle.textContent = title;
        const exampleRegex = /^- (.*?)\s\((.*?)\)$/gm;
        if (content.match(exampleRegex)) {
            let listHtml = content.replace(exampleRegex, (match, english, portuguese) => {
                return `<li class="gemini-flashcard-list-item"><span class="english-example">${english.trim()}</span><span class="portuguese-translation">${portuguese.trim()}</span></li>`;
            });
            elements.geminiDetailContent.innerHTML = `<ul class="gemini-flashcard-list">${listHtml}</ul>`;
        } else {
            elements.geminiDetailContent.innerHTML = `<p>${content.replace(/\n/g, '<br>')}</p>`;
        }
        openModal(elements.geminiDetailModal);
    }
    
    let activeModal = null;
    function openModal(modal) {
        if (!modal || isModalTransitioning) return;
        isModalTransitioning = true;
        activeModal = modal;
        modal.classList.add('active');
        gsap.to(modal, { opacity: 1, duration: 0.3 });
        gsap.fromTo(modal.querySelector('.modal-card'), { opacity: 0, scale: 0.95 }, { opacity: 1, scale: 1, duration: 0.3, ease: 'power2.out', onComplete: () => isModalTransitioning = false });
    }
    
    function openCelebrationModal(modal) {
        if (!modal || isModalTransitioning) return;
        isModalTransitioning = true;
        activeModal = modal;
        modal.classList.add('active');
        const card = modal.querySelector('.modal-card');
        const icon = card.querySelector('.celebration-icon');
        const texts = card.querySelectorAll('p, h3');
        gsap.to(modal, { opacity: 1, duration: 0.3 });
        gsap.fromTo(card, { opacity: 0, scale: 0.9, y: 50 }, { opacity: 1, scale: 1, y: 0, duration: 0.5, ease: 'power2.out' });
        if (icon) {
            gsap.fromTo(icon, { scale: 0.5, opacity: 0, rotation: -30 }, { scale: 1, opacity: 1, rotation: 0, duration: 0.5, ease: 'back.out(1.7)', delay: 0.2 });
        }
        gsap.fromTo(texts, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.1, delay: 0.4, onComplete: () => isModalTransitioning = false });
    }

    function closeModal(modal) {
        if (!modal || isModalTransitioning) return;
        isModalTransitioning = true;
        if (modal !== elements.geminiDetailModal) {
            activeModal = null;
        }
        gsap.to(modal.querySelector('.modal-card'), { opacity: 0, scale: 0.95, duration: 0.3, ease: 'power2.in' });
        gsap.to(modal, { opacity: 0, duration: 0.3, delay: 0.1, onComplete: () => {
            modal.classList.remove('active');
            isModalTransitioning = false;
        }});
    }
    
    function showLevelUpModal(levelName, iconSVG) {
        if (activeModal) {
            setTimeout(() => showLevelUpModal(levelName, iconSVG), 450);
            return;
        }
        elements.levelUpModalTitle.textContent = levelName;
        // A lógica do ícone SVG pode ser melhorada, mas por agora usamos um emoji
        elements.levelUpIcon.innerHTML = `<div class="celebration-icon text-5xl">${iconSVG}</div>`;
        openCelebrationModal(elements.levelUpModal);
    }

    function populateAndShowWordList() {
        updateUI(); 
        if (vocabulary.length === 0) {
            elements.wordListInModal.innerHTML = '';
            elements.emptyListMsgInModal.classList.remove('hidden');
        } else {
            elements.emptyListMsgInModal.classList.add('hidden');
            elements.wordListInModal.innerHTML = vocabulary.map(word => `<li data-word="${word}" class="capitalize py-1 px-2 rounded-md cursor-pointer transition-colors hover:bg-slate-200 dark:hover:bg-slate-700">${word}</li>`).join('');
        }
        openModal(elements.myListModal);
    }
    
    async function showWordDetails(word) {
        if (activeModal && activeModal !== elements.wordDetailsModal) {
             setTimeout(() => showWordDetails(word), 450);
             return;
        }
        openModal(elements.wordDetailsModal);
        elements.modalContent.classList.add('hidden');
        elements.modalSpinner.classList.remove('hidden');
        try {
            const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
            if (!response.ok) throw new Error('API request failed');
            const data = await response.json();
            elements.modalWord.textContent = data[0].word;
            elements.modalDefinition.textContent = data[0].meanings[0].definitions[0].definition;
            elements.modalExample.textContent = `"${data[0].meanings[0].definitions[0].example || 'Sem exemplo disponível.'}"`;
        } catch (error) {
            elements.modalWord.textContent = word;
            elements.modalDefinition.textContent = 'Não foi possível encontrar os detalhes para esta palavra.';
            elements.modalExample.textContent = '';
        } finally {
            elements.modalSpinner.classList.add('hidden');
            elements.modalContent.classList.remove('hidden');
        }
    }
    
    function handleClearList() {
        closeModal(elements.myListModal);
        setTimeout(() => openModal(elements.confirmModal), 450);
    }

    function populateAndShowStoriesModal() {
        const userWordCount = vocabulary.length;
        elements.storiesContainer.innerHTML = ''; 
        stories.forEach(story => {
            const isUnlocked = userWordCount >= story.unlockThreshold;
            let storyHTML = '';
            if (isUnlocked) {
                const highlightedText = story.text.replace(/\*\*(.*?)\*\*/g, (match, word) => {
                    const cleanWord = word.toLowerCase();
                    const isKnown = vocabulary.includes(cleanWord);
                    return `<span class="${isKnown ? 'font-bold text-indigo-500 dark:text-indigo-400' : ''}">${word}</span>`;
                });
                storyHTML = `<div class="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm"><h4 class="text-lg font-semibold mb-2">${story.title}</h4><p class="text-slate-600 dark:text-slate-300 leading-relaxed">${highlightedText}</p></div>`;
            } else {
                storyHTML = `<div class="bg-slate-200 dark:bg-slate-800/50 p-4 rounded-lg text-center opacity-60"><p class="font-semibold text-slate-600 dark:text-slate-400">🔒 Bloqueada</p><p class="text-sm text-slate-500 dark:text-slate-400">Alcance ${story.unlockThreshold} palavras para desbloquear.</p></div>`;
            }
            elements.storiesContainer.innerHTML += storyHTML;
        });
        openModal(elements.storiesModal);
    }

    function isoDay(ts) { return new Date(ts).toISOString().slice(0, 10); }
    
    function aggregateDailyLearned(events, days) {
        const end = new Date();
        const start = new Date(Date.now() - (days - 1) * 24 * 3600 * 1000);
        const map = {};
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            map[isoDay(d)] = 0;
        }
        events.forEach(e => {
            if (e.type === 'word_known') {
                const day = isoDay(e.timestamp);
                if (map.hasOwnProperty(day)) map[day]++;
            }
        });
        return Object.entries(map).map(([date, count]) => ({ date, count }));
    }
    
    function aggregateCategoryDistribution(events) {
        const map = {};
        events.forEach(e => {
            if (e.type === 'word_known') {
                const cat = e.category || 'Geral';
                map[cat] = (map[cat] || 0) + 1;
            }
        });
        return Object.entries(map).map(([category, count]) => ({ category, count }));
    }

    function renderDailyChart(days = 30) {
        if (!elements.dailyLearnedChartCanvas) return;
        elements.statsLoadingMsg.classList.add('hidden');
        elements.dailyLearnedChartCanvas.classList.remove('hidden');
        const dailyData = aggregateDailyLearned(vocaEvents, days);
        const isDark = document.documentElement.classList.contains('dark');
        const chartData = {
            labels: dailyData.map(d => d.date.slice(5)), 
            datasets: [{
                label: 'Palavras Aprendidas',
                data: dailyData.map(d => d.count),
                borderColor: '#4f46e5',
                backgroundColor: 'rgba(79, 70, 229, 0.1)',
                fill: true,
                tension: 0.4,
            }]
        };
        const chartOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, ticks: { precision: 0, color: isDark ? '#94a3b8' : '#475569' }, grid: { color: isDark ? '#334155' : '#e2e8f0' } },
                x: { ticks: { color: isDark ? '#94a3b8' : '#475569' }, grid: { color: isDark ? '#334155' : '#e2e8f0' } }
            }
        };
        if (dailyChartInstance) dailyChartInstance.destroy();
        dailyChartInstance = new Chart(elements.dailyLearnedChartCanvas.getContext('2d'), { type: 'line', data: chartData, options: chartOptions });
        document.querySelectorAll('.stats-period-btn').forEach(btn => {
            btn.classList.toggle('active', parseInt(btn.dataset.period) === days);
        });
    }

    function renderCategoryChart() {
        if (!elements.categoryChartCanvas) return;
        elements.categoryStatsLoadingMsg.classList.add('hidden');
        elements.categoryChartCanvas.classList.remove('hidden');
        const categoryData = aggregateCategoryDistribution(vocaEvents);
        const isDark = document.documentElement.classList.contains('dark');
        const chartData = {
            labels: categoryData.map(d => d.category),
            datasets: [{
                label: 'Distribuição por Categoria',
                data: categoryData.map(d => d.count),
                backgroundColor: ['#4f46e5', '#0ea5e9', '#f59e0b', '#ef4444', '#10b981', '#8b5cf6', '#d946ef'],
                borderColor: isDark ? '#1e293b' : '#fff',
                borderWidth: 2,
            }]
        };
        const chartOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom', labels: { color: isDark ? '#94a3b8' : '#475569', boxWidth: 12, padding: 20 } } }
        };
        if (categoryChartInstance) categoryChartInstance.destroy();
        categoryChartInstance = new Chart(elements.categoryChartCanvas.getContext('2d'), { type: 'doughnut', data: chartData, options: chartOptions });
    }

    function showStatsModal() {
        openModal(elements.statsModal);
        if (elements.dailyLearnedChartCanvas) elements.dailyLearnedChartCanvas.classList.add('hidden');
        if (elements.statsLoadingMsg) elements.statsLoadingMsg.classList.remove('hidden');
        if (elements.categoryChartCanvas) elements.categoryChartCanvas.classList.add('hidden');
        if (elements.categoryStatsLoadingMsg) elements.categoryStatsLoadingMsg.classList.remove('hidden');
        setTimeout(() => {
            renderDailyChart(30);
            renderCategoryChart();
        }, 200);
    }
    
    function generateShareCard() {
        const wordCount = vocabulary.length;
        const streak = gameState.streak;
        const level = levels.slice().reverse().find(l => wordCount >= l.threshold)?.name || 'Novice';
        if (elements.shareNickname) elements.shareNickname.textContent = userProfile.nickname;
        if (elements.shareAvatar) elements.shareAvatar.src = `https://storage.googleapis.com/gemini-prod-us-west1-assets/avatars/${userProfile.avatar}`;
        if (elements.shareWordCount) elements.shareWordCount.textContent = wordCount;
        if (elements.shareStreakCount) elements.shareStreakCount.textContent = streak;
        if (elements.shareLevel) elements.shareLevel.textContent = level;
        if (elements.shareCard) {
            elements.shareCard.classList.add('share-card-gradient');
            html2canvas(elements.shareCard, { useCORS: true }).then(canvas => {
                const link = document.createElement('a');
                link.download = 'meu-progresso-voca.png';
                link.href = canvas.toDataURL('image/png');
                link.click();
                elements.shareCard.classList.remove('share-card-gradient');
             }).catch(err => {
                console.error('Erro ao gerar imagem:', err);
                elements.shareCard.classList.remove('share-card-gradient');
            });
        }
    }

    function populateAndShowSettingsModal() {
        elements.nicknameInput.value = userProfile.nickname;
        selectedAvatar = userProfile.avatar;
        elements.avatarSelectionGrid.innerHTML = avatars.map(avatarFile => `<img src="https://storage.googleapis.com/gemini-prod-us-west1-assets/avatars/${avatarFile}" alt="Avatar" data-avatar="${avatarFile}" class="avatar-item ${avatarFile === selectedAvatar ? 'selected' : ''}">`).join('');
        openModal(elements.settingsModal);
    }

    function handleAvatarSelection(e) {
        if (e.target.classList.contains('avatar-item')) {
            document.querySelectorAll('.avatar-item.selected').forEach(el => el.classList.remove('selected'));
            e.target.classList.add('selected');
            selectedAvatar = e.target.dataset.avatar;
        }
    }
    
    function handleSaveSettings() {
        userProfile.nickname = elements.nicknameInput.value.trim() || 'WordMaster';
        userProfile.avatar = selectedAvatar;
        saveData();
        closeModal(elements.settingsModal);
    }

    function initTheme() {
        if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            document.documentElement.classList.add('dark');
            elements.themeIconLight.classList.remove('hidden');
            elements.themeIconDark.classList.add('hidden');
        } else {
            document.documentElement.classList.remove('dark');
            elements.themeIconLight.classList.add('hidden');
            elements.themeIconDark.classList.remove('hidden');
        }
    }

    function toggleTheme() {
        const isDark = document.documentElement.classList.toggle('dark');
        localStorage.theme = isDark ? 'dark' : 'light';
        elements.themeIconLight.classList.toggle('hidden', !isDark);
        elements.themeIconDark.classList.toggle('hidden', isDark);
    }

    function handleCloseDetailsModal() {
        closeModal(elements.wordDetailsModal);
        if (modalOrigin === elements.myListModal) {
            setTimeout(() => {
                populateAndShowWordList();
                modalOrigin = null; 
            }, 450);
        }
    }

    function startInteractiveOnboarding() {
        const driver = window.driver.js.driver;
        const driverObj = driver({
            showProgress: true,
            steps: [
                { 
                    element: '#challenge-card', 
                    popover: { 
                        title: 'Bem-vindo(a) ao VOCA!', 
                        description: 'Olá, aventureiro! Tudo começa aqui. Vamos descobrir a sua primeira palavra juntos.',
                    } 
                },
                { 
                    element: '#challenge-buttons', 
                    popover: { 
                        title: 'A Decisão é Sua', 
                        description: 'Uma palavra irá aparecer. Use estes botões para nos dizer se já a conhece ou se quer aprender mais sobre ela com a ajuda da nossa IA.',
                    } 
                },
                { 
                    element: '#word-count', 
                    popover: { 
                        title: 'O Seu Tesouro', 
                        description: 'Cada palavra que colecionar será adicionada aqui. Veja o seu conhecimento a crescer!',
                    } 
                },
                { 
                    element: '#show-list-btn', 
                    popover: { 
                        title: 'O Seu Diário de Bordo', 
                        description: 'E aqui fica o seu "diário", com todas as palavras que já descobriu. Pode consultá-lo quando quiser. Agora, a aventura é sua!',
                        side: "left",
                        align: 'start'
                    } 
                }
            ],
            onDestroyed: () => {
                finishOnboarding();
            }
        });

        function finishOnboarding() {
            if (gameState.isFirstVisit) {
                gameState.isFirstVisit = false;
                saveData();
                startChallenge();
            }
        }
        
        const startBtn = $('start-challenge-btn');
        if (startBtn) startBtn.click();
        
        driverObj.drive();
    }
    
    function initializeApp() {
        initTheme();
        updateUI();
        
        gsap.to('.card', {
            duration: 0.8,
            opacity: 1,
            y: 0,
            stagger: 0.2,
            ease: 'power2.out',
            delay: 0.2
        });

        safeOn(elements.themeToggle, 'click', toggleTheme);
        safeOn($('start-challenge-btn'), 'click', startChallenge);
        safeOn(elements.showListBtn, 'click', populateAndShowWordList);
        safeOn(elements.showStatsBtn, 'click', showStatsModal);
        safeOn(elements.showStoriesBtn, 'click', populateAndShowStoriesModal);
        safeOn(elements.shareProgressBtn, 'click', generateShareCard);
        safeOn(elements.settingsBtn, 'click', populateAndShowSettingsModal);
        safeOn(elements.closeLevelUpModalBtn, 'click', () => closeModal(elements.levelUpModal));
        safeOn(elements.closeMyListModalBtn, 'click', () => closeModal(elements.myListModal));
        safeOn(elements.closeModalBtn, 'click', handleCloseDetailsModal);
        safeOn(elements.closeAchievementModalBtn, 'click', () => closeModal(elements.achievementModal));
        safeOn(elements.closeStatsModalBtn, 'click', () => closeModal(elements.statsModal));
        safeOn(elements.closeStoriesModalBtn, 'click', () => closeModal(elements.storiesModal));
        safeOn(elements.closeSettingsModalBtn, 'click', () => closeModal(elements.settingsModal));
        safeOn(elements.saveSettingsBtn, 'click', handleSaveSettings);
        safeOn(elements.avatarSelectionGrid, 'click', handleAvatarSelection);
        safeOn(elements.confirmCancelBtn, 'click', () => { 
            closeModal(elements.confirmModal);
            setTimeout(populateAndShowWordList, 450);
        });
        safeOn(elements.clearListBtnInModal, 'click', handleClearList);
        safeOn(elements.confirmDeleteBtn, 'click', () => {
            vocabulary = [];
            vocaEvents = [];
            gameState.streak = 0;
            saveData();
            updateUI();
            closeModal(elements.confirmModal);
        });
        safeOn(elements.wordListInModal, 'click', (e) => {
            if (e.target.tagName === 'LI') {
                const word = e.target.dataset.word;
                modalOrigin = elements.myListModal; 
                closeModal(elements.myListModal);
                setTimeout(() => showWordDetails(word), 450);
            }
        });
        safeOn(elements.statsPeriodSelector, 'click', (e) => {
            if(e.target.classList.contains('stats-period-btn')) {
                const days = parseInt(e.target.dataset.period);
                renderDailyChart(days);
            }
        });
        safeOn(elements.geminiInteractionList, 'click', (e) => {
            const item = e.target.closest('.gemini-interaction-item');
            if (item) {
                const title = item.dataset.title;
                showGeminiDetail(title);
            }
        });
        safeOn(elements.closeGeminiDetailModalBtn, 'click', () => closeModal(elements.geminiDetailModal));
        
        if (gameState.isFirstVisit) {
            setTimeout(startInteractiveOnboarding, 500);
        } else {
            const startBtn = $('start-challenge-btn');
            if (startBtn) startBtn.click();
        }
    }

    fetch('words.json')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            wordsList = data;
            initializeApp();
        })
        .catch(error => {
            console.error('Erro fatal: Não foi possível carregar a lista de palavras.', error);
            const mainContent = document.querySelector('main');
            if (mainContent) {
                mainContent.innerHTML = `
                    <div class="col-span-1 lg:col-span-2 text-center p-8 bg-red-100 dark:bg-red-900/50 rounded-2xl">
                        <h2 class="text-2xl font-bold text-red-700 dark:text-red-300 mb-2">Erro Crítico</h2>
                        <p class="text-red-600 dark:text-red-400">Não foi possível carregar o ficheiro de palavras (words.json). Por favor, verifique se o ficheiro existe no local correto e tente recarregar a página.</p>
                    </div>
                `;
            }
        });

});
