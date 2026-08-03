import Badge from '@/components/common/Badge/Badge'
import GlassCard from '@/components/common/GlassCard/GlassCard'
import ProgressBar from '@/components/common/ProgressBar/ProgressBar'
import type { RecommendationRow } from '@/data/types'
import './RecommendationCard.less'

type RecommendationCardProps = RecommendationRow

export default function RecommendationCard({
  index,
  title,
  description,
  priority,
  impact,
  effort,
  owner,
  due,
  progress,
  tone,
}: RecommendationCardProps) {
  return (
    <GlassCard className={`action-card action-card--${tone}`}>
      <header className="action-card__head">
        <span className="action-card__number">{index}</span>
        <div className="action-card__heading">
          <h3>{title}</h3>
          <Badge tone={tone}>Prioritas {priority}</Badge>
        </div>
      </header>

      <p className="action-card__description">{description}</p>

      <dl className="action-card__meta">
        <div>
          <dt>Dampak</dt>
          <dd>{impact}</dd>
        </div>
        <div>
          <dt>Upaya</dt>
          <dd>{effort}</dd>
        </div>
        <div>
          <dt>Owner</dt>
          <dd>{owner}</dd>
        </div>
        <div>
          <dt>Target Selesai</dt>
          <dd>{due}</dd>
        </div>
      </dl>

      <div className="action-card__progress">
        <span>Progress</span>
        <ProgressBar value={progress} tone={tone} size="sm" label={`Progres ${title}: ${progress}%`} />
        <strong>{progress}%</strong>
      </div>
    </GlassCard>
  )
}
