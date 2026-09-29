from django import template

register = template.Library()

INPUT = (
    "block w-full rounded-lg border-slate-300 shadow-sm text-sm "
    "focus:border-brand-500 focus:ring-brand-500"
)


@register.simple_tag(takes_context=True)
def query_without_page(context):
    """Current querystring minus `page`, for building pagination links that keep
    active search/filter params."""
    request = context.get("request")
    if request is None:
        return ""
    params = request.GET.copy()
    params.pop("page", None)
    return params.urlencode()


@register.filter
def dict_get(d, key):
    """Look up a dict value by a variable key inside a template."""
    if hasattr(d, "get"):
        return d.get(key)
    return None


@register.filter
def add_class(field, css):
    return field.as_widget(attrs={"class": css})


@register.filter
def field_input(field):
    """Apply the shared Bootstrap-style input classes to a bound form field.

    Emits `.form-control` / `.form-select` / `.form-check-input` (defined in
    partials/_form_styles.html) so every form across the app looks consistent.
    """
    name = field.field.widget.__class__.__name__.lower()
    if "checkbox" in name:
        cls = "form-check-input"
    elif "select" in name:
        cls = "form-select"
    else:
        cls = "form-control"
    existing = field.field.widget.attrs.get("class", "")
    return field.as_widget(attrs={"class": (existing + " " + cls).strip()})
