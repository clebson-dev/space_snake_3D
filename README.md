# Space Snake 3D - Galaxy Hunter

Uma recriação futurista e tridimensional do clássico jogo da cobrinha (Snake), ambientada no espaço com gráficos neon, física de portais e mecânicas astronômicas avançadas.

## 🎮 Como Jogar

Navegue pelo vazio, colete energia para crescer e sobreviva a um universo caótico repleto de perigos gravitacionais. O mapa é cíclico (toroide): atravesse uma borda para surgir na oposta.

### Controles
*   **Mouse (Recomendado)**: Pilotagem de precisão. A cobra segue o cursor.
*   **WASD / Setas**: Direção manual (Estilo Clássico).
*   **Scroll**: Zoom da Câmera.
*   **Shift**: Olhar Livre (Move a câmera sem virar a cobra).
*   **P / ESC**: Pausa o jogo.

## 🌌 Entidades Cósmicas

### 🍎 Coletáveis
| Item | Visual | Efeito | Pontos |
|------|--------|--------|--------|
| **Energia Padrão** | 🔴 Vermelho | Crescimento normal. Abundante. | +100 |
| **Núcleo Estelar** | 🟡 Dourado (Pulsante) | Raro (1%). Dura **45s**. Exige velocidade. | +500 |
| **Anomalia Viva** | 🟢 Verde (Móvel) | Lendário (0.3%). Dura **2 min**. Move-se e usa portais. | +2000 |

### ⚫ Perigos: Buracos Negros
O universo está infestado com até **250 Buracos Negros**. Eles possuem gravidade própria e podem destruir você.

*   **Magnetismo**: Eles atraem frutas e a própria cobra.
*   **Colisão**: Encostar no horizonte de eventos causa dano massivo (remove segmentos). Se a cobra for pequena, é Fim de Jogo.
*   **Canibalismo**: Buracos negros colidem entre si!
    *   **O Maior vence**: O maior absorve o menor e cresce.
    *   **Canibais Dourados**: Se um Buraco Negro come uma Fruta Dourada, ele se torna um **Canibal Radioativo** (borda pulsando em **Preto e Dourado**). Eles crescem mais rápido e perseguem ativamente a comida.
    *   **Portais**: Se um canibal atravessa o mapa, seu portal também pulsa em Dourado e Preto.

### 💥 Evento: SUPERNOVA
Quando um Buraco Negro Canibal atinge uma massa crítica (Tamanho > 2.5x), ele se torna instável e colapsa em uma **SUPERNOVA**.
*   **Explosão**: Uma onda de choque massiva é liberada.
*   **Efeito**: Empurra violentamente todas as frutas, buracos negros e a cobra para longe.
*   **Zona de Perigo**: O raio da explosão é de **70 unidades**. Fique longe para evitar ser arremessado contra sua própria cauda!

## 🛠️ Tecnologias
*   **Three.js**: Renderização 3D, Post-Processing (Bloom/Glow), Partículas.
*   **Javascript ES6**: Lógica de jogo modular (State, Logic, Graphics, Effects).
*   **Física Customizada**: Detecção de colisão toroide, gravidade vetorial e inércia.

---
*Desenvolvido como experimento de codificação agêntica.*
