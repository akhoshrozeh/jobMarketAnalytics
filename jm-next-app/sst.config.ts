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

      new sst.aws.Nextjs("MyWeb", {
        link: [mongoReadURI, JMDatabase, apiEndpoint]
      });

      const api = new sst.aws.ApiGatewayV2("api", {
        link: [mongoReadURI, JMDatabase]    
      });
      
      api.route("GET /avg-occ", "src/functions/avgOcc.handler", );


    
    }

})
