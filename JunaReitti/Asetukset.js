import React, {Component} from "react";
import {ActivityIndicator, View, Text, StyleSheet, FlatList, Button, KeyboardAvoidingView} from "react-native";
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
  deleteItem(event) {
    return;
  }
  renderItem({item, index}) {
    let rowBackground = index % 2 === 0 ? '#e9e9e9' : '#FFFFFF';
    return (
      <View style={{padding: 8, flex: 1, flexDirection: 'row', justifyContent: 'space-between', height: 60, backgroundColor: rowBackground }} >
        <Text style={{fontSize: 20}}>{item[0]}</Text>
        <Text style={{fontSize: 20}}>{item[1]}</Text>
        <View style={{height: 1}}><Button style={{flex:1}} onPress={() => this.deleteItem(index)} title="Poista"/></View>
      </View>
    );
  }
  render() {
     const lista = this.props.asemaValit && this.props.asemaValit.length > 0
      ? (<FlatList
        data={this.props.asemaValit}
        renderItem={this.renderItem.bind(this)}
        keyExtractor={(item, index) => index.toString()}
        ItemSeparatorComponent={() => (<View style={{height: 2, width: "100%", backgroundColor: '#D3D3D3'}}/>)}
      />)
      : <Text>Loading...</Text>;

      return (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding"
    >
          <View style={{flex: 1 }}>
            <Text style={{ fontSize: 33, textAlign: 'center',}}>Omat reitit</Text>
            {lista}
          </View>
          <View style={styles.inputContainer}>
            <Input placeholder="Lähtöasema" name="lahto" userInput={this.handleInput}/>
            <Input placeholder="Tuloasema" name="tulo" userInput={this.handleInput}/>
          </View>
        </KeyboardAvoidingView>
      );
  }
}
const styles = StyleSheet.create({
    inputContainer: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    }
});
