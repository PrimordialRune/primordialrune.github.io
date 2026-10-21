---
# Project Minamoto: case study, written as the GBA cartridge's instruction booklet.
# HOW TO EDIT (Omar): this file is the whole page. Change the words, save, and the page rebuilds.
#   # Heading | カタカナ      a new booklet page: English title, then its katakana subtitle
#   plain lines             your text (paragraphs are separated by a blank line)
#   * like this             the narrator, writing in the margin (keep the lowercase "* " voice)
#   ?? like this            a question from Claude to you; shows only while status is draft
#   ![caption](file.png)    a picture from public/new/study/minamoto/ ("x2" sets a pixel art scale)
#   - like this             a bullet list
slug: minamoto
title: Project Minamoto
kana: プロジェクト・ミナモト
medium: gba
status: draft
cover: logo.png
palette: "#2a2440 #d9506a #3d9bd9 #fdf0ec"
facts:
  Type: A Pokémon fan game that re-reads Generation 1 on the Game Boy Advance
  Hardware: GBA, 240 × 160
  Started: 2021, still in progress ??
  My part: Design, pixel art, UI, balancing models ??
play: ""
---

# Gen 1, again | げん

Minamoto (源) means source, or origin. The project goes back to the source: the first Pokémon games, Red, Green and Blue, re-read on the hardware that came after them.

![ポケットモンスター 源, the title](logo.png)

The research starts further back than the finished games. The project folder holds the Japanese Pocket Monsters Green and the prototype data of Red and Green: the first move names, the early encounter tables, the trainer classes and parties that were changed before release.

* minamoto. gen 1, again.
* some people reread their favourite book. i rebuild it.

?? What is Minamoto, in your words: a remake, a "what Gen 1 could have been" from the prototype, or something else? This page should open with your own sentence.

# Pallet Town | マサラタウン

The first map, drawn twice. The 2021 version, and the one from this month, at the size of one Game Boy screen.

![Pallet Town, 2021](pallet-v1.png "x2")
![Pallet Town, October 2026](pallet-v4.png "x3")

?? Why did the newest Pallet Town shrink to 160 × 144? Is the overworld moving to GB proportions, or is it a study?

# Battle | バトル

The battle screen keeps the Gen 1 layout and its words (FIGHT, PKMN, ITEM, RUN) and redraws it for the GBA: a status box with HP and a second bar, a pink command frame, a SEL. button in the corner.

![The battle UI, version 1](battle.gif "x2")
![Battle UI test, animated](battle-anim.gif "x2")

?? What is the second bar under HP, the orange one marked TP?

# Gym Leaders | ジムリーダー

Every Gym Leader gets a portrait, framed like a card with their name in katakana.

![ユジロ](leader-001.png "x3")
![タケシ, Brock](leader-002.png "x3")
![カスミ, Misty](leader-003.png "x3")

* the first one isn't brock.
* if you know, you know. if you don't, ask omar.

?? Who is ユジロ, and why does he come first? I'm guessing it's from the prototype data, but I'd rather you tell the story.

# Balancing with numbers | バランス

Minamoto is balanced with a model, not by feel alone. A Python simulation plays thousands of battles using the real Gen 1 damage formula: levels, stats, type effectiveness, same-type bonus, a random roll. It checks whether a player who catches what each route offers, in the order the routes come, can beat each Gym Leader's team.

- The encounters file lists every route in its new order, with levels and rates.
- The bosses file holds the Gym Leaders' Pokémon, starting with Brock's Onix at level 14.
- The results record which moves a winning team leaned on: a level 18 Mankey beating the boss, mostly with Karate Chop and Scratch.

* i made a machine to play my game for me, thousands of times.
* it never got bored. that part worried me a little.

?? Is that a fair summary of the MathModels folder? It's a strong design story, and it deserves your own explanation of why you built it.
