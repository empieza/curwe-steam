
// Система платежей с интеграцией Mock Payment Service
function initPaymentSystem() {
    console.log('Инициализация платежной системы с Mock Payment Service...');
    
    // Элементы DOM
    const amountButtons = document.querySelectorAll('.amount-btn');
    const customAmountInput = document.getElementById('custom-amount');
    const userEmailInput = document.getElementById('user-email');
    const paymentAmountElement = document.getElementById('payment-amount');
    const paymentFeeElement = document.getElementById('payment-fee');
    const paymentTotalElement = document.getElementById('payment-total');
    const payButton = document.getElementById('pay-button');
    const paymentModal = document.getElementById('payment-modal');
    const closeModal = document.querySelector('.close');
    const confirmPaymentBtn = document.getElementById('confirm-payment');
    const cancelPaymentBtn = document.getElementById('cancel-payment');
    const demoAmountElement = document.getElementById('demo-amount');
    const demoSteamIdElement = document.getElementById('demo-steam-id');
    const demoSteamNicknameElement = document.getElementById('demo-steam-nickname');
    const demoEmailElement = document.getElementById('demo-email');
    const demoFeeElement = document.getElementById('demo-fee');
    const demoTotalElement = document.getElementById('demo-total');
    
    // Переменные состояния
    let selectedAmount = 0;
    let commission = 0;
    let totalAmount = 0;
    let currentSessionId = null;
    
    // Проверяем наличие необходимых элементов
    if (!payButton || !paymentModal) {
        console.error('Не найдены необходимые элементы для платежной системы');
        return;
    }
    
    // Инициализация обработчиков событий
    initEventHandlers();
    
    function initEventHandlers() {
        console.log('Инициализация обработчиков событий...');
        
        // Обработчики для кнопок выбора суммы
        amountButtons.forEach(button => {
            button.addEventListener('click', function() {
                // Сброс активного состояния у всех кнопок
                amountButtons.forEach(btn => btn.classList.remove('active'));
                
                // Установка активного состояния для текущей кнопки
                this.classList.add('active');
                
                // Сброс пользовательской суммы
                if (customAmountInput) {
                    customAmountInput.value = '';
                }
                
                // Установка выбранной суммы
                selectedAmount = parseInt(this.getAttribute('data-amount'));
                updatePaymentSummary();
            });
        });
        
        // Обработчик для пользовательской суммы
        if (customAmountInput) {
            customAmountInput.addEventListener('input', function() {
                // Сброс активного состояния у кнопок
                amountButtons.forEach(btn => btn.classList.remove('active'));
                
                // Установка выбранной суммы
                selectedAmount = parseInt(this.value) || 0;
                updatePaymentSummary();
            });
        }
        
        // Обработчик для поля email
        if (userEmailInput) {
            userEmailInput.addEventListener('input', validateForm);
        }
        
        // Обработчик для кнопки оплаты
        payButton.addEventListener('click', openPaymentModal);
        
        // Обработчики для модального окна
        if (closeModal) {
            closeModal.addEventListener('click', closePaymentModal);
        }
        
        if (cancelPaymentBtn) {
            cancelPaymentBtn.addEventListener('click', closePaymentModal);
        }
        
        if (confirmPaymentBtn) {
            confirmPaymentBtn.addEventListener('click', processPaymentWithMockService);
        }
        
        // Закрытие модального окна при клике вне его
        window.addEventListener('click', function(event) {
            if (event.target === paymentModal) {
                closePaymentModal();
            }
        });
        
        console.log('Обработчики событий инициализированы');
    }
    
    // Функция обновления сводки платежа
    function updatePaymentSummary() {
        if (selectedAmount > 0) {
            // Расчет комиссии (5%)
            commission = Math.round(selectedAmount * 0.05);
            totalAmount = selectedAmount + commission;
            
            // Обновление элементов DOM
            if (paymentAmountElement) paymentAmountElement.textContent = selectedAmount.toFixed(0);
            if (paymentFeeElement) paymentFeeElement.textContent = commission.toFixed(0);
            if (paymentTotalElement) paymentTotalElement.textContent = totalAmount.toFixed(0);
        } else {
            // Сброс значений
            if (paymentAmountElement) paymentAmountElement.textContent = '0';
            if (paymentFeeElement) paymentFeeElement.textContent = '0';
            if (paymentTotalElement) paymentTotalElement.textContent = '0';
        }
        
        validateForm();
    }
    
    // Функция проверки формы
    function validateForm() {
        const emailValid = userEmailInput && userEmailInput.value && isValidEmail(userEmailInput.value);
        const amountValid = selectedAmount > 0;
        const steamIdElement = document.getElementById('steam-id');
        const profileValid = steamIdElement && steamIdElement.textContent !== 'Не указан';
        
        if (payButton) {
            payButton.disabled = !(emailValid && amountValid && profileValid);
            
            if (!profileValid) {
                payButton.title = 'Сначала загрузите профиль Steam';
            } else if (!amountValid) {
                payButton.title = 'Выберите сумму пополнения';
            } else if (!emailValid) {
                payButton.title = 'Введите корректный email';
            } else {
                payButton.title = '';
            }
        }
    }
    
    // Функция проверки email
    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    
    // Функция открытия модального окна оплаты
    function openPaymentModal() {
        // Получение информации о профиле Steam
        const steamIdElement = document.getElementById('steam-id');
        const steamNicknameElement = document.getElementById('steam-nickname');
        
        const steamId = steamIdElement ? steamIdElement.textContent : 'Не указан';
        const steamNickname = steamNicknameElement ? steamNicknameElement.textContent : 'Не указан';
        const userEmail = userEmailInput ? userEmailInput.value : '';
        
        // Обновление информации в модальном окне
        if (demoAmountElement) demoAmountElement.textContent = selectedAmount.toFixed(0);
        if (demoSteamIdElement) demoSteamIdElement.textContent = steamId;
        if (demoSteamNicknameElement) demoSteamNicknameElement.textContent = steamNickname;
        if (demoEmailElement) demoEmailElement.textContent = userEmail;
        if (demoFeeElement) demoFeeElement.textContent = commission.toFixed(0);
        if (demoTotalElement) demoTotalElement.textContent = totalAmount.toFixed(0);
        
        // Открытие модального окна
        paymentModal.style.display = 'block';
    }
    
    // Функция закрытия модального окна оплаты
    function closePaymentModal() {
        paymentModal.style.display = 'none';
        currentSessionId = null;
    }
    
    // Функция обработки платежа через Mock Payment Service
    async function processPaymentWithMockService() {
        // Получение информации о платеже
        const steamIdElement = document.getElementById('steam-id');
        const steamNicknameElement = document.getElementById('steam-nickname');
        
        const steamId = steamIdElement ? steamIdElement.textContent : 'Не указан';
        const steamNickname = steamNicknameElement ? steamNicknameElement.textContent : 'Не указан';
        const userEmail = userEmailInput ? userEmailInput.value : '';
        
        // Получение выбранного метода оплаты
        const selectedMethod = document.querySelector('input[name="payment-method"]:checked');
        const paymentMethod = selectedMethod ? selectedMethod.value : 'card';
        
        // Показать индикатор загрузки
        if (confirmPaymentBtn) {
            confirmPaymentBtn.textContent = 'Подготовка...';
            confirmPaymentBtn.disabled = true;
        }
        
        try {
            // Создание объекта платежа для Mock Service
            const paymentData = {
                amount: totalAmount,
                currency: 'RUB',
                description: `Пополнение Steam баланса для ${steamNickname}`,
                paymentMethod: paymentMethod,
                customer: {
                    email: userEmail,
                    steamId: steamId,
                    steamNickname: steamNickname
                }
            };
            
            // Инициализация платежа через Mock Service
            console.log('Инициализация платежа через Mock Payment Service...');
            const paymentSession = await window.mockPaymentService.initiatePayment(paymentData);
            currentSessionId = paymentSession.sessionId;
            
            console.log('Платежная сессия создана:', paymentSession);
            
            // Обработка в зависимости от метода оплаты
            if (paymentMethod === 'card') {
                // Показ формы ввода карточных данных
                MockPaymentUI.showCardInputModal(currentSessionId, totalAmount, async (cardData) => {
                    await executePayment(currentSessionId, paymentMethod, {
                        ...cardData,
                        amount: totalAmount,
                        currency: 'RUB'
                    });
                });
            } else {
                // Для других методов сразу выполняем платеж
                await executePayment(currentSessionId, paymentMethod);
            }
            
        } catch (error) {
            console.error('Ошибка инициализации платежа:', error);
            MockPaymentUI.showPaymentResult(false, `Ошибка инициализации платежа: ${error.message}`);
            
            // Сброс состояния кнопки подтверждения
            if (confirmPaymentBtn) {
                confirmPaymentBtn.textContent = 'Подтвердить оплату';
                confirmPaymentBtn.disabled = false;
            }
        }
    }
    
    // Функция выполнения платежа
    async function executePayment(sessionId, paymentMethod, cardData = null) {
        try {
            // Показ статуса обработки
            MockPaymentUI.showPaymentProcessing(sessionId);
            
            // Обработка платежа через Mock Service
            console.log(`Выполнение платежа ${sessionId} методом ${paymentMethod}...`);
            const paymentResult = await window.mockPaymentService.processPayment(sessionId, paymentMethod, cardData);
            
            console.log('Результат платежа:', paymentResult);
            
            if (paymentResult.status === 'completed') {
                // Успешный платеж
                await handleSuccessfulPayment(paymentResult);
            } else {
                throw new Error('Платеж не завершен');
            }
            
        } catch (error) {
            console.error('Ошибка выполнения платежа:', error);
            MockPaymentUI.showPaymentResult(false, `Ошибка оплаты: ${error.message}`);
        } finally {
            // Сброс состояния кнопки подтверждения
            if (confirmPaymentBtn) {
                confirmPaymentBtn.textContent = 'Подтвердить оплату';
                confirmPaymentBtn.disabled = false;
            }
        }
    }
    
    // Обработка успешного платежа
    async function handleSuccessfulPayment(paymentResult) {
        // Получение информации о профиле
        const steamIdElement = document.getElementById('steam-id');
        const steamNicknameElement = document.getElementById('steam-nickname');
        
        const steamId = steamIdElement ? steamIdElement.textContent : 'Не указан';
        const steamNickname = steamNicknameElement ? steamNicknameElement.textContent : 'Не указан';
        const userEmail = userEmailInput ? userEmailInput.value : '';
        
        // Создание объекта платежа для истории
        const payment = {
            id: paymentResult.transactionId,
            amount: selectedAmount,
            fee: commission,
            total: totalAmount,
            steamId: steamId,
            steamNickname: steamNickname,
            email: userEmail,
            date: new Date().toISOString(),
            status: 'completed',
            paymentMethod: paymentResult.method,
            authorizationCode: paymentResult.authorizationCode
        };
        
        // Сохранение платежа в истории
        savePaymentToHistory(payment);
        
        // Отправка чека на email
        let emailResult;
        if (typeof sendReceiptEmail === 'function') {
            emailResult = await sendReceiptEmail(payment);
        } else {
            emailResult = { success: true, message: 'Чек будет отправлен' };
        }
        
        // Обновление баланса Steam (демо)
        updateSteamBalance(selectedAmount);
        
        // Закрытие модального окна оплаты
        closePaymentModal();
        
        // Сброс формы
        resetPaymentForm();
        
        // Показать сообщение об успехе
        MockPaymentUI.showPaymentResult(
            true, 
            `Платеж на сумму ${selectedAmount} ₽ успешно выполнен! ${emailResult.message}`,
            paymentResult.transactionId
        );
    }
    
    // Функция сброса формы платежа
    function resetPaymentForm() {
        // Сброс выбранной суммы
        selectedAmount = 0;
        commission = 0;
        totalAmount = 0;
        
        // Сброс активных кнопок
        amountButtons.forEach(btn => btn.classList.remove('active'));
        
        // Сброс полей ввода
        if (customAmountInput) customAmountInput.value = '';
        if (userEmailInput) userEmailInput.value = '';
        
        // Сброс выбора метода оплаты
        const defaultMethod = document.querySelector('input[value="card"]');
        if (defaultMethod) {
            defaultMethod.checked = true;
        }
        
        // Обновление сводки
        updatePaymentSummary();
    }
    
    // Функция сохранения платежа в историю
    function savePaymentToHistory(payment) {
        // Получение текущей истории из localStorage
        let paymentHistory = JSON.parse(localStorage.getItem('paymentHistory')) || [];
        
        // Добавление нового платежа
        paymentHistory.unshift(payment);
        
        // Сохранение обновленной истории
        localStorage.setItem('paymentHistory', JSON.stringify(paymentHistory));
        
        // Обновление отображения истории
        updatePaymentHistoryDisplay();
    }
    
    // Функция обновления отображения истории платежей
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
        
        paymentHistory.forEach(payment => {
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';
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
    
    // Функция обновления баланса Steam (демо)
    function updateSteamBalance(amount) {
        const balanceElement = document.getElementById('steam-balance');
        if (balanceElement) {
            const currentBalance = parseFloat(balanceElement.textContent) || 0;
            const newBalance = currentBalance + amount;
            balanceElement.textContent = newBalance.toFixed(2) + ' ₽';
        }
    }
    
    // Вспомогательные функции
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
    
    // Инициализация истории платежей при загрузке
    updatePaymentHistoryDisplay();
    
    console.log('Платежная система с Mock Payment Service инициализирована');
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    initPaymentSystem();
});
