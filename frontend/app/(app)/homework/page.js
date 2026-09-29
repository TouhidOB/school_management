"use client";

import InlineCrud from "@/components/InlineCrud";
import Link from "next/link";
import { Button } from "@mui/material";

export default function HomeworkPage() {
  return (
    <InlineCrud
      title="Homework & Assignments"
      endpoint="/assignments/"
      help="Manage homework tasks and assignments across all your classrooms."
      columns={[
        { key: "title", label: "Title" },
        { 
          key: "room", 
          label: "Classroom", 
          render: (r) => <Link href={`/rooms/${r.room}`}>{`Room #${r.room}`}</Link> 
        },
        { 
          key: "due_datetime", 
          label: "Due Date", 
          render: (r) => new Date(r.due_datetime).toLocaleString() 
        },
        { key: "total_marks", label: "Marks" },
        { 
          key: "is_published", 
          label: "Status", 
          render: (r) => (r.is_published ? "Published" : "Draft") 
        },
        {
          key: "id",
          label: "Submissions",
          render: (r) => (
            <Button 
              component={Link} 
              href={`/homework/submissions?assignment=${r.id}`}
              size="small" 
              variant="outlined" 
              color="primary"
            >
              View Submissions
            </Button>
          )
        }
      ]}
      fields={[
        { key: "title", label: "Assignment Title", required: true },
        { 
          key: "room", 
          label: "Classroom", 
          type: "select", 
          optionsEndpoint: "/rooms/?page_size=200", 
          optionLabel: "name", 
          required: true 
        },
        { key: "instructions", label: "Instructions / Description", type: "textarea" },
        { key: "due_datetime", label: "Due Date & Time", type: "datetime-local", required: true },
        { key: "total_marks", label: "Total Marks", type: "number", required: true },
        { key: "is_published", label: "Published?", type: "checkbox" },
      ]}
    />
  );
}
