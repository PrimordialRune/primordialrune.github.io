---
# Holon: case study, written as the disc's liner notes.
# HOW TO EDIT (Omar): this file is the whole page. Change the words, save, and the page rebuilds.
#   # Heading | カタカナ      a new page: English title, then its katakana subtitle
#   plain lines             your text (paragraphs are separated by a blank line)
#   * like this             the narrator, writing in the margin (keep the lowercase "* " voice)
#   ?? like this            a question from Claude to you; shows only while status is draft
#   ![caption](file.png)    a picture from public/new/study/holon/
#   - like this             a bullet list
# The pages are numbered like tracks on the disc.
# No game screenshots here on purpose: the alpha asks testers not to share them yet.
slug: holon
title: Holon
kana: ホロン
medium: disc
status: draft
cover: logo.png
palette: "#0d1530 #4f6fa8 #5fe3f2 #f1f4fa"
facts:
  What: A simulator for the RS-PK retro format of the Pokémon TCG (the EX era)
  Status: Closed alpha, version 0.1.2
  Platforms: Web, Windows, Android, and a game server on a Raspberry Pi
  Engine: Unity 6
  My part: Game design, visual design, art direction and development, built with AI help for the code
  Since: April 2025
  Music: Hoenn remixes by Zame
play: ""
---

# A new way to play RS-PK | ホロン

Holon is a simulator for the RS-PK retro format, which covers the EX era of the Pokémon Trading Card Game, from EX Ruby & Sapphire through EX Power Keepers.

As a player and game designer, I wanted a different way to experience this format with friends, so I started building my own.

* holon. the logo took longer than some games.
* it's the one i'm still playing.

# Every card, hopefully | カード

The alpha has Ruby & Sapphire, Sandstorm and Dragon, with every card (hopefully) working. You can play against the AI, try online play against other testers, build decks in a deck editor, and import decklists from Limitless.

Getting old cards right is the hard part. The rules of the EX era live in a written ruleset, set by set rulings, and the memory of the players who were there. Holon measures its engine against that ruleset and fixes what diverges: a damage counter that wasn't always 10 damage, Darkness and Metal Energy that provided every type, two Pokémon knocked out at the same time.

* a lot of the loading-screen tips came from questions testers asked.
* the game learns from the people playing it. i like that. i'd like that.

?? Is there a design decision you're proudest of in Holon, something beyond "the rules are right"? The animation of a coin flip, the way choices are asked, the deck editor? That's what I'd put here.

# The closed alpha | アルファ

Holon is in a small closed alpha while I learn, test and improve it. Testers ask for a seat on the site, sign in inside the game, and their decks follow them across devices.

- F8 sends a bug report from any match. On a phone, hold three fingers on the screen.
- If a ruling feels wrong, testers tell me, and it becomes a fix or a tip.
- Matches online run through a game server on a Raspberry Pi.

?? Should this page link to the alpha request, or stay quiet until the beta? I left screenshots out because the site asks testers not to share them yet.

# How it's made | せいさく

I'm building Holon with the help of AI, particularly for programming, while I keep learning Unity development. The game design, visual design and art direction are my own work.

The project is documented like a studio would document it: a knowledge base where every page says whether it owns a fact or only repeats it, decision records, a release gate that runs the tests before every build, and rules conformance measured against the written ruleset.

Holon is an unofficial, non-commercial fan project. It is not affiliated with or endorsed by Nintendo, Creatures, GAME FREAK or The Pokémon Company.
