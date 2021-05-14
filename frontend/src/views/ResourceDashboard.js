/*!

=========================================================
* Paper Dashboard React - v1.2.0
=========================================================

* Product Page: https://www.creative-tim.com/product/paper-dashboard-react
* Copyright 2020 Creative Tim (https://www.creative-tim.com)

* Licensed under MIT (https://github.com/creativetimofficial/paper-dashboard-react/blob/master/LICENSE.md)

* Coded by Creative Tim

=========================================================

* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

*/
import React from "react";
import {
  withScriptjs,
  withGoogleMap,
  GoogleMap,
  Marker,
} from "react-google-maps";

import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox from '@material-ui/core/Checkbox';

// reactstrap components
import {
  Button,
  Card,
  CardHeader,
  CardBody,
  CardTitle,
  CardFooter,
  FormGroup,
  Form,
  Input,
  Row,
  Col,
  Label,
} from "reactstrap";

import io from 'socket.io-client'

const MapWrapper = withScriptjs(
  withGoogleMap((props) => (
    <GoogleMap
      defaultZoom={10}
      center={{ lat: props.centerLat, lng: props.centerLong }}
      defaultOptions={{
        scrollwheel: false, //we disable de scroll over the map, it is a really annoing when you scroll through page
        disableDefaultUI: true,
        zoomControl: true,
        styles: [
          {
            featureType: "water",
            stylers: [
              {
                saturation: 43,
              },
              {
                lightness: -11,
              },
              {
                hue: "#0088ff",
              },
            ],
          },
          {
            featureType: "road",
            elementType: "geometry.fill",
            stylers: [
              {
                hue: "#ff0000",
              },
              {
                saturation: -100,
              },
              {
                lightness: 99,
              },
            ],
          },
          {
            featureType: "road",
            elementType: "geometry.stroke",
            stylers: [
              {
                color: "#808080",
              },
              {
                lightness: 54,
              },
            ],
          },
          {
            featureType: "landscape.man_made",
            elementType: "geometry.fill",
            stylers: [
              {
                color: "#ece2d9",
              },
            ],
          },
          {
            featureType: "poi.park",
            elementType: "geometry.fill",
            stylers: [
              {
                color: "#ccdca1",
              },
            ],
          },
          {
            featureType: "road",
            elementType: "labels.text.fill",
            stylers: [
              {
                color: "#767676",
              },
            ],
          },
          {
            featureType: "road",
            elementType: "labels.text.stroke",
            stylers: [
              {
                color: "#ffffff",
              },
            ],
          },
          {
            featureType: "poi",
            stylers: [
              {
                visibility: "off",
              },
            ],
          },
          {
            featureType: "landscape.natural",
            elementType: "geometry.fill",
            stylers: [
              {
                visibility: "off",
              },
              {
                color: "#b8cb93",
              },
            ],
          },
          {
            featureType: "poi.park",
            stylers: [
              {
                visibility: "off",
              },
            ],
          },
          {
            featureType: "poi.sports_complex",
            stylers: [
              {
                visibility: "off",
              },
            ],
          },
          {
            featureType: "poi.medical",
            stylers: [
              {
                visibility: "off",
              },
            ],
          },
          {
            featureType: "poi.business",
            stylers: [
              {
                visibility: "off",
              },
            ],
          },
          {
            featureType: "transit",
            stylers: [
              {
                visibility: "off",
              }
            ]
          }
        ],
      }}
    >
      {props.locations.map(loc => <Marker position={{ lat: parseFloat(loc.lat), lng: parseFloat(loc.long) }} key={loc.updated} color="blue"/>)}
    </GoogleMap>
  ))
);

class ResourceDashboard extends React.Component {

  constructor(props) {
    super(props)
    this.state = {
      gettingInitialLocation: true,
      centerLat: 0,
      centerLong: 0,
      radius: 0,
      locations: [],
      checkedMasks: false,
      checkedVaccines: false,
      checkedOxygen: false,
    }
  }

  componentDidMount() {
    this.getCenterLatLong();
    let socketEndpoint = "http://localhost:5000";
    this.socket = io.connect(socketEndpoint, {
      reconnection: true,
    });
  }

  getCenterLatLong() {
    navigator.geolocation.getCurrentPosition((position) => {
      this.setState({ centerLat: position.coords.latitude, 
                      centerLong: position.coords.longitude });
      this.fetchData();
    });
  }

  fetchData() {
    const url = "http://localhost:5000/get"
    return fetch(url, {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        lat: this.state.centerLat,
        long: this.state.centerLong,
        radius: this.state.radius,
      })
    })
        .then(response => response.json())
        .then(data => this.setState({locations: data.results, socketNamespace: data.namespace}))
        .then(this.connectWebsocket())
        .catch(error => console.log(error))
  }

  connectWebsocket() {
    let socketUrl = "http://localhost:5000";
    this.socket = io.connect(socketUrl, {
      reconnection: true,
    });
    this.socket.on("message", message => {
      console.log(message);
      this.setState({locations: [...this.state.locations, message]});
    });
  }

  addLocation() {
    const url = "http://localhost:5000/insert"
    let body = {
      lat: this.state.inputLat,
      long: this.state.inputLong,
    }
    fetch(url, {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      
      body: JSON.stringify(body)
    })
        .then(response => console.log('added data location'))
        .then(this.fetchData())
        .catch(error => console.log(error))
  }

  render() {
    const handleFilterChange = (event) => {
      // For some reason the setState function isn't working, but this does
      this.state[[event.target.name]] = event.target.checked;

      if (this.state.checkedMasks) {
        this.filterMarkers('masks');
      } else if (this.state.checkedVaccines) {
        this.filterMarkers('vaccines');
      } else if (this.state.checkedOxygen) {
        this.filterMarkers('oxygen');
      } else {
        this.fetchData();
      }
    };

    return (
      <>
        <div className="content">
        <Row>
            <Col sm="12" lg="8">
              <Card>
                <CardHeader>
                  <CardTitle tag="h5">View Existing Resource Requests</CardTitle>
                </CardHeader>
                <CardBody>
                  <div
                    id="map"
                    className="map"
                    style={{ position: "relative", overflow: "hidden" }}
                  >
                    <MapWrapper
                      googleMapURL="https://maps.googleapis.com/maps/api/js?key=AIzaSyBgZr3FXnzof-wJqVOJNwKHM6__4mONn7o"
                      loadingElement={<div style={{ height: `100%` }} />}
                      containerElement={<div style={{ height: `100%` }} />}
                      mapElement={<div style={{ height: `100%` }} />}
                      centerLat={this.state.centerLat}
                      centerLong={this.state.centerLong}
                      locations={this.state.locations}
                    />
                  </div>
                  <CardFooter>
                  <div className="card-stats">
                    <i className="nc-icon nc-compass-05" /> Filter resources on Map
                  </div>
                  <FormGroup>
                    <FormControlLabel
                        control={<Checkbox checked={this.state.checkedMasks} onChange={handleFilterChange} name="checkedMasks" />}
                        label="Masks"
                        color="red"
                    />
                    <FormControlLabel
                        control={<Checkbox checked={this.state.checkedVaccines} onChange={handleFilterChange} name="checkedVaccines" />}
                        label="Vaccines"
                        color="blue"
                    />
                    <FormControlLabel
                        control={<Checkbox checked={this.state.checkedOxygen} onChange={handleFilterChange} name="checkedOxygen" />}
                        label="Oxygen"
                        color="green"
                    />
                  </FormGroup>
                  </CardFooter>
                </CardBody>
              </Card>

            </Col>
            <Col sm="12" lg="4">
              <Card className="card-user">
                <CardHeader>
                  <CardTitle tag="h5">Create Resource Request</CardTitle>
                </CardHeader>
                <CardBody>
                  <Form>
                    <Row>
                      <Col>
                        <FormGroup>
                          <label>Do you have a surplus or deficit of resources?</label>
                          <Input type="select">
                            <option>I Have Resources to Give</option>
                            <option>I Need Resources</option>
                          </Input>
                        </FormGroup>
                      </Col>
                    </Row>

                    <Row>
                      <Col className="pc-1" md="12">
                      <FormGroup tag="fieldset">
                      <label>What type of resources are you interested in? </label>
                        <FormGroup check>
                          <Label check>
                            <Input type="radio" name="radio1" />{' '}
                            Masks
                          </Label>
                        </FormGroup>
                        <FormGroup check>
                          <Label check>
                            <Input type="radio" name="radio1" />{' '}
                            Vaccines
                          </Label>
                        </FormGroup>
                        <FormGroup check>
                          <Label check>
                            <Input type="radio" name="radio1" />{' '}
                            Oxygen
                          </Label>
                        </FormGroup>
                      </FormGroup>
                      </Col>
                      <Col className="pc-1" md="12">
                        <FormGroup>
                          <label>Quantity of Resources</label>
                          <Input
                            defaultValue="0"
                            placeholder="0"
                            type="number"
                          />
                        </FormGroup>
                      </Col>
                    </Row>

                    <Row>
                      <Col className="pr-1" md="6">
                        <FormGroup
                          disabled
                        >
                          <label>Latitude</label>
                          <Input
                            defaultValue="0"
                            placeholder="0"
                            type="text"
                          />
                        </FormGroup>
                      </Col>
                      <Col className="pl-1" md="6">
                        <FormGroup
                          disabled
                        >
                          <label>Longitude</label>
                          <Input
                            defaultValue="0"
                            placeholder="0"
                            type="text"
                          />
                        </FormGroup>
                      </Col>
                    </Row>
                    <Row>
                      <div className="update ml-auto mr-auto">
                        <Button
                          className="btn-round"
                          color="primary"
                          type="submit"
                          onClick={() => this.addLocation()}
                        >
                          Add Resource Request to Map
                        </Button>
                      </div>
                    </Row>
                  </Form>
                </CardBody>
              </Card>
            </Col>
          </Row>
        </div>
      </>
    );
  }
}

export default ResourceDashboard;
