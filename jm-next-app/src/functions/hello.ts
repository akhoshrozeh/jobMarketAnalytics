import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult>  => {
    console.log("hello.handler: ", event)   
    return {
        statusCode: 200,
        body: JSON.stringify({message: "hello handler hit!"})
    }
}