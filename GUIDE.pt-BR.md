# Guia HMS

**RPG Companion HMS Edition 2.9 beta** e **HMS Reporter beta**

Este guia explica como um jogo HMS funciona, como configurá-lo e o que cada parte faz.
Leia primeiro **Comece aqui**. Use as outras partes quando precisar.

---

## 1. Comece aqui: três partes, um jogo

Um jogo HMS tem três partes. Cada parte tem uma função.

| Parte | O que é | Função |
| --- | --- | --- |
| **O bot** | O card do personagem e seus lorebooks: Re:Zero, Mushoku Tensei, Classroom of the Elite ou Overlord | O mundo e suas regras. Ele escreve o **HUD do WORLD STATE** no topo de cada resposta. |
| **HMS Reporter beta** | Um preset: o prompt que o Lumiverse envia | Como a história abaixo do HUD é escrita: estilo, vozes, tamanho, raciocínio. |
| **RPG Companion HMS Edition 2.9 beta** | Uma extensão: o painel lateral | Lê o HUD e o mostra em cartões. Acompanha pessoas, o que sentem e o que sabem, missões, lutas e mais. Ajuda você a começar um jogo e a tirar dúvidas. |

### Quem manda

Quando duas partes discordam, esta ordem vence:

1. **O bot.** As regras e o HUD dele são a lei. Os bots chamam isso de **STATE IS GOD**. Nada pode esconder, mudar ou substituir o HUD.
2. **O preset.** Ele só molda a história abaixo do HUD. Nunca muda uma regra nem uma linha do HUD.
3. **A extensão.** Ela lê e mostra. Pede ao modelo um pequeno bloco oculto depois da história, e devolve o que lembra das pessoas (Mentes) antes da resposta seguinte. Nunca escreve um HUD próprio e nunca acrescenta regras.

### Como é uma resposta

```
### WORLD STATE ###
Day: 3 | Time: 14:10 (Afternoon)
◆ World of Re:Zero → Lugunica → Roswaal Mansion
Arc: Arc 2: A Week at the Mansion
***
A história...
<rpg_companion>{ ... }</rpg_companion>
```

- **O HUD** é a parte de cima, de `### WORLD STATE ###` até a linha `***`. Ele pertence ao bot.
- **A parede** é a linha `***`.
- **A história** vem abaixo da parede. Segue as regras do bot, escrita no estilo do preset.
- **O bloco oculto** vem por último. Ele pertence à extensão. Você nunca o vê: ele é removido da mensagem salva.

### Quem é dono do quê

| Coisa | Dono | Observações |
| --- | --- | --- |
| O HUD: hora, lugar, arco, poderes, dinheiro | Bot | A extensão só o lê. |
| Regras: morte, diferenças de poder, Return by Death, provas | Bot | As lutas da extensão usam as regras do próprio bot. |
| Comandos de início e o catálogo | Bot | O cartão Novo jogo só os preenche para você. |
| Respostas OOC | Bot (o personagem-guia dele) | O cartão de OOC pergunta a esse mesmo guia. |
| Ferimentos em Re:Zero e Mushoku Tensei | Bot | Esses bots guardam os ferimentos no HUD. A extensão fica de fora. |
| Ferimentos em Classroom of the Elite e Overlord | Extensão | Esses bots não guardam ferimentos. O cartão Ferimentos os acompanha. |
| Como a história soa, tamanho, raciocínio | Preset | Ajuste no ícone de controles deslizantes. |
| Emoji e cores de diálogo | Extensão | Desenhados na sua tela. O preset nunca escreve emoji. |
| Painel lateral, mapa, Crônica, pessoas, missões | Extensão | Lidos do HUD e do bloco oculto. |
| Quem um personagem é | Bot (os cards dos personagens) | Os cards sempre vencem. |
| Como os personagens são interpretados por dentro | Preset (o bloco Minds) | Do FrankenSIM. Veja a parte 7. |
| Os números: sentimentos, rotinas, quem sabe o quê, detalhes plantados | Extensão (Mentes) | O modelo só diz o que mudou. A extensão guarda o resto. Veja a parte 7. |

---

## 2. Instalar e configurar

Você precisa do **Lumiverse 1.2.0 ou mais novo**.

### Passo 1: Remova o RPG Companion antigo

Se você tem a extensão RPG Companion original, desative ou remova. As duas acrescentariam coisas ao seu prompt.

### Passo 2: Instale a extensão

1. Abra a gaveta e vá em **Extensions**.
2. Clique em **Add Extension**.
3. Escolha um jeito:
    - **Install from Source**: cole o link do GitHub da extensão.
    - **Import Local** (só dono ou admin): primeiro coloque a pasta `rpg_companion_hms` em `Lumiverse/data/extensions/`.
4. Leia as permissões e clique em **Install**.
5. Extensões novas começam desligadas. Ligue **Enable**.
6. Conceda as permissões. Você pode pular qualquer uma. Essa parte então se desliga e diz por quê.

| Permissão | Para que serve |
| --- | --- |
| interceptor | Acrescenta o pequeno pedido da extensão ao seu prompt. |
| generation | As chamadas próprias da extensão ao modelo: lutas, o guia OOC, resumos de capítulo, um bloco do painel lateral que faltou. |
| chat_mutation | Mantém o bloco oculto fora das respostas salvas, coloca de volta linhas do HUD, e posta seus turnos de novo jogo, celular e Mover o mundo. |
| world_books | Lê seus lorebooks: o Atlas, a checagem da linha Arc, o guia OOC, a lore das lutas. |
| memories | Usa o Memory Cortex do Lumiverse: a Crônica grava nele, as lutas leem dele. |
| image_gen | Só retratos de personagens. |

### Passo 3: Importe o preset

1. Abra o **Preset Manager** no Lumiverse.
2. Importe o arquivo `HMS_Reporter_beta.json`. Ele vem com a extensão, na pasta `preset`.
3. Escolha **HMS Reporter beta** como preset dos seus chats HMS.

### Passo 4: Abra o painel

Abra um chat com um bot HMS. Depois abra a aba **RPG Companion (HMS)** na gaveta lateral.

### Passo 5: Use o preset do seu mundo

Depois da primeira resposta, o painel oferece **Usar o preset [mundo]**. Clique.
Ele ajusta os cartões, lutas e tema certos para esse bot com um clique.
Você também pode fazer isso depois em **Configurações → Estilo de jogo**.

### Idioma

O painel fala **English**, **Português (BR)** e **Español**: **Configurações → Geral → Idioma**. Em *Automático* ele segue o idioma do navegador.
Com **Pedir o texto do painel neste idioma** ligado, o modelo escreve pensamentos, descrições, resumos de capítulo e as respostas do guia OOC no idioma escolhido. O HUD, os nomes e as palavras-chave nunca são traduzidos, para os lorebooks continuarem carregando.

### Boas configurações para começar

- Controles do preset: **Thinking: Normal**, **Prose length: Scene-led**, **Start replies with the HUD header: Auto**.
- Lumiverse: ligue o **Memory Cortex** se quiser que a Crônica lembre os momentos-chave.
- Extensão: mantenha o **Modo junto** (Configurações → Geral).
- Quer emoji ou diálogo colorido? Configurações → **Extras do chat e do painel** → **Diálogo**. Começam desligados.

---

## 3. Começar um novo jogo

### O catálogo

Todo bot HMS abre num **catálogo**. A primeira mensagem tem várias páginas. Deslize para a esquerda e para a direita para vê-las.

- **A página do hub** diz como começar e nomeia a linha do **start handler**.
- **A página canvas** é quase vazia. Você digita o seu início embaixo dela.
- **Páginas de comandos** listam inícios, complementos e exemplos prontos.

### A linha do start handler

Sua primeira mensagem precisa começar com a linha de início do bot, numa linha só dela.

| Bot | Primeira linha | Linha para retomar uma campanha antiga |
| --- | --- | --- |
| Re:Zero | `ReZero_Start_Handler` | `ReZero_Start_Continuer` |
| Mushoku Tensei | `MUSHOKU_TENSEI_START_HANDLER` | `MUSHOKU_TENSEI_START_CONTINUER` |
| Classroom of the Elite | `Cote_Start_Handler` | `Cote_Start_Continuer` |
| Overlord | `Overlord_Start_Handler` | `Overlord_Start_Continuer` |

Depois vêm os seus comandos. Por exemplo:

```
ReZero_Start_Handler
Start at Arc 3 with RBD, Hell Mode, Start with Echidna
```

Os comandos ficam em inglês, como o bot os escreve.

### O cartão Novo jogo (o jeito fácil)

Num chat novo, o painel mostra **Novo jogo**. Ele lê as páginas do catálogo para você.

1. Escolha uma página no topo.
2. Escolha um **início**.
3. Escolha os **complementos** que quiser. Complementos se empilham num início.
4. Preencha os espaços, como `[Name]`.
5. Leia os avisos. Por exemplo: nenhum início ainda, um espaço vazio, ou nenhum Return by Death em Re:Zero. Um clique adiciona `with RBD`.
6. Aperte **Começar o jogo**.

O cartão vira a saudação para a página canvas e envia o seu comando. Você também pode editar o comando à mão, **Copiar** ou **Limpar**.

### Retomar uma campanha antiga

Dentro do cartão Novo jogo, abra **Retomar uma campanha antiga**.

1. Cole o último HUD do seu chat antigo. Esse é o seu save.
2. Se tiver, cole suas últimas mensagens e um resumo da história.
3. Aperte **Retomar a campanha**.

O cartão coloca a linha Continuer do bot primeiro, como o bot pede.

### Depois da primeira resposta

- O bot monta o HUD no turno 1. Daí em diante ele o leva em toda resposta.
- **Checagem da linha Arc.** A linha Arc é uma chave de busca. Se estiver escrita errado, a lore do arco nunca carrega. O cartão World State avisa e oferece a grafia do livro com um clique.

---

## 4. O que acontece a cada turno

1. Você escreve o que faz e envia.
2. O preset monta o prompt: o card e o motor do bot, sua lore, a memória, o chat, o estado das mentes e o pequeno pedido da extensão.
3. O modelo escreve o HUD, a parede `***`, a história e o bloco oculto.
4. A extensão lê a resposta:
    - Lê o HUD e atualiza os cartões.
    - Lê o bloco oculto (pessoas, sentimentos, rotinas, o que as pessoas descobriram, detalhes plantados, missões, celular, ferimentos) e o remove da mensagem salva.
    - Faz as contas das Mentes: limita cada passo, deixa sentimentos antigos esfriarem, lembra dívidas.
    - Procura linhas do HUD que sumiram e coloca de volta as linhas que você fixou.
    - Desenha o HUD como um cartão no chat, e as cores e emoji de diálogo se você os ligou.
5. Quando você responde a uma resposta, ela fica assentada. A Crônica então grava os momentos-chave dela no Memory Cortex.

### A fileira de botões

| Botão | O que faz |
| --- | --- |
| **Mover o mundo** | Você não faz nada novo. Um fio da história fora de cena avança um passo. |
| **Luta imersiva** | Começa uma luta que você joga no chat. O painel a acompanha. |
| **Luta por turnos** | Abre a janela de luta de D&D. Só com o D&D ligado. |
| **Ler de novo** | Lê a última resposta de novo. Grátis: sem chamada ao modelo. Use quando um cartão não atualizou. |

### A barra do topo

| Item | O que faz |
| --- | --- |
| Modo junto / Modo separado / Pausado | Mostra como a extensão obtém os dados. Veja Configurações → Geral. |
| **Atualizar** | Pede de novo ao modelo os dados do painel lateral. Isso custa uma chamada. |
| Gaveta / Flutuante / Janela própria | Onde o painel fica: na gaveta, flutuando sobre o chat, ou numa janela própria para uma segunda tela. |
| **Zona de teste** | Um chat de treino dentro da extensão. O modo Demo não custa nada. |
| **Guia** | Este guia. |
| **Configurações** | Todas as configurações. |

### Botões na barra de digitação do chat

**Atualizar o painel lateral**, **Abrir o RPG Companion**, **Iniciar ou retomar uma luta** e **Mover o mundo**.

---

## 5. HMS Reporter beta (o preset)

### O que ele faz

O HMS Reporter beta diz ao modelo como escrever a história abaixo da parede. Ele sempre põe o bot em primeiro lugar. Ele diz: o núcleo e suas entradas de lorebook estão acima de tudo neste preset.

O preset é em inglês, como o card. Para jogar em português, diga isso ao bot (por exemplo, na sua persona ou numa nota do autor); o HUD continua em inglês, porque as palavras dele carregam a lore.

### Os blocos, de cima para baixo

| Bloco | Ligado no início? | O que faz |
| --- | --- | --- |
| Frame | Ligado | Diz quem manda e o formato da resposta: HUD, parede, história, e o bloco oculto se for pedido. Explica as mensagens OOC. |
| Game card | Ligado | A descrição do bot e o system prompt dele. |
| HMS core (campo personality) | Ligado | O motor do bot: suas regras e seu HUD. |
| Scenario | Ligado | O cenário do card, se tiver. |
| Player persona | Ligado | A sua persona. |
| Example messages | Ligado | Só exemplos de estilo. |
| Reporter: how the prose reads | Ligado | Comece pelo que mudou. Use detalhes exatos. Mostre só o que dá para ver. Termine onde o mundo devolve a vez. Corte frases feitas. |
| Voices and groups | Ligado | As pessoas falam pouco e com a própria voz. Ninguém lê mentes. Grupos conversam entre si. |
| The player's character | Ligado | O modelo nunca escreve suas escolhas, falas ou pensamentos. Um Narrative Mode do bot pode mudar isso. |
| Minds (from FrankenSIM) | Ligado | Como interpretar cada personagem por dentro: o lado dele que lidera, sentimentos que se carregam, máscaras, honestidade que se conquista, conhecimento que precisa de um caminho até a pessoa. Veja a parte 7. |
| Mature content (adults only) | Desligado | Cenas adultas só entre adultos. Menores e laços familiares sempre ficam não explícitos. |
| Gore | Desligado | Mostra a violência sem suavizar. |
| World info (before) e (after) | Ligado | Suas entradas de lorebook. |
| Memory (Chat Memory e Memory Cortex) | Ligado | A memória de longo prazo do Lumiverse. |
| Story summary (Loom Summary) | Desligado | O resumo próprio do Lumiverse. Ligue só se você o usar no lugar dos Capítulos. |
| Chat history | Ligado | O próprio chat. |
| Card's post-history instructions | Ligado | O que o card coloca depois do chat. |
| Minds state (RPG Companion) | Ligado | O que a extensão lembra das pessoas da história. Fica vazio sem a extensão, com as Mentes desligadas e nos turnos OOC. |
| Fight craft | Só em lutas | Carrega sozinho nas lutas: preparação de golpes, o ambiente na luta, o impacto antes da dor. |
| Side panel (RPG Companion) | Ligado | O pedido da extensão vai aqui. Fica vazio sem a extensão e nos turnos OOC. |
| Before you write | Ligado | Raciocínio, tamanho e o lembrete dos marcadores de diálogo. Num turno OOC: responder fora do personagem. |

### Suas configurações: o ícone de controles deslizantes

| Configuração | Opções | Dica |
| --- | --- | --- |
| Thinking | Off, Light, Normal (padrão), Deep | Normal e Deep pensam em cada personagem primeiro (o passo das mentes). Deep também move o mundo fora de cena e confere os detalhes plantados. É o mais lento. |
| Think out loud | Ligado ou desligado | Para modelos que não pensam sozinhos. Ligue também Auto-parse thoughts no Lumiverse, para o plano se recolher. |
| Prose length | Brief, Scene-led (padrão), Long, Very long | O HUD nunca conta para o tamanho. |
| Start replies with the HUD header | Auto (padrão), Always, Never | Auto só ajuda Kimi e DeepSeek. Use Always só se um modelo vive pulando o HUD, com o raciocínio desligado. |

### Mensagens OOC

Comece uma mensagem com o gatilho OOC do bot, como `[OOC: ...]` ou `OOC guide: ...`.
O preset então pede uma resposta fora do personagem: sem HUD, sem história, sem bloco oculto, e o tempo não passa.

---

## 6. Os cartões da extensão

O painel mostra um cartão por assunto. Um cartão só aparece quando tem algo para mostrar.
Clique no título de um cartão para recolher ou abrir.

### Novo jogo
Só num chat novo. Veja a parte 3.

### World State
O HUD, linha por linha.

- **Fixe** uma linha (o ícone de alfinete) para mantê-la exatamente como está. Se o modelo a perder ou mudar, a extensão a coloca de volta. O modelo também é lembrado.
- **A guarda.** Se uma linha some, você a vê com **Restaurar**. Uma linha portadora (uma que mantém lore carregada, como a linha Arc) é marcada, porque perdê-la esconde lore.
- Linhas que terminam pelas próprias regras (um ferimento curado, uma prova que passou) aparecem como **encerradas**, com um botão para colocar de volta.
- Se uma resposta não tem HUD nenhum, aperte **Devolver o último HUD**.
- A **checagem da linha Arc** avisa quando a linha Arc não carrega lore de arco nenhuma, e corrige com um clique.

### O cartão do mundo
Um cartão por mundo: **Re:Zero**, **Overlord**, **Classroom of the Elite**, **Mushoku Tensei**, **Undertale**, **Dark Souls** e **Skyrim**.
Ele mostra os atributos próprios daquele mundo a partir do HUD, explicados pelos seus lorebooks. Alguns exemplos:

- Re:Zero: mortes e o ponto de salvamento, Autoridades, contratos espirituais e seus ranks.
- Overlord: níveis e classes, com uma checagem de que eles batem.
- Classroom of the Elite: o calendário, a classificação das turmas, Private Points, a prova.
- Mushoku Tensei: estilos de espada e ranks de magia, os conselhos do Homem-Deus e a linha do tempo da saga: o ano (K.) numa barra com os 22 arcos, o arco atual e quantos anos faltam para o próximo. Os arcos e seus anos vêm das entradas "[WORLD STATE — ARC N: …]" do lorebook, ou da lista canônica se ele não tiver.

### Mapa
Onde cada um está na sala. Começa desligado: Configurações → Extras do chat e do painel → **Mapa**.
Um cômodo é desenhado uma vez, depois só as pessoas se movem. O **banco de mapas** guarda todo cômodo desenhado para aquele mundo, então um lugar nunca é pago duas vezes.

**Prédio inteiro.** Quando dois ou mais cômodos de um mesmo prédio já foram desenhados, aperte **Prédio inteiro**. A extensão junta os cômodos pelas portas, andar por andar. Não gasta tokens. Quem não está no seu cômodo aparece onde a rotina dele o coloca. Um cômodo a que nenhuma porta leva ainda é desenhado com linha tracejada. Veja a parte 7.

### Atlas
O livro de locais do bot como mapa. Mostra onde você está, os cômodos ao redor e detalhes de qualquer lugar: o quanto é vigiado, horário de funcionamento, quem costuma estar lá.
Clique num lugar para entrar, **Subir** para sair.

### Você
O seu próprio estado: vida e outros recursos, medidores, humor, estresse e sanidade.
Nível e experiência só aparecem em mundos que têm níveis.
**Item padrão** lista coisas que o bot supõe que você tem. **Carregado** lista pequenas coisas que você ganhou na história. Você pode adicioná-las ou removê-las.

### D&D
Uma ficha de personagem e um rolador de dados. Sua rolagem vai na sua próxima mensagem.
Desligue em Configurações → Módulos se o seu jogo não usa dados.

### Pessoas
Todos que você conheceu. Cada pessoa mostra:

- **Posição**: o quão próxima ela se sente de você, de Nemesis a Devoted. Nunca é romance.
- **Vínculo**: que tipo de relação é: colega de classe, mentor, família, parceiro.
- **A linha 🧠**: o que sente agora e por quem, o quanto se mostra caloroso, e os três sentimentos mais fortes por você. ⚠️ é um muro, ⚖️ é uma dívida sua com a pessoa.
- **📍** o que está fazendo e até quando.
- **Por dentro, sentimentos e o que sabe**: abra para ver o resto. Veja a parte 7.
- **Na cena**: como ela parece e age agora, e seus pensamentos.

As barras clássicas (Afeto, Confiança e as outras) voltam se você puser Configurações → Mentes → **Sentimentos por você** em Barras clássicas.

Use **Definir o vínculo** se a história ler uma relação errado.
Menores são protegidos: nunca um vínculo romântico, nunca nenhum desejo.
Membros do grupo mostram como estão aguentando. Adicione-os com **Adicionar ao grupo**.

### Finanças
Um livro-caixa de cada pagamento, salário, compra, suborno, empréstimo e dívida, vindo das suas mensagens e da história, ao lado do saldo do HUD (que continua sendo o registro do que você tem).

- **Dívidas em aberto**: quem deve a quem e quanto falta; um pagamento para a mesma pessoa vai abatendo, e ✓ quita à mão.
- **Livro-caixa**: do mais novo ao mais antigo, com totais de entrada e saída por moeda. **Registrar** adiciona um lançamento seu; ✕ remove um.
- O modelo é lembrado das dívidas em aberto, para o credor não esquecer.

### Facções
Grupos, não pessoas: guildas, reinos, igrejas, casas nobres, gangues, turmas da escola. Para cada um: sua **posição** (caçado, hostil, hostil leve, neutro, amigável, de confiança, aliado, membro), seu **posto** lá dentro, qualquer **recompensa** pela sua cabeça, o motivo da última mudança e quem de Pessoas pertence ao grupo.

- Vem das suas mensagens e da história, e das linhas Faction, Guild, Affiliation e Bounty do HUD. Mude a posição pelo cartão; vale até a história mudar de novo.
- O modelo é lembrado da sua posição com cada um. Viradas grandes, promoções e recompensas vão para a Crônica.

### Segredos
Quem sabe o quê.

- **Seus segredos** (uma vida passada, o Return by Death, um plano) e quem descobriu cada um, e como. **O que você sabe dos outros**: segredos alheios que você descobriu.
- Vem da história quando alguém descobre algo, e da sua mão: adicione um segredo, alguém que sabe, ou ✕ em quem não sabe.
- O modelo recebe quem sabe cada segredo; quem não está na lista não sabe e não pode agir com base nele. Cada descoberta vai para a Crônica.

### Agenda
Compromissos, promessas e horários marcados: "te encontro no rio amanhã", "a prova é sexta", "volte antes de escurecer".

- Vêm das suas mensagens e da história. Os horários vão para o relógio do HUD ("tomorrow at dawn", "in three days", "Day 5, 14:00"), então o cartão faz a contagem: **Atrasados**, **Em breve** (próximas 3 horas), **Chegando**, **Sem hora marcada**.
- ✓ cumprido, ✗ perdido, ⊘ cancelado; a história também marca. Os concluídos se recolhem.
- O modelo é lembrado do que está chegando, vencendo ou atrasado, para as pessoas lembrarem que vocês tinham marcado. Promessas cumpridas e perdidas vão para a Crônica.

### Propriedades
O que você possui ou detém e não carrega: **veículos** (uma carroça, um navio), **montarias**, **moradias** e quartos alugados, **terras**, **construções**, **negócios**, **títulos** e **cargos**.

- Lidas das suas mensagens e da história (ganhou, perdeu, mudou) e das linhas Title, Property, Mount e parecidas do HUD. O que o HUD lista não pode ser marcado como perdido.
- Cada uma mostra onde está, uma nota (estado, posto, o que rende), há quanto tempo é sua e o que o cartão Equipamento diz que está guardado ali ("deixado na carroça").
- **Editar** define onde está ou uma nota; ✕ marca como perdida. Ganhos e perdas vão para a Crônica.

### Equipamento
Como você carrega cada coisa: **na mão**, **vestido**, **embainhado**, **em você** (nas costas, no cinto), **dentro de uma bolsa**, **deixado em algum lugar** ou **largado**.

- É só escrever na sua mensagem: "embainho minha espada e coloco a mochila nas costas", "a carta vai no bolso do casaco". Depois da resposta o cartão mostra. O que você diz que faz vale, a não ser que a resposta mostre que falhou.
- O que o HUD lista em Equipment ou Items também aparece (como *no HUD*). O HUD continua sendo o registro do que você possui; o Equipamento só diz como você carrega.
- **Neste turno** lista o que mudou. Cada bolsa tem sua própria lista do que está dentro.
- **Mover…** muda como você carrega algo, guarda numa bolsa ou marca como sumido. Vale até a história dizer algo mais novo sobre aquele item.
- O modelo é lembrado de como tudo está, para uma espada embainhada não ser brandida e uma mochila largada não ser aberta.

### Família
Sua própria família, num cartão próprio: o que cada um é seu, se está vivo e onde está.

- **Onde**: o lugar que a história mostrou ou contou por último. *visto* quer dizer que estava na cena com você (o lugar é a sua localização no HUD), *contado* que alguém na história disse, *um palpite* que é só suposição. **Aqui com você** marca quem está na cena atual.
- **Estado**: vivo, desaparecido, morto ou desconhecido. Um desaparecido visto de novo é marcado como encontrado.
- **Por onde passou**: cada mudança de lugar, com como foi sabida e há quanto tempo no relógio do HUD.
- A posição, o Afeto e a Confiança vêm de Pessoas, então os dois cartões concordam.
- **Corrigir**: defina o lugar, o parentesco ou o estado. Vale até a história dizer algo mais novo sobre a pessoa.
- **Adicionar à família** para alguém que a história ainda não nomeou. **✕** esconde quem não é da família.
- O modelo é lembrado de onde cada um foi visto por último. Mortes, desaparecimentos, reencontros e notícias vão para a Crônica.

Configurações → Sistemas HMS tem, para cada um destes cartões, o cartão em si, a leitura da história e o lembrete ao modelo.

### Telefone
O seu dispositivo, seu dinheiro, seus contatos, suas mensagens e avisos.
Envie uma mensagem, ligue ou transfira. Isso entra na história como seu turno, e o bot decide se chega a alguém.

### Corpo
Ferimentos e condições do HUD, com quanto tempo cada um já dura.

### Ferimentos
Só para bots que não guardam ferimentos no HUD (Classroom of the Elite, Overlord).
Cada ferimento fica exposto até ser tratado. Tratado não é curado. O cartão mostra o tempo de cura e avisos.

### Mente
Condições mentais, como Dread, e o Conselho Mental.

### Sobrevivência
Começa desligado. Acompanha o tempo desde que você dormiu, comeu e bebeu, pelo relógio do HUD. O bot decide o que isso significa.

### Magia
Reservas de magia, tradições, recargas e um grimório que aprende as suas magias.

**Lista de magias.** Quando o lorebook do bot descreve magias, o card lista todas por escola, lidas do próprio lorebook: uma entrada por magia (`[SPELL — Earth Lance]` com `School:` e `Rank:`, ou `Earth Lance [Earth Magic - Intermediate]`), um índice de magias (`### Fire Magic` › `**Goa Series**` › `* **El Goa** – …`) ou uma entrada por elemento. O HUD decide o que está ao alcance: `Magic School: Water: Saint, Fire: Advanced` dá um rank por escola; `Magic: Fire | Gate: C-Rank` dá seus elementos, e o Gate até onde uma série vai (D El, C Ul, B Al). Cada magia aparece como **Dominada**, **Conhecida**, **Estudando**, **Ao alcance**, **Próximo rank**, **Rank desconhecido** (o lorebook não dá rank, então a história decide; aparece em Todos), **Bloqueada** ou **Especial** (única de um personagem, proibida, perdida). **Usáveis e próximas** esconde o resto; **Todos** mostra tudo; a busca acha uma magia pelo nome ou efeito. Com `Casting Method: Voiceless`, o encantamento aparece como opcional.

**Aprender.** Aperte 📖 para estudar uma magia. Antes de cada resposta o modelo é lembrado do que você estuda, com o efeito e o encantamento do lorebook, e da regra de que aprender exige prática e o seu rank. O bloco do painel lateral informa o progresso (uma barra sob a magia) e a magia quando você a lança bem pela primeira vez: ela vai para Conhecida e para a Crônica. ✓ marca uma magia como aprendida à mão; ✕ tira. Quando o rank de uma escola sobe no HUD, o card diz quais magias isso acabou de abrir. As magias que você conhece também vão para a preparação das lutas. Aparecer no menu de uma luta, ou só ser tentada, nunca conta como aprender; uma magia que a história mostra você praticando entra em Estudando sozinha. Lorebooks de qualquer tamanho são lidos inteiros, não só as primeiras 200 entradas.

### Técnicas de espada
A mesma lista das magias, para os estilos de espada. As técnicas vêm do lorebook: `[TECHNIQUE — Longsword of Light]` com `Style: Sword God · Rank: Saint`, ou texto corrido como "Sword God Technique: Silent Strike." e "… technique of the Water God Style, achieved at the Saint tier". A linha `Sword Style:` (ou `Martial Style:`) do HUD dá o seu rank em cada estilo, então cada técnica aparece como Conhecida, Estudando, Ao alcance, Próximo rank, Bloqueada ou Rank desconhecido. Estudar, ✓ e ✕ funcionam como nas magias; quando a história informa a primeira execução limpa, ela vira Conhecida e entra na Crônica. Um lorebook complementar, *Mushoku Tensei - Sword Techniques (Mazaki)*, dá um rank a cada técnica dos estilos Sword God, Water God e North God, e traz o Estilo Greyrat criado por Ars Greyrat (adição de fã).

### Habilidades
Seus poderes, perícias e atributos, lidos do HUD.

### Missões
- **A trama**: onde a história está, e seus fios abertos.
- **🔫 Detalhes plantados** (arma de Tchekhov): coisinhas que a história plantou e que devem ter consequência depois. Os **maduros** podem acontecer já. Um com 🔒 espera uma hora, uma pessoa ou uma condição. Aperte ✕ para tirar um que não cabe.
- **Objetivos**: o que você está tentando fazer agora. Você pode adicionar os seus. Os seus nunca vão para o modelo.
- **Missões** do HUD, com o objetivo, quem deu, onde, a recompensa e o tempo que resta.
- **Suas notas** nunca vão para o modelo.
- Se uma missão sai do HUD ainda ativa, aperte **Devolver**. Se o bot só parou de listá-la porque acabou, aperte **Já acabou**.

### Crônica
A linha do tempo da história: momentos-chave, marcos, o que as pessoas passaram a sentir por você e pontos da trama.
Filtre, marque uma entrada com estrela, oculte uma, ou adicione a sua.
Respostas assentadas são gravadas no Memory Cortex. Veja a parte 9.

### Capítulos
Resumos de partes da história. Aperte **Encerrar capítulo e resumir** quando uma parte termina.
Os resumos vão com cada mensagem, além do chat.

### Guia OOC
Faça uma pergunta ao guia do bot. Veja a parte 8.

### Crítico
Uma faixa vermelha para perigo real: vida perto de zero, uma condição no pior grau, um ferimento exposto por tempo demais.

### O acompanhamento da luta
Durante uma luta imersiva: o HP, MP e Stamina de todos, efeitos, o que cada lutador acabou de fazer e um registro da luta.

### Lutas

| Tipo | Como funciona |
| --- | --- |
| **Luta imersiva** | Sem janela. Você luta escrevendo no chat. O painel acompanha corpos, efeitos e movimentos. Inimigos guardam planos ocultos. **Estude** um inimigo para conhecer seus pontos fracos. As regras do bot decidem quem vence. |
| **Luta por turnos** | Uma janela de D&D: iniciativa, jogadas de ataque, dados de dano, testes de resistência. A extensão rola os dados. Quando termina, o desfecho é postado no chat como uma resposta normal, com o HUD. |
| **Janela narrativa** | A janela de luta antiga. Escondida a menos que você a ligue em Configurações → Lutas → Antigo. |

### No próprio chat

- **O cartão do HUD.** O HUD desenhado como um cartão bonito nas cores do bot. A resposta salva mantém o texto puro. **Mostrar o HUD como texto** abre a versão simples.
- **Estados internos** abaixo de cada resposta: abas de Cena, Pessoas, Mentes, Vínculos, Trama e Mapa. **Mentes** mostra o que mudou por dentro de cada pessoa naquela resposta.
- **Exibição do diálogo** (começa desligada): um emoji para o sentimento de quem fala, uma cor por personagem, ou o nome. **Tom de voz** desenha uma fala sussurrada em itálico e uma cortante em negrito.

### Zona de teste
Um chat de treino dentro da extensão. Roda o mesmo código de um chat real e não toca em nenhum dos seus chats.
**Demo** joga turnos roteirizados para cada mundo e não custa nada. **Ao vivo** usa o seu modelo.

---

## 7. Mentes (do FrankenSIM)

**Mentes** é como as pessoas da história sentem, pensam e agem. Vem do **FrankenSIM 4 Mini, de Wireless (Ryah)**, com permissão. **TFDY** (Ternura, Fúria, Pavor, Anseio) é de **Pyropia**. Obrigado aos dois.

### Como funciona

1. O modelo escreve a história como sempre.
2. No bloco oculto, ele diz só **o que mudou** dentro de cada pessoa nesta resposta, e por quê.
3. A extensão faz as contas: guarda cada número, limita cada passo, deixa sentimentos antigos esfriarem, e lembra.
4. Antes da resposta seguinte, ela devolve o estado ao modelo como memória.

O bot continua mandando. Os cards dos personagens dizem quem alguém é. As Mentes só lembram o que a história mostrou.

### Por dentro de uma pessoa

| Parte | O que significa |
| --- | --- |
| **Sentimento** | O que sente agora, nomeado pelo rumo que toma (a lista de Parrott: amor, alegria, surpresa, raiva, tristeza, medo), e por quem. |
| **TFDY** | O humor de fundo: 💗 Ternura, 🔥 Fúria, 😰 Pavor, 🌙 Anseio, de 0 a 4. Cada um descansa num nível que o temperamento define. |
| **Mostra** | O quanto se mostra calorosa por fora: ❄️ gélida, fria, morna, calorosa, 🔥 fervorosa. Pode ser diferente do que sente. |
| **Máscara** | A cara que usa: mantida, rachando ou caída. |
| **Lados dela** | Cinco a sete lados tirados do card. Um lidera de cada vez. Se o mesmo lidera três respostas seguidas, o painel avisa. |
| **Ainda carrega** | Um sentimento forte das últimas respostas que não passou. |

### Por você (e uns pelos outros)

Doze sentimentos, cada um de 1 a 20:

| Quente | Seu espelho |
| --- | --- |
| 🌶️ Desejo | 😠 Ódio |
| 🎲 Brincadeira | 🥊 Discórdia |
| 🤝 Amizade | ❄️ Inimizade |
| 🛠️ Parceria | 🪨 Travado |
| 🏠 Pertencimento | 🌫️ Indiferença |
| 🕊️ Cuidado | 🐍 Inveja |

- **Um muro** (⚠️): um sentimento e seu espelho estão os dois altos (10 ou mais), como desejo e ódio. Sai de lado.
- **Portão** 🚪: o quanto a pessoa se permite sentir: adormecido, atento, ciente, ansiando, aberto. Muda um passo por vez, e só por um acontecimento.
- **Mostra / Diz**: se o sentimento aparece no que faz e no que fala.
- **Filtros**: o que segura o sentimento (social, valores, combinação, laços). Cada um pode ir rachando aos poucos. Aberto nunca fecha de novo.
- **Dívida** ⚖️: um mal feito à pessoa. Fica até ser reparado.
- **Modo**: estranho, caloroso, tenso, hostil, amantes e outros.

### As contas que a extensão faz

| Regra | O que significa para você |
| --- | --- |
| **O máximo que um sentimento muda numa resposta: 2** | Uma cena não vira uma pessoa do avesso. |
| **Esfriar: um passo a cada 3 respostas paradas** | Um sentimento que nada alimenta volta para onde descansa. Sentimentos grandes esfriam um pouco mais rápido. |
| **Assentar** | Um sentimento empurrado na mesma direção três vezes vira parte de quem a pessoa é para você. |
| **Nunca 0** | Ninguém sente nada. Um primeiro encontro começa em 3 ou mais. |
| **Menores e família** | Nunca desejo, nunca um modo romântico, diga o modelo o que disser. |
| **Return by Death** | Quando o tempo volta, todos esquecem o loop desfeito: os sentimentos, o que descobriram nele e os planos. Os detalhes plantados ficam, porque você os viu. |

Você pode mudar o tamanho do passo e a velocidade com que esfriam em Configurações → **Mentes**.

### Rotinas, conhecimento e detalhes plantados

- **Rotinas** 📍 (o FrankenSIM chama de agendas): o que cada pessoa está fazendo, onde e até quando, em cena ou não. Quando a hora passa, o painel diz **terminou**. Ninguém pula de um lugar para outro. Não confunda com a sua **Agenda**, que são os seus compromissos.
- **Quem sabe o quê**: cada fato que uma pessoa descobriu, e como: 👁️ viu, 👂 ouviu escondido, 🗣️ alguém contou, 🔎 evidência, ✉️ mensagem, 🌐 todo mundo sabe, 💬 fofoca, 🤔 deduziu. Uma **crença falsa** fica sublinhada em vermelho. Aperte ✕ se alguém não deveria saber algo. Quem conhece um segredo seu (cartão Segredos) também mostra aqui, com 🔒.
- **Detalhes plantados** 🔫 (arma de Tchekhov): no cartão Missões. A história decide quando um acontece. Até 20 ficam guardados. Os antigos e leves somem.
- **Mapas de prédios**: no cartão Mapa, a partir dos cômodos que a história desenhou.
- **O bloco do próprio bot**: alguns bots (o de Re:Zero, por exemplo) pedem ao modelo um bloco `side_panel` próprio na resposta. A extensão o lê para estes mesmos cartões, tira-o da resposta salva, e deixa de pedir as partes que o bot já escreve, para nada ser escrito duas vezes.

### Ligar e desligar partes

Configurações → **Módulos** → **Mentes (do FrankenSIM)** tem cinco chaves: Mentes e sentimentos, Rotinas, Quem sabe o quê, Arma de Tchekhov, Mapas de prédios. Configurações → **Mentes** tem os detalhes. **Desfazer minhas correções** traz de volta fatos e detalhes que você tirou.

**Custo:** com tudo ligado, cerca de 1.000 tokens de instruções e 300 a 600 tokens de estado por resposta, mais o que o modelo escreve no bloco oculto. Com os outros módulos, a resposta do tracker fica longa: se o status disser que ela foi cortada, aumente o max tokens da conexão ou desligue o que não usa.

---

## 8. Perguntar fora do personagem (OOC)

Cada bot tem um personagem-guia que responde perguntas sobre o mundo, as regras e os comandos.

| Bot | Guia | Gatilho |
| --- | --- | --- |
| Re:Zero | Echidna | `[OOC: sua pergunta]` |
| Mushoku Tensei | Roxy | `OOC guide: sua pergunta` |
| Overlord | Demiurge | `OOC guide: sua pergunta` |
| Classroom of the Elite | Arisu Sakayanagi | `OOC guide: sua pergunta` (também `[OOC:` ou `OOC:`) |

### Dois jeitos de perguntar

1. **No painel**: abra o cartão **Guia OOC**, digite sua pergunta, aperte **Perguntar**. A resposta fica no painel. A história nunca a vê. Custa uma chamada ao modelo.
2. **No chat**: aperte **Perguntar na história**, ou digite o gatilho você mesmo.

Você pode nomear outro guia na caixa **Guia**, se o bot permitir.

### O que acontece num turno OOC

- Sem HUD, sem história, e o tempo não passa.
- A extensão não acrescenta nada a esse turno e não lê a resposta como história.
- Sua próxima mensagem normal retoma a história.

---

## 9. Memória: o que lembra o quê

| Ajudante | Parte | O que guarda | Chega ao modelo? |
| --- | --- | --- | --- |
| **Crônica** | Extensão | A linha do tempo: momentos, marcos, vínculos, trama | Sim, pelo Memory Cortex |
| **Capítulos** | Extensão | Resumos de partes da história; loops em Re:Zero | Sim, como "a história até aqui", depois de resumidos |
| **Banco de mapas** | Extensão | Todo cômodo desenhado, por mundo | Só uma planta curta do cômodo quando preciso |
| **Memory Cortex** e **Chat Memory** | Lumiverse | Pessoas, lugares, ligações entre eles, passagens antigas | Sim, pelo bloco Memory do preset |
| **Loom Summary** | Lumiverse | Um resumo da história | Só se você ligar o bloco dele no preset |
| **Mentes** | Extensão | Sentimentos, rotinas, quem sabe o quê, detalhes plantados | Sim, como o estado das mentes antes de cada resposta |

### A Crônica e o Memory Cortex

- Uma resposta só é gravada no Cortex depois que você a responde. Assim um swipe nunca deixa uma memória errada.
- Cada entrada vira um fato nas pessoas a quem se refere, com uma tag de importância.
- Escolha quanto é gravado: Configurações → **Crônica** → Gravar no Memory Cortex. **Momentos-chave, vínculos, trama e marcos** é o padrão.
- **Gravar agora** grava na hora. **Gravar tudo de novo** é para depois de reconstruir o Cortex. Nada é gravado duas vezes.
- Em Re:Zero, um loop desfeito pelo Return by Death é gravado como desfeito.

### Dica

Use os **Capítulos** ou o **Loom Summary**, não os dois. Os dois mandariam um resumo da mesma história.

---

## 10. Configurações, seção por seção

As Configurações abrem como uma lista de seções. Clique numa para abri-la. Toda chave tem uma nota curta embaixo.

| Seção | O que contém |
| --- | --- |
| **Estilo de jogo** | Presets de mundo (um clique por bot), estilos de jogo (HMS Narrativo, D&D, Escala de poder, Narrativa pura, Sobrevivência dura, Social e romance), seus presets salvos, o tema do painel, densidade e tamanho do texto. |
| **Módulos** | Todo recurso numa lista. Desligue o que você não usa: sai do painel e do prompt, e não custa tokens. |
| **Motor HMS** | Modo HMS (automático, sempre, desligado), o bloco oculto, buscar um bloco esquecido, a guarda de linhas perdidas, o lembrete dos fixados. |
| **Sistemas HMS** | Como o HUD é lido: recursos e medidores, ferimentos e condições, habilidades e atributos, pessoas e suas barras, agenda, propriedades, equipamento, finanças, facções, segredos e família, o celular, o grupo, o relógio de sobrevivência, ferimentos, experiência. |
| **Mentes (do FrankenSIM)** | Sentimentos (os doze sentimentos ou as barras clássicas), também entre os outros, o tamanho do passo, a velocidade com que esfriam, devolver o estado ao modelo, rotinas, quem sabe o quê, arma de Tchekhov, mapas de prédios, e os créditos. |
| **Missões** | O cartão Missões, detalhes das missões, a trama, objetivos, o diário de missões, rótulos e estados das missões. |
| **Capítulos** | Capítulos automáticos para loops, arcos, dias ou meses; resumos; se vão com cada mensagem e com as lutas. |
| **Crônica** | Ligada ou desligada, pedir à história os momentos-chave, e quanto vai para o Memory Cortex. |
| **Contexto de lorebook** | Quais chamadas da própria extensão recebem seus lorebooks, e o que a última chamada enviou. |
| **Núcleo do motor e memória** | Se as lutas rodam no motor do bot, e quanta memória de longo prazo elas recuperam. |
| **Geral** | O interruptor geral, o idioma, Modo junto ou separado, a conexão para as chamadas da extensão, e os tempos limite. |
| **Painéis** | Quais painéis clássicos aparecem, e cores das barras. |
| **Extras do chat e do painel** | Estados internos abaixo de cada resposta, o mapa e o banco de mapas, o cartão do HUD, emoji, cores e nomes nos diálogos, efeitos de clima, retratos. |
| **Configuração dos personagens** | O que é pedido sobre cada personagem na cena: detalhes, pensamentos, barras de personagem. |
| **Lutas** | Dificuldade, como as lutas imersivas se resolvem, dados do destino, efeitos, movimentos, planos ocultos, a janela antiga. |
| **D&D** | O cartão de D&D, o rolador, os valores do HUD, lutas por turnos. |
| **Extras da história** | Extras do RPG Companion original: HTML imersivo, cor nos diálogos, tags de mentira, o filtro de onisciência, escolha sua aventura (desligado em chats HMS), sugestões de música. |
| **Presets de campos do tracker** | Salve e carregue configurações inteiras de tracker, mais para chats clássicos. Vincule uma a um personagem. |
| **Prompts personalizados** | Todo prompt que a extensão envia, editável. Vazio usa o embutido. |
| **Ajuda e relatório de bug** | **Abrir o guia**, e **Copiar relatório de bug** para o Discord. Nenhum texto do chat, a menos que você marque a caixa. |
| **Redefinir** | Limpar os trackers deste chat, ou redefinir todas as configurações. |

**Junto ou separado?** Junto (o padrão) recebe os dados do painel lateral na mesma resposta: uma chamada. Separado faz uma segunda chamada depois de cada resposta. Use Separado só se o seu modelo vive esquecendo o bloco oculto.

---

## 11. Quando algo dá errado

| Problema | O que fazer |
| --- | --- |
| O cartão World State está vazio. | Ele diz por quê. Muitas vezes o modelo escreveu o HUD dentro do raciocínio. Aperte **Ler de novo**. A extensão também tira sozinha um HUD de dentro do raciocínio. |
| Um cartão não atualizou. | Aperte **Ler de novo**. É grátis. |
| "A última resposta deixou de fora o bloco do painel lateral." | A extensão o busca com uma segunda chamada rápida. Se acontece muito, use o **Modo separado** (Configurações → Geral). |
| Uma linha do HUD sumiu. | Aperte **Restaurar** no cartão World State. Fixe a linha se continuar acontecendo. |
| A resposta não tem HUD nenhum. | Aperte **Devolver o último HUD**, ou faça swipe para uma nova resposta. |
| O cabeçalho do HUD aparece duas vezes. | A extensão mantém um sozinha. Se continuar acontecendo, ponha o controle de cabeçalho do HUD do preset em **Never**. |
| "A linha de Arc não carrega nenhuma entrada de arco." | Aperte **Usar** para pôr a grafia do livro. |
| Uma resposta OOC veio com HUD ou história. | Confira se o gatilho está bem no começo da sua mensagem, como `[OOC: ...]`. |
| Sem emoji nem cores de diálogo. | Começam desligados: Configurações → Extras do chat e do painel → Diálogo. |
| O cartão Novo jogo não aparece. | Ele só aparece num chat novo cuja primeira mensagem tem páginas de catálogo. |
| O cartão de D&D aparece num jogo sem dados. | Use o preset do seu mundo, ou desligue o D&D em Configurações → Módulos. |
| "Seu provedor permite só um pedido por vez." | Espere a resposta terminar, depois aperte **Atualizar**, ou **Ler de novo** (grátis). |
| Pensamentos e resumos vêm em inglês. | Configurações → Geral → ligue **Pedir o texto do painel neste idioma**. |
| Alguém sabe algo que não poderia saber. | Abra o cartão da pessoa → Por dentro, sentimentos e o que sabe → aperte ✕ no fato. |
| Um detalhe plantado não cabe na história. | Cartão Missões → Detalhes plantados → aperte ✕. |
| Os sentimentos de alguém parecem errados. | Eles mudam no máximo 2 por resposta; dê algumas respostas à história. Se a relação em si está errada, use **Definir o vínculo**. |
| Tokens demais. | Desligue partes das Mentes em Configurações → Módulos. |
| Falta uma permissão. | Conceda-a no painel Extensions. A parte que precisa diz qual. |
| Outra coisa. | Configurações → **Ajuda e relatório de bug** → **Copiar relatório de bug**, e cole no Discord. |

### Quanto custa

- O pedido do bloco oculto custa cerca de 1.000 a 1.700 tokens por resposta, conforme o que estiver ligado.
- Módulos desligados não custam nada.
- As Mentes acrescentam cerca de 1.000 tokens de instruções e 300 a 600 tokens de estado por resposta. Desligue partes para economizar.
- Lutas, o guia OOC e os resumos de capítulo fazem cada um a própria chamada quando você os usa.

---

## 12. Palavras usadas neste guia

| Palavra | Significado |
| --- | --- |
| **HMS** | O motor de jogo dentro do card do bot. |
| **HUD** (WORLD STATE) | O bloco no topo de cada resposta: hora, lugar, arco, poderes e mais. |
| **A parede** | A linha `***` abaixo do HUD. A história começa depois dela. |
| **STATE IS GOD** | A regra dos bots: o HUD é verdade, e a história precisa concordar com ele. |
| **Linha portadora** | Uma linha do HUD cujas palavras mantêm uma entrada de lorebook carregada, como a linha Arc. |
| **Start handler** | A linha de início do bot, como `ReZero_Start_Handler`. Sua primeira mensagem começa com ela. |
| **Catálogo** | As páginas da primeira mensagem do bot: como começar, e todos os comandos. |
| **Canvas** | A página do catálogo quase vazia embaixo da qual você digita o seu início. |
| **OOC** | Fora do personagem: uma pergunta ao guia do bot, fora da história. |
| **Bloco oculto** | O pequeno dado `<rpg_companion>` depois da história. A extensão o lê e o remove. |
| **Fixar** | Manter uma linha do HUD exatamente como está. |
| **Guarda** | A checagem de linhas do HUD que sumiram. |
| **Swipe** | Outra versão de uma resposta. A extensão segue o swipe que você mantém. |
| **Lorebook** | As entradas de mundo do bot. Uma palavra-chave no chat carrega uma entrada. |
| **Memory Cortex** | A memória do Lumiverse sobre pessoas, lugares e suas ligações. |
| **Preset** | A receita de prompt que o Lumiverse envia ao modelo. Aqui: HMS Reporter beta. |
| **Extensão** | Um complemento do Lumiverse. Aqui: RPG Companion HMS Edition. |
| **Junto / Separado** | Se os dados do painel lateral vêm na mesma resposta ou de uma segunda chamada. |
| **Resposta assentada** | Uma resposta que você já respondeu. Não pode mais ser trocada por swipe. |
| **Mentes** | Como as pessoas sentem, pensam e agem, do FrankenSIM. A extensão guarda os números. |
| **TFDY** | Ternura, Fúria, Pavor, Anseio: o humor de fundo de uma pessoa, de 0 a 4. De Pyropia. |
| **Mostra (IW)** | O quanto uma pessoa se mostra calorosa por fora. O FrankenSIM chama de Inner Weather. |
| **Os doze sentimentos** | Desejo, Brincadeira, Amizade, Parceria, Pertencimento, Cuidado, e seus espelhos Ódio, Discórdia, Inimizade, Travado, Indiferença, Inveja. |
| **Assenta em** | Onde um sentimento descansa. Muda devagar, quando um sentimento é empurrado na mesma direção várias vezes. |
| **Muro** | Um sentimento e seu espelho altos ao mesmo tempo. |
| **Portão** | O quanto uma pessoa se permite sentir por alguém. |
| **Rotina** | O que uma pessoa está fazendo, onde e até quando. |
| **Arma de Tchekhov** | Um detalhe que a história plantou e que deve ter consequência depois. |
