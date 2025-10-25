
// Основной файл приложения Curwe Steam с Glass Effect
document.addEventListener('DOMContentLoaded', function() {
    console.log('Curwe Steam приложение загружается...');
    
    // Добавляем класс для плавного появления
    document.body.style.opacity = '0';
    document.body.style.transition = 'opacity 0.8s ease';
    
    setTimeout(() => {
        document.body.style.opacity = '1';
    }, 100);
    
    // Инициализация всех систем
    initApp();
});

function initApp() {
    console.log('Инициализация приложения Curwe Steam...');
    
    // Добавляем scroll эффект для header
    setupScrollEffects();
    
    // Добавляем hover эффекты для glass элементов
    setupGlassHoverEffects();
    
    // Проверка поддержки localStorage
    if (!isLocalStorageSupported()) {
        showError('Ваш браузер не поддерживает локальное хранилище. Некоторые функции могут быть недоступны.');
    }
    
    // Инициализация Steam API
    if (typeof window.steamAPI !== 'undefined') {
        window.steamAPI.init();
        console.log('Steam API инициализирован');
    } else {
        console.error('Steam API не загружен');
    }
    
    // Инициализация платежной системы
    if (typeof initPaymentSystem === 'function') {
        console.log('Платежная система загружена');
    } else {
        console.error('Платежная система не загружена');
    }
    
    // Инициализация Email Service
    if (typeof window.emailService !== 'undefined') {
        window.emailService.init().then(success => {
            if (success) {
                console.log('Email Service инициализирован');
            } else {
                console.warn('Email Service не инициализирован');
            }
        });
    }
    
    // Инициализация Mock Payment Service
    if (typeof window.mockPaymentService !== 'undefined') {
        console.log('Mock Payment Service готов к работе');
    } else {
        console.error('Mock Payment Service не загружен');
    }
    
    // Загрузка сохраненных данных
    loadSavedData();
    
    // Настройка обработчиков глобальных событий
    setupGlobalEventHandlers();
    
    console.log('Приложение Curwe Steam успешно инициализировано');
}

// Настройка scroll эффектов
function setupScrollEffects() {
    const header = document.querySelector('header');
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
        
        // Параллакс эффект для background
        const scrolled = window.pageYOffset;
        const parallax = document.querySelectorAll('.parallax');
        
        parallax.forEach(element => {
            const speed = element.dataset.speed || 0.5;
            element.style.transform = `translateY(${scrolled * speed}px)`;
        });
    });
}

// Настройка hover эффектов для glass элементов
function setupGlassHoverEffects() {
    const glassElements = document.querySelectorAll('.glass, .glass-dark, .glass-accent');
    
    glassElements.forEach(element => {
        element.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-5px) scale(1.02)';
            this.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
        });
        
        element.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
    });
}

// Проверка поддержки localStorage
function isLocalStorageSupported() {
    try {
        const test = 'test';
        localStorage.setItem(test, test);
        localStorage.removeItem(test);
        return true;
    } catch (e) {
        return false;
    }
}

// Загрузка сохраненных данных
function loadSavedData() {
    // Загрузка истории платежей
    const paymentHistory = JSON.parse(localStorage.getItem('paymentHistory')) || [];
    if (paymentHistory.length > 0) {
        console.log(`Загружено ${paymentHistory.length} записей истории платежей`);
        
        // Обновление отображения истории
        if (typeof updatePaymentHistoryDisplay === 'function') {
            updatePaymentHistoryDisplay();
        }
    }
    
    // Загрузка последнего Steam ID
    const lastSteamId = localStorage.getItem('lastSteamId');
    if (lastSteamId) {
        const steamIdInput = document.getElementById('steam-id-input');
        if (steamIdInput) {
            steamIdInput.value = lastSteamId;
            console.log('Восстановлен последний Steam ID:', lastSteamId);
        }
    }
    
    // Загрузка последнего email
    const lastEmail = localStorage.getItem('lastEmail');
    if (lastEmail) {
        const emailInput = document.getElementById('user-email');
        if (emailInput) {
            emailInput.value = lastEmail;
            console.log('Восстановлен последний email:', lastEmail);
        }
    }
}

// Сохранение данных
function saveData(key, value) {
    try {
        localStorage.setItem(key, value);
        return true;
    } catch (e) {
        console.error('Ошибка сохранения данных:', e);
        return false;
    }
}

// Настройка глобальных обработчиков событий
function setupGlobalEventHandlers() {
    // Сохранение Steam ID при вводе
    const steamIdInput = document.getElementById('steam-id-input');
    if (steamIdInput) {
        steamIdInput.addEventListener('blur', function() {
            if (this.value.trim()) {
                saveData('lastSteamId', this.value.trim());
            }
        });
    }
    
    // Сохранение email при вводе
    const emailInput = document.getElementById('user-email');
    if (emailInput) {
        emailInput.addEventListener('blur', function() {
            if (this.value.trim()) {
                saveData('lastEmail', this.value.trim());
            }
        });
    }
    
    // Активация навигационных ссылок при скролле
    window.addEventListener('scroll', highlightNavigation);
    
    // Обработка глобальных ошибок
    window.addEventListener('error', function(event) {
        console.error('Глобальная ошибка:', event.error);
    });
    
    // Обработка обещаний без обработчика ошибок
    window.addEventListener('unhandledrejection', function(event) {
        console.error('Необработанная ошибка Promise:', event.reason);
    });
}

// Подсветка активной навигационной ссылки
function highlightNavigation() {
    const sections = document.querySelectorAll('section');
    const navLinks = document.querySelectorAll('nav a');
    
    let currentSection = '';
    
    sections.forEach(section => {
        const sectionTop = section.offsetTop - 100;
        const sectionHeight = section.clientHeight;
        
        if (window.scrollY >= sectionTop && window.scrollY < sectionTop + sectionHeight) {
            currentSection = section.getAttribute('id');
        }
    });
    
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${currentSection}`) {
            link.classList.add('active');
        }
    });
}

// Функция показа ошибки с glass эффектом
function showError(message, elementId = null) {
    console.error('Показать ошибку:', message);
    
    if (elementId) {
        const errorElement = document.getElementById(elementId);
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
            errorElement.classList.add('error-shake');
            return;
        }
    }
    
    // Глобальное уведомление об ошибке
    const globalError = document.createElement('div');
    globalError.className = 'error-message';
    globalError.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 3000;
        max-width: 400px;
        background: rgba(255, 107, 107, 0.1);
        backdrop-filter: blur(20px);
        border: 1px solid #ff6b6b;
        color: #ffb8b8;
        padding: 20px;
        border-radius: 16px;
        box-shadow: 0 8px 32px rgba(255, 107, 107, 0.3);
        animation: slideInRightGlass 0.6s cubic-bezier(0.4, 0, 0.2, 1);
    `;
    globalError.textContent = message;
    
    document.body.appendChild(globalError);
    
    // Автоматическое скрытие через 5 секунд
    setTimeout(() => {
        if (globalError.parentNode) {
            globalError.style.animation = 'modalExitGlass 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
            setTimeout(() => {
                if (globalError.parentNode) {
                    globalError.parentNode.removeChild(globalError);
                }
            }, 300);
        }
    }, 5000);
}

// Функция показа успешного сообщения с glass эффектом
function showSuccess(message) {
    console.log('Показать успех:', message);
    
    const successMessage = document.createElement('div');
    successMessage.className = 'success-message';
    successMessage.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 3000;
        max-width: 400px;
        background: rgba(91, 163, 43, 0.1);
        backdrop-filter: blur(20px);
        border: 1px solid #5ba32b;
        color: #a8e6a3;
        padding: 20px;
        border-radius: 16px;
        box-shadow: 0 8px 32px rgba(91, 163, 43, 0.3);
        animation: slideInRightGlass 0.6s cubic-bezier(0.4, 0, 0.2, 1);
    `;
    successMessage.textContent = message;
    
    document.body.appendChild(successMessage);
    
    // Автоматическое скрытие через 3 секунды
    setTimeout(() => {
        if (successMessage.parentNode) {
            successMessage.style.animation = 'modalExitGlass 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
            setTimeout(() => {
                if (successMessage.parentNode) {
                    successMessage.parentNode.removeChild(successMessage);
                }
            }, 300);
        }
    }, 3000);
}

// Утилиты для форматирования
function formatCurrency(amount, currency = '₽') {
    return new Intl.NumberFormat('ru-RU', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount) + ' ' + currency;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Функция для обновления платежной информации
window.updatePaymentInfo = function(profile) {
    console.log('Обновление платежной информации для профиля:', profile);
    
    // Обновляем информацию в форме оплаты, если нужно
    const payButton = document.getElementById('pay-button');
    if (payButton && profile.steamId !== 'Не указан') {
        payButton.disabled = false;
    }
};

// Функция для обновления истории платежей
function updatePaymentHistoryDisplay() {
    const historyItems = document.getElementById('history-items');
    const noHistory = document.getElementById('no-history');
    
    if (!historyItems || !noHistory) return;
    
    // Получение истории из localStorage
    const paymentHistory = JSON.parse(localStorage.getItem('paymentHistory')) || [];
    
    if (paymentHistory.length === 0) {
        noHistory.style.display = 'block';
        historyItems.style.display = 'none';
        return;
    }
    
    // Скрытие сообщения "нет истории"
    noHistory.style.display = 'none';
    historyItems.style.display = 'block';
    
    // Создание элементов истории
    historyItems.innerHTML = '';
    
    paymentHistory.forEach((payment, index) => {
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item fade-in';
        historyItem.style.animationDelay = `${index * 0.1}s`;
        historyItem.innerHTML = `
            <div class="history-item-header">
                <span class="history-date">${formatDate(payment.date)}</span>
                <span class="history-status ${payment.status}">${getStatusText(payment.status)}</span>
            </div>
            <div class="history-item-details">
                <p><strong>Сумма:</strong> ${payment.amount} ₽</p>
                <p><strong>Steam:</strong> ${payment.steamNickname}</p>
                <p><strong>Метод:</strong> ${getPaymentMethodText(payment.paymentMethod)}</p>
                <p><strong>ID транзакции:</strong> ${payment.id}</p>
            </div>
        `;
        historyItems.appendChild(historyItem);
    });
}

// Вспомогательные функции для истории
function getStatusText(status) {
    const statuses = {
        'completed': 'Завершено',
        'pending': 'В обработке',
        'failed': 'Ошибка'
    };
    return statuses[status] || status;
}

function getPaymentMethodText(method) {
    const methods = {
        'card': 'Банковская карта',
        'qiwi': 'QIWI Кошелек',
        'yoomoney': 'ЮMoney',
        'mobile': 'Мобильный платеж'
    };
    return methods[method] || method;
}

// Функция для тестирования реальных Steam профилей
window.testRealProfiles = function() {
    const testProfiles = [
        '76561197960435530', // Valve Admin (известный аккаунт)
        '76561198028175941', // Другой известный аккаунт
        'gabelogannewell'    // Custom URL Гейба Ньюэлла
    ];
    
    const randomProfile = testProfiles[Math.floor(Math.random() * testProfiles.length)];
    document.getElementById('steam-id-input').value = randomProfile;
    
    if (window.steamAPI && window.steamAPI.fetchSteamProfile) {
        window.steamAPI.fetchSteamProfile();
    }
};

// Экспорт утилит для глобального использования
window.CurweSteam = {
    showError,
    showSuccess,
    formatCurrency,
    formatDate,
    saveData,
    updatePaymentHistoryDisplay,
    testRealProfiles
};

console.log('Curwe Steam приложение готово к работе');
