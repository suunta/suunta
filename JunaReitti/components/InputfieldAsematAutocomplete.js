import Autocomplete from 'react-native-autocomplete-input';
import React, { Component } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

class InputfieldAsematAutocomplete extends Component {

    constructor(props) {
        super(props);
        this.state = {
            asemat: [],
            syote: ''
        };
    }

  componentDidMount() {
      fetch('https://rata.digitraffic.fi/api/v1/metadata/stations')
          .then((response) => response.json())
          .then(asemat => asemat.filter((asema) => asema.passengerTraffic === true))
          .then(asemat => asemat.map(asema => {
                  return {
                      id: asema.stationUICCode,
                      stationShortCode: asema.stationShortCode,
                      stationName: asema.stationName,
                      passengerTraffic: asema.passengerTraffic
                  }
              })
          ).then(asemat => this.setState({asemat: asemat}))
  }

  etsiAsema(syote) {
    if (syote === '') {
      return [];
    }

    //console.log(this.state.syote);

    const { asemat } = this.state;
    const regex = new RegExp(syote.trim(), 'i');

    let tulos = asemat.filter(asema => asema.stationName.search(regex) >= 0);
    //console.log(tulos);

    return tulos;

  }

  render() {
    const { syote } = this.state;
    const asemat = this.etsiAsema(syote);
    const comp = (a, b) => a.toLowerCase().trim() === b.toLowerCase().trim();

    return (
      <View style={styles.container}>
          <View>
              <Text>{this.state.lahtoAsema}</Text>
          </View>
        <Autocomplete
          autoCapitalize="none"
          autoCorrect={false}
          containerStyle={styles.autocompleteContainer}
          data={asemat.length === 0 ? [] : asemat}
          defaultValue={syote}
          onChangeText={text => this.setState({ syote: text })}
          placeholder="Syotä aseman nimi"
          renderItem={({ stationName: stationName, stationShortCode: stationShortCode }) => (
            <TouchableOpacity onPress={() => {
                this.setState({
                    syote: stationName,
                    lahtoAsema: stationName
                });
                console.log(syote);
            }
            }>
              <Text style={styles.itemText}>
                {stationName} ({stationShortCode})
              </Text>
            </TouchableOpacity>
          )}
        />

      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50
  },
  autocompleteContainer: {
    flex: 1,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 1
  },
  itemText: {
    fontSize: 15,
    margin: 2
  },
  descriptionContainer: {
    // 'backgroundColor' needs to be set otherwise the
    // autocomplete input will disappear on text input.
    backgroundColor: '#F5FCFF',
    marginTop: 25
  },
  infoText: {
    textAlign: 'center'
  },
  titleText: {
    fontSize: 18,
    fontWeight: '500',
    marginBottom: 10,
    marginTop: 10,
    textAlign: 'center'
  },
  directorText: {
    color: 'grey',
    fontSize: 12,
    marginBottom: 10,
    textAlign: 'center'
  },
  openingText: {
    textAlign: 'center'
  }
});

export default InputfieldAsematAutocomplete;
