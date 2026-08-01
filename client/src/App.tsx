import { Navigate, Route, Routes } from 'react-router-dom'
import { HomePage } from '@/pages/HomePage'
import { CommunityPage } from '@/pages/CommunityPage'
import { MyImpactPage } from '@/pages/MyImpactPage'
import { LoginPage } from '@/pages/LoginPage'
import { AdminPage } from '@/pages/AdminPage'
import { VolunteerPage } from '@/pages/VolunteerPage'
import { VolunteerDetailPage } from '@/pages/VolunteerDetailPage'
import { VolunteerSuccessPage } from '@/pages/VolunteerSuccessPage'
import { VolunteerBriefingPage } from '@/pages/VolunteerBriefingPage'
import { GivePage } from '@/pages/GivePage'
import { GiveWishlistPage } from '@/pages/GiveWishlistPage'
import { CampaignCreatePage } from '@/pages/CampaignCreatePage'
import { CampaignPublicPage } from '@/pages/CampaignPublicPage'
import { GiveThanksPage } from '@/pages/GiveThanksPage'
import { AboutPage } from '@/pages/AboutPage'
import { NewsPage } from '@/pages/NewsPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/community" element={<CommunityPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/volunteer" element={<VolunteerPage />} />
      <Route path="/volunteer/success" element={<VolunteerSuccessPage />} />
      <Route path="/volunteer/briefing/:signupId" element={<VolunteerBriefingPage />} />
      <Route path="/volunteer/:id" element={<VolunteerDetailPage />} />
      <Route path="/give" element={<GivePage />} />
      <Route path="/give/wishlist" element={<GiveWishlistPage />} />
      <Route path="/give/campaigns/new" element={<CampaignCreatePage />} />
      <Route path="/give/thanks" element={<GiveThanksPage />} />
      <Route path="/c/:slug" element={<CampaignPublicPage />} />
      <Route path="/me" element={<MyImpactPage />} />
      <Route path="/admin" element={<AdminPage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/news" element={<NewsPage />} />
      <Route path="/support" element={<Navigate to="/" replace />} />
      <Route path="/portal" element={<Navigate to="/" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
