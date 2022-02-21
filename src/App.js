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
  const [cityName, setCityName] = useState("");
  const [CTcityName, setCTCityName] = useState("");
  // const [autoCompleteData, setAutoCompleteData] = useState([]);
  const [options, setOptions] = useState();
  const [CToptions, setCTOptions] = useState();
  const [searchMarker, setSearchMarker] = useState(null);
  const [generalTempData, setGeneralTempData] = useState();

  const airports = airportsData.filter((airport) => {
    if (data.cities.find((city) => airport.city === city.city)) {
      return true;
    } else {
      return false;
    }
  });

  const findCities = async (cityName) => {
    if (cityName.length > 0) {
      var tempData = generalTempData.filter((name) => name.properties.display_name === cityName)
      // console.log(tempData[0])
      resultClick(tempData[0])

      // const url = `https://nominatim.openstreetmap.org/search?city=${cityName}&format=geojson`;
      // await fetch(url)
      //   .then((response) => response.json())
      //   .then((data) => {
      //     // setJson(data.features[0]);
      //     console.log("data.featues.properties", data.features.properties);
      //     // resultClick(data.features[0])
      //   })
    }

  };

  const findCTCities = async (cityName) => {
    var DataCheapTrip = data.cities;
    if (cityName.length > 0) {
      DataCheapTrip = DataCheapTrip.filter((city) => city.city == cityName)
    }
    setSearchMarker({
      coordinates: {
        lat: DataCheapTrip[0].lat,
        lng: DataCheapTrip[0].lon
      },
      name: DataCheapTrip[0].city
    });
    if (map) {
      map.flyTo({
        lat: DataCheapTrip[0].lat,
        lng: DataCheapTrip[0].lon,
      })
    }
  };

  const findAutocomplete = async (cityName) => {
    const url2 = `https://photon.komoot.io/api/?q=${cityName}&osm_tag=place:city`;
    const url = `https://nominatim.openstreetmap.org/search?city=${cityName}&format=geojson`
    const response = await fetch(url);
    var data2 = (await response.json()).features;
    const response2 = await fetch(url2);
    let data1 = (await response2.json()).features;
    var dataArray = [];
    var duplicated = false;

    data1.forEach((result) => {
      duplicated = false;
      // console.log(result)
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
        // console.log(tempJson.geometry.coordinates[0],dataArray[i].geometry.coordinates[0], tempJson.geometry.coordinates[1], dataArray[i].geometry.coordinates[1],tempJson.properties.display_name,dataArray[i].properties.display_name)
        if ((tempJson.geometry.coordinates[0] === dataArray[i].geometry.coordinates[0] 
          && tempJson.geometry.coordinates[1] === dataArray[i].geometry.coordinates[1])
          ||(tempJson.properties.display_name===dataArray[i].properties.display_name)) {
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
        // console.log(result)
        var myArray = result.properties.display_name.split(",");
        // console.log(myArray[0], myArray[1], myArray[myArray.length - 1])
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

        // console.log(tempJson)
        for (var i = 0; i < dataArray.length; i++) {
          if ((tempJson.geometry.coordinates[0] === dataArray[i].geometry.coordinates[0] 
            && tempJson.geometry.coordinates[1] === dataArray[i].geometry.coordinates[1])
            ||(tempJson.properties.display_name===dataArray[i].properties.display_name)) {
            duplicated = true;
          }
        }
        if (!duplicated) {
          dataArray.push(tempJson);
        }
      }
      // console.log("end")
    })
    // console.log(dataArray)
    dataArray.forEach((city)=>{
      city.properties.display_name=city.properties.display_name.replace("undefined,", "")
    })
    setGeneralTempData(dataArray);
    return dataArray;
  };

  const resultClick = (city) => {
    // console.log(city)
    // console.log("clicked");
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
      matches = data.map((feature) => feature.properties.display_name)
      // matches = matches.filter((a, b) => matches.indexOf(a) === b);
    }
    // console.log("matches", matches);
    setOptions(matches);

  };

  const onChangeCTHandler = async (text) => {
    setCTCityName(text);
    var CTdata = data.cities
    let matches = [];
    if (text.length > 0) {
      CTdata = CTdata.filter((name) => name.city.toLowerCase().includes(text.toLowerCase()))
      matches = CTdata.map((feature) => feature.city);
      matches = matches.filter((a, b) => matches.indexOf(a) === b);
    }
    // console.log("matches", matches);
    setCTOptions(matches);
  };

  return (
    <div className="App">
      <div className="divSearchBox">
        <div className="searchBox">
          <AutoComplete
            onChange={(e) => { onChangeHandler(e.target.value) }}
            placeholder="Search cities from OSM"
            value={cityName}
            setValue={setCityName}
            options={options}
            setOptions={setOptions}
          />
          {options &&
            options.map((option, i) => {
              <div key={i}>option</div>;
            })}
          <input type="button" className="searchBtn" onClick={() => { findCities(cityName) }} value="Search" />

        </div>
        <div className="searchBox">
          <AutoComplete
            onChange={(e) => { onChangeCTHandler(e.target.value) }}
            placeholder="Search cities from Cheaptrip"
            value={CTcityName}
            setValue={setCTCityName}
            options={CToptions}
            setOptions={setCTOptions}
          />
          {options &&
            options.map((option, i) => {
              <div key={i}>option</div>;
            })}
          <input type="button" className="searchBtn" onClick={() => { findCTCities(CTcityName) }} value="Search" />

        </div>
      </div>
      <div className="main">
        <div className="results">
          {/* {json &&
            json.map((city) => (
              <SearchResult
                key={city.properties.display_name}
                city={city}
                resultClick={resultClick}
              />
            ))} */}
        </div>
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
