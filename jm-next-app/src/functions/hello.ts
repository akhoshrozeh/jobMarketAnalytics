export const handler = async (event: any) => {
    console.log("hello.handler: ", event)   
    return {
        statusCode: 200,
        body: JSON.stringify({message: "hello handler hit!"})
    }
}