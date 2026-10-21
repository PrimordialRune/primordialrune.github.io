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
  My part: Game design, pixel art and UI art
  Inspired by: Paperboy
  Team: IndigoMountain, Mika, GoldfishParty, Craig Henderson and me
play: "https://indigomountain.itch.io/galactic-news"
---

# Space is out of space | ストーリー

The game starts from Paperboy: ride along a street, throw the paper into every mailbox. We took the route to space.

The story is told in four screens before the title. Space is out of space. The intergalactic highways are cluttered with spacecraft. The Pirate News Network intercepts and manipulates news on the galactic web. So people go back to the only medium they still count on: the newspaper.

![SPACE IS OUT OF SPACE!](cutscene.gif)
![The highways, cluttered](cutscene2.png)
![The Pirate News Network](cutscene3.png)
![The only medium they still count on](cutscene4.png)

You fly the mail ship for The Galactic News, and every level is a delivery route.

* a game about trusting paper.
* printed on paper. well, almost.

?? Who wrote the story: was "the only medium they still count on" there from the start, or did it come after Paperboy-in-space?

# Every menu is part of the world | フロントページ

I wanted every screen to be an object from the game's world, not a menu laid on top of it.

**The level select is the newspaper.** Each route is a front page of Galactic Today: a headline, a portrait, the quota for that route. And the headline is the level design. "Employment increases" is the first, gentle route. "Galaxy-wide fuel shortage" starts you with less fuel. "Pirates!" sends seven pirate ships. "Traffic collapses!" fills the lanes with more than two hundred civilian ships. "Pirate captain near Earth" is the boss. You read the news, then you fly into it.

![Galactic Today: every level is a front page](level-select.gif)

**The shop is an ad in the paper.** Upgrades are sold the way they would be in a newspaper: a page with the owner, the ship on the lift and the parts on offer.

![The upgrade shop](shop.png)
![Buying the light shield](upgrade.png)

**The HUD is the cockpit.** Health, fuel, the delivery bar, shields and the paper count are dials and gauges on the ship's dashboard. It is harder to read than a plain HUD, and that was the trade I chose: you're sitting in the ship, not looking at a game.

![The cockpit: health, fuel, delivery bar, shield and papers](hud.png)

?? Was there a moment in the jam when the cockpit HUD was too hard to read, and you had to change it? A before and after would be great here.

# A tutorial in the stars | せいざ

The first route has no tutorial text for the controls. As you fly up, the stars form Game Boys, and each one lights the button you need: the D-pad to steer, A to throw a paper to the right, B to throw to the left.

![The first route's sky: constellations shaped like Game Boys](constellations.png "x2")

The cockpit explains itself the same way. On the first route the game pauses for a moment on each gauge, with an arrow and one short line: your fuel meter, steering uses fuel. Newspaper ammo, for shooting news.

* the sky tells you which button to press.
* i still look for them when i play it.

?? What were the other "design takes" like this one? Tell me two or three and I'll give them a page.

# How to play | あそびかた

- Steer the mail ship with the D-pad. Steering burns fuel.
- A throws a newspaper to the right, B throws one to the left.
- SELECT raises the shield when it's full.
- Pirates shoot back, and civilian ships get in the way.
- Fill the delivery bar to the line before the clock runs out.

A route ends on a results card: mailboxes delivered, the number you needed, and the money you made.

![Level complete](level-complete.gif)

?? Failing a route still pays for every paper you delivered. Was that a deliberate call, so the next try starts a little stronger?

# Four colours | よんしょく

GBJAM asks for Game Boy rules: a 160 × 144 screen and four colours. We picked a warm four: near-black, rust, mint and paper. They carry the whole game, from the title to the credits.

![The mail ship, frame by frame](mail-ship.gif "x4")

The shop started as a sketch, next to a diagram of every screen and how you move between them.

![The first upgrade sketch](upgrade-sketch.png)
![The UI flow, planned in the first days of the jam](ui-flow.png "wide")

* this booklet is printed in those same four colours.

# Staff | スタッフ

- Development: IndigoMountain, Mika
- Game design: PrimordialRune (me)
- Pixel art: PrimordialRune (me), GoldfishParty
- UI art: PrimordialRune (me)
- Music: Craig Henderson

![The credits screen](credits.png)
