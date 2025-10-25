
// Mock Payment Service - Демо сервис обработки платежей
class MockPaymentService {
    constructor() {
        this.baseURL = 'https://api.mock-payment-service.com';
        this.supportedMethods = ['card', 'qiwi', 'yoomoney', 'mobile'];
        this.processingTimes = {
            card: 3000,
            qiwi: 2000,
            yoomoney: 2500,
            mobile: 4000
        };
        this.successRate = 0.95; // 95% успешных платежей
    }

    // Инициализация платежа
    async initiatePayment(paymentData) {
        console.log('Инициализация платежа через Mock Payment Service:', paymentData);
        
        // Валидация данных платежа
        const validation = this.validatePaymentData(paymentData);
        if (!validation.valid) {
            throw new Error(validation.error);
        }

        // Создание сессии платежа
        const sessionId = this.generateSessionId();
        const paymentMethod = paymentData.paymentMethod || 'card';
        
        return {
            sessionId: sessionId,
            status: 'pending',
            paymentUrl: `${this.baseURL}/pay/${sessionId}`,
            expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 минут
            method: paymentMethod,
            amount: paymentData.amount,
            currency: paymentData.currency || 'RUB'
        };
    }

    // Обработка платежа
    async processPayment(sessionId, paymentMethod, cardData = null) {
        console.log(`Обработка платежа ${sessionId} методом ${paymentMethod}`);
        
        // Имитация обработки платежа
        await this.simulateProcessing(paymentMethod);
        
        // Определяем успешность платежа (95% успеха)
        const isSuccess = Math.random() < this.successRate;
        
        if (isSuccess) {
            return {
                sessionId: sessionId,
                status: 'completed',
                transactionId: this.generateTransactionId(),
                processedAt: new Date().toISOString(),
                amount: cardData?.amount || 0,
                currency: cardData?.currency || 'RUB',
                method: paymentMethod,
                authorizationCode: this.generateAuthCode()
            };
        } else {
            // Случайные ошибки для реалистичности
            const errors = [
                'Недостаточно средств на карте',
                'Превышен лимит операции',
                'Карта заблокирована',
                'Неверный срок действия карты',
                'Транзакция отклонена банком',
                'Ошибка связи с банком-эмитентом'
            ];
            const randomError = errors[Math.floor(Math.random() * errors.length)];
            
            throw new Error(randomError);
        }
    }

    // Проверка статуса платежа
    async checkPaymentStatus(sessionId) {
        console.log('Проверка статуса платежа:', sessionId);
        
        // Имитация задержки проверки
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // В реальной системе здесь был бы запрос к API платежного шлюза
        const statuses = ['pending', 'processing', 'completed', 'failed'];
        const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
        
        return {
            sessionId: sessionId,
            status: randomStatus,
            lastChecked: new Date().toISOString()
        };
    }

    // Валидация данных платежа
    validatePaymentData(paymentData) {
        const requiredFields = ['amount', 'currency', 'description'];
        const missingFields = requiredFields.filter(field => !paymentData[field]);
        
        if (missingFields.length > 0) {
            return {
                valid: false,
                error: `Отсутствуют обязательные поля: ${missingFields.join(', ')}`
            };
        }
        
        if (paymentData.amount <= 0) {
            return {
                valid: false,
                error: 'Сумма платежа должна быть больше 0'
            };
        }
        
        if (paymentData.paymentMethod && !this.supportedMethods.includes(paymentData.paymentMethod)) {
            return {
                valid: false,
                error: `Неподдерживаемый метод оплаты: ${paymentData.paymentMethod}`
            };
        }
        
        return { valid: true };
    }

    // Генерация ID сессии
    generateSessionId() {
        return 'MPS_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9).toUpperCase();
    }

    // Генерация ID транзакции
    generateTransactionId() {
        return 'TXN_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6).toUpperCase();
    }

    // Генерация кода авторизации
    generateAuthCode() {
        return 'AUTH_' + Math.random().toString(36).substr(2, 8).toUpperCase();
    }

    // Имитация обработки платежа
    async simulateProcessing(paymentMethod) {
        const processingTime = this.processingTimes[paymentMethod] || 3000;
        console.log(`Имитация обработки платежа (${processingTime}ms)...`);
        
        // Создаем прогресс бар для визуализации
        this.showProcessingProgress(processingTime);
        
        await new Promise(resolve => setTimeout(resolve, processingTime));
    }

    // Показ прогресса обработки
    showProcessingProgress(duration) {
        // Эта функция может быть реализована в UI
        console.log(`Обработка платежа: 0%`);
        
        const interval = 100;
        const steps = duration / interval;
        let currentStep = 0;
        
        const progressInterval = setInterval(() => {
            currentStep++;
            const progress = Math.min((currentStep / steps) * 100, 100);
            console.log(`Обработка платежа: ${progress.toFixed(0)}%`);
            
            if (currentStep >= steps) {
                clearInterval(progressInterval);
                console.log('Обработка платежа завершена: 100%');
            }
        }, interval);
    }

    // Получение информации о поддерживаемых методах оплаты
    getSupportedPaymentMethods() {
        return this.supportedMethods.map(method => ({
            code: method,
            name: this.getMethodDisplayName(method),
            description: this.getMethodDescription(method),
            minAmount: 10,
            maxAmount: 50000,
            currencies: ['RUB', 'USD', 'EUR']
        }));
    }

    // Отображение названий методов оплаты
    getMethodDisplayName(method) {
        const names = {
            card: 'Банковская карта',
            qiwi: 'QIWI Кошелек',
            yoomoney: 'ЮMoney',
            mobile: 'Мобильный платеж'
        };
        return names[method] || method;
    }

    // Описания методов оплаты
    getMethodDescription(method) {
        const descriptions = {
            card: 'Оплата картой Visa, MasterCard, Mir',
            qiwi: 'Оплата через QIWI кошелек',
            yoomoney: 'Оплата через ЮMoney (Яндекс.Деньги)',
            mobile: 'Оплата с мобильного счета'
        };
        return descriptions[method] || 'Метод оплаты';
    }

    // Эмуляция ввода карточных данных
    generateMockCardData() {
        const cards = [
            {
                number: '4242424242424242',
                expiry: '12/25',
                cvv: '123',
                holder: 'IVAN IVANOV',
                type: 'visa'
            },
            {
                number: '5555555555554444',
                expiry: '09/24',
                cvv: '456',
                holder: 'PETR PETROV',
                type: 'mastercard'
            },
            {
                number: '2201382000000013',
                expiry: '03/26',
                cvv: '789',
                holder: 'MARIA SIDOROVA',
                type: 'mir'
            }
        ];
        
        return cards[Math.floor(Math.random() * cards.length)];
    }
}

// Создаем глобальный экземпляр Mock Payment Service
window.mockPaymentService = new MockPaymentService();
console.log('Mock Payment Service инициализирован');

// UI функции для работы с Mock Payment Service
const MockPaymentUI = {
    // Показ модального окна ввода карточных данных
    showCardInputModal(sessionId, amount, callback) {
        const cardData = window.mockPaymentService.generateMockCardData();
        
        const modalHTML = `
            <div class="modal" id="card-input-modal">
                <div class="modal-content">
                    <span class="close">&times;</span>
                    <h2>Введите данные карты</h2>
                    <div class="card-input-form">
                        <p><strong>Демо-режим:</strong> Используются тестовые данные</p>
                        <div class="form-group">
                            <label>Номер карты:</label>
                            <input type="text" value="${cardData.number}" readonly class="demo-field">
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Срок действия:</label>
                                <input type="text" value="${cardData.expiry}" readonly class="demo-field">
                            </div>
                            <div class="form-group">
                                <label>CVV:</label>
                                <input type="text" value="${cardData.cvv}" readonly class="demo-field">
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Держатель карты:</label>
                            <input type="text" value="${cardData.holder}" readonly class="demo-field">
                        </div>
                        <button id="submit-card-payment" class="confirm-btn">Оплатить ${amount} ₽</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        const modal = document.getElementById('card-input-modal');
        const closeBtn = modal.querySelector('.close');
        const submitBtn = document.getElementById('submit-card-payment');
        
        closeBtn.onclick = () => modal.remove();
        submitBtn.onclick = () => {
            modal.remove();
            callback(cardData);
        };
        
        modal.style.display = 'block';
    },

    // Показ статуса обработки платежа
    showPaymentProcessing(sessionId) {
        const loadingModal = document.getElementById('loading-modal');
        const loadingText = document.getElementById('loading-text');
        
        if (loadingModal && loadingText) {
            loadingText.textContent = 'Обработка платежа...';
            loadingModal.style.display = 'block';
        }
    },

    // Показ результата платежа
    showPaymentResult(success, message, transactionId = null) {
        const statusModal = document.getElementById('payment-status-modal');
        const statusIcon = document.getElementById('payment-status-icon');
        const statusTitle = document.getElementById('payment-status-title');
        const statusMessage = document.getElementById('payment-status-message');
        const closeBtn = document.getElementById('payment-status-close');
        
        if (statusModal && statusIcon && statusTitle && statusMessage) {
            if (success) {
                statusIcon.innerHTML = '✅';
                statusIcon.className = 'status-success';
                statusTitle.textContent = 'Платеж успешно обработан';
                statusMessage.innerHTML = `
                    ${message}<br><br>
                    <strong>ID транзакции:</strong> ${transactionId}<br>
                    <small>Это демо-транзакция в тестовой среде</small>
                `;
            } else {
                statusIcon.innerHTML = '❌';
                statusIcon.className = 'status-error';
                statusTitle.textContent = 'Ошибка оплаты';
                statusMessage.textContent = message;
            }
            
            statusModal.style.display = 'block';
        }
        
        // Скрываем окно загрузки
        const loadingModal = document.getElementById('loading-modal');
        if (loadingModal) {
            loadingModal.style.display = 'none';
        }
        
        // Обработчик закрытия
        if (closeBtn) {
            closeBtn.onclick = () => {
                statusModal.style.display = 'none';
            };
        }
    }
};

// Экспортируем UI функции
window.MockPaymentUI = MockPaymentUI;
