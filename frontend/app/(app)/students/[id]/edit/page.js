"use client";

import { useParams } from "next/navigation";
import StudentForm from "@/components/StudentForm";

export default function EditStudentPage() {
  const { id } = useParams();
  return <StudentForm id={id} />;
}
