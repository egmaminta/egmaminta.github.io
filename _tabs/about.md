---
layout: page
title: Writing
order: 1
permalink: /blog/
description: Notes on robotics, perception, and physical AI.
writing: true
---

<section class="writing-series" aria-labelledby="robotics-series">
  <p class="eyebrow">Course notes · Ongoing series</p>
  <h2 id="robotics-series">Robotics for Beginners</h2>
  <p>I have been wanting to create a robotics course that my friends can follow without owning a robot arm. We will start with an SO101 arm in MuJoCo and work toward experiments in robot learning.</p>
  <p>The course begins with the concepts needed to explain an arm's movement. Each chapter pairs an explanation with diagrams and an exercise.</p>
  {% assign current_posts = site.posts | where_exp: 'post', 'post.archived != true' %}
  {% include post-list.html posts=current_posts descriptions=true %}
</section>

<p class="archive-note"><a href="{{ '/archives/' | relative_url }}">Earlier writing →</a></p>
