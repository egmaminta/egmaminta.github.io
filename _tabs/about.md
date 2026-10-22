---
layout: page
title: Writing
order: 1
permalink: /blog/
description: Notes on robotics, perception, and physical AI.
writing: true
---

<section class="writing-series" aria-labelledby="robotics-series">
  <h2 id="robotics-series">Robotics for Beginners</h2>
  <p>A robotics course that my friends can follow without owning a robot arm. The first chapter covers the SO-101 model in MuJoCo and a recorded joint response, including overshoot and angle settling time.</p>
  {% assign current_posts = site.posts | where_exp: 'post', 'post.archived != true' %}
  {% include post-list.html posts=current_posts descriptions=true %}
</section>

<p class="archive-note"><a href="{{ '/archives/' | relative_url }}">Earlier writing →</a></p>
