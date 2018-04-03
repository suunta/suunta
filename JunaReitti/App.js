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
            asemaValit: [['HKI', 'PSL'], ['HKI', 'KER']]
        };
    }
    
    
     render() {
     return <RootStack screenProps={this.state.asemaValit} />;
  }
}


class HomeScreen extends React.Component {
    static navigationOptions = { title: 'Welcome', header: null };
  render() {
      return ( 
      <View style={{ flex: 1}} >
                <Button
          title="Go to Settings"
          onPress={() => this.props.navigation.navigate('Settings')}
        />
                <Swiper showsButtons={false}>
                
                    <JunaReitti lahtoasema="HKI" tuloasema="PSL" />
                   </Swiper>
          </View>
            );
        }
    }


class SettingsScreen extends React.Component {
constructor(props) {
        super(props);
        }
 static navigationOptions = { title: 'Asetukset'};
  render() {
    return (
    <Asetukset asemaValit={this.props.screenProps} />
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
