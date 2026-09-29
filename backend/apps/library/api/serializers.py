from rest_framework import serializers
from apps.library.models import BookCategory, Book, BookIssue

class BookCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = BookCategory
        fields = ["id", "name", "description"]


class BookSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source="category.name", read_only=True)

    class Meta:
        model = Book
        fields = [
            "id", "title", "author", "isbn", "publisher", 
            "category", "category_name", "total_quantity", 
            "available_quantity", "shelf_number"
        ]
        read_only_fields = ["available_quantity"]

    def create(self, validated_data):
        validated_data["available_quantity"] = validated_data.get("total_quantity", 1)
        return super().create(validated_data)


class BookIssueSerializer(serializers.ModelSerializer):
    book_title = serializers.CharField(source="book.title", read_only=True)
    student_name = serializers.CharField(source="student.full_name", read_only=True)

    class Meta:
        model = BookIssue
        fields = [
            "id", "book", "book_title", "student", "student_name",
            "issue_date", "due_date", "return_date", "status", "fine_amount"
        ]
        read_only_fields = ["return_date", "status", "fine_amount"]

    def validate(self, attrs):
        book = attrs.get("book")
        # Ensure we can't issue a book if none are available
        if self.instance is None and book and book.available_quantity <= 0:
            raise serializers.ValidationError({"book": "No available copies of this book."})
        return attrs
