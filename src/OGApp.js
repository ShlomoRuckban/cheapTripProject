import "./App.css";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  GeoJSON,
  useMapEvent,
} from "react-leaflet";
import { useState, useEffect } from "react";
import { connect } from "react-redux";
import data from "./data.json";
import airportsData from "./airports.json";
import * as Actions from "./redux/AppStateReducer/ActionCreators";
import airportIcon from "./assets/airport";
import L from "leaflet";
import SearchResult from "./components/SearchResult/SearchResult";
import AutoComplete from "./components/AutoComplete/AutoComplete";

function App({ loading, setLoading }) {
  const [map, setMap] = useState(null);
  const [citiesActive, setCitiesActive] = useState(false);
  const [airportsActive, setAirportsActive] = useState(false);
  const [json, setJson] = useState(null);
  const [cityName, setCityName] = useState("");
  const [autoCompleteData, setAutoCompleteData] = useState([]);
  const [options, setOptions] = useState();
  const [searchMarker, setSearchMarker] = useState(null);

  const airports = airportsData.filter((airport) => {
    if (data.cities.find((city) => airport.city === city.city)) {
      return true;
    } else {
      return false;
    }
  });

  const findCities = async (cityName) => {
    const url = `https://nominatim.openstreetmap.org/search?city=${cityName}&format=geojson`;
    fetch(url)
      .then((response) => response.json())
      .then((data) => {
        setJson(data.features);
        // console.log(data.features[0].properties);
      });
  };
  const findAutocomplete = async (cityName) => {
    const url = `https://photon.komoot.io/api/?q=${cityName}&osm_tag=place:city`;
    const response = await fetch(url);
    let data = (await response.json()).features;
    console.log(data);
    // data = data.map((feature) => feature.properties.name);
    // console.log(data);
    // setAutoCompleteData(data);
    return data;
  };

  const resultClick = (city) => {
    console.log("clockde");
    setSearchMarker({
      coordinates: {
        lat: city.geometry.coordinates[1],
        lng: city.geometry.coordinates[0],
      },
      name: city.properties.display_name,
    });
    if (map) {
      map.flyTo({
        lat: city.geometry.coordinates[1],
        lng: city.geometry.coordinates[0],
      });
    }
  };

  const onChangeHandler = async (text) => {
    setCityName(text);
    let matches = [];
    if (text.length > 0) {
      const data = await findAutocomplete(text);
      // console.log(data);
      matches = data.map((feature) => feature.properties.name);
      matches = matches.filter((a, b) => matches.indexOf(a) === b);
    }
    console.log("matches", matches);
    setOptions(matches);
   
  };
  return (
    <div className="App">
      <div className="searchBox">
        <AutoComplete
          onChange={(e) => {
            onChangeHandler(e.target.value);
          }}
          placeholder="type city name"
          value = {cityName}
          setValue={setCityName}
          options = {options}
          setOptions={setOptions}
        />
        {options &&
          options.map((option, i) => {
            <div key={i}>option</div>;
          })}
        <button
          className="searchBtn"
          onClick={() => {
            findCities(cityName);
          }}
        >
          search
        </button>
      </div>
      <div className="main">
        <div className="results">
          {json &&
            json.map((city) => (
              <SearchResult
                key={city.properties.display_name}
                city={city}
                resultClick={resultClick}
              />
            ))}
        </div>
        <MapContainer
          center={{ lat: 51.505, lng: -0.09 }}
          zoom={10}
          scrollWheelZoom={true}
          whenCreated={(map) => setMap(map)}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {citiesActive &&
            data.cities.map((city) => (
              <Marker position={{ lat: city.lat, lng: city.lon }}>
                <Popup>{city.city}</Popup>
              </Marker>
            ))}
          {airportsActive &&
            airports.map((airport) => (
              <Marker
                icon={airportIcon}
                position={{
                  lat: airport._geoloc.lat,
                  lng: airport._geoloc.lng,
                }}
              ></Marker>
            ))}
          {searchMarker && (
            <Marker position={searchMarker.coordinates}>
              <Popup>{searchMarker.name}</Popup>
            </Marker>
          )}
        </MapContainer>
        <div className="temp">
          <div className="checkBoxes">
            show cities:
            <input
              type="checkbox"
              checked={citiesActive}
              onChange={() => setCitiesActive(!citiesActive)}
            />
            show airports:
            <input
              type="checkbox"
              checked={airportsActive}
              onChange={() => setAirportsActive(!airportsActive)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
const mapStateToProps = (state) => {
  return {
    loading: state.appState.loading,
  };
};
const mapDispatchToProps = (dispatch) => {
  return {
    setLoading: (state) => dispatch(Actions.setLoading(state)),
  };
};
export default connect(mapStateToProps, mapDispatchToProps)(App);