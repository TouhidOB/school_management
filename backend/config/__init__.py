# Django 5.0+ compatibility shim for older django-filter ChoiceField._set_choices
import django.forms.fields
if not hasattr(django.forms.fields.ChoiceField, "_set_choices"):
    def _set_choices(self, value):
        self._choices = self.widget.choices = value
    django.forms.fields.ChoiceField._set_choices = _set_choices

from .celery import app as celery_app

__all__ = ("celery_app",)
