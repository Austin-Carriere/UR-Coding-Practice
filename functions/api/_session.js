const encoder = new TextEncoder();

function toBase64URL(bytes) {
    return btoa(String.fromCharCode(...new Uint8Array(bytes)))
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=/g, "");
}

async function sign(value, secret) {
    const key = await crypto.subtle.importKey(
        "raw",
        encoder.encode(secret),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
    );

    const signature = await crypto.subtle.sign(
        "HMAC",
        key,
        encoder.encode(value)
    );

    return toBase64URL(signature);
}

export async function createSession(playerID, secret) {
    const expires = Date.now() + 7 * 24 * 60 * 60 * 1000;

    const payload = toBase64URL(
        encoder.encode(JSON.stringify({
            playerID,
            expires
        }))
    );

    const signature = await sign(payload, secret);

    return `${payload}.${signature}`;
}

export async function verifySession(token, secret) {
    try {
        if (!token || !secret) return null;

        const parts = token.split(".");
        if (parts.length !== 2) return null;

        const [payload, signature] = parts;
        const expectedSignature = await sign(payload, secret);

        if (signature !== expectedSignature) return null;

        const decoded = atob(
            payload.replace(/-/g, "+").replace(/_/g, "/")
        );

        const session = JSON.parse(decoded);

        if (!session.playerID || session.expires < Date.now()) {
            return null;
        }

        return session.playerID;

    } catch {
        return null;
    }
}