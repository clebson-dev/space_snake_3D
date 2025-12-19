# Space Snake 3D 🐍🚀

Um jogo Snake 3D futurista desenvolvido com Three.js, apresentando mecânicas espaciais únicas, efeitos visuais impressionantes e gameplay desafiador.

## 🎮 Como Jogar

### Controles
- **Mouse**: Mova para controlar a direção da cobra (click para travar/destravar)
- **WASD / Setas**: Controle direcional alternativo
- **Scroll do Mouse**: Ajusta zoom da câmera
- **Shift**: Modo de visão livre
- **P / ESC**: Pausar jogo

### Objetivo
Colete frutas para crescer e aumentar sua pontuação enquanto evita:
- Colidir com seu próprio corpo
- Buracos negros
- Efeitos de Supernova

## 🌟 Características

### Frutas
- **Frutas Vermelhas** (Comuns): +100 pontos, +1 segmento
- **Núcleo Estelar** (Amarelas/Raras): +500 pontos, +2 segmentos, aumenta velocidade
  - Duração: 45 segundos
  - Taxa de spawn: 1%
- **Anomalia Viva** (Verdes/Ultra-raras): +2000 pontos, +20 segmentos
  - Duração: 2 minutos
  - Taxa de spawn: 0.3%
  - Move-se pelo mapa criando portais

### Buracos Negros (até 100)
- **Magnetismo**: Atraem frutas e a cobra
- **Colisão**: Causa dano baseado no tamanho
- **Canibalismo**: Buracos negros podem consumir uns aos outros
  - Visuais: Pulsam em dourado/preto
  - Portais proporcionais ao tamanho
- **SUPERNOVA**: Quando um buraco negro canibal atinge tamanho > 2.5
  - Explosão massiva
  - Camera shake intensa
  - Ondas de choque
  - Raio de explosão: 70 unidades

### Sistema de Câmera
- Câmera suave com interpolação
- Sistema de warp durante teletransportes
- Efeitos de shake em eventos especiais

## 🛠️ Tecnologias

- **Three.js**: Engine 3D
- **JavaScript (ES6+)**: Lógica do jogo
- **WebGL**: Renderização
- **Post-processing**: Bloom effects para visual neon

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
├── index.html          # Entry point
├── main.js            # Game loop principal
├── style.css          # Estilos UI
├── js/
│   ├── constants.js   # Constantes do jogo
│   ├── state.js       # Gerenciamento de estado
│   ├── logic.js       # Lógica do jogo
│   ├── graphics.js    # Renderização 3D
│   ├── input.js       # Controles
│   └── effects.js     # Efeitos visuais
└── README.md
```

## 🎯 Mecânicas Principais

### Sistema de Interpolação
- Fixed timestep (100ms) para física consistente
- Interpolação visual suave em 60 FPS
- Sincronização perfeita entre lógica e renderização

### Espaço Toroidal
- O mundo "dá a volta" em todas as direções
- Portais visuais indicam teletransportes

### Sistema de Pontuação
- Pontuação base por frutas
- Multiplicador de velocidade progressivo
- High score persistente (localStorage)

## 🐛 Correções Recentes

- ✅ Interpolação de movimento otimizada
- ✅ Detecção de colisão de frutas raras corrigida
- ✅ Limpeza de meshes ao coletar frutas
- ✅ Controles de mouse desacoplados da câmera visual

## 📄 Licença

Este projeto é de código aberto. Sinta-se livre para usar, modificar e distribuir.

## 👨‍💻 Desenvolvedor

**Clebson**
- GitHub: [@clebson-dev](https://github.com/clebson-dev)

---

**Divirta-se jogando! 🎮✨**
