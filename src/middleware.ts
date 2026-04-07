import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const secretKey = "secret";
const key = new TextEncoder().encode(secretKey);

export async function decrypt(input: string): Promise<any> {
    const { payload } = await jwtVerify(input, key, {
        algorithms: ["HS256"],
    });
    return payload;
}

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const session = request.cookies.get("session")?.value;

    // 1. Skip auth check for public assets and auth APIs
    if (
        pathname.startsWith("/_next") ||
        pathname.startsWith("/api/auth") ||
        pathname.startsWith("/api/seed") ||
        pathname === "/login" ||
        pathname === "/admin-login" ||
        pathname === "/signup" ||
        pathname.startsWith("/api/parent/login") ||
        pathname === "/manifest.json" ||
        pathname === "/icon.png"
    ) {
        return NextResponse.next();
    }
    
    // Allow pass-through for parent routes if no session (Capacitor WebView 307 redirect bug fix)
    // The client-side code in /parent/page.tsx will handle the redirect to /login via API check
    if (!session && pathname.startsWith("/parent")) {
        return NextResponse.next();
    }

    // 2. Redirect to specific login pages if no session for other routes
    if (!session) {
        // If they are trying to access admin routes, redirect to admin-login
        if (pathname === "/" || pathname.startsWith("/admin") || pathname.startsWith("/super-admin")) {
            return NextResponse.redirect(new URL("/admin-login", request.url));
        }
        return NextResponse.redirect(new URL("/login", request.url));
    }

    try {
        const parsed = await decrypt(session);

        // 3. Super Admin Route Protection
        if (pathname.startsWith("/super-admin") && parsed.user.role !== "SUPER") {
            return NextResponse.redirect(new URL("/", request.url));
        }

        // 4. Parent vs Admin Route Protection
        const isParentRoute = pathname.startsWith('/parent');

        if (!isParentRoute && parsed.user.role === 'PARENT') {
            // Parents shouldn't be in admin area
            return NextResponse.redirect(new URL("/parent", request.url));
        }

        // 5. If authenticated and visiting login pages, redirect to appropriate home
        if ((pathname === '/login' || pathname === '/admin-login') && parsed.user.role !== 'PARENT') {
            if (parsed.user.role === 'SUPER') return NextResponse.redirect(new URL("/super-admin", request.url));
            return NextResponse.redirect(new URL("/", request.url));
        }
        if ((pathname === '/login' || pathname === '/admin-login') && parsed.user.role === 'PARENT') {
            return NextResponse.redirect(new URL("/parent", request.url));
        }

        return NextResponse.next();
    } catch (err) {
        // Session expired or invalid
        if (pathname === "/" || pathname.startsWith("/admin") || pathname.startsWith("/super-admin")) {
            return NextResponse.redirect(new URL("/admin-login", request.url));
        }
        return NextResponse.redirect(new URL("/login", request.url));
    }
}

// Routes to apply middleware
export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
