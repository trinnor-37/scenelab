import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const type = searchParams.get('type')

  if (type === 'recovery') {
    return NextResponse.redirect(`${origin}/auth/reset`)
  }

  return NextResponse.redirect(`${origin}/`)
}
