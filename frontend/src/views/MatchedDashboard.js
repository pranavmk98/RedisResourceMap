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
import RTChart from 'react-rt-chart';
import './styles.css'

// reactstrap components
import {
  Card,
  CardHeader,
  CardBody,
  CardTitle,
  Row,
  Col,
} from "reactstrap";

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min) + min); //The maximum is exclusive and the minimum is inclusive
}

class MatchedDashboard extends React.Component {
  componentDidMount() {
    setInterval(() => this.forceUpdate(), 1000);
  }

  render() {
    var data = {
      date: new Date(),
      Masks: getRandomInt(0, 4000),
      Oxygen: getRandomInt(0, 4000),
      Vaccines: getRandomInt(0, 4000)
    };
    return (
      <>
      {/* <link rel="stylesheet" href="https://raw.githubusercontent.com/c3js/c3/master/c3.css"></link> */}
        <div className="content">
          <Row>
            <Col md="12">
              <Card>
                <CardHeader>
                  <CardTitle tag="h4">Matched Resources</CardTitle>
                </CardHeader>
                <CardBody>
                <RTChart
                  fields={['Masks', 'Oxygen', 'Vaccines']}
                  data={data} />
                </CardBody>
              </Card>
            </Col>
          </Row>
        </div>
      </>
    );
  }
}

export default MatchedDashboard;
