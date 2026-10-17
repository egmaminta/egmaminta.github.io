---
layout: page
title: Writing
order: 1
permalink: /blog/
description: Notes on AI research, engineering, and building intelligent agents.
---

{% include post-list.html posts=site.posts descriptions=true %}

<nav class="writing-archive-nav" aria-label="Browse writing">
  <a href="{{ '/archives/' | relative_url }}">Archive</a>
  <a href="{{ '/categories/' | relative_url }}">Categories</a>
  <a href="{{ '/tags/' | relative_url }}">Topics</a>
  <a href="{{ '/feed.xml' | relative_url }}">RSS feed</a>
</nav>
