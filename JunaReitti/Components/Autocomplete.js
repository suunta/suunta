import React, {Component} from "react";
import {TouchableOpacity, View, StyleSheet, Text} from "react-native";

class Autocomplete extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      stationList: [],
      query: ''
    };
  }

  inputHandler = (val) => {
    this.setState({
      query: val
    }, () => {
      this.props.userInput(this.props.name, this.state.query);
    });
  };

  componentDidMount() {

    const tempL = [];

    console.log('PROPSIT');
    console.log(this.props.stations);

    this.props.stations.map((station) => {

      tempL.push(station.stationName);
    });

    this.setState({
      stationList: tempL
    })
  }

  findStation(query) {
    if (query === '') {
      return [];
    }

    const { stationList } = this.state;
    const regex = new RegExp('^' + `${query.trim()}`, 'i');
    return stationList.filter(station => station.search(regex) >= 0);
  }

  render() {

    const { query } = this.state;
    const stations = this.findStation(query);
    const comp = (a, b) => a.toLowerCase().trim() === b.toLowerCase().trim();

    return (
      <Autocomplete
        autoCapitalize="none"
        containerStyle={{width: '40%'}}
        inputContainerStyle={{borderRightWidth:0,borderLeftWidth:0}}
        underlineColorAndroid='transparent'
        data={stations.length && comp(query, stations[0]) ? [] : stations}
        defaultValue={query}
        onChangeText={this.inputHandler}
        placeholder={this.props.placeholder}
        renderItem={(data) => (
          <TouchableOpacity onPress={() => this.setState({ query: data }, () => {this.props.userInput(this.props.name, this.state.query);})}>
            <Text style={styles.itemText}>
              {data}
            </Text>
          </TouchableOpacity>
        )}
      />
    )
  }
}

const styles = StyleSheet.create({
  itemText: {
    fontSize: 15,
    margin: 2
  }
});

export default Autocomplete;