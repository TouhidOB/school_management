"""Phusion Passenger entry point (cPanel "Setup Python App").

Passenger looks for `passenger_wsgi.py` at the app root and expects a module
level `application` callable. We just re-export the real Django WSGI app.
"""
import os

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

from config.wsgi import application  # noqa: E402  (must follow env setup)
