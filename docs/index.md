---
layout: default
title: Download the forms extension for Firefox !
---

Welcome on the forms extension website. This extension is dedicated to the
Mozilla employees in France, so if it's not your case, you're likely not in the
right place.

Generally you'll want to install the [latest version](french_holiday_forms-latest.xpi),
but you'll also find previous versions should you be interested.

The [source code](https://github.com/julienw/forms-extension) is hosted on github, just like this website.

-------
{% assign myfiles = site.static_files | where_exp: "item", "item.github != true" %}
{% for file in myfiles %} | {{ file.modified_time | date: "%Y-%m-%d %H:%M" }} | [{{ file.name }}]({{ file.path | prepend: site.github.url }}) |
{% endfor %}
