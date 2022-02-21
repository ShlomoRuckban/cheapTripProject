function SetMarkerbyClick() {
    const [position, setPosition] = useState(null);
    let [loading, setLoading] = useState(false);
    const [json, setJson] = useState(null);
    const map = useMapEvent("click", (e) => {
      setPosition(e.latlng);
      // let url = `https://nominatim.openstreetmap.org/reverse?lat=${e.latlng.lat}&lon=${e.latlng.lng}&zoom=10&polygon_geojson=1&format=geojson`;
      let url= `https://nominatim.openstreetmap.org/reverse?format=geojson&lat=51.505&lon=-0.09`;
      setLoading(true);
      fetch(url)
        .then((response) => {
          console.log("response recieved");
          return response.json();
        })
        .then((data) => {
          
          setJson(data);
          setLoading(false);
        })
        .catch((error) => {
          console.log(error.message);
        });
    });
    return <GeoJSON data={json} />;
  }

  //add loading redux