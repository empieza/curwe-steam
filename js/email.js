
// Email Service для отправки чеков через EmailJS
class EmailService {
    constructor() {
        this.initialized = false;
        this.serviceId = 'service_xrwhrgr';
        this.templateId = 'template_t6b2pkr';
        this.publicKey = 'Gs1d0LpfmTBwaVw_e';
    }

    // Инициализация EmailJS
    async init() {
        try {
            if (typeof emailjs === 'undefined') {
                console.error('EmailJS SDK не загружен');
                return false;
            }
            
            // Инициализация EmailJS с публичным ключом
            emailjs.init(this.publicKey);
            this.initialized = true;
            console.log('EmailJS инициализирован');
            return true;
        } catch (error) {
            console.error('Ошибка инициализации EmailJS:', error);
            return false;
        }
    }

    // Отправка чека о платеже
    async sendReceipt(paymentData) {
        if (!this.initialized) {
            const initialized = await this.init();
            if (!initialized) {
                throw new Error('EmailJS не инициализирован');
            }
        }

        try {
            // Подготовка данных для шаблона
            const templateParams = {
                to_email: paymentData.email,
                steam_nickname: paymentData.steamNickname,
                steam_id: paymentData.steamId,
                transaction_id: paymentData.id,
                amount: paymentData.amount,
                fee: paymentData.fee,
                total: paymentData.total,
                payment_method: this.getPaymentMethodText(paymentData.paymentMethod),
                authorization_code: paymentData.authorizationCode,
                date: this.formatDate(paymentData.date),
                customer_email: paymentData.email
            };

            console.log('Отправка чека через EmailJS:', templateParams);

            // Отправка email через EmailJS
            const response = await emailjs.send(
                this.serviceId,
                this.templateId,
                templateParams
            );

            console.log('Чек успешно отправлен:', response);
            return {
                success: true,
                message: 'Чек отправлен на вашу почту',
                response: response
            };

        } catch (error) {
            console.error('Ошибка отправки чека:', error);
            return {
                success: false,
                message: 'Ошибка отправки чека: ' + error.message,
                error: error
            };
        }
    }

    // Получение текстового описания метода оплаты
    getPaymentMethodText(method) {
        const methods = {
            'card': 'Банковская карта',
            'qiwi': 'QIWI Кошелек',
            'yoomoney': 'ЮMoney',
            'mobile': 'Мобильный платеж'
        };
        return methods[method] || method;
    }

    // Форматирование даты
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
}

// Создаем глобальный экземпляр EmailService
window.emailService = new EmailService();

// Глобальная функция для отправки чека (для использования в payment.js)
async function sendReceiptEmail(paymentData) {
    try {
        const result = await window.emailService.sendReceipt(paymentData);
        return result;
    } catch (error) {
        console.error('Ошибка при отправке чека:', error);
        return {
            success: false,
            message: 'Не удалось отправить чек: ' + error.message
        };
    }
}

// Инициализация EmailService при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    // Инициализируем EmailService
    window.emailService.init().then(success => {
        if (success) {
            console.log('EmailService готов к работе');
        } else {
            console.warn('EmailService не инициализирован, чеки не будут отправляться');
        }
    });
});
