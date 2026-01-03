---
layout: page
title: Blog
permalink: /blog/
icon: fas fa-blog
order: 1
---


<nav class="row row-cols-1 row-cols-md-2 row-cols-xl-3 g-4" id="post-list">
	{% for post in site.posts %}
	<article class="col">
		<a class="post-preview card h-100" href="{{ post.url | relative_url }}">
			<div class="card-body">
				<time datetime="{{ post.date | date_to_xmlschema }}">{{ post.date | date: "%b %-d, %Y" }}</time>
				<h4 class="pt-0 my-2">{{ post.title }}</h4>
				<div class="text-muted">
					<p>{{ post.excerpt | strip_html | truncate: 160 }}</p>
				</div>
			</div>
		</a>
	</article>
	{% endfor %}
</nav>
