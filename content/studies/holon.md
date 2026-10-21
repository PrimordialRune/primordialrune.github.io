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
  What: A simulator for the RS-PK retro format of the Pokémon TCG (the EX era), designed for digital
  Status: Closed alpha, version 0.1.2
  Platforms: Web, Windows, Android, and a game server on a Raspberry Pi
  Engine: Unity 6
  My part: Game design, visual design, art direction and development, built with AI help for the code
  Since: April 2025
  Inspired by: Pokémon TCG Pocket, and the Game Boy Pokémon Trading Card Game
  Music: Hoenn remixes by Zame
play: ""
---

# Designed for digital | ホロン

Holon is a simulator for RS-PK, the retro format of the Pokémon Trading Card Game that covers the whole EX era, from EX Ruby & Sapphire through EX Power Keepers.

I made it because I wanted a way to play this game that feels refreshing and is designed for digital, not a paper table copied onto a screen. Pokémon TCG Pocket was a big inspiration: it showed how well the TCG can be rethought for a digital space. I wanted to do the same for the community I care about most in the Pokémon TCG, the RS-PK players.

* holon. the logo took longer than some games.
* it's the one i'm still playing.

# Chrome and metal | クローム

The whole design mixes the aesthetic of the time with a modern renovation. Holon should feel new, modern and functional, and still remind you of how things looked back then.

You can see it most in the chrome and metal everywhere: the materials of Y2K design, the years these cards came out in.

?? You wrote "I try to use that a bit also for horror", and I'm not sure I caught it. Did you mean the chrome also turns unsettling somewhere (a boss, the story mode), or something else?

# Every card, hopefully | カード

The alpha has Ruby & Sapphire, Sandstorm and Dragon, with every card (hopefully) working. You can play against the AI, try online play against other testers, build decks in a deck editor, and import decklists from Limitless.

Getting old cards right is the hard part. The rules of the EX era live in a written ruleset, set by set rulings, and the memory of the players who were there. Holon measures its engine against that ruleset and fixes what diverges: a damage counter that wasn't always 10 damage, Darkness and Metal Energy that provided every type, two Pokémon knocked out at the same time.

* a lot of the loading-screen tips came from questions testers asked.
* the game learns from the people playing it. i like that. i'd like that.

# A story mode, like the Game Boy ones | ものがたり

The Game Boy Pokémon Trading Card Game gave the cards an adventure: clubs, masters, a world to walk through. It only ever covered the earliest sets, and its sequel, which added Team Rocket cards, never left Japan.

I want Holon to have that too, but living alongside the simulator. Players who only want to test decks or run tournaments keep the simulator. Players who want an adventure get a story mode, with a more draft-like way of building what they play.

The story's bosses are designed to be a real challenge, and each one has a **trainer power**: a strong move they can use once during a match. Some accelerate energy, some clear special conditions, and so on. A trainer power gives every Gym Leader a flavour you can't foresee just by reading their deck.

* a deck tells you what someone plays.
* a trainer power tells you who they are.

?? Is the story mode already in the alpha, or still being designed? And can you name one Gym Leader and their trainer power? One concrete example would make this page.

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
