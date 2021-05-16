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
import ResourceDashboard from "views/ResourceDashboard.js";
import MatchedDashboard from "views/MatchedDashboard";

var routes = [
  {
    path: "/dashboard",
    name: "Resource Dashboard",
    icon: "nc-icon nc-bank",
    component: ResourceDashboard,
    layout: "/admin",
  },
  {
    path: "/matches",
    name: "Matched Resources",
    icon: "nc-icon nc-bank",
    component: MatchedDashboard,
    layout: "/admin",
  },
];
export default routes;
