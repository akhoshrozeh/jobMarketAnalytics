import { Resource } from "sst";
const APIEndpoint = Resource.APIEndpoint.value;

async function test() {
  try {
    const response = await fetch(`${APIEndpoint}/hello`, 
      { 
        headers: {
          'Accept': 'application/json',
        },
        cache: 'no-store' 
      }
    );    
    console.log(response)
    if (!response.ok) {
      throw new Error("Fail to fetch data.")
    }
    return response.json()

  } catch (error) {
    console.error("Error caught:", error)
    return {message: "error fetching data."}
  }
}

async function getAvgOcc() {
  const mongoURI = Resource.MongoReadURI.value;
  try {
    const response = await fetch(`${APIEndpoint}/avg-occ`, {
      headers: {
        'Accept': 'application/json',
      }
    })

    console.log(response)
    if (!response.ok) {
      throw new Error("Failed to fetch from mongo")
    }

    return response.json()

  } catch (error) {
    console.error("err caught:", error)
  }
}

export default async function Home() {
  const data = await test();
  const mongodata = await getAvgOcc();
  return (
    <div>
      <h1>Lambda Function Test</h1>
      <p>Message from lambda: {data.message}</p>
      <h1>Test Read From Mongo</h1>
      <p>Values: {mongodata && mongodata.map((item:any, index: number) => (
                <span key={index}>{JSON.stringify(item)}{index < mongodata.length - 1 ? ', ' : ''}</span>
      ))}</p>
     </div>
  );
}