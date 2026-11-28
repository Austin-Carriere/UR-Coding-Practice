import { verifySession } from "./_session.js";

export async function onRequestGet({ request, env }) {
    const cookie = request.headers.get("Cookie") || "";

    const sessionCookie = cookie
        .split(";")
        .map(value => value.trim())
        .find(value => value.startsWith("session="));

    const token = sessionCookie?.slice("session=".length);

    const playerID = await verifySession(
        token,
        env.SESSION_SECRET
    );

    if (!playerID) {
        return Response.json(
            { success: false, loggedIn: false },
            { status: 401 }
        );
    }

    return Response.json({
        success: true,
        loggedIn: true,
        playerID
    }, {
        headers: {
            "Cache-Control": "no-store"
        }
    });
}