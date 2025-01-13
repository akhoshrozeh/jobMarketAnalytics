import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
 
export function middleware(request: NextRequest) {
  console.log('\n\n\nRequest URL:', request.url)
  console.log('Request headers:', Object.fromEntries(request.headers))
  console.log('Request method:', request.method)
  return NextResponse.next()
}