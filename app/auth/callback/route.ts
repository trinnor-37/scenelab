import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const type = searchParams.get('type')

  if (type === 'recovery' && code) {
    return NextResponse.redirect(`https://scenebloc.com/auth/reset?code=${code}`)
  }

  return NextResponse.redirect('https://scenebloc.com/')
}
