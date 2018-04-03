import React, {Component} from "react";
import {ActivityIndicator, View, Text, StyleSheet, FlatList, Button} from "react-native";
import {List, ListItem} from "react-native-elements";
import Input from "./Components/Input";

export default class Asetukset extends Component {
     constructor(props) {
        super(props);
        this.state = {
            lahto: '',
            tulo: ''
        }
     }
    handleInput = (type, userInput) => {
		return;
    }
    
     render() {
         const lista = this.props.asemaValit.map((vali, index) => (
                                           <View key={index}>
                                            <Text>{vali[0]}</Text>
                                            <Text>{vali[1]}</Text>
                                            <Text>Poista</Text>
                                           </View>
                                        )
                                        );
        return (
            <View style={{ flex: 1, alignItems: 'center', paddingTop: 0 }}>
                <Text style={{ fontSize: 40}}>Omat reitit</Text>
                {lista}
            <View style={styles.inputContainer}>
               <Input placeholder="Lähtöasema" name="lahto" userInput={this.handleInput}/>
                <Input placeholder="Tuloasema" name="tulo" userInput={this.handleInput}/>
            </View>
            </View>
        );
  }
}
const styles = StyleSheet.create({
    inputContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    junalista: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        height: 50
    },
    junat: {
        fontSize: 20
    },
    junatHeader: {
        fontSize: 20,
        fontWeight: 'bold'
    },
    tunnus: {
        height: 22,
        width: 22,
        borderRadius: 11,
        backgroundColor: '#EEEEEE',
        justifyContent: 'center',
        alignItems: 'center'
    }
});
