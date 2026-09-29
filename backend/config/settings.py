"""
Django settings for the Multi-Vendor School Management SaaS platform.

Multi-tenancy model: shared database, shared schema.
Every tenant-scoped table carries a `school` FK. The current tenant is
resolved from the request subdomain by TenantMiddleware and exposed both as
`request.school` and via a thread-local (see apps.core.tenant).
"""
from pathlib import Path

import environ

BASE_DIR = Path(__file__).resolve().parent.parent

# Secure by default: DEBUG off, no fallback SECRET_KEY, no wildcard hosts.
# A misconfigured deploy should fail loudly, not silently ship debug mode.
env = environ.Env(
    DEBUG=(bool, False),
    ALLOWED_HOSTS=(list, []),
)
environ.Env.read_env(BASE_DIR / ".env")

# No insecure fallback — raises ImproperlyConfigured if SECRET_KEY is unset.
SECRET_KEY = env("SECRET_KEY")
DEBUG = env("DEBUG")
ALLOWED_HOSTS = env("ALLOWED_HOSTS")

# Base domain for subdomain tenant resolution, e.g. "platform.local".
# greenvalley.platform.local -> tenant slug "greenvalley".
PLATFORM_DOMAIN = env("PLATFORM_DOMAIN", default="platform.local")

# Wildcard trusted origins for the per-tenant subdomains (Django 4+ supports
# the leading-dot wildcard). Needed or POST/login across subdomains 403s.
CSRF_TRUSTED_ORIGINS = env(
    "CSRF_TRUSTED_ORIGINS",
    default=[f"https://*.{PLATFORM_DOMAIN}", f"https://{PLATFORM_DOMAIN}"],
)

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    # Third party
    "rest_framework",
    "corsheaders",
    "django_filters",
    # Local
    "apps.core",
    "apps.accounts",
    "apps.tenants",
    "apps.academics",
    "apps.teachers",
    "apps.students",
    "apps.rooms",
    "apps.fees",
    "apps.ratings",
    "apps.attendance",
    "apps.exams",
    "apps.notifications",
    "apps.library",
    "apps.transport",
    "apps.hostel",
    "apps.inventory",
    "apps.subscriptions",
    "apps.support",
    "apps.cms",
    # Kept installed for its management commands (create_superadmin, seed_demo).
    # Its template views are no longer routed — the frontend is now Next.js.
    "apps.web",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    # Serves collected static files with DEBUG=False (no web-server config
    # needed under Passenger/Gunicorn). Must sit right after SecurityMiddleware.
    "whitenoise.middleware.WhiteNoiseMiddleware",
    # CORS must precede CommonMiddleware and any response-producing middleware
    # so preflight (OPTIONS) requests from the Next.js origin get the headers.
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    # Tenant resolution must run after auth so we can cross-check membership.
    "apps.core.middleware.TenantMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"

# Production DB via DATABASE_URL. django-environ parses the scheme, so both
#   postgres://user:pass@host:5432/db   (VPS / managed Postgres)
#   mysql://user:pass@host:3306/db      (typical cPanel shared hosting)
# work — just install the matching driver (psycopg / mysqlclient).
# SQLite is dev/demo only: single-writer, unfit for concurrent multi-tenant
# writes (attendance, fees, admissions) -> "database is locked" under load.
if env("DATABASE_URL", default=""):
    DATABASES = {"default": env.db("DATABASE_URL")}
    # Reuse connections instead of opening one per request (cheap pooling).
    DATABASES["default"]["CONN_MAX_AGE"] = env.int("DB_CONN_MAX_AGE", default=60)
else:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": BASE_DIR / "db.sqlite3",
        }
    }

AUTH_USER_MODEL = "accounts.User"

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

LANGUAGE_CODE = "en-us"
TIME_ZONE = "Asia/Dhaka"
USE_I18N = True
USE_TZ = True

STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
STATICFILES_DIRS = [BASE_DIR / "static"]

MEDIA_URL = "media/"
MEDIA_ROOT = BASE_DIR / "media"

# Let Django serve /media/ itself (shared hosting fallback, see config/urls).
SERVE_MEDIA = env.bool("SERVE_MEDIA", default=False)

# WhiteNoise: compressed + hashed static filenames, served by the app.
# Media is NOT served here — point Apache/Nginx/CDN at MEDIA_ROOT for /media/.
STORAGES = {
    "default": {"BACKEND": "django.core.files.storage.FileSystemStorage"},
    "staticfiles": {
        "BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage",
    },
}

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# Celery (async: bulk SMS, PDF/report generation, CSV import, invoice runs)
CELERY_BROKER_URL = env("CELERY_BROKER_URL", default="redis://localhost:6379/0")
CELERY_RESULT_BACKEND = env("CELERY_RESULT_BACKEND", default="redis://localhost:6379/1")

REST_FRAMEWORK = {
    # JWT is the primary auth for the decoupled Next.js SPA. SessionAuth stays
    # on so the DRF browsable API still works when hit from a logged-in browser.
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework_simplejwt.authentication.JWTAuthentication",
        "rest_framework.authentication.SessionAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated",
    ],
    "DEFAULT_FILTER_BACKENDS": [
        "django_filters.rest_framework.DjangoFilterBackend",
        "rest_framework.filters.SearchFilter",
        "rest_framework.filters.OrderingFilter",
    ],
    "DEFAULT_PAGINATION_CLASS": "config.pagination.DynamicPageNumberPagination",
    "PAGE_SIZE": 25,
    "PAGE_SIZE_QUERY_PARAM": "page_size",
    "MAX_PAGE_SIZE": 1000,
}

from datetime import timedelta  # noqa: E402

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=env.int("JWT_ACCESS_MINUTES", default=60)),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=env.int("JWT_REFRESH_DAYS", default=7)),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": False,
    "AUTH_HEADER_TYPES": ("Bearer",),
}

# ---------------------------------------------------------------------------
# CORS — the Next.js frontend runs on a separate origin and calls /api/ with
# a Bearer token (not cookies), so credentials aren't required. Origins are
# env-driven; default covers local dev + the docker nginx host.
# ---------------------------------------------------------------------------
CORS_ALLOWED_ORIGINS = env.list(
    "CORS_ALLOWED_ORIGINS",
    default=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost",
    ],
)
CORS_ALLOW_CREDENTIALS = env.bool("CORS_ALLOW_CREDENTIALS", default=False)

# Allow the Super Admin "act as school" header through CORS preflight.
from corsheaders.defaults import default_headers  # noqa: E402

CORS_ALLOW_HEADERS = (*default_headers, "x-active-school")

LOGIN_URL = "login"
LOGIN_REDIRECT_URL = "dashboard"
LOGOUT_REDIRECT_URL = "home"

# ---------------------------------------------------------------------------
# Email — password resets / notifications fail silently without a backend.
# Console backend in dev; set EMAIL_* in prod for real SMTP delivery.
# ---------------------------------------------------------------------------
if DEBUG:
    EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"
else:
    EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"
    EMAIL_HOST = env("EMAIL_HOST", default="")
    EMAIL_PORT = env.int("EMAIL_PORT", default=587)
    EMAIL_HOST_USER = env("EMAIL_HOST_USER", default="")
    EMAIL_HOST_PASSWORD = env("EMAIL_HOST_PASSWORD", default="")
    EMAIL_USE_TLS = env.bool("EMAIL_USE_TLS", default=True)
    DEFAULT_FROM_EMAIL = env("DEFAULT_FROM_EMAIL", default="noreply@" + PLATFORM_DOMAIN)

# ---------------------------------------------------------------------------
# Security hardening — active only when DEBUG=False so local dev over HTTP
# still works. Assumes TLS terminates at a proxy (Nginx/Cloudflare/cPanel).
# ---------------------------------------------------------------------------
if not DEBUG:
    # Default False: TLS terminates at nginx and the app speaks plain HTTP to
    # gunicorn inside the docker network. Flip on only when the app is exposed
    # directly over HTTPS. Leaving it True would infinite-redirect behind nginx.
    SECURE_SSL_REDIRECT = env.bool("SECURE_SSL_REDIRECT", default=False)
    SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_HSTS_SECONDS = env.int("SECURE_HSTS_SECONDS", default=31536000)
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True
    SECURE_CONTENT_TYPE_NOSNIFF = True
    X_FRAME_OPTIONS = "DENY"

# ---------------------------------------------------------------------------
# Logging — without this you're blind on a host with no shell access.
# ---------------------------------------------------------------------------
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "verbose": {
            "format": "{asctime} [{levelname}] {name}: {message}",
            "style": "{",
        },
    },
    "handlers": {
        "console": {"class": "logging.StreamHandler", "formatter": "verbose"},
    },
    "root": {"handlers": ["console"], "level": env("LOG_LEVEL", default="INFO")},
    "loggers": {
        "django.request": {
            "handlers": ["console"],
            "level": "ERROR",
            "propagate": False,
        },
    },
}
