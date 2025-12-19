# Space Snake 3D 🐍🚀

Um jogo Snake 3D futurista desenvolvido com Three.js, apresentando mecânicas espaciais únicas, efeitos visuais impressionantes e gameplay desafiador.

## 🎮 Como Jogar

### Controles
- **Mouse**: Mova para controlar a direção da cobra (click para travar/destravar)
- **Espaço (SPACE)**: **Turbo / Boost** (Aumenta velocidade, limitado por energia)
- **WASD / Setas**: Controle direcional alternativo
- **Scroll do Mouse**: Ajusta zoom da câmera
- **Shift**: Modo de visão livre
- **P / ESC**: Pausar jogo

### Interface
- **Seletor de Idioma**: Disponível no menu inicial (PT | EN | ES)
- **Barra de Boost**: Canto inferior direito. Indica energia disponível para o turbo.
- **Objetivos**: Descritos no menu inicial.

### Objetivo
Colete energia para crescer e aumentar sua pontuação enquanto evita perigos:

## 🌟 Características

### Sistema de Energia (Frutas)
- **Energia Rosa** (Comum): Crescimento normal (+100 pontos).
- **Energia Dourada** (Rara): Bônus de velocidade temporário (Speed Up).
- **Fruta Verde** (Ultra-rara/Móvel): Alto crescimento (+2000 pontos, +20 segmentos). Fugitiva!

### Mecânicas Especiais
- **Turbo (Boost)**
  - Duração máxima: **2 segundos** (Uso estratégico!)
  - Tempo de recarga: **40 segundos**
  - Barra visual indicativa
- **Localização**: Suporte completo para Português, Inglês e Espanhol.
- **Espaço Toroidal**: O mapa "dá a volta" em todas as direções.

### Perigos
#### Buracos Negros (Void)
- **Magnetismo**: Atraem frutas e a cobra.
- **Colisão**: Morte instantânea ou dano massivo.
- **Canibalismo**: Podem se fundir e criar eventos de **Supernova** (explosões massivas).

## 🛠️ Tecnologias

- **Three.js**: Engine 3D para renderização e efeitos.
- **JavaScript (ES6+)**: Lógica moderna e modular.
- **WebGL**: Aceleração gráfica.
- **Post-processing**: Efeitos de Bloom (Neon HDR) e distorções.

## 🚀 Como Executar

1. Clone o repositório:
```bash
git clone git@github.com:clebson-dev/space_snake_3D.git
cd space_snake_3D
```

2. Instale dependências:
```bash
npm install
```

3. Execute localmente:
```bash
npm run dev
```

4. Acesse: `http://localhost:5173`

## 📂 Estrutura do Projeto

```
space_snake_3D/
├── index.html          # Entry point e UI
├── main.js            # Loop principal e inicialização
├── style.css          # Estilos Neon UI
├── js/
│   ├── localization.js # Sistema de tradução (PT/EN/ES)
│   ├── state.js       # Estado global (inclui boostEnergy)
│   ├── logic.js       # Mecânicas de jogo
│   ├── graphics.js    # Three.js setup
│   ├── input.js       # Mouse/Teclado
│   └── effects.js     # Partículas e Explosões
└── README.md
```

## 🐛 Atualizações Recentes (v1.1)

- ✅ **Localização**: Adicionado suporte a múltiplos idiomas.
- ✅ **Boost Energy**: Sistema de limite de turbo adicionado para balanceamento.
- ✅ **Correções Visuais**: Barra de boost e textos informativos ajustados.
- ✅ **Reset**: Correção de bugs no reinício do jogo.

## 📄 Licença

Este projeto é de código aberto. Sinta-se livre para usar, modificar e distribuir.

## 👨‍💻 Desenvolvedor

**Clebson**
- GitHub: [@clebson-dev](https://github.com/clebson-dev)

---

**Divirta-se jogando! 🎮✨**
