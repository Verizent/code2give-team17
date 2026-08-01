import { Navigate } from 'react-router-dom'

export function GiveWishlistPage() {
  return <Navigate to="/give?tab=wishlist" replace />
}
