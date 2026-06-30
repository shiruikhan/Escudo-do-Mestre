# Product Specification: Escudo do Mestre (Mobile-First RPG Master Shield)

## 1. Visão Geral
O **Escudo do Mestre** é uma ferramenta web estática, totalmente otimizada para dispositivos móveis (mobile-first), projetada para rodar diretamente via **GitHub Pages**[cite: 3]. O objetivo principal é servir como um painel de controle e consulta rápida para o Mestre de RPG (uso pessoal) durante a condução de sessões de aventura baseadas em **D&D 5.5e (2024)**, eliminando a necessidade de carregar papéis ou navegar por PDFs pesados no celular[cite: 3].

## 2. Personas e Casos de Uso
* **Persona:** Mestre de RPG (Narrador) utilizando um smartphone durante a sessão de jogo[cite: 3].
* **Caso de Uso Principal:** O Mestre abre o site no celular, escolhe a campanha no menu inicial e passa a ter acesso imediato a tabelas de consulta, mapas da região, fichas resumidas de NPCs, monstros e ganchos de missões ativos[cite: 3]. Ele pode navegar de forma cruzada por toda a aventura com toques na tela (ex: ler sobre uma missão, clicar no nome do NPC associado e ver a ficha dele imediatamente).

## 3. Escopo Funcional (Módulos por Aventura)
Após selecionar uma aventura na tela inicial, o sistema libera a navegação pelas seguintes abas[cite: 3]:
- [ ] **Menu / Seletor de Aventura:** Tela inicial simples para escolher qual campanha/módulo carregar[cite: 3].
- [ ] **Seletor de Mapas:** Visualizador de imagens de mapas com suporte a zoom simples ou alternância rápida de sub-regiões[cite: 3].
- [ ] **Bestiário (Padrão 2024):** Lista de monstros e criaturas com o bloco de estatísticas focado em modificadores, Iniciativa, Percepção Passiva, Ações, Ações Bônus e Reações bem delimitadas[cite: 1, 2].
- [ ] **NPCs (Personagens Não-Jogáveis):** Fichas rápidas com nome, localização, descrição, motivação e segredos[cite: 3].
- [ ] **Itens:** Lista de itens mágicos, tesouros ou itens de missão (incluindo propriedades de Maestria em Armas se aplicável).
- [ ] **Ganchos de Aventura (Rumores):** Lista de boatos, pistas e ganchos disponíveis para guiar os jogadores[cite: 3].
- [ ] **Missões Possíveis (Quests):** Rastreador do status das missões (Disponível, Em Andamento, Concluída) com os objetivos principais[cite: 3].

## 4. Funcionalidade Drill-Down e Drill-Up (Navegação Reativa)
* **Drill-Down Automático:** Se o nome de um NPC, Monstro ou Item cadastrado aparecer listado no texto de uma missão ou gancho, o sistema deve renderizá-lo automaticamente como um link clicável. Ao clicar, a interface redireciona o mestre diretamente para a aba e ficha detalhada do objeto em questão.
* **Drill-Up Histórico:** Sempre que o mestre fizer um "drill-down" para inspecionar um objeto, um botão flutuante ou fixo de "Voltar" (Drill-up) deve aparecer no topo da tela, permitindo retornar exatamente ao contexto/aba onde ele estava antes.

## 5. Requisitos Não-Funcionais e Regras de Negócio
* **Uso Mínimo de Assets:** O aplicativo não utilizará nenhuma imagem de interface, ícones externos em arquivos independentes ou fontes customizadas pesadas. Ícones serão renderizados via caracteres Unicode, SVG inline simples dentro do código ou classes do Tailwind CSS. As únicas imagens permitidas no repositório são os mapas de jogo, obrigatoriamente otimizados em formato `.webp`[cite: 3].
* **Mobile-First Real:** A interface deve ser extremamente limpa, com botões fáceis de tocar com o polegar, fontes legíveis em telas pequenas e sem elementos que causem overflow horizontal[cite: 3].
* **Serverless / Estático:** Sem backend ativo ou banco de dados relacional hospedado. Todas as aventuras e dados serão estruturados em arquivos JSON locais carregados dinamicamente[cite: 3].