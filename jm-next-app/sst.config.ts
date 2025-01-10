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
      const JMDatabase = new sst.Secret("JMDatabase");
      const apiEndpoint = new sst.Secret("APIEndpoint");
      const userPoolID = new sst.Secret("UserPoolID");  
      const userPoolClientID = new sst.Secret("UserPoolClientID");
      const identityPoolID = new sst.Secret("IdentityPoolID");
      const region = new sst.Secret("Region");


      const userPool = new sst.aws.CognitoUserPool("JobTrendrUserPool", {
        usernames: ["email"]
      });

      const userPoolClient = userPool.addClient("JobTrendrUserPoolClient");

      const identityPool = new sst.aws.CognitoIdentityPool("IdentityPool", {
        userPools: [
          {
            userPool: userPool.id,
            client: userPoolClient.id,
          },
        ],
      });   

      new sst.aws.Nextjs("MyWeb", {
        link: [mongoReadURI, JMDatabase, apiEndpoint, userPoolID, userPoolClientID, identityPoolID, region, userPool, userPoolClient, identityPool],
        domain: "jobtrendr.com",
        environment: {
          NEXT_PUBLIC_USER_POOL_ID: userPool.id,
          NEXT_PUBLIC_USER_POOL_CLIENT_ID: userPoolClient.id,
          NEXT_PUBLIC_IDENTITY_POOL_ID: identityPool.id,
        }
      });

      const api = new sst.aws.ApiGatewayV2("api", {
        link: [mongoReadURI, JMDatabase]    
      });
      
      api.route("GET /get-keywords-counted", "src/functions/getKeywordsCounted.handler", );
      api.route("GET /get-jobs", "src/functions/getJobs.handler", );
      api.route("GET /get-keywords-connected-by-job", "src/functions/getKeywordsConnectedByJob.handler", );


    
    }

})
