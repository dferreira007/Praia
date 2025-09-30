// === CONFIGURAÇÃO DO FIREBASE ===
// SUBSTITUA COM AS SUAS CREDENCIAIS DO FIREBASE
const firebaseConfig = {
    apiKey: "SUA_API_KEY_AQUI",
    authDomain: "SEU_AUTH_DOMAIN_AQUI",
    projectId: "SEU_PROJECT_ID_AQUI",
    databaseURL: "SUA_DATABASE_URL_AQUI"
};

// Inicializa o Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();
const scoresRef = db.ref('scores'); // Cria uma referência para o placar

// === CONFIGURAÇÃO GERAL ===
const CONFIG = {
    targetDate: new Date('2025-11-14T00:00:00'),
    updateInterval: 1000,
    animationScene: document.getElementById('animationScene'),
    scoreboardElement: document.getElementById('scoreboard')
};

// === UTILITÁRIOS ===
const Utils = {
    pad: (n) => String(n).padStart(2, '0'),
    
    getTimeDifference: (target) => {
        const now = new Date();
        const diff = target - now;
        
        if (diff <= 0) return null;
        
        const totalSeconds = Math.floor(diff / 1000);
        return {
            days: Math.floor(totalSeconds / 86400),
            hours: Math.floor((totalSeconds % 86400) / 3600),
            minutes: Math.floor((totalSeconds % 3600) / 60),
            seconds: totalSeconds % 60
        };
    },
    
    updateElement: (id, value) => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = Utils.pad(value);
        }
    }
};

// === CONTAGEM REGRESSIVA ===
const Countdown = {
    interval: null,
    
    init: () => {
        Countdown.update();
        Countdown.interval = setInterval(Countdown.update, CONFIG.updateInterval);
    },
    
    update: () => {
        const timeLeft = Utils.getTimeDifference(CONFIG.targetDate);
        
        if (!timeLeft) {
            Countdown.finish();
            return;
        }
        
        Utils.updateElement('days', timeLeft.days);
        Utils.updateElement('hours', timeLeft.hours);
        Utils.updateElement('minutes', timeLeft.minutes);
        Utils.updateElement('seconds', timeLeft.seconds);
    },
    
    finish: () => {
        clearInterval(Countdown.interval);
        
        ['days', 'hours', 'minutes', 'seconds'].forEach(id => {
            Utils.updateElement(id, 0);
        });
        
        Countdown.showFinalMessage();
    },
    
    showFinalMessage: () => {
        const titleEl = document.getElementById('finalTitle');
        const messageEl = document.getElementById('finalMessage');
        const finalMessage = document.getElementById('countdown-final-message');
        const prizeReveal = document.getElementById('prize-reveal');

        const scores = PetelecoScore.scores;
        let winner = '';
        let maxScore = -1;
        
        for (const name in scores) {
            if (scores[name] > maxScore) {
                maxScore = scores[name];
                winner = name;
            }
        }

        const formattedWinner = winner.charAt(0).toUpperCase() + winner.slice(1);

        titleEl.textContent = `O CAMPEÃO DOS PETELECOS É ${formattedWinner}! 🎉`;
        messageEl.textContent = "Bora pra praiaaa! 🏖️☀️🌊";
        finalMessage.classList.add('active');

        prizeReveal.textContent = 'Vale uma abobrinha empanada!';
        prizeReveal.style.display = 'block';

        PetelecoScore.lockdown = true;
    }
};

// === LÓGICA DO PLACAR DE PETELECOS ===
const PetelecoScore = {
    scores: {},
    lockdown: false,
    
    init: () => {
        PetelecoScore.setupEventListeners();
        // Escuta por mudanças no banco de dados do Firebase em tempo real
        scoresRef.on('value', (snapshot) => {
            const newScores = snapshot.val();
            if (newScores) {
                PetelecoScore.scores = newScores;
                PetelecoScore.renderScoreboard();
            }
        });
    },

    renderScoreboard: () => {
        const scoreboard = CONFIG.scoreboardElement;
        scoreboard.innerHTML = '';
        
        for (const name in PetelecoScore.scores) {
            const score = PetelecoScore.scores[name];
            const li = document.createElement('li');
            li.textContent = `${name.charAt(0).toUpperCase() + name.slice(1)}: ${score}`;
            scoreboard.appendChild(li);
        }
    },

    setupEventListeners: () => {
        const characters = document.querySelectorAll('.person-char');
        characters.forEach(char => {
            char.addEventListener('click', () => {
                if (PetelecoScore.lockdown) {
                    return;
                }
                const name = char.getAttribute('data-name');
                PetelecoScore.handleFlick(name, char);
            });
        });
    },

    handleFlick: (name, element) => {
        // Incrementa o placar e envia para o Firebase
        const currentScore = PetelecoScore.scores[name] || 0;
        scoresRef.child(name).set(currentScore + 1);

        element.classList.add('flicked');
        setTimeout(() => {
            element.classList.remove('flicked');
        }, 300);
    }
};

// === EFEITOS VISUAIS EXTRAS ===
const VisualEffects = {
    init: () => {
        if (window.innerWidth > 768) {
            VisualEffects.createParticles();
        }
    },
    
    createParticles: () => {
        const scene = CONFIG.animationScene;
        const particleCount = 8;
        
        for (let i = 0; i < particleCount; i++) {
            setTimeout(() => {
                const particle = document.createElement('div');
                particle.className = 'particle';
                particle.style.left = `${Math.random() * 100}%`;
                particle.style.bottom = '30%';
                particle.style.setProperty('--float-duration', `${3 + Math.random() * 3}s`);
                particle.style.setProperty('--float-x', `${(Math.random() - 0.5) * 50}px`);
                particle.style.animationDelay = `${Math.random() * 2}s`;
                
                scene.appendChild(particle);
                
                setTimeout(() => particle.remove(), 6000);
            }, i * 2000);
        }
    }
};

// === VALIDAÇÃO E TRATAMENTO DE ERROS ===
const ErrorHandler = {
    checkDateValidity: () => {
        if (isNaN(CONFIG.targetDate.getTime())) {
            console.error('Data inválida configurada');
            return false;
        }
        return true;
    },
    
    init: () => {
        window.addEventListener('error', (e) => {
            console.error('Erro na aplicação:', e.message);
        });
        
        if (!ErrorHandler.checkDateValidity()) {
            alert('Erro: Data de destino inválida. Por favor, contate o administrador.');
        }
    }
};

// === INICIALIZAÇÃO GERAL ===
document.addEventListener('DOMContentLoaded', () => {
    try {
        ErrorHandler.init();
        Countdown.init();
        VisualEffects.init();
        PetelecoScore.init();
    } catch (error) {
        console.error('Erro ao inicializar aplicação:', error);
        alert('Ocorreu um erro ao carregar a página. Por favor, recarregue.');
    }
});