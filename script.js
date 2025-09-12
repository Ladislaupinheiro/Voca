document.addEventListener('DOMContentLoaded', () => {

    // =================================================================================
    // FUNÇÕES DE SEGURANÇA E HELPERS
    // =================================================================================

    const $ = (id) => document.getElementById(id);

    const safeOn = (el, ev, fn) => {
        if (el) el.addEventListener(ev, fn);
    };

    const safeParse = (key, fallback) => {
        try {
            const raw = localStorage.getItem(key);
            return raw ? JSON.parse(raw) : fallback;
        } catch (err)
        {
            console.warn(`Falha ao analisar a chave do localStorage "${key}"`, err);
            localStorage.removeItem(key);
            return fallback;
        }
    };

    // =================================================================================
    // ESTADO DA APLICAÇÃO
    // =================================================================================

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

    const commonWords = [
        { word: 'a', category: 'Artigo' }, { word: 'about', category: 'Conector' }, { word: 'all', category: 'Adjetivo' }, 
        { word: 'also', category: 'Advérbio' }, { word: 'an', category: 'Artigo' }, { word: 'and', category: 'Conector' }, 
        { word: 'any', category: 'Adjetivo' }, { word: 'are', category: 'Verbo' }, { word: 'as', category: 'Conector' }, 
        { word: 'at', category: 'Conector' }, { word: 'be', category: 'Verbo' }, { word: 'been', category: 'Verbo' }, 
        { word: 'but', category: 'Conector' }, { word: 'by', category: 'Conector' }, { word: 'can', category: 'Verbo' }, 
        { word: 'car', category: 'Transporte' }, { word: 'city', category: 'Lugar' },
        { word: 'come', category: 'Verbo' }, { word: 'could', category: 'Verbo' }, { word: 'day', category: 'Tempo' }, 
        { word: 'do', category: 'Verbo' }, { word: 'does', category: 'Verbo' }, { word: 'down', category: 'Advérbio' }, 
        { word: 'each', category: 'Adjetivo' }, { word: 'eat', category: 'Ação' }, { word: 'even', category: 'Advérbio' }, { word: 'every', category: 'Adjetivo' }, 
        { word: 'find', category: 'Verbo' }, { word: 'first', category: 'Adjetivo' }, { word: 'food', category: 'Comida' }, { word: 'for', category: 'Conector' }, 
        { word: 'from', category: 'Conector' }, { word: 'get', category: 'Verbo' }, { word: 'give', category: 'Verbo' }, 
        { word: 'go', category: 'Verbo' }, { word: 'good', category: 'Adjetivo' }, { word: 'great', category: 'Adjetivo' }, 
        { word: 'had', category: 'Verbo' }, { word: 'has', category: 'Verbo' }, { word: 'have', category: 'Verbo' }, 
        { word: 'he', category: 'Pessoa' }, { word: 'her', category: 'Pessoa' }, { word: 'here', category: 'Lugar' }, 
        { word: 'him', category: 'Pessoa' }, { word: 'his', category: 'Pessoa' }, { word: 'how', category: 'Advérbio' }, 
        { word: 'I', category: 'Pessoa' }, { word: 'if', category: 'Conector' }, { word: 'in', category: 'Conector' }, 
        { word: 'into', category: 'Conector' }, { word: 'is', category: 'Verbo' }, { word: 'it', category: 'Objeto' }, 
        { word: 'its', category: 'Objeto' }, { word: 'just', category: 'Advérbio' }, { word: 'know', category: 'Verbo' }, 
        { word: 'like', category: 'Verbo' }, { word: 'look', category: 'Verbo' }, { word: 'made', category: 'Verbo' }, 
        { word: 'make', category: 'Verbo' }, { word: 'man', category: 'Pessoa' }, { word: 'many', category: 'Adjetivo' }, 
        { word: 'me', category: 'Pessoa' }, { word: 'men', category: 'Pessoa' }, { word: 'more', category: 'Advérbio' }, 
        { word: 'most', category: 'Advérbio' }, { word: 'my', category: 'Pessoa' }, { word: 'new', category: 'Adjetivo' }, 
        { word: 'no', category: 'Advérbio' }, { word: 'not', category: 'Advérbio' }, { word: 'now', category: 'Tempo' }, 
        { word: 'of', category: 'Conector' }, { word: 'on', category: 'Conector' }, { word: 'one', category: 'Adjetivo' }, 
        { word: 'only', category: 'Advérbio' }, { word: 'or', category: 'Conector' }, { word: 'other', category: 'Adjetivo' }, 
        { word: 'our', category: 'Pessoa' }, { word: 'out', category: 'Advérbio' }, { word: 'people', category: 'Pessoa' }, 
        { word: 'said', category: 'Verbo' }, { word: 'same', category: 'Adjetivo' }, { word: 'see', category: 'Verbo' }, 
        { word: 'she', category: 'Pessoa' }, { word: 'so', category: 'Advérbio' }, { word: 'some', category: 'Adjetivo' }, 
        { word: 'such', category: 'Adjetivo' }, { word: 'take', category: 'Verbo' }, { word: 'tell', category: 'Verbo' }, 
        { word: 'than', category: 'Conector' }, { word: 'that', category: 'Conector' }, { word: 'the', category: 'Artigo' }, 
        { word: 'their', category: 'Pessoa' }, { word: 'them', category: 'Pessoa' }, { word: 'then', category: 'Tempo' }, 
        { word: 'there', category: 'Lugar' }, { word: 'these', category: 'Adjetivo' }, { word: 'they', category: 'Pessoa' }, 
        { word: 'thing', category: 'Objeto' }, { word: 'think', category: 'Verbo' }, { word: 'this', category: 'Adjetivo' }, 
        { word: 'those', category: 'Adjetivo' }, { word: 'time', category: 'Tempo' }, { word: 'to', category: 'Conector' }, 
        { word: 'two', category: 'Adjetivo' }, { word: 'up', category: 'Advérbio' }, { word: 'us', category: 'Pessoa' }, 
        { word: 'use', category: 'Verbo' }, { word: 'very', category: 'Advérbio' }, { word: 'want', category: 'Verbo' }, 
        { word: 'was', category: 'Verbo' }, { word: 'water', category: 'Comida' }, { word: 'way', category: 'Objeto' }, { word: 'we', category: 'Pessoa' }, 
        { word: 'well', category: 'Advérbio' }, { word: 'went', category: 'Verbo' }, { word: 'were', category: 'Verbo' }, 
        { word: 'what', category: 'Conector' }, { word: 'when', category: 'Tempo' }, { word: 'which', category: 'Conector' }, 
        { word: 'who', category: 'Pessoa' }, { word: 'will', category: 'Verbo' }, { word: 'with', category: 'Conector' }, 
        { word: 'woman', category: 'Pessoa' }, { word: 'women', category: 'Pessoa' }, { word: 'word', category: 'Objeto' }, 
        { word: 'work', category: 'Verbo' }, { word: 'world', category: 'Lugar' }, { word: 'would', category: 'Verbo' }, 
        { word: 'year', category: 'Tempo' }, { word: 'yes', category: 'Advérbio' }, { word: 'you', category: 'Pessoa' }, 
        { word: 'your', category: 'Pessoa' }, { word: 'bread', category: 'Comida' }, { word: 'computer', category: 'Tecnologia' }, { word: 'email', category: 'Tecnologia' }
    ];

    const levels = [
        { name: 'Novice', threshold: 0 },
        { name: 'Apprentice', threshold: 50 },
        { name: 'Adept', threshold: 150 },
        { name: 'Expert', threshold: 300 },
        { name: 'Master', threshold: 500 },
        { name: 'Grandmaster', threshold: 1000 },
    ];

    const achievements = [
        { id: '10_words', threshold: 10, text: 'Primeiras 10 palavras!' },
        { id: '25_words', threshold: 25, text: 'Impressionante! 25 palavras.' },
        { id: '50_words', threshold: 50, text: 'Meio caminho para 100!' },
        { id: '100_words', threshold: 100, text: 'Centurião do Vocabulário!' },
        { id: '200_words', threshold: 200, text: 'Duzentas palavras dominadas!' },
    ];

    const stories = [
        {
            id: 'story_1',
            title: 'A Quick Meal 🥪',
            unlockThreshold: 10,
            text: "A **man** is hungry. He wants to **eat** some **food**. He has **bread** and drinks **water**. It is a **good** and simple meal."
        },
        {
            id: 'story_2',
            title: 'A Trip to the City 🚗',
            unlockThreshold: 25,
            text: "We **go** to the **city** in a **car**. We **see** many **people**. It is a busy **day**."
        },
        {
            id: 'story_3',
            title: 'At Work 💻',
            unlockThreshold: 50,
            text: "It is **time** to **work**. I sit at my **computer** and read an **email**. I **think** about a **new** idea for a long **time**."
        }
    ];

    const avatars = [ 'avatar_1.png', 'avatar_2.png', 'avatar_3.png', 'avatar_4.png', 'avatar_5.png', 'avatar_6.png' ];
    let selectedAvatar = userProfile.avatar;

    // =================================================================================
    // ELEMENTOS DO DOM
    // =================================================================================

    const elements = {
        themeToggle: $('theme-toggle'),
        themeIconLight: $('theme-icon-light'),
        themeIconDark: $('theme-icon-dark'),
        wordCountEl: $('word-count'),
        levelTitleEl: $('level-title'),
        streakCountEl: $('streak-count'),
        challengeWordContainer: $('challenge-word-container'),
        challengeWordEl: $('challenge-word'),
        challengeButtonsContainer: $('challenge-buttons'),
        startChallengeBtn: $('start-challenge-btn'),
        showListBtn: $('show-list-btn'),
        showStatsBtn: $('show-stats-btn'),
        showStoriesBtn: $('show-stories-btn'),
        settingsBtn: $('settings-btn'),
        
        // Modais
        welcomeModal: $('welcome-modal'),
        levelUpModal: $('level-up-modal'),
        myListModal: $('my-list-modal'),
        wordDetailsModal: $('word-details-modal'),
        confirmModal: $('confirm-modal'),
        achievementModal: $('achievement-modal'),
        statsModal: $('stats-modal'),
        storiesModal: $('stories-modal'),
        settingsModal: $('settings-modal'),

        // Botões de fechar e de ações dos modais
        closeWelcomeModalBtn: $('close-welcome-modal-btn'),
        closeLevelUpModalBtn: $('close-level-up-modal-btn'),
        closeMyListModalBtn: $('close-my-list-modal-btn'),
        closeModalBtn: $('close-modal-btn'),
        confirmCancelBtn: $('confirm-cancel-btn'),
        confirmDeleteBtn: $('confirm-delete-btn'),
        closeAchievementModalBtn: $('close-achievement-modal-btn'),
        closeStatsModalBtn: $('close-stats-modal-btn'),
        closeStoriesModalBtn: $('close-stories-modal-btn'),
        closeSettingsModalBtn: $('close-settings-modal-btn'),
        saveSettingsBtn: $('save-settings-btn'),

        // Conteúdo dos modais
        levelUpModalTitle: $('level-up-modal-title'),
        wordListInModal: $('word-list-in-modal'),
        emptyListMsgInModal: $('empty-list-msg-in-modal'),
        clearListBtnInModal: $('clear-list-btn-in-modal'),
        modalSpinner: $('modal-spinner'),
        modalContent: $('modal-content'),
        modalWord: $('modal-word'),
        modalDefinition: $('modal-definition'),
        modalExample: $('modal-example'),
        achievementModalText: $('achievement-modal-text'),
        storiesContainer: $('stories-container'),

        // Estatísticas
        statsPeriodSelector: $('stats-period-selector'),
        statsLoadingMsg: $('stats-loading-msg'),
        dailyLearnedChartCanvas: $('daily-learned-chart'),
        categoryChartCanvas: $('category-chart'),
        categoryStatsLoadingMsg: $('category-stats-loading-msg'),

        // Partilha
        generateShareCardBtn: $('generate-share-card-btn'),
        shareCardTemplate: $('share-card-template'),
        shareCardWords: $('share-card-words'),
        shareCardStreak: $('share-card-streak'),
        shareCardLevel: $('share-card-level'),
        shareCardNickname: $('share-nickname'),
        shareCardAvatar: $('share-avatar'),

        // Configurações
        nicknameInput: $('nickname-input'),
        avatarSelectionGrid: $('avatar-selection-grid'),
    };

    // =================================================================================
    // FUNÇÕES PRINCIPAIS
    // =================================================================================

    const saveData = () => {
        localStorage.setItem('vocabulary', JSON.stringify(vocabulary));
        localStorage.setItem('gameState', JSON.stringify(gameState));
        localStorage.setItem('voca_events', JSON.stringify(vocaEvents));
        localStorage.setItem('userProfile', JSON.stringify(userProfile));
    };

    const recordEvent = (type, word, category) => {
        const event = {
            type: type,
            word: word,
            category: category || 'Geral',
            timestamp: new Date().toISOString(),
        };
        vocaEvents.push(event);
    };

    const updateUI = () => {
        const count = vocabulary.length;
        if (elements.wordCountEl) elements.wordCountEl.textContent = count;

        const currentLevel = levels.slice().reverse().find(l => count >= l.threshold) || levels[0];
        if (elements.levelTitleEl) elements.levelTitleEl.textContent = currentLevel.name;
        
        if(elements.streakCountEl) elements.streakCountEl.textContent = `↑ ${gameState.streak} dia(s) de streak`;

        checkAchievements(count);
    };
    
    const checkAchievements = (count) => {
        const lastLevel = levels.slice().reverse().find(l => (count - 1) >= l.threshold) || levels[0];
        const currentLevel = levels.slice().reverse().find(l => count >= l.threshold) || levels[0];

        if (currentLevel.name !== lastLevel.name && count > 0) {
            showLevelUpModal(currentLevel.name);
        }

        achievements.forEach(ach => {
            if (count >= ach.threshold && !gameState.unlockedAchievements.includes(ach.id)) {
                gameState.unlockedAchievements.push(ach.id);
                showAchievementModal(ach.text);
            }
        });
    };
    
    const startChallenge = () => {
        const availableWords = commonWords.filter(wordObj => !vocabulary.includes(wordObj.word.toLowerCase()));
        if (availableWords.length === 0) {
            elements.challengeWordContainer.innerHTML = '<p class="text-center">Parabéns! Você conhece todas as palavras da lista!</p>';
            elements.challengeButtonsContainer.innerHTML = '';
            return;
        }

        currentWordObject = availableWords[Math.floor(Math.random() * availableWords.length)];
        elements.challengeWordEl.textContent = currentWordObject.word;
        
        if (!elements.challengeButtonsContainer.querySelector('#yes-btn')) {
             elements.challengeButtonsContainer.innerHTML = `
                <button id="yes-btn" class="flex-1 bg-green-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-green-600 transition-colors btn-scale">Sim, conheço</button>
                <button id="no-btn" class="flex-1 bg-red-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-red-600 transition-colors btn-scale">Não conheço</button>
            `;
        }
        
        safeOn($('yes-btn'), 'click', handleYes);
        safeOn($('no-btn'), 'click', handleNo);
    };
    
    const handleYes = () => {
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
    };

    const handleNo = () => {
        startChallenge();
    };

    const updateStreak = () => {
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
        }
    };
    
    // =================================================================================
    // LÓGICA DOS MODAIS
    // =================================================================================
    
    let activeModal = null;
    const openModal = (modal) => {
        if (!modal || isModalTransitioning) return;
        isModalTransitioning = true;
        activeModal = modal;
        modal.classList.add('active');
        gsap.to(modal, { opacity: 1, duration: 0.3 });
        gsap.fromTo(modal.querySelector('.modal-card'), 
            { opacity: 0, scale: 0.95 }, 
            { opacity: 1, scale: 1, duration: 0.3, ease: 'power2.out', onComplete: () => isModalTransitioning = false }
        );
    };

    const closeModal = (modal) => {
        if (!modal || isModalTransitioning) return;
        isModalTransitioning = true;
        activeModal = null;
        gsap.to(modal.querySelector('.modal-card'), { 
            opacity: 0, scale: 0.95, duration: 0.3, ease: 'power2.in' 
        });
        gsap.to(modal, { 
            opacity: 0, duration: 0.3, delay: 0.1, onComplete: () => {
                modal.classList.remove('active');
                isModalTransitioning = false;
            }
        });
    };
    
    const showLevelUpModal = (levelName) => {
        if (activeModal) {
            setTimeout(() => showLevelUpModal(levelName), 450);
            return;
        }
        elements.levelUpModalTitle.textContent = levelName;
        openModal(elements.levelUpModal);
    };

    const showAchievementModal = (text) => {
        if (activeModal) {
            setTimeout(() => showAchievementModal(text), 450);
            return;
        }
        elements.achievementModalText.textContent = text;
        openModal(elements.achievementModal);
    };

    const populateAndShowWordList = () => {
        updateUI(); 
        if (vocabulary.length === 0) {
            elements.wordListInModal.innerHTML = '';
            elements.emptyListMsgInModal.classList.remove('hidden');
        } else {
            elements.emptyListMsgInModal.classList.add('hidden');
            elements.wordListInModal.innerHTML = vocabulary.map(word => 
                `<li data-word="${word}" class="capitalize p-2 rounded-md cursor-pointer transition-colors hover:bg-slate-200 dark:hover:bg-slate-700">${word}</li>`
            ).join('');
        }
        openModal(elements.myListModal);
    };
    
    const showWordDetails = async (word) => {
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
    };
    
    const handleClearList = () => {
        closeModal(elements.myListModal);
        setTimeout(() => openModal(elements.confirmModal), 450);
    };

    // =================================================================================
    // LÓGICA DAS HISTÓRIAS, ESTATÍSTICAS E PARTILHA
    // =================================================================================
    
    const populateAndShowStoriesModal = () => {
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

                storyHTML = `
                    <div class="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm">
                        <h4 class="text-lg font-semibold mb-2">${story.title}</h4>
                        <p class="text-slate-600 dark:text-slate-300 leading-relaxed">${highlightedText}</p>
                    </div>
                `;
            } else {
                storyHTML = `
                    <div class="bg-slate-200 dark:bg-slate-800/50 p-4 rounded-lg text-center opacity-60">
                        <p class="font-semibold text-slate-600 dark:text-slate-400">🔒 Bloqueada</p>
                        <p class="text-sm text-slate-500 dark:text-slate-400">Alcance ${story.unlockThreshold} palavras para desbloquear.</p>
                    </div>
                `;
            }
            elements.storiesContainer.innerHTML += storyHTML;
        });

        openModal(elements.storiesModal);
    };

    const isoDay = (ts) => new Date(ts).toISOString().slice(0, 10);

    const aggregateDailyLearned = (events, days) => {
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
    };
    
    const aggregateCategoryDistribution = (events) => {
        const map = {};
        events.forEach(e => {
            if (e.type === 'word_known') {
                const cat = e.category || 'Geral';
                map[cat] = (map[cat] || 0) + 1;
            }
        });
        return Object.entries(map).map(([category, count]) => ({ category, count }));
    };

    const renderDailyChart = (days = 30) => {
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

        if (dailyChartInstance) {
            dailyChartInstance.destroy();
        }
        dailyChartInstance = new Chart(elements.dailyLearnedChartCanvas.getContext('2d'), {
            type: 'line',
            data: chartData,
            options: chartOptions,
        });

        document.querySelectorAll('.stats-period-btn').forEach(btn => {
            btn.classList.toggle('active', parseInt(btn.dataset.days) === days);
        });
    };

    const renderCategoryChart = () => {
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
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: isDark ? '#94a3b8' : '#475569',
                        boxWidth: 12,
                        padding: 20,
                    }
                }
            }
        };

        if (categoryChartInstance) {
            categoryChartInstance.destroy();
        }
        categoryChartInstance = new Chart(elements.categoryChartCanvas.getContext('2d'), {
            type: 'doughnut',
            data: chartData,
            options: chartOptions,
        });
    };

    const showStatsModal = () => {
        openModal(elements.statsModal);
        elements.dailyLearnedChartCanvas.classList.add('hidden');
        elements.statsLoadingMsg.classList.remove('hidden');
        elements.categoryChartCanvas.classList.add('hidden');
        elements.categoryStatsLoadingMsg.classList.remove('hidden');
        
        setTimeout(() => {
            renderDailyChart(30);
            renderCategoryChart();
        }, 200);
    };
    
    const generateShareCard = () => {
        const wordCount = vocabulary.length;
        const streak = gameState.streak;
        const level = levels.slice().reverse().find(l => wordCount >= l.threshold)?.name || 'Novice';

        elements.shareCardNickname.textContent = userProfile.nickname;
        elements.shareCardAvatar.src = `https://storage.googleapis.com/gemini-prod-us-west1-assets/avatars/${userProfile.avatar}`;
        elements.shareCardWords.textContent = wordCount;
        elements.shareCardStreak.textContent = streak;
        elements.shareCardLevel.textContent = level;

        html2canvas(elements.shareCardTemplate).then(canvas => {
            const link = document.createElement('a');
            link.download = 'meu-progresso-voca.png';
            link.href = canvas.toDataURL('image/png');
            link.click();
        });
    };

    const populateAndShowSettingsModal = () => {
        elements.nicknameInput.value = userProfile.nickname;
        selectedAvatar = userProfile.avatar;
        
        elements.avatarSelectionGrid.innerHTML = avatars.map(avatarFile => `
            <img src="https://storage.googleapis.com/gemini-prod-us-west1-assets/avatars/${avatarFile}" 
                 alt="Avatar" 
                 data-avatar="${avatarFile}" 
                 class="avatar-item ${avatarFile === selectedAvatar ? 'selected' : ''}">
        `).join('');

        openModal(elements.settingsModal);
    };

    const handleAvatarSelection = (e) => {
        if (e.target.classList.contains('avatar-item')) {
            document.querySelectorAll('.avatar-item.selected').forEach(el => el.classList.remove('selected'));
            e.target.classList.add('selected');
            selectedAvatar = e.target.dataset.avatar;
        }
    };
    
    const handleSaveSettings = () => {
        userProfile.nickname = elements.nicknameInput.value.trim() || 'WordMaster';
        userProfile.avatar = selectedAvatar;
        saveData();
        closeModal(elements.settingsModal);
    };

    // =================================================================================
    // INICIALIZAÇÃO E EVENT LISTENERS
    // =================================================================================

    const initTheme = () => {
        if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            document.documentElement.classList.add('dark');
            elements.themeIconLight.classList.remove('hidden');
            elements.themeIconDark.classList.add('hidden');
        } else {
            document.documentElement.classList.remove('dark');
            elements.themeIconLight.classList.add('hidden');
            elements.themeIconDark.classList.remove('hidden');
        }
    };

    const toggleTheme = () => {
        const isDark = document.documentElement.classList.toggle('dark');
        localStorage.theme = isDark ? 'dark' : 'light';
        elements.themeIconLight.classList.toggle('hidden', !isDark);
        elements.themeIconDark.classList.toggle('hidden', isDark);
    };

    const handleCloseDetailsModal = () => {
        closeModal(elements.wordDetailsModal);
        if (modalOrigin === elements.myListModal) {
            setTimeout(() => {
                populateAndShowWordList();
                modalOrigin = null; 
            }, 450);
        }
    };

    // Event Listeners Globais
    safeOn(elements.themeToggle, 'click', toggleTheme);
    safeOn(elements.startChallengeBtn, 'click', startChallenge);
    safeOn(elements.showListBtn, 'click', populateAndShowWordList);
    safeOn(elements.showStatsBtn, 'click', showStatsModal);
    safeOn(elements.showStoriesBtn, 'click', populateAndShowStoriesModal);
    safeOn(elements.generateShareCardBtn, 'click', generateShareCard);
    safeOn(elements.settingsBtn, 'click', populateAndShowSettingsModal);

    // Event Listeners para Modais
    safeOn(elements.closeWelcomeModalBtn, 'click', () => closeModal(elements.welcomeModal));
    safeOn(elements.closeLevelUpModalBtn, 'click', () => closeModal(elements.levelUpModal));
    safeOn(elements.closeMyListModalBtn, 'click', () => closeModal(elements.myListModal));
    safeOn(elements.closeModalBtn, 'click', handleCloseDetailsModal);
    safeOn(elements.closeAchievementModalBtn, 'click', () => closeModal(elements.achievementModal));
    safeOn(elements.closeStatsModalBtn, 'click', () => closeModal(elements.statsModal));
    safeOn(elements.closeStoriesModalBtn, 'click', () => closeModal(elements.storiesModal));
    safeOn(elements.closeSettingsModalBtn, 'click', () => closeModal(elements.settingsModal));
    safeOn(elements.saveSettingsBtn, 'click', handleSaveSettings);
    safeOn(elements.avatarSelectionGrid, 'click', handleAvatarSelection);
    safeOn(elements.confirmCancelBtn, 'click', () => { // CORRIGIDO
        closeModal(elements.confirmModal);
        setTimeout(populateAndShowWordList, 450);
    });
    
    safeOn(elements.clearListBtnInModal, 'click', handleClearList);
    
    safeOn(elements.confirmDeleteBtn, 'click', () => {
        vocabulary = [];
        vocaEvents = [];
        gameState.streak = 0;
        gameState.unlockedAchievements = [];
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
            const days = parseInt(e.target.dataset.days);
            renderDailyChart(days);
        }
    });

    // Inicialização da Aplicação
    initTheme();
    updateUI();
    if (gameState.isFirstVisit) {
        openModal(elements.welcomeModal);
        gameState.isFirstVisit = false;
        saveData();
    }
});

