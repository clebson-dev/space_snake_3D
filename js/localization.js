export const translations = {
    pt: {
        subtitle: 'VIAJANTE DIMENSIONAL',
        score_label: 'PONTOS',
        high_score_label: 'RECORDE',
        speed_label: 'VELOCIDADE',
        ready_pilot: 'PILOTO PRONTO?',
        mission_obj_title: 'OBJETIVOS DA MISSÃO',
        obj_pink: 'Coma energia <span class="highlight-pink">ROSA</span> para crescer.',
        obj_golden: 'Caçe energia <span class="highlight-golden">DOURADA</span> para bônus de velocidade.',
        obj_green: 'Busque fruta <span class="highlight-green">VERDE</span> para alto crescimento!',
        obj_blackhole: 'Evite <span class="highlight-void">BURACOS NEGROS</span> - eles consomem tudo.',
        flight_controls_title: 'CONTROLES DE VOO',
        control_mouse: 'Pilotar Cobra',
        control_space: 'Turbo',
        control_shift: 'Olhar Livre',
        control_scroll: 'Zoom Câmera',
        btn_launch: 'INICIAR MISSÃO',
        system_paused: 'SISTEMA PAUSADO',
        btn_resume: 'RETOMAR MISSÃO',
        btn_abort: 'ABORTAR & REINICIAR',
        critical_failure: 'FALHA CRÍTICA',
        final_score_label: 'PONTUAÇÃO FINAL: ',
        btn_retry: 'TENTAR NOVAMENTE'
    },
    en: {
        subtitle: 'DIMENSIONAL DRIFTER',
        score_label: 'SCORE',
        high_score_label: 'HIGH SCORE',
        speed_label: 'SPEED',
        ready_pilot: 'READY PILOT?',
        mission_obj_title: 'MISSION OBJECTIVES',
        obj_pink: 'Eat <span class="highlight-pink">PINK</span> energy to grow.',
        obj_golden: 'Hunt rare <span class="highlight-golden">GOLDEN</span> energy for speed bonus.',
        obj_green: 'Seek <span class="highlight-green">GREEN</span> fruit for huge growth!',
        obj_blackhole: 'Avoid <span class="highlight-void">BLACK HOLES</span> - they consume all.',
        flight_controls_title: 'FLIGHT CONTROLS',
        control_mouse: 'Steer Snake',
        control_space: 'Boost Speed',
        control_shift: 'Free Look',
        control_scroll: 'Zoom Cam',
        btn_launch: 'LAUNCH MISSION',
        system_paused: 'SYSTEM PAUSED',
        btn_resume: 'RESUME MISSION',
        btn_abort: 'ABORT & RESTART',
        critical_failure: 'CRITICAL FAILURE',
        final_score_label: 'FINAL SCORE: ',
        btn_retry: 'RETRY MISSION'
    },
    es: {
        subtitle: 'VIAJERO DIMENSIONAL',
        score_label: 'PUNTOS',
        high_score_label: 'RÉCORD',
        speed_label: 'VELOCIDAD',
        ready_pilot: '¿PILOTO LISTO?',
        mission_obj_title: 'OBJETIVOS DE MISIÓN',
        obj_pink: 'Come energía <span class="highlight-pink">ROSA</span> para crecer.',
        obj_golden: 'Caza energía <span class="highlight-golden">DORADA</span> para bono de velocidad.',
        obj_green: '¡Busca fruta <span class="highlight-green">VERDE</span> para gran crecimiento!',
        obj_blackhole: 'Evita <span class="highlight-void">AGUJEROS NEGROS</span> - consumen todo.',
        flight_controls_title: 'CONTROLES DE VUELO',
        control_mouse: 'Pilotar Serpiente',
        control_space: 'Turbo',
        control_shift: 'Mirar Libre',
        control_scroll: 'Zoom Cámara',
        btn_launch: 'INICIAR MISIÓN',
        system_paused: 'SISTEMA PAUSADO',
        btn_resume: 'REANUDAR MISIÓN',
        btn_abort: 'ABORTAR Y REINICIAR',
        critical_failure: 'FALLO CRÍTICO',
        final_score_label: 'PUNTUACIÓN FINAL: ',
        btn_retry: 'REINTENTAR MISIÓN'
    }
};

let currentLang = localStorage.getItem('spaceSnake3DLang') || 'pt';

export function initLocalization() {
    setLanguage(currentLang);

    updateStaticText();

    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const lang = e.target.dataset.lang;
            setLanguage(lang);
            e.target.blur();
        });
    });
}

export function setLanguage(lang) {
    if (!translations[lang]) return;
    currentLang = lang;
    localStorage.setItem('spaceSnake3DLang', lang);
    updateStaticText();
    updateLanguageButtons();
}

export function getTranslation(key) {
    return translations[currentLang][key] || key;
}

export function getCurrentLanguage() {
    return currentLang;
}

function updateStaticText() {
    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (translations[currentLang][key]) {
            if (translations[currentLang][key].includes('<')) {
                el.innerHTML = translations[currentLang][key];
            } else {
                el.textContent = translations[currentLang][key];
            }
        }
    });

    const finalScoreEl = document.getElementById('final-score');
    if (finalScoreEl && finalScoreEl.parentElement) { }
}

function updateLanguageButtons() {
    document.querySelectorAll('.lang-btn').forEach(btn => {
        if (btn.dataset.lang === currentLang) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}
