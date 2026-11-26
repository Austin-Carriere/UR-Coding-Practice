export async function onRequestGet({ env }) {
    try {
        const result = await env.DB
            .prepare("SELECT * FROM level_progress")
            .all();

        return Response.json({
            success: true,
            progress: result.results
        });

    } catch (error) {
        return Response.json({
            success: false,
            error: "Failed to retrieve progress"
        }, { status: 500 });
    }
}