import { NextResponse } from 'next/server';

const COOKIE_NAME = 'gsm_crm_session';

export function proxy(request) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(COOKIE_NAME)?.value;

  // Rutas públicas que no requieren autenticación
  const isAuthPage = pathname === '/login';
  const isApiRoute = pathname.startsWith('/api/');

  // Si no hay token y no está en la página de login, redirigir a /login (excepto para APIs públicas si las hubiera)
  if (!token) {
    if (!isAuthPage && !isApiRoute && pathname !== '/') {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    return NextResponse.next();
  }

  // Si hay token, intentar decodificar el payload para verificar roles
  try {
    const payloadPart = token.split('.')[1];
    if (!payloadPart) throw new Error('Token inválido');
    
    // Decodificar Base64Url en el entorno Edge
    const base64 = payloadPart.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = atob(base64);
    const user = JSON.parse(jsonPayload);

    // Si el usuario ya está autenticado y va al login, redirigir al dashboard
    if (isAuthPage) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // Ruta de configuración (/setup) - solo para administradores
    if (pathname.startsWith('/setup') && user.role !== 'administrador') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // Ruta de administración de usuarios (/users) - solo para administradores y propietarios
    if (pathname.startsWith('/users') && user.role !== 'administrador' && user.role !== 'propietario') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  } catch (error) {
    // Si el token es inválido o corrupto, limpiar cookie y redirigir a login
    if (!isAuthPage && !isApiRoute) {
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete(COOKIE_NAME);
      return response;
    }
  }

  return NextResponse.next();
}

// Configurar en qué rutas se ejecutará el middleware
export const config = {
  matcher: [
    /*
     * Coincidir con todas las rutas excepto:
     * - _next/static (archivos estáticos)
     * - _next/image (optimización de imágenes)
     * - favicon.ico, logo, etc. (archivos en public)
     */
    '/((?!_next/static|_next/image|favicon.ico|assets|public|logogestionsmart.png|logo2.png).*)',
  ],
};
