import 'server-only'

import { verifyIdToken } from '@/utils/verifyToken'
import { Resource } from "sst";

const APIEndpoint = Resource.APIEndpoint.value;

async function getTier() {
    const tokenPayload = await verifyIdToken();
    const tier = tokenPayload.payload?.["custom:tier"] as string || "free";
    return tier;
}



export async function getKeywordsCounted(query: string) {

    const tier = await getTier();

    
    try {
        const response = await fetch(`${APIEndpoint}/get-keywords-counted?tier=${tier}`, {
        headers: {
            'Accept': 'application/json',
        },

        });

        if (!response.ok) {
        console.log(response)
        throw new Error(`Failed to fetch: ${response}`);
        }

        return response.json();
    } catch (error) {
        console.error("Error:", error);
        return [];
    }
}

