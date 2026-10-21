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
  Made for: A 48-hour castle game jam, October 2023, theme "Klaatu barada nikto" ??
  Genre: Rhythm game with RPG boss battles, played by typing spells
  Engine: Godot 4.1, with MIDI-driven beats
  My part: ??
  Team: Malakh17, Zahkros, Smoketracy, Elia Scaravelli and me: the same team as Crossfader
play: ""
---

# Klaatu barada nikto | じゅもん

The jam's theme was a phrase: "Klaatu barada nikto", the words that stop the robot Gort in The Day the Earth Stood Still (1951). A theme that is literally a spell, so we made a game about reciting spells.

We wanted something that could be done properly in 48 hours, by the same team that later made Crossfader. SpaceRim is a rhythm game with a bit of RPG in it: you face a boss, and the only weapon you have is your keyboard.

![Create the spells to beat the boss](tutorial.png "x2")

* spacerim. a jam game. it shows.
* in a good way. mostly.

?? What does "Rim" mean in the name? And who was Limpero Studios: the team's name at the time?

# Spells, letter by letter | タイピング

Every spell is a word, and every word is spread across the beats of the song. Say the spell is TOBY: when the beats call for an attack, you type the next letter in time, T, then O, then B. Each correct letter deals damage. Finishing the whole word completes the spell, and a completed spell hits much harder.

The beats carry their own signs. A sword means attack: type the next letter. Other beats ask you to stay quiet, and let the beat pass.

?? You mentioned an action type I couldn't make out ("a silent"?). What are all the beat types and what does each one do? The tutorial screen shows Attack, Skip, Stun and Defend.

The beats aren't placed by hand: the game reads the song's MIDI file and spawns a marker for every note on the right channel, so the level is literally the score.

?? Is it right that the levels are generated from the MIDI tracks? It's the most interesting technical choice in the project, if so.

# Learning to read in time | リズム

In testing, typing on the beat felt counterintuitive at first. Then players got used to it and started building real skill. The rhythm does half the teaching: following the beat tells you when the next letter is due, and you fall into a loop of reading the word ahead and typing it in time.

* reading ahead, typing in time.
* that's also how you write a letter to someone you miss. i think.

?? What changed after that first round of testing? A tweak to the timing window, bigger letters, a slower first boss? That's the design story a reader will want here.

# The bosses | ボスたち

Every boss is a parody of someone you've met somewhere else.

![A skeleton in a cap](boss-skeleton.gif "x2")
![A very large slug, holding a very red bowl](boss-slug.gif "x2")
![You're breathtaking!](boss-breathtaking.gif "x2")

* i'm not going to say who they are.
* you know who they are.

?? Who drew the bosses, and who picked the words for each boss's spells? If the spells are tied to the parodies (TOBY for the skeleton?), that's worth saying.
