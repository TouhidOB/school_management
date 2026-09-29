"""Percentage -> letter grade / grade point (Bangladesh secondary scale)."""

GRADE_BANDS = [
    (80, "A+", 5.0),
    (70, "A", 4.0),
    (60, "A-", 3.5),
    (50, "B", 3.0),
    (40, "C", 2.0),
    (33, "D", 1.0),
]


def grade_for(percentage):
    """Return (letter, grade_point) for a 0-100 percentage."""
    for cutoff, letter, point in GRADE_BANDS:
        if percentage >= cutoff:
            return letter, point
    return "F", 0.0
