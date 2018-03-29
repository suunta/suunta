import React, {Component} from "react";
import {ActivityIndicator, View, Text, StyleSheet, FlatList, Button} from "react-native";
import {List, ListItem} from "react-native-elements";
import Input from "./Components/Input";
import sortBy from "lodash/sortBy";
import Swiper from 'react-native-swiper';
import JunaReitti from './JunaReitti';
import {StackNavigator} from 'react-navigation';

export default class App extends Component<{}> {
    constructor(props) {
        super(props);

        this.state = {
            asemaVali: []
        };
    }
    
    
     render() {
    return <RootStack />;
  }
}


class HomeScreen extends React.Component {
    static navigationOptions = { title: 'Welcome', header: null };
  render() {
      return ( 
            <View style={{ height: 50000}} >
                <Button
          title="Go to Settings"
          onPress={() => this.props.navigation.navigate('Settings')}
        />
                <Swiper showsButtons={false}>
                    <JunaReitti lahtoasema="HKI" tuloasema="PSL" />
                    <JunaReitti lahtoasema="PSL" tuloasema="HKI" />
                   </Swiper>
          </View>
            );
        }
    }


class SettingsScreen extends React.Component {
  render() {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text>Settings Screen</Text>
        <Text>Hello world!</Text>
      </View>
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
