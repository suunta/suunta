import React, {Component} from "react";
import {TouchableOpacity, View, StyleSheet, Text} from "react-native";
import Autocomplete from 'react-native-autocomplete-input';
import { Icon } from "react-native-elements";

class AutoComplete extends React.Component {

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
        this.setState({
            stationList: this.props.stations.map(station => station.stationName)
        })
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.location !== this.props.location) {
            this.setState({query: ''});
        }
    }

    findStation(query) {
        if (query === '') {
            if (!(this.props.location && this.props.location.length > 0)) {
                let mostUsedStations = this.props.stations.reduce((result, station) => {
                    if (station.used > 0) {
                        result.push({n: station.stationName, u: station.used});
                    }
                    return result;
                }, [])
                    .sort((a, b) => b.u - a.u)
                    .map(asema => asema.n);
                return mostUsedStations.slice(0,5);
            }
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

        console.log(stations);

        let icon;
        if (this.props.location && this.props.location.length > 0 && this.state.query.length == 0) {
            icon = (<View style={styles.icon}><Icon name={'my-location'} size={20} color="#666" title="Oma Sijainti" /></View>)
        }

        return (
            <View style={{width: '50%'}}>
                <Autocomplete
                    autoCapitalize="none"
                    inputContainerStyle={styles.inputContainer}
                    underlineColorAndroid='transparent'
                    data={stations.length && comp(query, stations[0]) ? [] : stations}
                    defaultValue={query}
                    onChangeText={this.inputHandler}
                    placeholder={icon ? '       '+this.props.location : this.props.placeholder}
                    renderItem={(data) => (
                        <TouchableOpacity onPress={() => this.setState({ query: data }, () => {this.props.userInput(this.props.name, this.state.query);})}>
                            <Text style={styles.itemText}>
                                {data}
                            </Text>
                        </TouchableOpacity>
                    )}
                />
                {icon}
            </View>
        )
    }
}

const styles = StyleSheet.create({
    itemText: {
        fontSize: 16,
        margin: 2,
        lineHeight: 38
    },
    inputContainer: {
        borderRightWidth: 0,
        borderLeftWidth: 0
    },
    icon: {
        position: 'absolute',
        top: 10,
        left: 3
    }
});
export default AutoComplete;