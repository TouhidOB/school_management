"""Reusable tenant-scoped, role-gated CRUD base views."""
from django.contrib import messages
from django.db.models import Q
from django.urls import reverse, reverse_lazy
from django.views.generic import CreateView, DeleteView, ListView, UpdateView

from apps.web.mixins import (SchoolAdminMixin, TenantFormMixin,
                             TenantQuerysetMixin, current_school)


class BaseList(SchoolAdminMixin, TenantQuerysetMixin, ListView):
    template_name = "generic/list.html"
    paginate_by = 25
    header = ""
    subheader = ""
    headers: list[str] = []
    create_url_name: str | None = None
    edit_url_name: str | None = None
    delete_url_name: str | None = None
    detail_url_name: str | None = None
    empty_text = "Nothing here yet."

    # Search/filter config -------------------------------------------------
    search_fields: list[str] = []          # ORM lookups searched by `?q=`
    search_placeholder = "Search…"
    # Each filter: {"param", "label", "lookup", "choices": [(value, label), ...]}
    # `choices` may be a callable(self) -> list[(value, label)] for FK options.
    filters: list[dict] = []

    def get_queryset(self):
        qs = super().get_queryset()
        q = self.request.GET.get("q", "").strip()
        if q and self.search_fields:
            cond = Q()
            for field in self.search_fields:
                cond |= Q(**{f"{field}__icontains": q})
            qs = qs.filter(cond)
        for f in self.filters:
            val = self.request.GET.get(f["param"], "").strip()
            if val:
                qs = qs.filter(**{f["lookup"]: val})
        return qs

    def _resolved_filters(self):
        out = []
        for f in self.filters:
            choices = f["choices"](self) if callable(f["choices"]) else f["choices"]
            selected = self.request.GET.get(f["param"], "")
            out.append({
                "param": f["param"], "label": f["label"], "selected": selected,
                "options": [{"value": str(v), "label": l,
                             "selected": str(v) == selected} for v, l in choices],
            })
        return out

    def get_context_data(self, **kwargs):
        ctx = super().get_context_data(**kwargs)
        rows = []
        for obj in ctx["object_list"]:
            rows.append({
                "cells": self.cells(obj),
                "url": reverse(self.detail_url_name, args=[obj.pk]) if self.detail_url_name else None,
                "edit_url": reverse(self.edit_url_name, args=[obj.pk]) if self.edit_url_name else None,
                "delete_url": reverse(self.delete_url_name, args=[obj.pk]) if self.delete_url_name else None,
            })
        # Preserve search/filter params across pagination links.
        params = self.request.GET.copy()
        params.pop("page", None)
        ctx.update({
            "header": self.header,
            "subheader": self.subheader,
            "headers": self.headers,
            "rows": rows,
            "empty_text": self.empty_text,
            "action_url": reverse(self.create_url_name) if self.create_url_name else None,
            "action_label": "New",
            "has_search": bool(self.search_fields),
            "search_placeholder": self.search_placeholder,
            "search_query": self.request.GET.get("q", ""),
            "list_filters": self._resolved_filters(),
            "querystring": params.urlencode(),
        })
        return ctx

    def cells(self, obj) -> list:
        return [str(obj)]


class BaseCreate(SchoolAdminMixin, TenantFormMixin, CreateView):
    template_name = "generic/form.html"
    header = "Create"
    list_url_name: str | None = None

    def get_form_kwargs(self):
        kwargs = super().get_form_kwargs()
        kwargs["school"] = current_school(self.request)
        return kwargs

    def get_initial(self):
        # Allow ?field=value prefilling (e.g. enroll a specific device id).
        initial = super().get_initial()
        form_fields = getattr(getattr(self, "form_class", None), "base_fields", {})
        for key, value in self.request.GET.items():
            if key in form_fields:
                initial[key] = value
        return initial

    def get_success_url(self):
        return reverse(self.list_url_name)

    def get_context_data(self, **kwargs):
        ctx = super().get_context_data(**kwargs)
        ctx["header"] = self.header
        ctx["cancel_url"] = reverse(self.list_url_name)
        return ctx


class BaseUpdate(BaseCreate, UpdateView):
    header = "Edit"


class BaseDelete(SchoolAdminMixin, TenantQuerysetMixin, DeleteView):
    template_name = "generic/confirm_delete.html"
    list_url_name: str | None = None

    def get_success_url(self):
        messages.success(self.request, "Deleted.")
        return reverse(self.list_url_name)

    def get_context_data(self, **kwargs):
        ctx = super().get_context_data(**kwargs)
        ctx["cancel_url"] = reverse(self.list_url_name)
        return ctx
