import React, {Component} from "react";
import {ActivityIndicator, View, Text, StyleSheet, FlatList, Button, KeyboardAvoidingView, Keyboard} from "react-native";
import Input from "./Components/Input";
import Realm from 'realm';
import Autocomplete from "./Components/Autocomplete";
import {RouteSchema} from './RouteSchema';

export default class Asetukset extends Component {
  constructor(props) {
    super(props);
    this.state = {
      lahtoAsema: '',
      tuloAsema: '',
      lahto: '',
      tulo: '',
      reitit: {},
      lastId: 0,
    }
  }

  componentDidMount() {
    let routes = this.fetchRoutesFromRealm();
    console.log('*** Tulostetaan reitit Realmista');
    console.log(routes);

    try {
      this.setState({
        reitit: routes,
      }, () => {
        console.log('*** Tulostetaan reitit statesta');
        console.log(this.state.reitit);
      });
    } catch (e) {
      console.log('*** Virhe reittien haussa ');
      console.log(e);
    }
  }

  handleInput = (type, userInput) => {
    console.log(userInput);

    this.setState({
      [type + 'Asema']: userInput,
    }, () => {
      console.log(this.state.lahtoAsema);
      console.log(this.state.tuloAsema);
    });
  }

  fetchRoutesFromRealm() {
    console.log('**** Koitetaan hakea reitit Realmista');

    Realm.open({schema: [RouteSchema]})
      .then(realm => {
        try {
          const routes = realm.objects('Route');
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

  getLastIdFromRealm() {
    Realm.open({schema: [RouteSchema]})
      .then(realm => {
        try {
          let lastId = realm.objects('Route').max('id');
          console.log('** lastId :');
          console.log(lastId);

          if (lastId == null) {
            lastId = 0;

          } else {
            lastId = lastId+1;
          }

          this.setState({
            lastId: lastId
          })

          return lastId;
        } catch (e) {
          console.log("!!! Error on getLastId :");
          console.log(e);
        }
      })
  }

  addRouteToRealm() {
    console.log('*** Lahto- ja tuloasemat');
    console.log(this.state.lahtoAsema + ' - ' + this.state.tuloAsema);

    // Haetaan viimeisin ID Realmista
    let lastId = this.getLastIdFromRealm();
    console.log('*** ID : ' + lastId);

    Realm.open({schema: [RouteSchema]})
      .then(realm => {
        try {
          realm.write(() => {
            let reitti = realm.create('Route', {id: this.state.lastId, lahtoAsema: this.state.lahtoAsema, tuloAsema: this.state.tuloAsema});
          });
        } catch (e) {
          console.log("!!! Error on creation :");
          console.log(e);
        }
      })
      .then(() => {
        this.setState({
          lahtoAsema: '',
          tuloAsema: ''
        });
      })
  }

  deleteRouteFromRealm(item) {
    Realm.open({schema: [RouteSchema]})
      .then(realm => {
        try {
          realm.write(() => {
            realm.delete(item);
          });
          this.fetchRoutesFromRealm();
        } catch (e) {
          console.log("Error on deletion");
        }
      })
      .then(console.log('Reitti poistettu'));
  }
  renderItem({item, index}) {
    let rowBackground = index % 2 === 0 ? '#e9e9e9' : '#FFFFFF';
    return (
      <View style={{padding: 8, flex: 1, flexDirection: 'row', justifyContent: 'space-between', height: 60, backgroundColor: rowBackground }} >
        <Text style={{fontSize: 20}}>{item.lahtoAsema}</Text>
        <Text style={{fontSize: 20}}>{item.tuloAsema}</Text>
        <View style={{height: 1}}><Button style={{flex:1}} onPress={() => this.deleteRouteFromRealm(item)} title="Poista"/></View>
      </View>
    );
  }
  render() {
     const lista = this.state.reitit && this.state.reitit.length > 0
      ? (<FlatList
        data={this.state.reitit}
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
            <Input name="lahto" userInput={this.handleInput} placeholder="Lähtöasema"/>
            <Input name="tulo" userInput={this.handleInput} placeholder="Tuloasema"/>

            {/*<Autocomplete stations={this.props.asemat} placeholder="Lähtöasema" name="lahto" userInput={this.handleInput}/>*/}
            {/*<Autocomplete stations={this.props.asemat} placeholder="Tuloasema" name="tulo" userInput={this.handleInput}/>*/}

            <Button style={{flex:1}} onPress={() => {
              Keyboard.dismiss();
              this.addRouteToRealm();
            }} title="Lisää"/>
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
