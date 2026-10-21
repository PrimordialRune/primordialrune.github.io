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
  My part: Project coordinator, game designer and UI/UX designer: all the UI, the level design, and an art direction that stays cohesive
  Team: Malakh17 (programming), Zahkros (2D art), Smoketracy (music and sound design), Elia Scaravelli (3D models, AI engineering), and me
play: "https://primordialrune.itch.io/crossfader"
---

# One half-remembered song | うた

Crossfader is a puzzle platformer about Ayane, a girl searching for a song she half-remembers.

The jam theme was "cross-over", and we built the concept around strong clashes of styles and ideals: two different worlds, crossed together. It didn't start as a platformer. The first pivot was a roguelike where dying in one world was how you travelled to the other. We finally landed on a puzzle adventure you move through by platforming.

The idea grew the way jam ideas should: every member brought their own, and my job was finding a direction that could hold some of them elegantly. The cassette wasn't there at the start. It arrived when Elia showed an animation that reminded me a lot of Unbeatable, an indie game I really love, and from then on we built the game around it.

![The title screen: flip the side, remix the song](title.png)

* every game i make ends up being about a medium.
* this one is about a tape. you're holding it.

# Looking for her own ideas | アヤネ

We are constantly bombarded with cool ideas and concepts, and now with AI even more. A creative person can struggle to find themselves in what they make.

The whole level is a metaphor for Ayane's creative process. She looks for her old ideas inside cassettes to find her inspiration again, and switching between the sides of a cassette is switching between her worlds.

?? Your sentence was cut off here: "puzzles become gradually more difficult as she starts to…". How does it end?

# Mixtape of influences | インスピレーション

The look and feel borrow from a whole shelf:

- **Hi-Fi Rush**, for a world that moves to the beat.
- **HyperPop and MoePop**, for the colour and the overload.
- **Planarcadia** from Honkai: Star Rail, and **Splatoon**.
- **Unbeatable**, for some of the concepts.
- **Fez**, for the level design: one space, read from more than one side.
- **Jet Set Radio Future**, for the punk.

* a mixtape of other people's songs.
* which is how every new song starts, honestly.

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

# Hyper Mode | ハイパー

Sometimes Ayane gets so inspired by what she's thinking that she falls into Hyper Mode. Pick up five Inspirations and the Walkman gauge fills; press X and the room turns 3D for one short hyper track.

In Hyper Mode she's overstimulated by the rush of ideas in her head, and that makes it impossible to recover her memories, the tapes. To rebuild a memory and learn from it, she has to come back to nostalgia.

![Hyper-mode: the room opens into colour](hyper.png)

That's the design rule too: Hyper Mode **sets up** the solution, it never **is** the solution. Nothing can be collected in 3D. You use the song to push a subwoofer where it's needed, and the payoff happens back in 2D, where the moved speaker becomes a step, a wall or a bridge.

![Pushing a subwoofer in Hyper Mode](subwoofer.png)

?? You said this rule isn't your proudest line. Which design decision in Crossfader are you proudest of? I'll lead the Hyper Mode page with it, or move it wherever it belongs.

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
