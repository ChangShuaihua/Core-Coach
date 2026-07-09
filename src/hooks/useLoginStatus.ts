import { useUserStore } from '@/store/useUserStore'

export function useLoginStatus() {
  const accessToken = useUserStore((state) => state.accessToken)
  return { isLoggedIn: !!accessToken }
}
