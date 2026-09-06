import { TOPICS } from "@/lib/exam/topics";
import { StudyTopicClient } from "./StudyTopicClient";

/**
 * 정적 배포에서는 동적 경로를 미리 만들어 두어야 한다.
 * 주제는 고정이므로 전부 나열한다.
 */
export function generateStaticParams() {
  return TOPICS.map((t) => ({ topicId: t.id }));
}

export default async function StudyTopicPage({
  params,
}: {
  params: Promise<{ topicId: string }>;
}) {
  const { topicId } = await params;
  return <StudyTopicClient topicId={topicId} />;
}
