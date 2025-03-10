/* This file is auto-generated by SST. Do not edit. */
/* tslint:disable */
/* eslint-disable */
/* deno-fmt-ignore-file */
import "sst"
export {}
declare module "sst" {
  export interface Resource {
    "APIEndpoint": {
      "type": "sst.sst.Secret"
      "value": string
    }
    "BasicMembershipPriceId": {
      "type": "sst.sst.Secret"
      "value": string
    }
    "CreateUser": {
      "name": string
      "type": "sst.aws.Function"
    }
    "CreateUserURI": {
      "type": "sst.sst.Secret"
      "value": string
    }
    "IdentityPool": {
      "id": string
      "type": "sst.aws.CognitoIdentityPool"
    }
    "JobTrendrAppDB": {
      "type": "sst.sst.Secret"
      "value": string
    }
    "JobTrendrUserPool": {
      "id": string
      "type": "sst.aws.CognitoUserPool"
    }
    "JobTrendrUserPoolClient": {
      "id": string
      "secret": string
      "type": "sst.aws.CognitoUserPoolClient"
    }
    "JobsDatabase": {
      "type": "sst.sst.Secret"
      "value": string
    }
    "MongoReadURI": {
      "type": "sst.sst.Secret"
      "value": string
    }
    "MyWeb": {
      "type": "sst.aws.Nextjs"
      "url": string
    }
    "PremiumMembershipPriceId": {
      "type": "sst.sst.Secret"
      "value": string
    }
    "Region": {
      "type": "sst.sst.Secret"
      "value": string
    }
    "STRIPE_PUBLISHABLE_KEY": {
      "type": "sst.sst.Secret"
      "value": string
    }
    "STRIPE_SECRET_KEY": {
      "type": "sst.sst.Secret"
      "value": string
    }
    "STRIPE_WEBHOOK_SIG": {
      "type": "sst.sst.Secret"
      "value": string
    }
    "SanitizeSignUp": {
      "name": string
      "type": "sst.aws.Function"
    }
    "WebhookHandler": {
      "name": string
      "type": "sst.aws.Function"
    }
    "api": {
      "type": "sst.aws.ApiGatewayV2"
      "url": string
    }
  }
}
