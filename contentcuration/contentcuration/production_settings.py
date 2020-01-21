from __future__ import absolute_import

from . import settings as base_settings
from .settings import *  # noqa
from contentcuration.utils.secretmanagement import get_secret
# production_settings.py -- production studio settings override
#
# noinspection PyUnresolvedReferences

MEDIA_ROOT = base_settings.STORAGE_ROOT

SITE_ID = int(get_secret("SITE_ID") or "1")

DEFAULT_FILE_STORAGE = 'contentcuration.utils.gcs_storage.GoogleCloudStorage'
SESSION_ENGINE = "django.contrib.sessions.backends.db"

# email settings
EMAIL_BACKEND = 'postmark.django_backend.EmailBackend'
POSTMARK_API_KEY = get_secret("EMAIL_CREDENTIALS_POSTMARK_API_KEY")

LANGUAGE_CODE = get_secret("LANGUAGE_CODE") or "en"

# Google drive settings
GOOGLE_STORAGE_REQUEST_SHEET = "1uC1nsJPx_5g6pQT6ay0qciUVya0zUFJ8wIwbsTEh60Y"
GOOGLE_AUTH_JSON = get_secret("GOOGLE_DRIVE_AUTH_JSON") or base_settings.GOOGLE_AUTH_JSON

# Activate django-prometheus
INSTALLED_APPS = INSTALLED_APPS + (
    "django_prometheus",
)

MIDDLEWARE_CLASSES = (
    ("django_prometheus.middleware.PrometheusBeforeMiddleware",) +
    MIDDLEWARE_CLASSES +
    ("django_prometheus.middleware.PrometheusAfterMiddleware",)
)

CACHES["default"]["BACKEND"] = "django_prometheus.cache.backends.redis.RedisCache"
if SITE_READ_ONLY:
    CACHES['default']['BACKEND'] = "django_prometheus.cache.backends.locmem.LocMemCache"

DATABASES["default"]["ENGINE"] = "django_prometheus.db.backends.postgresql"
