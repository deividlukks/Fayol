import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Rotas públicas que não precisam de autenticação
  const publicRoutes = ['/login'];
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));

  // Se for rota pública, permitir acesso
  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Verificar se há token de autenticação no localStorage
  // Como middleware roda no servidor, vamos verificar o cookie
  const authCookie = request.cookies.get('admin-auth-storage');

  // Se não houver cookie de autenticação, redirecionar para login
  if (!authCookie) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Verificar se o cookie contém dados válidos
  try {
    const authData = JSON.parse(authCookie.value);

    // Verificar se está autenticado
    if (!authData.state?.isAuthenticated || !authData.state?.token) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  } catch (error) {
    // Se houver erro ao parsear o cookie, redirecionar para login
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Se chegou aqui, está autenticado - permitir acesso
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
};
