"use client";

import InlineCrud from "@/components/InlineCrud";
import { Box, Typography } from "@mui/material";

export default function LibraryBooksPage() {
  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <InlineCrud
          title="Book Categories"
          endpoint="/library/categories/"
          columns={[
            { key: "name", label: "Category Name" },
            { key: "description", label: "Description" }
          ]}
          fields={[
            { key: "name", label: "Category Name", required: true },
            { key: "description", label: "Description", type: "textarea" }
          ]}
        />
      </Box>

      <InlineCrud
        title="Library Inventory"
        endpoint="/library/books/"
        columns={[
          { key: "title", label: "Title" },
          { key: "author", label: "Author" },
          { key: "category_name", label: "Category" },
          { key: "total_quantity", label: "Total Qty" },
          { key: "available_quantity", label: "Available" },
          { key: "shelf_number", label: "Shelf" },
        ]}
        fields={[
          { key: "title", label: "Book Title", required: true },
          { key: "author", label: "Author" },
          { key: "isbn", label: "ISBN" },
          { key: "publisher", label: "Publisher" },
          { key: "category", label: "Category", type: "select", optionsEndpoint: "/library/categories/" },
          { key: "total_quantity", label: "Total Copies", type: "number", required: true },
          { key: "shelf_number", label: "Shelf Location" },
        ]}
      />
    </Box>
  );
}
