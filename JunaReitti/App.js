import React, {Component} from "react";
import {ActivityIndicator, View, Text, StyleSheet, FlatList, Button} from "react-native";
import {List, ListItem} from "react-native-elements";
import Input from "./Components/Input";
import sortBy from "lodash/sortBy";
import Swiper from 'react-native-swiper';
import JunaReitti from './JunaReitti';
import Asetukset from './Asetukset';
import {StackNavigator} from 'react-navigation';

export default class App extends Component {
    constructor(props) {
        super(props);

        this.state = {
            asemaValit: [['HKI', 'PSL'], ['HKI', 'KE'], ['HKI', 'TPE']],
            asemat: []
        };
    }
    
    
     render() {
     return <RootStack screenProps={this.state} />;
  }
}

class HomeScreen extends React.Component {
    static navigationOptions = { header: null };
  render() {
    const reitit = this.props.screenProps.asemaValit.map((reitti, index) => (
      <JunaReitti key={index} lahtoasema={reitti[0]} tuloasema={reitti[1]} navigation={this.props.navigation} />
    ));
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
    <Asetukset asemaValit={this.props.screenProps.asemaValit} />
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
