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

        // 4. Academy Admin Route Protection (prevent them from accessing super-admin)
        if (!pathname.startsWith("/super-admin") && parsed.user.role === "SUPER") {
            // Super admin should stay in super-admin area or can browse but it's cleaner to redirect
            // For now, allow them to see the main app if they want, but usually they'll be in /super-admin
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
