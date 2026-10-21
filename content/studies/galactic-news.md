---
# The Galactic News: case study, written as the cartridge's instruction booklet.
# HOW TO EDIT (Omar): this file is the whole page. Change the words, save, and the page rebuilds.
#   # Heading | カタカナ      a new booklet page: English title, then its katakana subtitle
#   plain lines             your text (paragraphs are separated by a blank line)
#   * like this             the narrator, writing in the margin (keep the lowercase "* " voice)
#   ?? like this            a question from Claude to you; shows only while status is draft
#   ![caption](file.png)    a picture from public/new/study/galactic-news/ (add "x3" to set its scale)
#   - like this             a bullet list
# Delete a "?? " line once you've answered it in the text.
slug: galactic-news
title: The Galactic News
kana: ギャラクティック・ニュース
medium: gb
status: draft
cover: title.gif
palette: "#291f23 #bd502f #34d1af #f7ecb9"
facts:
  Made for: GBJAM 11, September 2023
  Hardware: Game Boy rules, 160 × 144, four colours
  Engine: Godot 4.1
  My part: Pixel art and UI ??
  Team: IndigoMountain, Mika, GoldfishParty, Craig Henderson
play: ""
---

# Story | ストーリー

Space is out of space. The newspapers still have to get through.

You fly the mail ship for The Galactic News. Every level is a delivery route: a stretch of space dotted with mailboxes, a paper count, and pirates who would rather the news didn't arrive.

![The opening cutscene: SPACE IS OUT OF SPACE!](cutscene.gif)

* i drew that headline before i knew what the game was.
* that's how it usually goes.

?? Where did the idea start? Was "space is out of space" the jam theme, or the first joke?

# The front page | フロントページ

The level select is the newspaper. Each route is a front page of Galactic Today, with its headline, its quota and a little SOON! box for the next edition. Choosing a level is reading the paper you are about to deliver.

![Galactic Today: every level is a front page](level-select.gif)

This is the thing I care about most in the project: the menu is not a menu, it is the object the game is about.

* you'll notice i do this a lot.
* the medium is the message. somebody said that first. i just keep agreeing.

?? Is that true for you, or am I putting words in your mouth? Rewrite this page freely.

# How to play | あそびかた

- Steer the mail ship with the D-pad. Fuel burns only while you move.
- A throws a newspaper to the right, B throws one to the left. The paper bag is not bottomless.
- SELECT raises the shield for two seconds. It needs ten to recharge.
- A paper that hits a passing ship knocks it off course. Pirates shoot back.
- When the clock runs out, you need enough mailboxes delivered to pass.

![The HUD: health, fuel and papers along the bottom](hud.png)

A route ends on a results card: mailboxes delivered, the number you needed, and the money you made. Every paper pays ten, even on a failed route, so the next attempt starts a little stronger.

![Level complete](level-complete.gif)

?? Failing still pays (10 per paper delivered, "you made 30$ anyways" in the UI flow). Was that a deliberate design call? It's a nice one to talk about.

# The upgrade shop | ショップ

Money goes to the shop. The owner greets you at the hangar door, your ship sits on the lift, and four parts sit on the shelf, each with two grades: a printer for more papers (Printobot-2, Printobot-3), hull plating (Titanium alloy, Diamond coating), engines (Hyper-1, F-1) and shields (Sigma, Omega).

![The shop owner and the ship in the hangar](shop.png)
![Buying the light shield](upgrade.png)

The shop started as a sketch in the docs folder and a diagram of every screen and how you move between them: boot, story, title, the paper, the shop, the route, and back.

![The first upgrade sketch](upgrade-sketch.png)
![The UI flow, planned in the first days of the jam](ui-flow.png "wide")

* the diagram has three question marks in it.
* we answered all of them. eventually.

?? Did you draw the UI flow and design the shop yourself? I'd like the "My part" line to be exact.

# Four colours | よんしょく

GBJAM asks for Game Boy rules: a 160 × 144 screen and four colours. We picked a warm four: near-black #291f23, rust #bd502f, mint #34d1af and paper #f7ecb9. They carry the whole game, from the title to the credits.

![The mail ship, frame by frame](mail-ship.gif "x4")

* this booklet is printed in those same four.
* i checked. twice.

?? Anything about working inside four colours you'd want a designer reading this to notice?

# Staff | スタッフ

- Development: IndigoMountain, Mika
- Pixel art: PrimordialRune (me), GoldfishParty
- Music: Craig Henderson

![The credits screen](credits.png)

?? Where can people play it? An itch.io link would go on the cover.
