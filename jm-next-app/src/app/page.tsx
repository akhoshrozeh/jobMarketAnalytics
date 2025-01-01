import { Resource } from "sst";
const APIEndpoint = Resource.APIEndpoint.value;

async function getAvgOcc() {

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

  const mongodata = await getAvgOcc();
  return (
    <div>
      <h1>Test Read From Mongo</h1>
      <p>Values: {mongodata && mongodata.map((item: {_id: string, totalOccurrences: number}, index: number) => (
                <span key={index}>{JSON.stringify(item)}{index < mongodata.length - 1 ? ', ' : ''}</span>
      ))}</p>
     </div>
  );
}