/**
 * AUTO-GENERATED SCHEMA (Dummy File)
 * Execute `npm run generate:api` when the FastAPI backend is running!
 */

export interface paths {
    "/auth/webauthn/verify": {
        post: {
            requestBody: {
                content: {
                    "application/json": {
                        credentialId: string;
                        clientDataJSON: string;
                        authenticatorData: string;
                        signature: string;
                    };
                };
            };
            responses: {
                200: {
                    content: {
                        "application/json": {
                            status: string;
                            token: string;
                        };
                    };
                };
            };
        };
    };
    // ...other paths
}
