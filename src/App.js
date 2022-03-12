import "./App.css";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Rectangle
} from "react-leaflet";

import { useState, useEffect } from "react";
import { connect } from "react-redux";
import data from "./data.json";
import airportsData from "./airports.json";
import * as Actions from "./redux/AppStateReducer/ActionCreators";
import airportIcon from "./assets/airport";
import AutoComplete from "./components/AutoComplete/AutoComplete";


function App({ loading, setLoading }) {
  const [map, setMap] = useState(null);
  const [bordersActive, setBordersActive] = useState(false);
  const [citiesActive, setCitiesActive] = useState(false);
  const [airportsActive, setAirportsActive] = useState(false);

  const [searchMarker, setSearchMarker] = useState(null);
  const [endGeneralTempData, setEndGeneralTempData] = useState();
  const [endPoint, setEndPoint] = useState();
  const [endOptions, setEndOptions] = useState();

  const getDistance = (firstPoint, secondPoint) => {
    let y = secondPoint.lon - firstPoint.geometry.coordinates[0];
    let x = secondPoint.lat - firstPoint.geometry.coordinates[1];

    return Math.sqrt(x * x + y * y);
  }

  const cities = data.cities;

  const airports = airportsData.filter((airport) => {
    if (cities.find((city) => airport.city === city.city)) {
      return true;
    } else {
      return false;
    }
  });

  const findCities = async () => {
    var tempData2;
    if (endPoint !== undefined) {
      tempData2 = endGeneralTempData.filter((name) => name.properties.display_name === endPoint)

      resultClick(tempData2[0])
    }
    else { alert("Please enter a city name") }

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
    var CTdata = cities

    if (cityName.length === 0) {
      return [{
        geometry: {
          coordinates: [0, 0],
        },
        properties: {
          display_name: '',
        }
      }];
    }

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
        geometry: {
          coordinates: result.geometry.coordinates,
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
          geometry: {
            coordinates: result.geometry.coordinates,
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

    var sortedArray = dataArray.filter((a) => { if (a.properties.display_name.toLowerCase().startsWith(cityName)) { return a } })
    var notSortedArray = dataArray.filter((a) => { if (!a.properties.display_name.toLowerCase().startsWith(cityName)) { return a } })


    sortedArray = sortedArray.concat(notSortedArray);
    if (sortedArray.length === 0) {
      return [{
        geometry: {
          coordinates: [0, 0],
        },
        properties: {
          display_name: 'does not exist in database',
        }
      }];
    }

    setEndGeneralTempData(sortedArray);
    return sortedArray;

  };

  const resultClick = (endCity) => {
    var cheapTripDataFile = data.cities;
    var closestCity = cheapTripDataFile[0]

    cheapTripDataFile.forEach((point) => {
      if (getDistance(endCity, point) <= getDistance(endCity, closestCity)) {
        closestCity = point
      }
    })
    console.log("Closest city from CheapTrip: " ,closestCity)

    setSearchMarker({
      coordinates: {
        lat: endCity.geometry.coordinates[1],
        lng: endCity.geometry.coordinates[0],
      },
      name: endCity.properties.display_name,
    });

    if (map) {
      map.flyTo({
        lat: endCity.geometry.coordinates[1],
        lng: endCity.geometry.coordinates[0],
      });
    }


  };

  const onChangeHandler = async (text, point) => {
    let matches = [];
    const data = await findAutocomplete(text, point);

    matches = data.map((feature) => feature.properties.display_name)
    return matches;

  }

  var delayTimer;

  const onChangeHandlerEnd = async (text) => {
    clearTimeout(delayTimer);
    delayTimer = setTimeout(async function () {
      setEndOptions(await onChangeHandler(text, "end"));
    }, 500)
  }

  return (
    <div className="App">
      <div className="divSearchBox">
        <div className="searchBox">

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
          <input type="button" className="searchBtn" onClick={() => { findCities() }} value="Lets go" />

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
            {citiesActive &&
              cities.map((city) => (
                <Marker position={{ lat: city.lat, lng: city.lon }}>
                  <Popup>{city.city}</Popup>
                </Marker>
              ))}
            {bordersActive &&
              cities.map((city) => (
                <Rectangle bounds={[[city.latX, city.lonX], [city.latY, city.lonY]]} />
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
