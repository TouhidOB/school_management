from django.contrib import messages
from django.shortcuts import get_object_or_404, redirect, render

from apps.tenants.models import ContactMessage, School

# Flat, manual pricing (founder decision): ৳10 per student, paid offline.
PRICE_PER_STUDENT_BDT = 10


def home(request):
    return render(request, "public/home.html",
                  {"price": PRICE_PER_STUDENT_BDT})


def features(request):
    return render(request, "public/features.html")


def leaderboard(request):
    """Platform-wide top-rated teachers across all schools (PRD 5.4).

    Only teachers with the public threshold of ratings (5+) appear, ranked by
    average overall score.
    """
    from django.db.models import Avg, Count

    from apps.ratings.models import TeacherRatingAggregate
    from apps.teachers.models import TeacherProfile

    min_ratings = TeacherRatingAggregate.MIN_RATINGS_TO_PUBLISH
    teachers = (
        TeacherProfile.all_objects
        .select_related("user", "school", "designation")
        .annotate(avg=Avg("ratings__score_overall"), n=Count("ratings"))
        .filter(n__gte=min_ratings)
        .order_by("-avg", "-n")[:50]
    )
    return render(request, "public/leaderboard.html",
                  {"teachers": teachers, "min_ratings": min_ratings})


def school_leaderboard(request):
    """Platform-wide top schools, rated by the average of their teacher ratings."""
    from django.db.models import Avg, Count

    from apps.ratings.models import TeacherRatingAggregate
    from apps.tenants.models import School

    min_ratings = TeacherRatingAggregate.MIN_RATINGS_TO_PUBLISH
    schools = (
        School.objects
        .exclude(status__in=[School.STATUS_SUSPENDED, School.STATUS_CANCELLED])
        .annotate(avg=Avg("teacherratings__score_overall"),
                  n=Count("teacherratings"))
        .filter(n__gte=min_ratings)
        .order_by("-avg", "-n")[:50]
    )
    return render(request, "public/school_leaderboard.html",
                  {"schools": schools, "min_ratings": min_ratings})


def pricing(request):
    return render(request, "public/pricing.html",
                  {"price": PRICE_PER_STUDENT_BDT})


def admissions_directory(request):
    """Public list of schools currently accepting online admissions."""
    q = request.GET.get("q", "").strip()
    schools = School.objects.filter(admissions_open=True).exclude(
        status__in=[School.STATUS_SUSPENDED, School.STATUS_CANCELLED])
    if q:
        from django.db.models import Q
        schools = schools.filter(Q(name__icontains=q) | Q(address__icontains=q))
    return render(request, "public/admissions.html",
                  {"schools": schools.order_by("name"), "q": q})


def admission_apply(request, slug):
    """Public admission page for one school.

    Online: the school's Google Form when configured, else the built-in form.
    Offline: a downloadable PDF admission form (uploaded or auto-generated).
    """
    from django.utils.crypto import get_random_string

    from apps.students.models import AdmissionApplication
    from apps.web.forms import AdmissionApplicationForm
    school = get_object_or_404(School, slug=slug, admissions_open=True)
    if request.method == "POST":
        form = AdmissionApplicationForm(request.POST, request.FILES, school=school)
        if form.is_valid():
            app = form.save(commit=False)
            app.school = school
            app.status = "pending"
            seq = AdmissionApplication.all_objects.filter(school=school).count() + 1
            from datetime import date
            app.tracking_code = f"{school.slug[:4].upper()}-{date.today():%Y}-{seq:04d}"
            app.track_token = get_random_string(24)
            app.save()
            return render(request, "public/admission_done.html",
                          {"school": school, "app": app})
    else:
        form = AdmissionApplicationForm(school=school)
    return render(request, "public/admission_apply.html", {
        "school": school, "form": form,
        "google_form_url": school.admission_google_form_url,
        "pdf_mode": school.admission_mode == School.ADMISSION_PDF})


def admission_form_pdf(request, slug):
    """Blank admission form PDF for offline applicants.

    Serves the school's uploaded form when present, else generates one with
    all the fields the online form collects (parents' info, documents list).
    """
    from django.http import FileResponse, HttpResponse

    school = get_object_or_404(School, slug=slug)
    if school.admission_form_pdf:
        return FileResponse(school.admission_form_pdf.open("rb"),
                            content_type="application/pdf",
                            as_attachment=True,
                            filename=f"{school.slug}-admission-form.pdf")
    from apps.students.admission_pdf import build_admission_form_pdf
    pdf = build_admission_form_pdf(school)
    resp = HttpResponse(pdf, content_type="application/pdf")
    resp["Content-Disposition"] = (
        f'attachment; filename="{school.slug}-admission-form.pdf"')
    return resp


def register_school(request):
    """Public school signup. The tenant starts Pending until the Super Admin
    approves it; the admin can log in but only sees the waiting screen."""
    from apps.web.forms import SchoolRegistrationForm
    if request.method == "POST":
        form = SchoolRegistrationForm(request.POST)
        if form.is_valid():
            school = form.save()
            return render(request, "public/register_done.html",
                          {"school": school})
    else:
        form = SchoolRegistrationForm()
    return render(request, "public/register.html", {"form": form})


def _get_application(token):
    from apps.students.models import AdmissionApplication
    return get_object_or_404(
        AdmissionApplication.all_objects.select_related("school"),
        track_token=token) if token else None


def admission_track(request, token):
    """Public status page for an application (via its unguessable token)."""
    app = _get_application(token)
    return render(request, "public/admission_track.html",
                  {"app": app, "school": app.school})


def admission_admit_card(request, token):
    """Printable admit card / admission document for an applicant."""
    app = _get_application(token)
    return render(request, "public/admit_card.html",
                  {"app": app, "school": app.school})


def contact(request):
    """Store the enquiry as a lead the Super Admin actions from their dashboard."""
    if request.method == "POST":
        ContactMessage.objects.create(
            name=request.POST.get("name", "").strip(),
            school_name=request.POST.get("school", "").strip(),
            email=request.POST.get("email", "").strip(),
            phone=request.POST.get("phone", "").strip(),
            topic=request.POST.get("topic", "").strip(),
            message=request.POST.get("message", "").strip(),
        )
        messages.success(
            request, "Thanks — we've received your message and will reach out soon.")
        return redirect("contact")
    return render(request, "public/contact.html",
                  {"price": PRICE_PER_STUDENT_BDT})
