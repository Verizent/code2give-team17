import { Navigate, Route, Routes } from 'react-router-dom'
import { HomePage } from '@/pages/HomePage'
import { CommunityPage } from '@/pages/CommunityPage'
import { ComingSoonPage } from '@/pages/ComingSoonPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/community" element={<CommunityPage />} />
      <Route
        path="/volunteer"
        element={
          <ComingSoonPage
            title="Volunteer"
            body="Bring your time and skills to an activity that fits you. Full volunteer matching is coming next."
          />
        }
      />
      <Route
        path="/give"
        element={
          <ComingSoonPage
            title="Give with meaning"
            body="Your gift funds the real activities you can see happening on our home page. Donations of HK$100 or more are tax-deductible under Section 88."
          />
        }
      />
      <Route
        path="/support"
        element={
          <ComingSoonPage
            title="Get support"
            body="Support pathways for families and members will live here."
          />
        }
      />
      <Route
        path="/portal"
        element={
          <ComingSoonPage
            title="Member portal"
            body="The member portal is coming soon."
          />
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
