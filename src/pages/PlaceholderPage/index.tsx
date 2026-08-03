import { BarChart3, Boxes, Clock3, Wrench } from 'lucide-react'
import GlassCard from '@/components/common/GlassCard/GlassCard'
import SectionTitle from '@/components/common/SectionTitle/SectionTitle'
import './index.less'

interface PlaceholderPageProps {
  description?: string
  eyebrow?: string
  title: string
}

export default function PlaceholderPage({ description, eyebrow = 'Enterprise BI Module', title }: PlaceholderPageProps) {
  return (
    <div className="placeholder-page">
      <section className="placeholder-page__hero">
        <div className="hero-copy">
          <span>{eyebrow}</span>
          <h1>{title}</h1>
          <p>
            {description ??
              'Area konten ini belum diimplementasikan, tetapi route dan active state sidebar sudah berdiri sendiri.'}
          </p>
        </div>
        <div className="placeholder-page__illustration" aria-hidden="true">
          <span className="placeholder-page__beam" />
          <div className="placeholder-page__chart">
            <i />
            <i />
            <i />
            <i />
          </div>
          <div className="placeholder-page__nodes">
            <span />
            <span />
            <span />
          </div>
        </div>
      </section>

      <div className="placeholder-page__grid">
        <GlassCard interactive={false} className="placeholder-page__card">
          <SectionTitle icon={Wrench} title="Fondasi Siap" subtitle="Route dan navigasi sudah tersedia" />
          <p>
            Halaman ini disediakan sebagai fondasi modul analytics enterprise. Implementasi fitur bisnisnya bisa
            ditambahkan tanpa mengganggu halaman yang sudah berjalan.
          </p>
        </GlassCard>

        <GlassCard interactive={false} className="placeholder-page__card">
          <SectionTitle icon={BarChart3} title="Data Layer Tetap" subtitle="Tidak ada perubahan pada cube" />
          <p>Module ini memakai struktur navigasi baru, sementara sumber data dan selector halaman existing tetap aman.</p>
        </GlassCard>

        <GlassCard interactive={false} className="placeholder-page__card">
          <SectionTitle icon={Boxes} title="BI Workspace" subtitle="Siap untuk drilldown lanjutan" />
          <p>Placeholder menjaga hierarki menu, active state tunggal, dan page transition sebelum fitur final dibuat.</p>
        </GlassCard>

        <GlassCard interactive={false} className="placeholder-page__card">
          <SectionTitle icon={Clock3} title="Roadmap" subtitle="Belum menjalankan model prediktif" />
          <p>Khusus area predictive analytics, halaman ini hanya menyiapkan fondasi dan belum membuat model AI.</p>
        </GlassCard>
      </div>
    </div>
  )
}
