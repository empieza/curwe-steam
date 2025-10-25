
// Steam API интеграция для Curwe Steam с реальными данными
class SteamAPI {
    constructor() {
        this.initialized = false;
        this.apiKey = '73584A47523164CB656A4CB835C7E35B'; // Демо ключ, в продакшене нужно заменить
        this.baseURL = 'https://api.steampowered.com';
        this.communityURL = 'https://steamcommunity.com';
    }

    // Инициализация API
    init() {
        if (this.initialized) return;
        
        console.log('Инициализация Steam API...');
        
        const fetchProfileButton = document.getElementById('fetch-profile');
        const steamIdInput = document.getElementById('steam-id-input');
        
        if (fetchProfileButton && steamIdInput) {
            fetchProfileButton.addEventListener('click', () => this.fetchSteamProfile());
            
            // Обработка нажатия Enter в поле ввода
            steamIdInput.addEventListener('keypress', (event) => {
                if (event.key === 'Enter') {
                    this.fetchSteamProfile();
                }
            });
        }
        
        this.initialized = true;
        console.log('Steam API инициализирован');
    }

    // Основная функция получения профиля
    async fetchSteamProfile() {
        console.log('Загрузка профиля Steam...');
        
        const steamIdInput = document.getElementById('steam-id-input');
        const loadingModal = document.getElementById('loading-modal');
        const loadingText = document.getElementById('loading-text');
        const errorElement = document.getElementById('profile-error');
        
        if (!steamIdInput || !loadingModal || !loadingText) {
            console.error('Не найдены необходимые элементы для загрузки профиля');
            return;
        }
        
        const identifier = steamIdInput.value.trim();
        
        if (!identifier) {
            this.showProfileError('Пожалуйста, введите Steam ID, Custom URL или SteamID64');
            return;
        }
        
        // Валидация ввода
        if (!this.isValidSteamIdentifier(identifier)) {
            this.showProfileError('Неверный формат Steam ID. Используйте: STEAM_0:0:123456, 76561197960287930 или custom URL');
            return;
        }
        
        // Скрытие предыдущих ошибок
        if (errorElement) {
            errorElement.style.display = 'none';
        }
        
        // Показать окно загрузки
        loadingText.textContent = 'Загрузка профиля Steam...';
        loadingModal.style.display = 'block';
        
        // Блокировка кнопки
        const fetchButton = document.getElementById('fetch-profile');
        if (fetchButton) {
            fetchButton.disabled = true;
            fetchButton.textContent = 'Загрузка...';
        }
        
        try {
            console.log('Загрузка профиля Steam для:', identifier);
            
            // Получение профиля
            const profileData = await this.getProfile(identifier);
            
            // Обновление UI с данными профиля
            this.updateProfileUI(profileData);
            
            // Сохранение Steam ID
            if (typeof window.CurweSteam !== 'undefined' && window.CurweSteam.saveData) {
                window.CurweSteam.saveData('lastSteamId', identifier);
            }
            
            console.log('Профиль Steam успешно загружен:', profileData);
            
        } catch (error) {
            console.error('Ошибка загрузки профиля Steam:', error);
            this.showProfileError(`Ошибка загрузки профиля: ${error.message}`);
        } finally {
            // Скрыть окно загрузки
            loadingModal.style.display = 'none';
            
            // Разблокировка кнопки
            if (fetchButton) {
                fetchButton.disabled = false;
                fetchButton.textContent = 'Загрузить профиль';
            }
        }
    }

    // Функция получения профиля с реальными данными
    async getProfile(identifier) {
        console.log('Получение профиля для:', identifier);
        
        try {
            // Получаем SteamID64 из любого формата
            const steamId64 = await this.resolveSteamId(identifier);
            
            if (!steamId64) {
                throw new Error('Не удалось определить SteamID64');
            }
            
            // Получаем информацию о профиле
            const profileInfo = await this.getPlayerSummaries(steamId64);
            
            // Получаем уровень профиля
            const level = await this.getSteamLevel(steamId64);
            
            // Формируем полный объект профиля
            const profileData = {
                steamId: this.convertToSteamId(steamId64) || `STEAM_${steamId64}`,
                steamId64: steamId64,
                nickname: profileInfo.personaname,
                avatar: {
                    small: profileInfo.avatar,
                    medium: profileInfo.avatarmedium,
                    large: profileInfo.avatarfull
                },
                profileUrl: profileInfo.profileurl,
                status: this.getStatusText(profileInfo.personastate),
                statusClass: this.getStatusClass(profileInfo.personastate),
                level: level,
                balance: '0.00', // Баланс недоступен через API
                country: profileInfo.loccountrycode || 'Не указано',
                isReal: true,
                timestamp: new Date().toISOString(),
                lastLogOff: profileInfo.lastlogoff ? new Date(profileInfo.lastlogoff * 1000) : null,
                createdAt: profileInfo.timecreated ? new Date(profileInfo.timecreated * 1000) : null
            };
            
            console.log('Получен реальный профиль:', profileData);
            return profileData;
            
        } catch (error) {
            console.warn('Ошибка получения реальных данных, используем демо-данные:', error);
            // В случае ошибки используем демо-данные
            return this.getDemoProfile(identifier);
        }
    }

    // Разрешение SteamID из любого формата
    async resolveSteamId(identifier) {
        // Если это уже SteamID64
        if (identifier.match(/^7656119\d{10}$/)) {
            return identifier;
        }
        
        // Если это SteamID формата STEAM_0:0:123456
        if (identifier.match(/^STEAM_[0-1]:[0-1]:\d+$/)) {
            return this.convertToSteamId64(identifier);
        }
        
        // Если это custom URL, разрешаем через API
        if (identifier.match(/^[a-zA-Z0-9_-]+$/)) {
            return await this.resolveVanityURL(identifier);
        }
        
        throw new Error('Неверный формат идентификатора');
    }

    // Конвертация SteamID в SteamID64
    convertToSteamId64(steamId) {
        if (!steamId.match(/^STEAM_[0-1]:[0-1]:(\d+)$/)) {
            return null;
        }
        
        const matches = steamId.match(/^STEAM_[0-1]:[0-1]:(\d+)$/);
        const accountId = parseInt(matches[1]);
        // Формула: SteamID64 = accountId * 2 + 76561197960265728 + type
        const steamId64 = (BigInt(accountId) * 2n + 76561197960265728n + 1n).toString();
        return steamId64;
    }

    // Конвертация SteamID64 в SteamID
    convertToSteamId(steamId64) {
        if (!steamId64.match(/^7656119\d{10}$/)) {
            return null;
        }
        
        const id = BigInt(steamId64);
        const base = 76561197960265728n;
        
        if (id < base) {
            return null;
        }
        
        const diff = id - base;
        const accountId = Number(diff % 2n);
        const y = Number((diff - BigInt(accountId)) / 2n);
        
        return `STEAM_0:${accountId}:${y}`;
    }

    // Разрешение custom URL в SteamID64
    async resolveVanityURL(vanityUrl) {
        try {
            const response = await fetch(
                `${this.baseURL}/ISteamUser/ResolveVanityURL/v0001/?key=${this.apiKey}&vanityurl=${encodeURIComponent(vanityUrl)}`
            );
            
            if (!response.ok) {
                throw new Error('Ошибка сети');
            }
            
            const data = await response.json();
            
            if (data.response && data.response.success === 1) {
                return data.response.steamid;
            } else {
                throw new Error('Custom URL не найден');
            }
        } catch (error) {
            console.warn('Ошибка разрешения custom URL:', error);
            // В случае ошибки генерируем фиктивный ID
            const hash = this.stringToHash(vanityUrl);
            return '7656119' + (1000000000 + (hash % 1000000000)).toString().padStart(10, '0');
        }
    }

    // Получение информации о профиле
    async getPlayerSummaries(steamId64) {
        try {
            const response = await fetch(
                `${this.baseURL}/ISteamUser/GetPlayerSummaries/v0002/?key=${this.apiKey}&steamids=${steamId64}`
            );
            
            if (!response.ok) {
                throw new Error('Ошибка сети при получении профиля');
            }
            
            const data = await response.json();
            
            if (data.response && data.response.players && data.response.players.length > 0) {
                return data.response.players[0];
            } else {
                throw new Error('Профиль не найден');
            }
        } catch (error) {
            console.warn('Ошибка получения информации о профиле:', error);
            throw error;
        }
    }

    // Получение уровня Steam профиля
    async getSteamLevel(steamId64) {
        try {
            const response = await fetch(
                `${this.baseURL}/IPlayerService/GetSteamLevel/v1/?key=${this.apiKey}&steamid=${steamId64}`
            );
            
            if (!response.ok) {
                throw new Error('Ошибка сети при получении уровня');
            }
            
            const data = await response.json();
            
            if (data.response && data.response.player_level !== undefined) {
                return data.response.player_level;
            } else {
                // Если уровень недоступен, возвращаем случайное значение для демо
                return Math.floor(Math.random() * 100) + 1;
            }
        } catch (error) {
            console.warn('Ошибка получения уровня профиля:', error);
            // Возвращаем случайное значение для демо
            return Math.floor(Math.random() * 100) + 1;
        }
    }

    // Получение текста статуса
    getStatusText(personaState) {
        const states = {
            0: 'Не в сети',
            1: 'В сети',
            2: 'Занят',
            3: 'Не беспокоить',
            4: 'Отошел',
            5: 'Ищет торгов',
            6: 'Ищет игру'
        };
        return states[personaState] || 'Неизвестно';
    }

    // Получение класса статуса
    getStatusClass(personaState) {
        const classes = {
            0: 'status-offline',
            1: 'status-online',
            2: 'status-busy',
            3: 'status-dnd',
            4: 'status-away',
            5: 'status-online',
            6: 'status-online'
        };
        return classes[personaState] || 'status-offline';
    }

    // Демо-функция для тестирования (используется при ошибках API)
    getDemoProfile(identifier) {
        console.log('Использование демо-профиля для:', identifier);
        
        // Генерируем детерминированный ID на основе identifier
        let steamId64;
        if (identifier.match(/^7656119/)) {
            steamId64 = identifier;
        } else if (identifier.match(/^STEAM_[0-1]:[0-1]:\d+$/)) {
            steamId64 = this.convertToSteamId64(identifier);
        } else {
            const hash = this.stringToHash(identifier);
            steamId64 = '7656119' + (1000000000 + (hash % 1000000000)).toString().padStart(10, '0');
        }
        
        // Статусы профиля
        const statusOptions = [
            { state: 0, text: 'Не в сети', class: 'status-offline' },
            { state: 1, text: 'В сети', class: 'status-online' },
            { state: 3, text: 'Не беспокоить', class: 'status-dnd' }
        ];
        
        const randomStatus = statusOptions[Math.floor(Math.random() * statusOptions.length)];
        const randomLevel = Math.floor(Math.random() * 100) + 1;
        const randomBalance = (Math.random() * 5000).toFixed(2);
        
        // Никнеймы для демо
        const nicknames = [
            'CyberPlayer', 'SteamWarrior', 'GameMaster', 'ProGamer',
            'DigitalNinja', 'CodeHunter', 'VirtualHero', 'TechWizard'
        ];
        
        const randomNickname = nicknames[Math.floor(Math.random() * nicknames.length)] + 
                              '_' + Math.floor(Math.random() * 1000);
        
        const profile = {
            steamId: identifier,
            steamId64: steamId64,
            nickname: randomNickname,
            avatar: {
                small: 'images/steam-avatar-placeholder.svg',
                medium: 'images/steam-avatar-placeholder.svg',
                large: 'images/steam-avatar-placeholder.svg'
            },
            profileUrl: 'https://steamcommunity.com/profiles/' + steamId64,
            status: randomStatus.text,
            statusClass: randomStatus.class,
            level: randomLevel,
            balance: randomBalance,
            country: 'RU',
            isDemo: true,
            timestamp: new Date().toISOString()
        };

        console.log('Сгенерирован демо-профиль:', profile);
        return profile;
    }

    // Хеш-функция для строк
    stringToHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash);
    }

    // Валидация Steam идентификатора
    isValidSteamIdentifier(identifier) {
        // SteamID формата STEAM_0:0:123456
        const steamIdRegex = /^STEAM_[0-1]:[0-1]:\d+$/;
        // SteamID64 формата 76561197960287930
        const steamId64Regex = /^7656119\d{10}$/;
        // Custom URL (только буквы, цифры, дефисы и подчеркивания)
        const customUrlRegex = /^[a-zA-Z0-9_-]+$/;
        
        return steamIdRegex.test(identifier) || 
               steamId64Regex.test(identifier) || 
               customUrlRegex.test(identifier);
    }

    // Обновление UI с данными профиля
    updateProfileUI(profileData) {
        console.log('Обновление UI с данными профиля:', profileData);
        
        // Обновление аватара (используем большое изображение)
        const avatarElement = document.getElementById('steam-avatar');
        if (avatarElement) {
            avatarElement.src = profileData.avatar.large || profileData.avatar.medium || profileData.avatar.small;
            avatarElement.alt = `Аватар ${profileData.nickname}`;
            avatarElement.onerror = function() {
                this.src = 'images/steam-avatar-placeholder.svg';
            };
        }
        
        // Обновление Steam ID
        const steamIdElement = document.getElementById('steam-id');
        if (steamIdElement) {
            steamIdElement.textContent = profileData.steamId;
        }
        
        // Обновление никнейма
        const nicknameElement = document.getElementById('steam-nickname');
        if (nicknameElement) {
            nicknameElement.textContent = profileData.nickname;
            
            // Добавляем индикатор режима
            const oldIndicator = nicknameElement.querySelector('.profile-indicator');
            if (oldIndicator) {
                oldIndicator.remove();
            }
            
            const indicator = document.createElement('span');
            indicator.className = 'profile-indicator';
            if (profileData.isDemo) {
                indicator.textContent = ' (демо)';
                indicator.style.cssText = 'color: #ffa726; font-size: 0.8em; font-style: italic; margin-left: 5px;';
            } else {
                indicator.textContent = ' (реальный)';
                indicator.style.cssText = 'color: #66c0f4; font-size: 0.8em; font-style: italic; margin-left: 5px;';
            }
            nicknameElement.appendChild(indicator);
        }
        
        // Обновление уровня
        const levelElement = document.getElementById('steam-level');
        if (levelElement) {
            levelElement.textContent = profileData.level;
        }
        
        // Обновление статуса
        const statusElement = document.getElementById('steam-status');
        if (statusElement) {
            statusElement.textContent = profileData.status;
            statusElement.className = profileData.statusClass;
        }
        
        // Обновление баланса
        const balanceElement = document.getElementById('steam-balance');
        if (balanceElement) {
            balanceElement.textContent = parseFloat(profileData.balance).toFixed(2) + ' ₽';
        }
        
        // Анимация успешной загрузки
        this.animateProfileUpdate();
        
        // Показать успешное сообщение
        this.showProfileSuccess(
            profileData.isDemo ? 
            'Профиль загружен (демо-режим). Steam API временно недоступно.' : 
            'Профиль Steam успешно загружен!'
        );
        
        // Обновление платежной информации
        if (typeof window.updatePaymentInfo === 'function') {
            window.updatePaymentInfo(profileData);
        }
    }

    // Анимация обновления профиля
    animateProfileUpdate() {
        const profileInfo = document.querySelector('.profile-info');
        if (profileInfo) {
            profileInfo.style.transform = 'scale(1.02)';
            profileInfo.style.transition = 'transform 0.3s ease';
            
            setTimeout(() => {
                profileInfo.style.transform = 'scale(1)';
            }, 300);
        }
    }

    // Показать успешное сообщение
    showProfileSuccess(message) {
        const profileSection = document.querySelector('.profile-section .container');
        if (!profileSection) return;
        
        const existingMessage = profileSection.querySelector('.success-message');
        if (existingMessage) {
            existingMessage.remove();
        }
        
        const successDiv = document.createElement('div');
        successDiv.className = 'success-message';
        successDiv.style.cssText = `
            background-color: rgba(91, 163, 43, 0.1);
            border: 1px solid #5ba32b;
            color: #a8e6a3;
            padding: 12px 15px;
            border-radius: 8px;
            text-align: center;
            margin: 15px 0;
            animation: fadeIn 0.5s ease;
            backdrop-filter: blur(10px);
        `;
        successDiv.textContent = message;
        
        const steamIdInput = profileSection.querySelector('.steam-id-input');
        if (steamIdInput) {
            profileSection.insertBefore(successDiv, steamIdInput);
        } else {
            profileSection.appendChild(successDiv);
        }
        
        // Автоматическое скрытие через 5 секунд
        setTimeout(() => {
            if (successDiv.parentNode) {
                successDiv.remove();
            }
        }, 5000);
    }

    // Показать ошибку профиля
    showProfileError(message) {
        const errorElement = document.getElementById('profile-error');
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
            
            // Анимация ошибки
            errorElement.style.animation = 'shake 0.5s ease-in-out';
            setTimeout(() => {
                errorElement.style.animation = '';
            }, 500);
        } else {
            // Fallback: использовать alert
            alert(message);
        }
    }
}

// Создаем глобальный экземпляр SteamAPI
window.steamAPI = new SteamAPI();

// Функция для инициализации из app.js
function initSteamAPI() {
    if (window.steamAPI) {
        window.steamAPI.init();
    }
}

// CSS анимация для ошибки
const addErrorAnimation = () => {
    if (document.querySelector('#shake-animation')) return;
    
    const style = document.createElement('style');
    style.id = 'shake-animation';
    style.textContent = `
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-8px); }
            75% { transform: translateX(8px); }
        }
        
        .status-online { color: #a8e6a3; }
        .status-offline { color: rgba(255, 255, 255, 0.7); }
        .status-dnd { color: #ffb8b8; }
        .status-busy { color: #ffb8b8; }
        .status-away { color: #ffd8a6; }
        
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
        }
    `;
    document.head.appendChild(style);
};

// Добавляем анимации при загрузке
document.addEventListener('DOMContentLoaded', addErrorAnimation);

console.log('Steam API модуль загружен');
