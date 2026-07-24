import { notFound } from "next/navigation";

import { fetchAcademicDetail, fetchAcademicWorks } from "../../../lib/api";
import { AcademicDetailClient } from "./page-client";


export default async function AcademicDetailPage({
  params,
}: {
  params: Promise<{ academicId: string }>;
}) {
  const { academicId } = await params;
  const [academic, works] = await Promise.all([
    fetchAcademicDetail(academicId).catch(() => null),
    fetchAcademicWorks(academicId).catch(() => []),
  ]);

  if (!academic) {
    notFound();
  }

  return <AcademicDetailClient academic={academic} works={works} />;
}
