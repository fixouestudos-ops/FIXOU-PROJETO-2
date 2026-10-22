import fs from 'node:fs';
// Conteudo das 22 explicacoes revisadas pelo Owner (fonte: prompt da tarefa).
// Estilo: sem markdown ** (o app usa escapeHTML e nao renderiza bold), \n\n entre paragrafos.
const raw={
"fis-lic-l2-f1-c6-exercicios-complementares-q43":`A frequência do gira-gira é 0,25 Hz. Sua velocidade angular é ω = 2πf = 2 × 3 × 0,25 = 1,5 rad/s.

a) Como a bola está a 2 m do eixo, a velocidade tangencial vale v = ωR = 1,5 × 2 = 3 m/s. A aceleração centrípeta é a = ω²R = 1,5² × 2 = 4,5 m/s².

b) No lançamento, a velocidade de 4 m/s em direção ao centro é perpendicular à velocidade tangencial de 3 m/s. Assim, a velocidade em relação ao chão é U = √(4² + 3²) = 5 m/s.

c) O ângulo entre U e a direção radial do lançamento satisfaz tan θ = 3/4, portanto θ ≈ 37°.`,
"fis-lic-l2-f1-c6-exercicios-propostos-q37":`Como a partícula parte do repouso e apresenta acelerações constantes ax = 3 m/s² e ay = 4 m/s², as componentes da velocidade são vx = 3t e vy = 4t.

O módulo da velocidade é v = √[(3t)² + (4t)²] = 5t.

a) Para v = 40 m/s, temos 5t = 40, portanto t = 8 s.

b) Como a posição inicial é a origem, x = (1/2)ax t² = 1,5 × 64 = 96 m; y = (1/2)ay t² = 2 × 64 = 128 m.`,
"fis-lic-l2-f1-c6-exercicios-propostos-q38":`O movimento começa do repouso e apresenta aceleração tangencial constante de 1 m/s².

I. Após 10 s, a velocidade é v = aₜt = 1 × 10 = 10 m/s. A aceleração centrípeta é a꜀ = v²/R = 100/100 = 1 m/s². Logo, as componentes tangencial e centrípeta valem 1 m/s² e 1 m/s², respectivamente: alternativa E.

II. As componentes tangencial e centrípeta são perpendiculares. Como possuem o mesmo módulo, a aceleração resultante forma 45° com a direção radial voltada ao centro: alternativa D.`,
"fis-lic-l2-f1-c6-exercicios-propostos-q44":`Para permanecer em repouso em relação ao Sol, desprezando a translação terrestre, o avião precisa compensar a velocidade de rotação da Terra naquela latitude.

O raio do paralelo de latitude 60° é r = R cos 60° = 6000 × 0,5 = 3000 km.

Em 24 horas, um ponto desse paralelo percorre uma circunferência de comprimento 2πr = 6000π km.

Sua velocidade é v = 6000π/24 = 250π km/h. O avião deve voar para oeste, em sentido contrário ao da rotação terrestre.`,
"fis-lic-l2-f1-c7-exercicios-complementares-q30":`Decompondo a velocidade inicial de 80 m/s em componentes horizontal e vertical.

vx = 80 cos 30° = 40√3 m/s.

vy inicial = 80 sen 30° = 40 m/s.

Após 5 segundos, vy = 40 − 10 × 5 = −10 m/s. O sinal negativo indica que a pedra está descendo.

O módulo da velocidade é v = √[(40√3)² + (−10)²] = √(4800 + 100) = 70 m/s.`,
"fis-lic-l2-f1-c7-exercicios-propostos-q17":`O projétil é lançado com componente vertical inicial de 30 m/s e retorna à mesma altura, sob aceleração gravitacional de 10 m/s².

O tempo total de voo é T = 2v₀y/g = 2 × 30/10 = 6 s.

Como a distância horizontal percorrida é 300 m e a velocidade horizontal é constante, temos 300 = v₀x × 6.

Assim, a componente horizontal necessária é v₀x = 50 m/s.`,
"fis-lic-l2-f1-c7-exercicios-propostos-q25":`Na chegada ao solo, o módulo da velocidade é 37,5 m/s e sua direção forma 53° com a horizontal.

A componente vertical da velocidade de impacto vale vy = 37,5 sen 53° = 37,5 × 0,8 = 30 m/s.

Como o lançamento foi horizontal, a velocidade vertical inicial era nula. Pela relação vy² = 2gh, temos 30² = 2 × 10 × h.

Portanto, a altura da torre é h = 45 m.`,
"fis-lic-l2-f1-c8-exercicios-complementares-q12":`A tração máxima suportada pelo fio é uma propriedade mecânica do material, não dependendo diretamente do planeta em que ele é utilizado.

Na Terra, ele suporta uma massa de 60 kg sob gravidade de 10 m/s². Portanto, sua tração máxima é Tmáx = mg = 60 × 10 = 600 N.

Na Lua, o limite de tração permanece 600 N.

A massa máxima suspensa será m = Tmáx/gLua = 600/1,5 = 400 kg.`,
"fis-lic-l2-f1-c8-exercicios-complementares-q19":`a) A massa é abandonada a 8 m de altura em Marte, com velocidade vertical inicial nula. Aplicando h = gt²/2, temos 8 = 4t²/2, resultando em t = 2 s. Durante esse intervalo, a velocidade horizontal permanece 6 m/s. Logo, o deslocamento horizontal é Δx = 6 × 2 = 12 m.

b) A sustentação depende da diferença de pressão nas hélices, que em Marte corresponde a 1/160 da sustentação terrestre na mesma condição de operação. Na Terra, a sustentação equilibra o peso de 800 g: FTerra = 0,8 × 10 = 8 N. Em Marte, FMarte = 8/160 = 0,05 N. Com gravidade marciana de 4 m/s², a massa sustentada é m = 0,05/4 = 0,0125 kg = 12,5 g.`,
"fis-lic-l2-f1-c8-exercicios-complementares-q22":`A massa do avião é 100 toneladas, equivalentes a 100.000 kg.

a) No início do voo, considerando equilíbrio vertical naquele instante, a sustentação deve igualar o peso: F = mg = 100.000 × 10 = 1,0 × 10⁶ N.

b) A velocidade de decolagem é 360 km/h = 100 m/s. Partindo do repouso e percorrendo 2000 m, a aceleração média equivalente é obtida por v² = 2aΔs: 100² = 2a × 2000, logo a = 2,5 m/s². Pela segunda lei de Newton, F = ma = 100.000 × 2,5 = 2,5 × 10⁵ N.`,
"fis-lic-l2-f1-c8-exercicios-complementares-q24":`A queda livre acontece ao longo de 80 m, pois o resgate ocorre 1 m antes do solo.

Pela equação v² = 2gΔh, adotando g = 10 m/s², a velocidade imediatamente antes do resgate é v = √(2 × 10 × 80) = 40 m/s, dirigida para baixo.

a) A velocidade é anulada em 0,05 s. A aceleração média de frenagem possui módulo a = 40/0,05 = 800 m/s², dirigida para cima. Pela segunda lei de Newton, F − mg = ma, portanto F = 50 × (800 + 10) = 40.500 N.

b) A aceleração média de frenagem equivale a 80g. Comparada à aceleração letal indicada, de 8g, ela é 10 vezes maior.`,
"fis-lic-l2-f1-c8-exercicios-complementares-q42":`A massa da caixa é 500 kg e a da empilhadeira é 1000 kg.

a) A caixa sobe com aceleração de 0,5 m/s². Aplicando a segunda lei de Newton: F − mg = ma. Assim, F = 500 × (10 + 0,5) = 5250 N.

b) Pela terceira lei de Newton, a caixa exerce na empilhadeira uma força vertical para baixo de 5250 N. O chão também precisa sustentar o peso da empilhadeira, de 1000 × 10 = 10.000 N. Logo, a força normal do chão é N = 10.000 + 5250 = 15250 N.`,
"fis-lic-l2-f1-c8-exercicios-propostos-q1":`A afirmativa 01 é falsa, pois a inércia está relacionada à massa, enquanto o peso é a força gravitacional sobre o corpo.

A 02 é verdadeira: com força resultante nula, um corpo que já está em movimento mantém velocidade vetorial constante, segundo a primeira lei de Newton.

A 04 é verdadeira: a propulsão a jato é uma aplicação da terceira lei de Newton.

A 08 é falsa: as forças de ação e reação atuam em corpos diferentes e, portanto, não se anulam mutuamente no movimento da Terra.

A 16 é falsa: se a velocidade é constante sob força aplicada horizontal de 10 N, a força de atrito cinético tem módulo de 10 N, em sentido contrário.

Corretas: 02 e 04. Soma = 06.`,
"fis-lic-l2-f1-c8-exercicios-propostos-q14":`A afirmativa I é verdadeira, pois um corpo em equilíbrio estático ou dinâmico apresenta força resultante nula.

A afirmativa II é falsa, porque o módulo da soma de duas forças depende do ângulo entre elas. Forças de mesmos módulos podem produzir resultantes diferentes conforme suas orientações.

A afirmativa III é falsa, pois as forças de ação e reação atuam obrigatoriamente em corpos diferentes. Por isso, não se anulam como forças aplicadas a um mesmo corpo.

Logo, somente a afirmativa I está correta: alternativa A.`,
"fis-lic-l2-f1-c8-exercicios-propostos-q19":`Cada objeto possui massa de 50 g = 0,05 kg. Seu peso é P = mg = 0,05 × 10 = 0,5 N.

A tração no segmento superior do fio corresponde ao peso de todos os objetos pendurados.

Com 11 objetos, a tração é 11 × 0,5 = 5,5 N, inferior ao limite de 5,80 N.

Ao pendurar o 12º objeto, a tração passa a 12 × 0,5 = 6,0 N, ultrapassando a resistência máxima.

Portanto, 12 objetos são pendurados até ocorrer o rompimento, que acontece no segmento superior do fio, junto ao suporte.`,
"fis-lic-l2-f1-c8-exercicios-propostos-q21":`Pela segunda lei de Newton, F = ma.

Para a primeira massa, m₁ = F/5. Para a segunda, m₂ = F/20.

Ao reunir os corpos, a massa total será M = F/5 + F/20 = F/4.

Aplicando a mesma força ao conjunto, temos a = F/M = F/(F/4) = 4 m/s².`,
"fis-lic-l2-f1-c8-exercicios-propostos-q25":`A massa do reboque é de 16 toneladas, equivalentes a 16.000 kg. A aceleração informada é 200 cm/s² = 2 m/s².

Desprezando a massa do cabo e considerando que a tração seja a força horizontal resultante sobre o reboque, utilizamos T = ma.

Logo, T = 16.000 × 2 = 32.000 N, ou 3,2 × 10⁴ N.`,
"fis-lic-l2-f1-c8-exercicios-propostos-q27":`A velocidade inicial do automóvel é 90 km/h = 25 m/s.

a) Aplicamos v² = v₀² + 2aΔs. Como o automóvel para, v = 0, e a desaceleração é −2,5 m/s²:

0 = 25² − 5Δs.

Assim, Δs = 125 m. Como o sinal está a 100 m, o automóvel ultrapassa o sinal em 25 m antes de parar.

b) A massa total do conjunto é 720 + 80 = 800 kg. O módulo da força resultante é F = ma = 800 × 2,5 = 2000 N.`,
"fis-lic-l2-f1-c8-revisando-q15":`Quando o trem acelera, o fio de prumo se inclina no sentido oposto ao da aceleração do vagão.

a) O sentido de movimento inicial do trem é oposto ao sentido em que a massa do prumo se desloca relativamente ao vagão durante a partida.

b) No regime de inclinação considerado, tan θ = a/g. Como sen 36,87° = 0,6 e cos 36,87° = 0,8, temos a = 10 × (0,6/0,8) = 7,5 m/s².

c) Em repouso, a tração vale T = mg = 5 × 10 = 50 N.

d) Durante a aceleração, T cos θ = mg. Logo, T = 50/0,8 = 62,5 N.`,
"fis-lic-l2-f2-c5-exercicios-propostos-q10":`A potência elétrica da lâmpada é P = 60 W e a tensão de alimentação é U = 100 V.

Usando a relação P = Ui, isolamos a corrente:

i = P/U = 60/100 = 0,6 A.

A corrente elétrica que alimenta a lâmpada é, portanto, de 0,6 ampère: alternativa B.`,
"fis-lic-l2-f2-c5-exercicios-propostos-q20":`Pela primeira lei de Ohm, a resistência elétrica é R = U/i.

Substituindo a diferença de potencial de 0,07 V e a corrente de 7,0 × 10⁻⁶ A:

R = 0,07/(7,0 × 10⁻⁶) = 1,0 × 10⁴ Ω.

A ordem de grandeza da resistência é 10⁴ Ω: alternativa C.`,
"fis-lic-l2-f3-c9-exercicios-complementares-q9":`A velocidade de propagação da luz em um meio é v = c/n. Como o índice de refração para a luz vermelha é menor (1,513) do que para a azul (1,528), a luz vermelha se propaga mais rapidamente.

a) Portanto, a luz vermelha chega primeiro.

b) O tempo de propagação é t = Ln/c. A diferença entre os tempos de chegada será Δt = L(nazul − nvermelho)/c.

Para L = 300 km = 3 × 10⁵ m:

Δt = (3 × 10⁵ × 0,015)/(3 × 10⁸) = 1,5 × 10⁻⁵ s.`
};
// validacoes de estilo
let probs=0;
for(const [id,ex] of Object.entries(raw)){
 if(ex.includes('**')){console.log('FALHA markdown em '+id);probs++;}
 if(!ex.trim()){console.log('FALHA vazio em '+id);probs++;}
}
console.log('explicacoes:',Object.keys(raw).length,'| problemas de estilo:',probs);
// gravar
fs.writeFileSync('scripts/lote14-explicacoes.json',JSON.stringify(raw,null,2),'utf8');
console.log('gravado scripts/lote14-explicacoes.json');
