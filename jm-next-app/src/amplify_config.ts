import { Resource } from "sst";

const config = {
    cognito: {
        region: Resource.Region.value,
        userPoolId: Resource.UserPoolID.value,
        userPoolWebClientId: Resource.UserPoolClientID.value,
        identityPoolId: Resource.IdentityPoolID.value
    }
}

export default config;