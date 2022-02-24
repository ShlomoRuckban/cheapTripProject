import "./SearchResult.css"
export default function SearchResult({city,resultClick}) {
  console.log(city);
  return (
    <div className="SearchResult" onClick={()=>{resultClick(city)}}>
      <p className="name">{city.properties.display_name}</p>
      <p><b>latitude</b>:{city.geometry.coordinates[1]}</p>
      <p><b>longitude</b>:{city.geometry.coordinates[0]}</p>
    </div>
  );
}
