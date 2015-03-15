# Vetinari Clock

[A web page](https://roryokane.github.io/vetinari-clock) that plays a distractingly irregular tick-tock sound, mimicking Vetinari’s clock from Terry Pratchett’s [<i>Discworld</i>](http://en.wikipedia.org/wiki/Discworld) series.

> Someone very clever—certainly someone much cleverer than whoever had trained that imp—must have made the clock for the Patrician’s waiting room. It went tick-tock like any other clock. But somehow, and against all usual horological practice, the tick and the tock were irregular. Tick tock tick…and then the merest fraction of a second longer before…tock tick tock…and then a tick a fraction of a second earlier than the mind’s ear was now prepared for. The effect was enough, after ten minutes, to reduce the thinking processes of even the best-prepared to a sort of porridge. The Patrician must have paid the clockmaker quite highly.

– <i>Feet of Clay</i> by Terry Pratchett, page 91

## How it ticks

The clock ticks roughly every second. Every sound alternates between “tick” and “tock”, like a normal clock.

Every tick, the program randomly decides to either tick perfectly on time, or skew its tick slightly off. When it chooses to skew its tick, it randomly chooses how far to skew, and in which direction.

The total skew over time is restricted. If the clock starts getting too far ahead or behind the actual time, the clock starts skewing in the opposite direction, so that it stays roughly accurate.

## Related works

* [schematics](https://github.com/akafugu/vetinari_clock) for building a physical clock like this and a [video](http://www.akafugu.jp/posts/products/vetinariclock/) of one, by Akafugu Corporation
* a [video](https://www.youtube.com/watch?v=KHKOhO_-hZY) of a physical clock built like this and [discussion of it](http://www.reddit.com/r/discworld/comments/l1q0p/a_vetinaristyled_clock/), by rdmiller3
