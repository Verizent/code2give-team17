import { ComingSoon } from '@/components/coming-soon'

export function ComingSoonPage({
  title,
  body,
}: {
  title: string
  body: string
}) {
  return <ComingSoon title={title} body={body} />
}
