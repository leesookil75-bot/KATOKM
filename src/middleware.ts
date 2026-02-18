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
        pathname === "/signup" ||
        pathname === "/parent/login" ||
        pathname.startsWith("/api/parent/login") ||
        pathname === "/manifest.json" ||
        pathname === "/icon.png"
    ) {
        return NextResponse.next();
    }

    // 2. Redirect to login if no session
    if (!session) {
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
        const isLoginRedirect = pathname === '/login' || pathname === '/parent/login';

        if (isParentRoute && parsed.user.role !== 'PARENT') {
            // Admin users shouldn't be in the parent area unless it's testing
            // But for reliability, if they try to go deep, redirect to admin home
            if (pathname !== '/parent/login') {
                // allow testing parent app if needed, but usually redirect
            }
        }

        if (!isParentRoute && parsed.user.role === 'PARENT') {
            // Parents shouldn't be in admin area
            return NextResponse.redirect(new URL("/parent", request.url));
        }

        return NextResponse.next();
    } catch (err) {
        // Session expired or invalid
        return NextResponse.redirect(new URL("/login", request.url));
    }
}

// Routes to apply middleware
export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
