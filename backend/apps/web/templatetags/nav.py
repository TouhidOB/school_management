from django import template
from django.urls import NoReverseMatch, reverse
from django.utils.safestring import mark_safe

register = template.Library()

# Small stroke-icon set keyed by name; `nav_group`/`nav_item` pick one via `icon`.
_ICONS = {
    "dashboard": "M3 12l9-9 9 9M5 10v10a1 1 0 001 1h4v-6h4v6h4a1 1 0 001-1V10",
    "people": "M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-1.13a4 4 0 10-4-4 4 4 0 004 4z",
    "academics": "M12 14l9-5-9-5-9 5 9 5zm0 0v6m-6-3.5V17a6 3 0 0012 0v-2.5",
    "attendance": "M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11",
    "exams": "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h7l5 5v11a2 2 0 01-2 2z",
    "finance": "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8V6m0 8v2m0-10a9 9 0 100 18 9 9 0 000-18z",
    "insights": "M3 3v18h18M18 17V9M13 17V5M8 17v-3",
    "system": "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065zM15 12a3 3 0 11-6 0 3 3 0 016 0z",
    "platform": "M3 21h18M5 21V7l7-4 7 4v14M9 21v-4h6v4",
    "teaching": "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253",
    "student": "M12 14l9-5-9-5-9 5 9 5zm0 0v6",
    "child": "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
}


def _icon_svg(name):
    path = _ICONS.get(name, _ICONS["dashboard"])
    return (
        '<svg class="h-4 w-4 shrink-0" fill="none" stroke="currentColor" '
        "stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" "
        f'viewBox="0 0 24 24"><path d="{path}"/></svg>'
    )


def _resolve(url_name):
    try:
        return reverse(url_name)
    except NoReverseMatch:
        return "#"


def _is_active(request, url):
    return bool(request and url not in ("#", "/") and request.path.startswith(url))


@register.simple_tag(takes_context=True)
def nav_item(context, url_name, label, icon=None):
    """Render one top-level sidebar link, highlighted on the current path."""
    url = _resolve(url_name)
    active = _is_active(context.get("request"), url)
    base = "flex items-center gap-2 rounded-lg px-3 py-2 transition"
    cls = (
        f"{base} bg-white/10 text-white font-medium"
        if active
        else f"{base} text-brand-100/80 hover:bg-white/5 hover:text-white"
    )
    glyph = _icon_svg(icon) if icon else ""
    return mark_safe(f'<a href="{url}" class="{cls}">{glyph}<span>{label}</span></a>')


@register.simple_tag(takes_context=True)
def nav_group(context, label, icon, *items):
    """Render a collapsible parent with child links.

    Each item is "url_name|Label". The group auto-expands when it holds the
    active page, and the parent button stays highlighted while collapsed so the
    current location is always visible.
    """
    request = context.get("request")
    rows, group_active = [], False
    for item in items:
        name, _, lbl = item.partition("|")
        url = _resolve(name)
        active = _is_active(request, url)
        group_active = group_active or active
        link_base = "flex items-center gap-2 rounded-lg px-3 py-2 transition"
        link_cls = (
            f"{link_base} bg-white/10 text-white font-medium"
            if active
            else f"{link_base} text-brand-100/70 hover:bg-white/5 hover:text-white"
        )
        rows.append(f'<a href="{url}" class="{link_cls}">{lbl}</a>')

    btn_base = "w-full flex items-center gap-2 rounded-lg px-3 py-2 transition"
    btn_cls = (
        f"{btn_base} text-white font-medium"
        if group_active
        else f"{btn_base} text-brand-100/80 hover:bg-white/5 hover:text-white"
    )
    children = "".join(rows)
    return mark_safe(
        f'<div x-data="{{ open: {str(group_active).lower()} }}">'
        f'<button type="button" @click="open=!open" class="{btn_cls}">'
        f"{_icon_svg(icon)}"
        f'<span class="flex-1 text-left">{label}</span>'
        '<svg class="h-4 w-4 shrink-0 transition-transform" '
        ":class=\"open && 'rotate-90'\" "
        'fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">'
        '<path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>'
        "</svg></button>"
        '<div x-show="open" x-transition '
        'class="mt-1 ml-4 space-y-1 border-l border-white/10 pl-3">'
        f"{children}</div></div>"
    )
