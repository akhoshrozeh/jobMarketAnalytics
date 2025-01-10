const config = {
    Auth: {
        Cognito: {  
            userPoolId: String(process.env.NEXT_PUBLIC_USER_POOL_ID),
            userPoolClientId: String(process.env.NEXT_PUBLIC_USER_POOL_CLIENT_ID),
            identityPoolId: String(process.env.NEXT_PUBLIC_IDENTITY_POOL_ID),
            loginWith: {
                email: true,
              },
              signUpVerificationMethod: "code",
              userAttributes: {
                email: {
                  required: true,
                },
              },
              allowGuestAccess: true,
              passwordFormat: {
                minLength: 8,
                requireLowercase: true,
                requireUppercase: true,
                requireNumbers: true,
                requireSpecialCharacters: false,
              },
        }
    }
}

export default config;