---
layout: page
title: Writing
order: 1
permalink: /blog/
description: Notes on machine learning, robotics, and perception.
writing: true
---

{% assign current_posts = site.posts | where_exp: 'post', 'post.archived != true' %}
{% assign standalone_posts = current_posts | where_exp: 'post', 'post.series == nil' %}
{% assign robotics_posts = current_posts | where: 'series', 'Robotics for Beginners' %}

<section class="writing-series" aria-labelledby="machine-learning-writing">
  <h2 id="machine-learning-writing">Machine learning</h2>
  {% include post-list.html posts=standalone_posts descriptions=true %}
</section>

<section class="writing-series" aria-labelledby="robotics-series">
  <h2 id="robotics-series">Robotics for Beginners</h2>
  <p>A robotics course that my friends can follow without owning a robot arm. The first chapter covers the SO-101 model in MuJoCo and a recorded joint response, including overshoot and angle settling time.</p>
  {% include post-list.html posts=robotics_posts descriptions=true %}
</section>

<p class="archive-note"><a href="{{ '/archives/' | relative_url }}">Earlier writing →</a></p>
