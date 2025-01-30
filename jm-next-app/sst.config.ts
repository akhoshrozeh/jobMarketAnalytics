  /// <reference path="./.sst/platform/config.d.ts" />

  
  export default $config({
    app(input) {
      return {
        name: "jm-next-app",
        removal: input?.stage === "production" ? "retain" : "remove",
        protect: ["production"].includes(input?.stage),
        home: "aws",
      };
    },
    
    
    async run() {
      const mongoReadURI = new sst.Secret("MongoReadURI");

      // There's one database for the job data, which is used in both production and dev environments
      const JobsDatabase = new sst.Secret("JobsDatabase");
      // Then there's two databases for App data (i.e. User data)
      // In SST secrets, the names of the DBs are different depending on production or dev environments
      const JobTrendrAppDB = new sst.Secret("JobTrendrAppDB")

      const apiEndpoint = new sst.Secret("APIEndpoint");
      const region = new sst.Secret("Region");
      const mongoCreateUserURI = new sst.Secret("CreateUserURI")

      const createUser = new sst.aws.Function("CreateUser", {
        handler: "src/functions/createUser.handler",
        link: [mongoCreateUserURI, JobTrendrAppDB]
      })

      const sanitizeSignUp = new sst.aws.Function("SanitizeSignUp", {
        handler: "src/functions/sanitizeSignUp.handler",
      })


      const userPool = new sst.aws.CognitoUserPool("JobTrendrUserPool", {
        usernames: ["email"],
        transform: {
          userPool: {
            passwordPolicy: {
              minimumLength: 8,
              requireSymbols: false,
              requireNumbers: true,
              requireUppercase: true,
              requireLowercase: true,
            },
            schemas: [
              {
                attributeDataType: "String",
                name: "tier",
                mutable: true,              
            }

            ]   
          }
        },
        triggers: {
          postConfirmation: createUser.arn,
          preSignUp: "src/functions/sanitizeSignUp.handler"
        }

      });


      const userPoolClient = userPool.addClient("JobTrendrUserPoolClient", {
          transform: {
              client: {
                explicitAuthFlows: [
                  "ALLOW_USER_AUTH", 
                  "ALLOW_REFRESH_TOKEN_AUTH", 
                  "ALLOW_CUSTOM_AUTH", 
                  "ALLOW_USER_SRP_AUTH"],
                accessTokenValidity: 24,
                idTokenValidity: 24,
                writeAttributes: [],
                readAttributes: ["email", "custom:tier"]
              },
              
          },
          
        }, 
      );

      const identityPool = new sst.aws.CognitoIdentityPool("IdentityPool", {
        userPools: [
          {
            userPool: userPool.id,
            client: userPoolClient.id,
          },
        ],
      });   

      new sst.aws.Nextjs("MyWeb", {
        link: [mongoReadURI, mongoCreateUserURI, JobTrendrAppDB, JobsDatabase, apiEndpoint, region, userPool, userPoolClient, identityPool],
        domain: "jobtrendr.com",
        environment: {
          NEXT_PUBLIC_USER_POOL_ID: userPool.id,
          NEXT_PUBLIC_USER_POOL_CLIENT_ID: userPoolClient.id,
          NEXT_PUBLIC_IDENTITY_POOL_ID: identityPool.id,
        }
      });

      const api = new sst.aws.ApiGatewayV2("api", {
        link: [mongoReadURI, JobTrendrAppDB, JobsDatabase]    
      });
      
      api.route("GET /get-keywords-counted", "src/functions/getKeywordsCounted.handler", );
      api.route("GET /get-jobs", "src/functions/getJobs.handler", );
      api.route("GET /get-keywords-connected-by-job", "src/functions/getKeywordsConnectedByJob.handler", );


    
    }

})
