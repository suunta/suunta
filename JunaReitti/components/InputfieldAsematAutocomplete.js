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
          .then(asemat => asemat.map(asema => {
                  return {
                      id: asema.stationUICCode,
                      stationShortCode: asema.stationShortCode,
                      stationName: asema.stationName,
                      passengerTraffic: asema.passengerTraffic
                  }
              })
          )

      {/*
    fetch('https://rata.digitraffic.fi/api/v1/metadata/stations').then(res => res.json()).then((json) => {
      console.log('*** haetaan asemia');
      const { results: asemat } = json;
      this.setState({
          asemat: asemat
      });
    }).then(console.log(this.state.asemat.toString()));
      */}

  }



  etsiAsema(syote) {
    if (syote === '') {
      return [];
    }

    const { asemat } = this.state;
    const regex = new RegExp('${syote.trim()}', 'i');
    return asemat.filter(asema => asema.stationName.search(regex) >= 0);
  }

  render() {
    const { syote } = this.state;
    const asemat = this.etsiAsema(syote);
    const comp = (a, b) => a.toLowerCase().trim() === b.toLowerCase().trim();

    return (
      <View style={styles.container}>
        <Autocomplete
          autoCapitalize="none"
          autoCorrect={false}
          containerStyle={styles.autocompleteContainer}
          data={asemat.length === 1 && comp(syote, asemat[0].title) ? [] : asemat}
          defaultValue={syote}
          onChangeText={text => this.setState({ syote: text })}
          placeholder="Syotä aseman nimi"
          renderItem={({ title: stationName, release_date: stationShortCode }) => (
            <TouchableOpacity onPress={() => this.setState({ syote: stationName })}>
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
    backgroundColor: '#F5FCFF',
    flex: 1,
    paddingTop: 25
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
