# Auditoria — Dragão da Espiral de Gelo (14/10/2026)

Conferência do `data/aventuras/dragao-espiral-gelo.json` contra o PDF PT-BR (`docs/assets`). Limites: o PDF em inglês é só imagem (sem texto), as cartas de itens mágicos não estão no PDF e os mapas não foram lidos. Dois achados críticos foram reconfirmados direto no PDF (Anacoreta e Banshee). Status: correções e conteúdo faltante aplicados em 14/10/2026 (ver git diff); pendências de conferência manual ao final deste arquivo.

## 1. Erros que afetam combate (bestiário)
- **Anacoreta (`anacoreta-orc`)**: ficha inteira errada. Livro = Anacoreta de Talos, meio-orc: CA 13, PV 58 (9d8+18), FOR16 DES13 CON14 INT9 SAB15 CAR12, Furtividade +3/Natureza +1/Sobrevivência +4, Perc. passiva 12, ND 3 (700 XP), Magia Inata CD 12. JSON: CA 11, PV 38, ND 2. Afeta Flenz, Narux, Yargath, Grannoc, Moesko, Drethna.
- **Banshee**: Lamento invertido (livro: todas as *outras* criaturas a 18 m, sem efeito em constructos e mortos-vivos, só fora da luz do sol; JSON: só mortos-vivos a 9 m). Rosto Horripilante truncado (desvantagem com linha de visão; imune por 24 h após sucesso).
- **Gorthok**, Relâmpago: CD 15, 18 (4d8) (JSON: CD 14, 14 (4d6)).
- **Aranha Gigante**, Mordida: CON CD 11, 9 (2d8) veneno; se reduzir a 0 PV, estável mas envenenado e paralisado 1 h. Teia é ataque à distância com arma (CA 10, 5 PV, vulnerável a fogo).
- **Ramo de Espetos**: Garras 6 (2d4+1); Espetos = ataque à distância +3, 9/18 m, 8 (2d6+1), sem recarga e não mágico.
- **Ramo de Vinhas**: falta Emaranhado de Plantas (Recarga 5–6, raio 4,5 m, FOR CD 12 ou contido).
- **Homem-Rato**: Mordida 4 (1d4+2) (JSON: 1); falta Besta Leve +4, 9/36 m, 5 (1d6+2).
- **Manticora**: Espinho de Cauda 30/60 m (JSON: 18/36).
- **Javali**: Disparada com +3 (1d6) cortante.
- **Stirge**: FOR −3, INT −4, CAR −2; Drenar Sangue solta com 10 PV drenados.
- **Rato Gigante**: falta Táticas de Grupo.
- **Harpia**: CON +0; Canção Sedutora é Ação (completar texto).
- Menores: Orc com "Agressivo" duplicado; Gnomo sem alcance 36 m no Mísseis Mágicos; nome "Banshee (Vyldara)" também usado para Miraal.
- **Sem ficha**: Veterano (Sicários Frios, Alfonso, Dobin), Vaca (Petúnia, Vicente), Tubarão-Caçador (3 nos naufrágios), Don-Jon (p.54) e Falcon (p.56) como blocos de combate.

## 2. Dados errados em locais/NPCs/ganchos
- Fortaleza: `tesouro` fala do símbolo de Abbathor (é da Escavação, E10); `npcs` lista Dazlyn/Norbus (são da Escavação); `criaturas`/`perigos` colocam orcs (o dragão os expulsou); `conexoes` e `resumo` incorretos (acesso real é a trilha H1 e torre de entrada, onde ficam os Sicários Frios).
- Escavação: `perigos` descreve fossos com espadas (é armadilha da Colina do Dragão); real = estátua explosiva em E11 (DES CD 15, 22 (4d10)) e até 3 gosmas ocres.
- Acampamento dos Lenhadores: orcs não existem ali (só ankhegs).
- Axeholm: carniçais = 3 + **3** por personagem (JSON: +1); baú está em A29 (porta secreta na lareira de A28, Percepção CD 15), aberto pelo anel de sinete de A14.
- Colina do Dragão: espada está no topo do crânio de Azdraka, não enterrada com Lady Alagondar; só os sarcófagos de D6 têm armadilha.
- Falcon (`interacao`): não guia ao Círculo (recusa acompanhar; quem guia é Xanth).
- Rancho: cavalos estão em Conyberry (não no estábulo); `conexoes` "ligado ao Santuário" não está no livro.
- Santuário: ogros ficam no quadrante sudeste, orcs nos demais.
- Mansão do Bosque: manto e baú em W13 (sala secreta atrás de porta secreta).
- Círculo do Trovão: o livro diz que nenhuma missão leva ao local; a "missão" é criação do app (marcar como opcional/não oficial).
- Ganchos g5 e g6 (rumores 5 e 6) não batem com a tabela do livro; g4 omite a referência ao Falcon.
- Harbin Wester: falta o detalhe de pagar uma moeda por vez pela fresta da porta.
- Missão Axeholm: objetivo do livro é "matar ou expulsar todos os monstros".

## 3. Faltando no site
**NPCs e criaturas nomeadas**: Halia Thornton (Zhentarim), Ander, Thistle, Irmã Garaele (Harpista, fora da cidade), Dobin Noreth + Trevo de Quatro Folhas, os 4 Sicários Frios (Syleen Wintermoon, Runa Vokdottir, Brakkis Elspaar, Jabarl o Morde-Orc), Alfonso Kalazorn, Petúnia, Corwin, Pell, Grannoc, Moesko, Miraal, Boca de Faca, os 15 gnomos da Gruta (inclusive reis Gnerkli e Korboz) e Zeleen Varnaster.

**Itens**: Poção de Cura Superior (A19), Poção de Cura Maior (Yargath), 3 poções de cura (ogro congelado), Poção de Cura (Adabra), Poção de Respiração Aquática (T5), Pó Desvanecedor (W11), Cajado de Sons de Pássaros (W12), Chave Misteriosa (S10), Óculos de Visão Noturna (M4), Encantamento da Tempestade (T4), Arma +1 (T10), Manto de Muitos Estilos (T12), Varinha dos Segredos e livro de feitiços (T14), Concha da banshee (125/250 PO), Magick de Gnomengarde (G11), anel de sinete, símbolos de Moradin e Abbathor, gemas, pérolas, minério, etc.

**Áreas/salas, armadilhas e CDs**: o JSON cobre poucas salas por local. Praticamente sem áreas: Cabana de Falcon (F1–F16), Torre das Tempestades (só ~40%; faltam T2–T4, T6, T8–T14 e os naufrágios), Fortaleza (H1, H3, H5, H7–H11, H13–H23), Rancho (B1–B10), Axeholm (A4, A6–A8, A10–A13, A15–A18, A20–A21, A23, A25, A27, A29–A30), Mansão (W2–W4, W6–W7, W9, W11–W17), Gruta (G1–G3, G5–G6, G10, G13–G14), Santuário (S1–S10), Serra (U1–U5), Mina (M2–M3, M5–M10, M12, M16), Escavação (E2, E4, E6–E11), Colina (D1, D3–D6), Círculo (cavernas C2–C4). Armadilhas e testes sem registro incluem: Totem (L2), balistas e fendas de seta (Axeholm), Armadilha de árvore (Círculo), fossos D3, colapso D5, poeira ácida D6, caranguejos-barril G6, lâminas G10, escada W3, telhado W16, árvore de Gulthias, para-raios T8 e coração T9, estátua E11, regra do frio na Fortaleza.

**Regras e texto de ambientação**: progressão por missões (3 iniciais → 3 subsequentes → 3 finais; +1 nível por inicial até o 3º, +1 a cada 2 subsequentes, +1 por Cryovain), comportamento completo do dragão, Contexto da Aventura, descrição de Phandalin (estalagem, Santuário da Sorte, Câmbio de Minério, Prefeitura, história), Costa da Espada, gancho "Sorte de Tymora", "Terminando a Aventura" e "Para Onde Agora?", viagem ao Acampamento (40 km/dia, navegação CD 10).

## 4. Encontros (`encontros[]`)
Quantidades conferidas e corretas na maior parte. Divergências: Axeholm falta A1/A4 (3 + 3/personagem) e A27; Fortaleza sem Sicários Frios (H4, H6); Colina sem armadilhas; Torre sem tubarões; Santuário "N" ambíguo no quadrante; stirges da Mansão sem área confirmada (cabeçalho ausente no PDF; conferir p.36).

## 5. Conferido e OK
Cryovain, Carniçal, Ankheg, Caranguejo, Cavalo, Centauro, Espreitador, Fogo-fátuo, Gnomo, Gosma Ocre, Mímico, Ogro, Orc, Plebeu, Ramo de Galhos, Verme de Carniça; recompensas em PO e níveis das missões; tabela d20 do dragão (20 linhas); distâncias; preços da estalagem; locais dos 16 itens (exceto os apontados).

## 6. Pendências de conferência manual
- Itens mágicos: raridade, sintonização e efeito dos itens vêm do livro quando possível e, senão, do DMG/SRD (marcados "confira a carta"); as cartas não estão no PDF.
- Chave Misteriosa (S10) e CD do Encantamento da Tempestade (T4): o livro não informa.
- Stirges da Mansão: colocados em W14 por posição no PDF (p.37); confirmar no mapa impresso.
- Texto do cartão da missão Colina do Dragão: ausente no PDF PT-BR (montado a partir do capítulo).
- Fogo-fátuo DES (livro imprime 28/+2; mantido +9), Cavalo de Montaria CON, Harpia CON e Veterano SAB: possíveis erros de impressão (ver notas).
- Códigos de áreas de Phandalin (1–7) são do app, não do livro. Gênero de Ander/Thistle não consta no livro.
- Conta de nível do livro dá 7 ao final (3 + 3 + 1), mas o texto diz 6º nível; mantido "ideal: 6º".
