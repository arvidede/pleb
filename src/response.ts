export function html(body: BodyInit, init?: ResponseInit) {
    const _html = typeof body === "string" ? body : JSON.stringify(body)
    return new Response(_html, {
        status: 200,
        ...init,
        headers: {
            ...init?.headers,
            "Content-Type": "text/html",
        },
    })
}
