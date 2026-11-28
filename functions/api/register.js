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
            typeof password !== "string" ||
            username.trim().length < 3 ||
            username.trim().length > 20 ||
            password.length < 3 ||
            password.length > 20
        ) {
            return Response.json(
                { success: false, error: "Invalid username or password." },
                { status: 400 }
            );
        }

        const cleanUsername = username.trim();
        const playerID = crypto.randomUUID();
        const salt = crypto.randomUUID();

        const passwordHash = await hashPassword(password, salt);

        await env.DB.prepare(`
            INSERT INTO players (
                player_id,
                username,
                password_salt,
                password_hash
            )
            VALUES (?, ?, ?, ?)
        `).bind(
            playerID,
            cleanUsername,
            salt,
            passwordHash
        ).run();

        return Response.json({
            success: true,
            playerID: playerID
        });

    } catch (error) {
        if (error.message?.includes("UNIQUE constraint failed")) {
            return Response.json(
                { success: false, error: "Username already exists." },
                { status: 409 }
            );
        }

        return Response.json(
            { success: false, error: "Registration failed." },
            { status: 500 }
        );
    }
}