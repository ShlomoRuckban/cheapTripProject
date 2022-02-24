import "./App.css";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  // GeoJSON,
  // useMapEvent,
  Rectangle
} from "react-leaflet";

import { useState, useEffect } from "react";
import { connect } from "react-redux";
import data from "./data.json";
import airportsData from "./airports.json";
import * as Actions from "./redux/AppStateReducer/ActionCreators";
import airportIcon from "./assets/airport";
// import L, { rectangle } from "leaflet";
// import SearchResult from "./components/SearchResult/SearchResult";
import AutoComplete from "./components/AutoComplete/AutoComplete";

function App({ loading, setLoading }) {
  const [map, setMap] = useState(null);
  const [bordersActive, setBordersActive] = useState(false);
  const [citiesActive, setCitiesActive] = useState(false);
  const [airportsActive, setAirportsActive] = useState(false);

  // const [json, setJson] = useState(null);
  // const [cityName, setCityName] = useState("");
  // const [autoCompleteData, setAutoCompleteData] = useState([]);
  // const [options, setOptions] = useState();

  const [searchMarker, setSearchMarker] = useState(null);
  const [startGeneralTempData, setStartGeneralTempData] = useState();
  const [endGeneralTempData, setEndGeneralTempData] = useState();
  const [startPoint, setStartPoint] = useState();
  const [startOptions, setStartOptions] = useState();
  const [endPoint, setEndPoint] = useState();
  const [endOptions, setEndOptions] = useState();

  const airports = airportsData.filter((airport) => {
    if (data.cities.find((city) => airport.city === city.city)) {
      return true;
    } else {
      return false;
    }
  });

  const findCities = async (city, point) => {
    var tempData
    if (city.length > 0) {
      if (point === "start") {
        tempData = startGeneralTempData.filter((name) => name.properties.display_name === city)
      }

      if(point === "end") {
        tempData = endGeneralTempData.filter((name) => name.properties.display_name === city)
      }


      resultClick(tempData[0])
    }

  };

  const findAutocomplete = async (cityName, point) => {
    const url2 = `https://photon.komoot.io/api/?q=${cityName}&osm_tag=place:city`;
    const url = `https://nominatim.openstreetmap.org/search?city=${cityName}&format=geojson`
    const response = await fetch(url);
    var data2 = (await response.json()).features;
    const response2 = await fetch(url2);
    let data1 = (await response2.json()).features;
    var dataArray = [];
    var duplicated = false;
    var CTdata = data.cities

    CTdata = CTdata.filter((name) => name.city.toLowerCase().includes(cityName.toLowerCase()))

    CTdata.forEach((result) => {
      duplicated = false;

      var tempJson = {
        geometry: {
          coordinates: [result.lon, result.lat],
        },
        properties: {
          display_name: result.city,
          source: 'CheapTrip'
        }
      }

      for (var i = 0; i < dataArray.length; i++) {
        if ((tempJson.geometry.coordinates[0] === dataArray[i].geometry.coordinates[0]
          && tempJson.geometry.coordinates[1] === dataArray[i].geometry.coordinates[1])
          || (tempJson.properties.display_name === dataArray[i].properties.display_name)) {
          duplicated = true;
        }
      }
      if (!duplicated) {
        dataArray.push(tempJson);
      }
    })


    data1.forEach((result) => {
      duplicated = false;

      var tempJson = {
        type: result.type,
        geometry: {
          coordinates: result.geometry.coordinates,
          type: result.geometry.type
        },
        properties: {
          display_name: `${result.properties.name}, ${result.properties.county}, ${result.properties.country}`,
          osm_id: result.properties.osm_id,
          osm_type: result.properties.osm_type,
          source: 'photon.komoot'
        }
      }
      for (var i = 0; i < dataArray.length; i++) {

        if ((tempJson.geometry.coordinates[0] === dataArray[i].geometry.coordinates[0]
          && tempJson.geometry.coordinates[1] === dataArray[i].geometry.coordinates[1])
          || (tempJson.properties.display_name === dataArray[i].properties.display_name)) {
          duplicated = true;
        }
      }
      if (!duplicated) {
        dataArray.push(tempJson);
      }
    })
    data2.forEach((result) => {
      duplicated = false;
      if (result.properties.osm_type === "node") {

        var myArray = result.properties.display_name.split(",");

        var tempJson = {
          type: result.type,
          geometry: {
            coordinates: result.geometry.coordinates,
            type: result.geometry.type
          },
          properties: {
            display_name: `${myArray[0]}, ${myArray[1]}, ${myArray[myArray.length - 1]}`,
            osm_id: result.properties.osm_id,
            osm_type: result.properties.osm_type,
            source: 'nominatim'
          }
        }


        for (var i = 0; i < dataArray.length; i++) {
          if ((tempJson.geometry.coordinates[0] === dataArray[i].geometry.coordinates[0]
            && tempJson.geometry.coordinates[1] === dataArray[i].geometry.coordinates[1])
            || (tempJson.properties.display_name === dataArray[i].properties.display_name)) {
            duplicated = true;
          }
        }
        if (!duplicated) {
          dataArray.push(tempJson);
        }
      }

    })

    dataArray.forEach((city) => {
      city.properties.display_name = city.properties.display_name.replace("undefined,", "")
    })
    if (point === "start")
      setStartGeneralTempData(dataArray);
    if (point === "end")
      setEndGeneralTempData(dataArray);
    return dataArray;
  };

  const resultClick = (city) => {

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

  const onChangeHandler = async (text, point) => {
    let matches = [];
    if (text.length > 0) {
      const data = await findAutocomplete(text, point);

      matches = data.map((feature) => feature.properties.display_name)

    }
    return matches;
    // setOptions(matches);
  }

  const onChangeHandlerStart = async (text) => {
    setStartPoint(text);
    setStartOptions(await onChangeHandler(text, "start"));
  }
  const onChangeHandlerEnd = async (text) => {
    setEndPoint(text);
    setEndOptions(await onChangeHandler(text, "end"));
  }

  return (
    <div className="App">
      <div className="divSearchBox">
        <div className="searchBox">
          <AutoComplete
            onChange={(e) => { onChangeHandlerStart(e.target.value) }}
            placeholder="Search cities"
            value={startPoint}
            setValue={setStartPoint}
            options={startOptions}
            setOptions={setStartOptions}
          />
          {startOptions &&
            startOptions.map((option, i) => {
              <div key={i}>option</div>;
            })}
          <input type="button" className="searchBtn" onClick={() => { findCities(startPoint, "start") }} value="Search" />

        </div>

        <div className="searchBox">
          <AutoComplete
            onChange={(e) => { onChangeHandlerEnd(e.target.value) }}
            placeholder="Search cities"
            value={endPoint}
            setValue={setEndPoint}
            options={endOptions}
            setOptions={setEndOptions}
          />
          {endOptions &&
            endOptions.map((option, i) => {
              <div key={i}>option</div>;
            })}
          <input type="button" className="searchBtn" onClick={() => { findCities(endPoint, "end") }} value="Search" />

        </div>

      </div>
      <div className="main">
        <div className="results"></div>

        <div className="map">
          <MapContainer
            center={{ lat: 51.505, lng: -0.09 }}
            zoom={10}
            scrollWheelZoom={true}
            whenCreated={(map) => setMap(map)}
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {bordersActive &&
              data.cities.map((city) => (
                <Rectangle bounds={[[city.latX, city.lonX], [city.latY, city.lonY]]} />
              ))}
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
        </div>
        <div className="temp">
          <div className="checkBoxes">
            <br />show cities:
            <input
              type="checkbox"
              checked={citiesActive}
              onChange={() => setCitiesActive(!citiesActive)}
            />
            <br />show borders:
            <input
              type="checkbox"
              checked={bordersActive}
              onChange={() => setBordersActive(!bordersActive)}
            />
            <br />show airports:
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
