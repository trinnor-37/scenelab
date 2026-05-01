import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const type = searchParams.get('type')

  if (type === 'recovery' && code) {
    const { data, error } = await supabase.auth.verifyOtp({
      token: code,
      type: 'recovery',
    })

    if (!error && data.session) {
      const response = NextResponse.redirect('https://scenebloc.com/auth/reset')
      response.cookies.set('sb-access-token', data.session.access_token, { path: '/' })
      response.cookies.set('sb-refresh-token', data.session.refresh_token, { path: '/' })
      return response
    }
  }

  return NextResponse.redirect('https://scenebloc.com/auth/forgot')
}
