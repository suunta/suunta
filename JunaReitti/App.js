import React, {Component} from "react";
import {ActivityIndicator, View, Text, StyleSheet, FlatList, Button} from "react-native";
import Input from "./Components/Input";
import sortBy from "lodash/sortBy";
import Swiper from 'react-native-swiper';
import Realm from 'realm';
import JunaReitti from './JunaReitti';
import Asetukset from './Asetukset';
import {StackNavigator} from 'react-navigation';
import {RouteSchema} from "./RouteSchema";

export default class App extends Component {
    constructor(props) {
        super(props);

        this.state = {
          asemat: [],
          reitit: []
        };
    }

  fetchRoutesFromRealm() {
    console.log('**** Koitetaan hakea reitit Realmista');

    Realm.open({schema: [RouteSchema]})
      .then(realm => {
        try {
          const routes = realm.objects('Route');

          if (routes.length === 0) {
            routes.push('0');
          }

          this.setState({
            reitit: routes
          });
          console.log('*** Reitit Realmista :');
          console.log(routes);
          return routes;
        } catch (e) {
          console.log('Virhe reittien haussa Realmista');
        }
      });
  }

  componentDidMount() {
    console.log('**** Koitetaan hakea reitit Realmista');
    this.fetchRoutesFromRealm();

    fetch('https://rata.digitraffic.fi/api/v1/metadata/stations')
      .then((response) => response.json())
      .then(asemat => asemat.filter((asema) => asema.passengerTraffic === true))
      .then(asemat => asemat.map(asema => {
          return {
            id: asema.stationUICCode,
            stationShortCode: asema.stationShortCode,
            stationName: asema.stationName.split(" ")[1] === "asema" ? asema.stationName.split(" ")[0] : asema.stationName,
            passengerTraffic: asema.passengerTraffic
          }
        })
      )
      .then(asemat => this.setState({
        isLoading: false,
        asemat: asemat}));
  }
    
    
     render() {
     return <RootStack screenProps={this.state} />;
  }
}

class HomeScreen extends React.Component {
    static navigationOptions = { header: null };
  render() {
    console.log('ÄÄÄ screenProps.reitit :');
    console.log(this.props.screenProps.reitit);

    const reitit = this.props.screenProps.reitit.map((reitti, index) => (
      <JunaReitti key={index} reitit={this.props.screenProps.reitit} lahtoAsema={reitti.lahtoAsema} lahtoLyhenne={reitti.lahtoLyhenne} tuloAsema={reitti.tuloAsema}  tuloLyhenne={reitti.tuloLyhenne} navigation={this.props.navigation} />
    ));

    if (reitit === undefined || reitit == null || reitit.length === 0) {
      reitit.push(<JunaReitti key={0} reitit={this.props.screenProps.reitit} lahtoAsema={''} tuloAsema={''} navigation={this.props.navigation} />)
    }
      return ( 
      <View style={{ flex: 1}} >
                <Swiper showsButtons={false}>
                  {reitit}
                 </Swiper>
          </View>
            );
        }
    }


class SettingsScreen extends React.Component {
 static navigationOptions = { title: 'Asetukset'};
  render() {
    return (
    <Asetukset asemat={this.props.screenProps.asemat} />
    );
  }
}

const RootStack = StackNavigator(
  {
    Home: {
      screen: HomeScreen,
    },
    Settings: {
      screen: SettingsScreen,
    },
  },
  {
    initialRouteName: 'Home',
  }
);
