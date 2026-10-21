---
# Crossfader: case study, written as the cassette's J-card (the folded insert in the case).
# HOW TO EDIT (Omar): this file is the whole page. Change the words, save, and the page rebuilds.
#   # Heading | カタカナ      a new panel: English title, then its katakana subtitle
#   plain lines             your text (paragraphs are separated by a blank line)
#   * like this             the narrator, writing in the margin (keep the lowercase "* " voice)
#   ?? like this            a question from Claude to you; shows only while status is draft
#   ![caption](file.png)    a picture from public/new/study/crossfader/
#   - like this             a bullet list
# The panels are numbered like tracks: the first half is Side A, the second half Side B.
slug: crossfader
title: Crossfader
kana: クロスフェーダー
medium: cassette
status: draft
cover: cover.png
palette: "#2e2828 #d2508f #4fb3cf #f1ead6"
facts:
  Made for: Castle Game Jam, October 2026, 48 hours, theme "cross-over"
  Genre: Puzzle platformer in three views
  Engine: Godot 4.7
  My part: Game design (GDD, one-pager, level design) and development ??
  Team: Paolo Malacarne, Elia Scaravelli, PrimordialRune ??
play: ""
---

# One half-remembered song | うた

Crossfader is a puzzle platformer about a girl searching for a song she half-remembers.

The jam theme was "cross-over". We read it as one room crossed with itself: every level is a single space you can read in two ways, and a third way you have to earn.

![The title screen: flip the side, remix the song](title.png)

* every game i make ends up being about a medium.
* this one is about a tape. you're holding it.

?? Where did the idea come from? Was the cassette there from the first hour, or did it arrive with the theme?

# Side A | サイドA

**Side A** shows the room from above. You walk, you find the way, you spot what's hidden. You can't jump here: a missing floor drops you to the level below.

![Side A: the floor plan](side-a.png)

Things you collect only exist on one side. A cassette lying flat can only be read from above.

# Side B | サイドB

**Side B** shows the same room from the side. Now you can run, jump and dash, and a low wall that blocked you from above is just a hop.

![Side B: the same room, on its side](side-b.png)

Flipping is one key and always allowed. The puzzle is never in your hands; it's in knowing what each side shows and hides. A cassette standing upright can only be read from the side.

* side a. always side a first.
* then you flip it. that's the whole game, and also how tapes work.

# Hyper-mode | ハイパー

Pick up five Inspirations and the Walkman gauge fills. Press X and the room turns 3D for one short hyper track.

![Hyper-mode: the room opens into colour](hyper.png)

The rule I held onto: Hyper-mode **sets up** the solution, it never **is** the solution. Nothing can be collected in 3D. You use the song to push a subwoofer where it's needed, and the payoff happens back in 2D, where the moved speaker becomes a step, a wall or a bridge.

![Pushing a subwoofer in Hyper-mode](subwoofer.png)

?? Is "a Remix prepares a solution, never is one" the design rule you're proudest of? It's the line I'd lead with for a designer reading this.

# If it moves on the beat, it matters | シグナル

There is no tutorial text beyond the first Flip prompt. The room teaches itself through five rules:

- If it moves on the beat, it matters. Pickups and interactive props dance at 120 BPM; scenery never moves.
- Cyan means Side A, magenta means Side B. If you see magenta from above, flip.
- An outline in the signature colour marks what you can touch.
- Sound leads before sight: each cassette leaks its layer of the song as you get close.
- Every action answers on the beat: the flip clicks like a cassette turning, a push lands with a bass thump.

Only two props change the state of a level: the cassettes you collect and the subwoofer you push. Everything else in the room only talks to you.

* a still room with one thing bouncing.
* that's how you tell someone where to look without saying anything. i should try it.

# Three cassettes | カセット

Each level hides three cassettes. The first two bring back layers of her song. The third, in a gold shell, ends the track: the room freezes and the outro loops until you're ready to continue.

The jam build has two levels, CMY and Bass Drop.

?? Who made the music, and who else was on the team? The repository shows commits from Paolo Malacarne, Elia Scaravelli and you. I'd like the credits to be complete.

?? Where can people play it? An itch.io link would go on the cover.
