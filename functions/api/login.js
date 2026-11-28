async function hashPassword(password, salt) {
    const encoder = new TextEncoder();

    const key = await crypto.subtle.importKey(
        "raw",
        encoder.encode(password),
        "PBKDF2",
        false,
        ["deriveBits"]
    );

    const hash = await crypto.subtle.deriveBits(
        {
            name: "PBKDF2",
            salt: encoder.encode(salt),
            iterations: 600000,
            hash: "SHA-256"
        },
        key,
        256
    );

    return Array.from(new Uint8Array(hash))
        .map(byte => byte.toString(16).padStart(2, "0"))
        .join("");
}

export async function onRequestPost({ request, env }) {
    try {
        const { username, password } = await request.json();

        if (
            typeof username !== "string" ||
            typeof password !== "string"
        ) {
            return Response.json(
                { success: false, error: "Invalid credentials." },
                { status: 400 }
            );
        }

        const player = await env.DB.prepare(`
            SELECT player_id, password_salt, password_hash
            FROM players
            WHERE username = ?
        `).bind(username.trim()).first();

        if (!player) {
            return Response.json(
                { success: false, error: "Incorrect username or password." },
                { status: 401 }
            );
        }

        const submittedHash = await hashPassword(
            password,
            player.password_salt
        );

        if (submittedHash !== player.password_hash) {
            return Response.json(
                { success: false, error: "Incorrect username or password." },
                { status: 401 }
            );
        }

        return Response.json({
            success: true,
            playerID: player.player_id
        });

    } catch (error) {
        return Response.json(
            { success: false, error: "Login failed." },
            { status: 500 }
        );
    }
}