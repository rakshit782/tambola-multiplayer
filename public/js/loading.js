// Loading Screen Component
class LoadingScreen {
    constructor() {
        this.overlay = null;
    }

    show(message = 'Loading...') {
        if (this.overlay) return;

        this.overlay = document.createElement('div');
        this.overlay.id = 'loading-overlay';
        this.overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.95);
            backdrop-filter: blur(10px);
            z-index: 99999;
            display: flex;
            align-items: center;
            justify-content: center;
            animation: fadeIn 0.3s ease-out;
        `;

        this.overlay.innerHTML = `
            <div style="
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 24px;
            ">
                <!-- Animated Logo -->
                <div style="
                    width: 80px;
                    height: 80px;
                    border-radius: 50%;
                    background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    animation: pulse 2s ease-in-out infinite;
                    box-shadow: 0 0 60px rgba(99, 102, 241, 0.6);
                ">
                    <span style="
                        font-size: 2.5rem;
                        font-weight: 800;
                        color: white;
                    ">T</span>
                </div>

                <!-- Spinner -->
                <div class="spinner"></div>

                <!-- Message -->
                <div style="
                    color: white;
                    font-size: 1.125rem;
                    font-weight: 600;
                    text-align: center;
                    font-family: 'Plus Jakarta Sans', sans-serif;
                ">${message}</div>
            </div>
        `;

        document.body.appendChild(this.overlay);
    }

    hide() {
        if (this.overlay) {
            this.overlay.style.animation = 'fadeOut 0.3s ease-out';
            setTimeout(() => {
                if (this.overlay && this.overlay.parentNode) {
                    this.overlay.parentNode.removeChild(this.overlay);
                    this.overlay = null;
                }
            }, 300);
        }
    }

    update(message) {
        if (this.overlay) {
            const messageEl = this.overlay.querySelector('div:last-child');
            if (messageEl) {
                messageEl.textContent = message;
            }
        }
    }
}

// Add styles
const loadingStyles = document.createElement('style');
loadingStyles.textContent = `
    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }

    @keyframes fadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
    }

    @keyframes pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.1); }
    }

    .spinner {
        width: 48px;
        height: 48px;
        border: 4px solid rgba(99, 102, 241, 0.2);
        border-top-color: #6366f1;
        border-radius: 50%;
        animation: spin 1s linear infinite;
    }

    @keyframes spin {
        to { transform: rotate(360deg); }
    }
`;
document.head.appendChild(loadingStyles);

// Create global instance
window.loading = new LoadingScreen();
