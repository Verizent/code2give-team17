import { Navigate, Route, Routes } from 'react-router-dom'
import { HomePage } from '@/pages/HomePage'
import { CommunityPage } from '@/pages/CommunityPage'
import { MyImpactPage } from '@/pages/MyImpactPage'
import { LoginPage } from '@/pages/LoginPage'
import { AdminLayout } from '@/features/admin/AdminLayout'
import { AdminDashboardPage } from '@/pages/AdminDashboardPage'
import { AdminCampaignsPage } from '@/pages/AdminCampaignsPage'
import { AdminAttendancePage } from '@/pages/AdminAttendancePage'
import { AdminStoryDeskPage } from '@/pages/AdminStoryDeskPage'
import { AdminModerationPage } from '@/pages/AdminModerationPage'
import { AdminArticlesPage } from '@/pages/AdminArticlesPage'
import { VolunteerPage } from '@/pages/VolunteerPage'
import { VolunteerDetailPage } from '@/pages/VolunteerDetailPage'
import { VolunteerSuccessPage } from '@/pages/VolunteerSuccessPage'
import { VolunteerBriefingPage } from '@/pages/VolunteerBriefingPage'
import { GivePage } from '@/pages/GivePage'
import { GiveWishlistPage } from '@/pages/GiveWishlistPage'
import { CampaignCreatePage } from '@/pages/CampaignCreatePage'
import { CampaignPublicPage } from '@/pages/CampaignPublicPage'
import { GiveThanksPage } from '@/pages/GiveThanksPage'
import { DonorTrackPage } from '@/pages/DonorTrackPage'
import { SupportPage } from '@/pages/SupportPage'

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
      {/* Bearer token in the path (§15). Must sit above the `*` catch-all, or a valid
          tracking link silently redirects home — the same trap that made Stripe's old
          /donate/thanks success_url look like it worked. */}
      <Route path="/give/track/:token" element={<DonorTrackPage />} />
      <Route path="/c/:slug" element={<CampaignPublicPage />} />
      <Route path="/me" element={<MyImpactPage />} />
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminDashboardPage />} />
        <Route path="articles" element={<AdminArticlesPage />} />
        <Route path="stories" element={<AdminStoryDeskPage />} />
        <Route path="campaigns" element={<AdminCampaignsPage />} />
        <Route path="attendance" element={<AdminAttendancePage />} />
        <Route path="moderation" element={<AdminModerationPage />} />
        <Route path="proofs" element={<Navigate to="/admin/stories" replace />} />
        <Route path="social" element={<Navigate to="/admin/stories" replace />} />
        <Route path="instagram" element={<Navigate to="/admin/stories" replace />} />
      </Route>
      <Route path="/support" element={<SupportPage />} />
      <Route path="/about" element={<Navigate to="/" replace />} />
      <Route path="/news" element={<Navigate to="/#stories" replace />} />
      <Route path="/portal" element={<Navigate to="/" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
