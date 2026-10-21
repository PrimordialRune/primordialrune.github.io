---
# SpaceRim: case study, written as the disc's liner notes.
# HOW TO EDIT (Omar): this file is the whole page. Change the words, save, and the page rebuilds.
#   # Heading | カタカナ      a new page: English title, then its katakana subtitle
#   plain lines             your text (paragraphs are separated by a blank line)
#   * like this             the narrator, writing in the margin (keep the lowercase "* " voice)
#   ?? like this            a question from Claude to you; shows only while status is draft
#   ![caption](file.png)    a picture from public/new/study/spacerim/ ("x2" sets a pixel art scale)
#   - like this             a bullet list
# The pages are numbered like tracks on the disc.
slug: spacerim
title: SpaceRim
kana: スペースリム
medium: disc
status: draft
cover: logo.png
palette: "#1a1016 #db604c #317c87 #f6dbba"
facts:
  Made for: A castle game jam, as Limpero Studios, October 2023 ??
  Genre: Rhythm boss battles
  Engine: Godot 4.1, with MIDI-driven beats
  My part: ??
  Team: ??
play: ""
---

# Beat the boss | ボス

SpaceRim is a rhythm game made of boss fights. The music is the attack pattern: the beats arrive along a timeline, and every beat is an action.

![Create the spells to beat the boss](tutorial.png "x2")

* spacerim. a jam game. it shows.
* in a good way. mostly.

?? What was the jam, and its theme? And who was Limpero Studios? I found the project as "LimperoStudiosCastleJam" but nothing about the team.

# Four kinds of beat | ビート

Each beat on the timeline carries a sign, and the player builds spells by answering them in time:

- **Attack** hits the boss.
- **Skip** lets a beat pass.
- **Stun** stops the boss for a moment.
- **Defend** is held down, and blocks what comes back.

The beats aren't placed by hand on a chart: the game reads the song's MIDI file and spawns a marker for every note on the right channel, so the level is literally the score.

?? I guessed what Stun and Defend do from the tutorial screen; please correct them. And is it right that the levels are generated from the MIDI tracks? It's the most interesting technical choice in the project, if so.

# The bosses | ボスたち

Every boss is a parody of someone you've met somewhere else.

![A skeleton in a cap](boss-skeleton.gif "x2")
![A very large slug, holding a very red bowl](boss-slug.gif "x2")
![You're breathtaking!](boss-breathtaking.gif "x2")

* i'm not going to say who they are.
* you know who they are.

?? Did you draw the bosses? Who made the music?
