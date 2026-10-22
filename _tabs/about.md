---
layout: page
title: Writing
order: 1
permalink: /blog/
description: A learning journal on robotics, perception, and physical AI.
writing: true
---

<section class="writing-series" aria-labelledby="robotics-series">
  <p class="eyebrow">Learning in public · Ongoing series</p>
  <h2 id="robotics-series">Robotics for Beginners</h2>
  <p>I study embodied AI and vision-language models for retail. Here, I am building my understanding of robot learning from the ground up, starting with an SO101 arm in MuJoCo. These notes follow the experiments I try, the intuition I develop, and the questions I still need to test.</p>
  <p>The approach is selective: focus first on a few foundational ideas that make later work easier to understand. Each chapter pairs an explanation with visual intuition and a small experiment.</p>
  {% assign current_posts = site.posts | where_exp: 'post', 'post.archived != true' %}
  {% include post-list.html posts=current_posts descriptions=true %}
</section>

<p class="archive-note"><a href="{{ '/archives/' | relative_url }}">Earlier writing →</a></p>
