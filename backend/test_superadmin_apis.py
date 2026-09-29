import os
import django
import sys
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.test import Client
from django.contrib.auth import get_user_model
from apps.cms.models import FAQCategory
from apps.support.models import KnowledgeBaseCategory
from apps.tenants.models import School

User = get_user_model()
client = Client(SERVER_NAME='localhost')

# Ensure user exists
user = User.objects.filter(is_superuser=True).first()
if not user:
    print("No superuser found!")
    sys.exit(1)

client.force_login(user)

def check_endpoint(name, method, url, data=None):
    print(f"\n--- Testing {name} ---")
    if method == "POST":
        response = client.post(url, data, content_type='application/json')
    elif method == "PATCH":
        response = client.patch(url, data, content_type='application/json')
    else:
        response = client.get(url)
    
    status = response.status_code
    print(f"{method} {url} -> {status}")
    
    if status >= 400:
        print(f"ERROR: {response.content.decode()}")
        return False
    return True

def get_count(url):
    response = client.get(url)
    if response.status_code == 200:
        data = response.json()
        if "results" in data:
            return len(data["results"])
        return len(data)
    print(f"Failed to fetch {url}: {response.status_code} {response.content}")
    return -1

# Create Plan
plan_data = {
    "name": "Enterprise Test Plan 2",
    "slug": "enterprise-test-plan-2",
    "tier": "enterprise",
    "price_monthly": "199.99",
    "price_yearly": "1999.99",
    "max_students": 5000,
    "max_teachers": 500,
    "max_storage_mb": 50000,
    "features": {"api_access": True},
    "is_active": True
}
check_endpoint("Plans", "POST", "/api/platform/billing/plans/", plan_data)

# Create Tenant (School)
school_data = {
  "name": "Global Excellence Academy",
  "slug": "global-excellence",
  "school_type": "secondary",
  "admin_email": "admin@globalexcellence.com",
  "phone": "9876543210",
  "country": "UK",
  "timezone": "Europe/London",
  "currency": "GBP",
  "admin_name": "James Smith",
  "admin_password": "Password123!",
  "default_grading_system": "",
  "school_working_days": ""
}
check_endpoint("Schools", "POST", "/api/platform/schools/", school_data)

# Settings
check_endpoint("General Settings", "PATCH", "/api/core/settings/general/", {"platform_name": "Test Platform"})
check_endpoint("Email Settings", "PATCH", "/api/core/settings/email/", {"smtp_host": "smtp.mailtrap.io"})
check_endpoint("SMS Settings", "PATCH", "/api/core/settings/sms/", {"provider": "twilio", "twilio_account_sid": "test_sid"})

# CMS Testimonials
testimonial_data = {
    "author": "John Doe",
    "role": "Principal",
    "school": "Global Excellence Academy",
    "content": "This platform is amazing!",
    "rating": 5,
    "is_published": True
}
check_endpoint("Testimonials", "POST", "/api/platform/cms/testimonials/", testimonial_data)

# Pre-create category for FAQ
faq_cat, _ = FAQCategory.objects.get_or_create(name="General Questions", defaults={"order": 1})

# CMS FAQs
faq_data = {
    "question": "How do I reset my password?",
    "answer": "Click on 'Forgot Password' on the login screen.",
    "category": faq_cat.id,
    "order": 1,
    "is_active": True
}
check_endpoint("FAQs", "POST", "/api/platform/cms/faqs/", faq_data)

# Pre-create category for KB
kb_cat, _ = KnowledgeBaseCategory.objects.get_or_create(name="Getting Started", slug="getting-started")

# KB Articles
kb_data = {
    "title": "Getting Started Guide",
    "slug": "getting-started-guide",
    "content": "Here is how you start using the platform...",
    "category": kb_cat.id,
    "status": "published"
}
check_endpoint("KB Articles", "POST", "/api/platform/support/kb-articles/", kb_data)

# Announcements
announcement_data = {
    "title": "System Maintenance",
    "body": "We will be down for maintenance this weekend.",
    "target_roles": "ALL",
    "is_published": True
}
check_endpoint("Announcements", "POST", "/api/platform/communication/announcements/", announcement_data)

# Templates
template_data = {
    "name": "Welcome Email",
    "channel": "email",
    "subject": "Welcome to our platform!",
    "body": "Hello {{name}}, welcome!"
}
check_endpoint("Message Templates", "POST", "/api/platform/communication/templates/", template_data)

# Dashboard Stats Check
print("\n--- Dashboard Stats ---")
dashboard_response = client.get("/api/platform/stats/")
if dashboard_response.status_code == 200:
    print("Dashboard loaded successfully! Keys:", dashboard_response.json().keys())
else:
    print("Dashboard error:", dashboard_response.status_code, dashboard_response.content)

print("\n--- Summary of GET lists ---")
print("Plans count:", get_count("/api/platform/billing/plans/"))
print("Schools count:", get_count("/api/platform/schools/"))
print("Testimonials count:", get_count("/api/platform/cms/testimonials/"))
print("FAQs count:", get_count("/api/platform/cms/faqs/"))
print("KB count:", get_count("/api/platform/support/kb-articles/"))
print("Announcements count:", get_count("/api/platform/communication/announcements/"))
print("Templates count:", get_count("/api/platform/communication/templates/"))
print("Support Tickets count:", get_count("/api/platform/support/tickets/"))

