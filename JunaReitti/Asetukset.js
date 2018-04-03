import React, {Component} from "react";
import {ActivityIndicator, View, Text, StyleSheet, FlatList, Button} from "react-native";
import {List, ListItem} from "react-native-elements";
import Input from "./Components/Input";

export default class Asetukset extends Component {
     constructor(props) {
        super(props);
     }
    
     render() {
         const lista = this.props.asemaValit.map(vali => (
                                           <View>
                                            <Text>{vali[0]}</Text>
                                            <Text>{vali[1]}</Text>
                                            <Text>Poista</Text>
                                           </View>
                                        )
                                        );
        return (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                <Text>Omat reitit</Text>
                {lista}
               
            </View>
        );
  }
}
